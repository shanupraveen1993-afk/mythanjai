import { adminDb, adminMessaging } from "@/lib/firebase-admin";
import { NotificationType } from "@/types/notification";
import { randomUUID } from "crypto";

/**
 * Claim lease duration: 5 minutes.
 * A claim older than this is considered stale (server likely crashed) and is reclaimable.
 * This duration is chosen to be comfortably larger than any practical FCM send operation.
 */
const CLAIM_LEASE_MS = 5 * 60 * 1000;

/**
 * Worker-side FCM timeout: 90 seconds.
 * Note: Promise.race() stops the worker from waiting after 90 seconds; it does NOT cancel
 * the underlying HTTP connection to Google FCM servers. The delivery contract remains
 * AT-LEAST-ONCE. Stale claim recovery and cycle ID verification protect Firestore state
 * against late-completing FCM responses.
 */
const FCM_TIMEOUT_MS = 90 * 1000;

/**
 * A per-token FCM claim record.
 * Stored in the notification document under the `claims` field.
 */
interface TokenClaim {
  token: string;
  claimedAt: Date; // Stored as Firestore Timestamp; read back as Timestamp or Date.
  claimId: string; // UUID identifying this specific attempt. Used for precise release.
}

interface ServerNotificationParams {
  recipientUid: string;
  recipientPhone?: string;
  type: NotificationType;
  title: string;
  message: string;
  senderUid?: string;
  senderName?: string;
  senderPhone?: string;
  conversationId?: string;
  actionUrl?: string;
  dateKey?: string;
  messageId?: string;
}

export type PushStatus = "NO_DEVICES" | "PENDING" | "DELIVERED" | "FAILED";

/**
 * Authoritative Server Notification Engine — v46.4
 * Powered by Firebase Admin SDK.
 *
 * Delivery contract:
 *   AT-LEAST-ONCE delivery with duplicate prevention during normal concurrent execution.
 *
 * Reliability guarantees:
 * 1. Cumulative Message-Idempotency Protection (allNotifiedMessageIds: string[]).
 *    - Message notification idempotency is tracked permanently in `allNotifiedMessageIds`.
 *    - Even after a notification cycle is marked `read: true`, replaying `/api/chat/notify` for an
 *      already-notified `messageId` will be detected and skipped — preventing replay attacks or late retries
 *      from creating brand-new unread notification cycles or duplicate FCM push sends.
 *
 * 2. Notification Versioning / Cycle ID Protection (notificationVersion: string).
 *    - Every read -> unread reset cycle generates a new notificationVersion (UUID).
 *    - FCM attempts record the version at claim time.
 *    - Post-FCM state updates verify that the document's notificationVersion is still equal
 *      to the claimed version. If the user opened the chat or a new cycle started, late FCM
 *      completions discard their state update to prevent corrupting the new cycle.
 *
 * 3. Safe Invalid-Token Cleanup.
 *    - Failed FCM tokens are deleted ONLY if the current device document in Firestore still
 *      contains that exact failed token — preventing race conditions where a refreshed token registration
 *      is accidentally deleted.
 *
 * 4. Atomic Per-Token Leased Claiming (claims: TokenClaim[]).
 *    - Device tokens are claimed inside a transaction before FCM is sent.
 *    - Concurrent requests targeting the same notification document serialize on the transaction.
 */
export async function dispatchServerNotification({
  recipientUid,
  recipientPhone,
  type,
  title,
  message,
  senderUid,
  senderName,
  senderPhone,
  conversationId,
  actionUrl,
  dateKey,
  messageId,
}: ServerNotificationParams) {
  if (!recipientUid) return { success: false, error: "Missing recipientUid" };

  try {
    const finalActionUrl = actionUrl || (conversationId ? `/chat?chatId=${conversationId}` : "/chat");
    const todayDate = dateKey || new Date().toISOString().slice(0, 10);

    // ─── 1. CHAT NOTIFICATIONS ─────────────────────────────────────────────────
    if (type === "CHAT" && conversationId) {
      const deterministicNotifId = `${recipientUid}_${conversationId}`;
      const targetDocRef = adminDb.collection("notifications").doc(deterministicNotifId);

      let isReplay = false;

      // Phase A: create or update the notification document
      // (message content grouping + messageId deduplication + cycle versioning)
      await adminDb.runTransaction(async (tx) => {
        const notifDoc = await tx.get(targetDocRef);
        const currentData = notifDoc.data() || {};
        const allNotifiedIds: string[] = currentData.allNotifiedMessageIds || [];

        // Check permanent message-level idempotency across all read/unread cycles
        if (messageId && allNotifiedIds.includes(messageId)) {
          isReplay = true;
          return; // Message has already been notified — abort transaction
        }

        const updatedAllMsgIds = messageId
          ? Array.from(new Set([...allNotifiedIds, messageId]))
          : allNotifiedIds;

        if (!notifDoc.exists || currentData.read === true) {
          // Fresh notification OR new unread cycle after user opened chat
          const newCycleVersion = randomUUID();
          const updatedMessage = senderName ? `${senderName}: "${message}"` : `"${message}"`;
          tx.set(
            targetDocRef,
            {
              recipientUid,
              recipientPhone: recipientPhone || "",
              type: "CHAT",
              title: title || "New Message",
              message: updatedMessage,
              senderUid: senderUid || "",
              senderName: senderName || "",
              senderPhone: senderPhone || "",
              conversationId,
              messageCount: 1,
              actionUrl: finalActionUrl,
              read: false,
              pushStatus: "PENDING",
              deliveredTokens: [],
              claims: [],
              notificationVersion: newCycleVersion,
              processedMessageIds: messageId ? [messageId] : [],
              allNotifiedMessageIds: updatedAllMsgIds,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            { merge: true }
          );
        } else {
          // Ongoing unread cycle
          const currentProcessedMsgIds: string[] = currentData.processedMessageIds || [];
          const alreadyProcessed = messageId ? currentProcessedMsgIds.includes(messageId) : false;

          let newCount = currentData.messageCount || 1;
          if (!alreadyProcessed) newCount += 1;

          const updatedMessage = senderName
            ? `${senderName} (${newCount} new messages): "${message}"`
            : `${newCount} new messages: "${message}"`;

          const updatedMsgIds =
            messageId && !alreadyProcessed
              ? Array.from(new Set([...currentProcessedMsgIds, messageId]))
              : currentProcessedMsgIds;

          tx.update(targetDocRef, {
            message: updatedMessage,
            messageCount: newCount,
            processedMessageIds: updatedMsgIds,
            allNotifiedMessageIds: updatedAllMsgIds,
            updatedAt: new Date(),
          });
        }
      });

      if (isReplay) {
        return { success: true, skipped: "message_already_notified" };
      }

      // Phase B: FCM delivery with leased per-token claiming & cycle version verification
      const pushResult = await executeServerPushWithClaim({
        recipientUid,
        notifDocRef: targetDocRef,
        title,
        message,
        actionUrl: finalActionUrl,
        chatId: conversationId,
        type,
      });

      if (!pushResult.success) {
        return { success: false, error: pushResult.error || "FCM delivery failed" };
      }

      return { success: true, grouped: true };
    }

    // ─── 2. SYSTEM / ACTIVITY NOTIFICATIONS ──────────────────────────────────
    const deterministicSystemId = `${type}_${todayDate}_${recipientUid}`;
    const systemNotifRef = adminDb.collection("notifications").doc(deterministicSystemId);

    let isExistingDoc = false;
    let existingPushStatus: string = "PENDING";

    await adminDb.runTransaction(async (tx) => {
      const docSnap = await tx.get(systemNotifRef);
      if (!docSnap.exists) {
        const newCycleVersion = randomUUID();
        tx.set(systemNotifRef, {
          recipientUid,
          recipientPhone: recipientPhone || "",
          type,
          title,
          message,
          senderUid: senderUid || "namma_thanjai_official",
          senderName: senderName || "Namma Thanjai Team",
          senderPhone: senderPhone || "",
          conversationId: conversationId || "namma_thanjai_system_welcome",
          messageCount: 1,
          actionUrl: finalActionUrl,
          read: false,
          pushStatus: "PENDING",
          deliveredTokens: [],
          claims: [],
          notificationVersion: newCycleVersion,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      } else {
        isExistingDoc = true;
        existingPushStatus = docSnap.data()?.pushStatus || "PENDING";
      }
    });

    // Skip FCM if already fully delivered (idempotency guard for system events)
    if (isExistingDoc && existingPushStatus === "DELIVERED") {
      return { success: true };
    }

    const pushResult = await executeServerPushWithClaim({
      recipientUid,
      notifDocRef: systemNotifRef,
      title,
      message,
      actionUrl: finalActionUrl,
      chatId: conversationId || "namma_thanjai_system_welcome",
      type,
    });

    if (!pushResult.success) {
      return { success: false, error: pushResult.error || "FCM delivery failed" };
    }

    return { success: true };
  } catch (error: any) {
    console.error("dispatchServerNotification error:", error);
    return { success: false, error: error?.message || "Server notification error" };
  }
}

/**
 * Resolves a raw Firestore Timestamp or JavaScript Date to epoch milliseconds.
 */
function toMs(value: unknown): number {
  if (!value) return 0;
  if (typeof (value as any).toMillis === "function") return (value as any).toMillis();
  if (typeof (value as any).toDate === "function") return (value as any).toDate().getTime();
  if (value instanceof Date) return value.getTime();
  return 0;
}

/**
 * FCM delivery with leased per-token claiming & cycle version verification.
 */
async function executeServerPushWithClaim({
  recipientUid,
  notifDocRef,
  title,
  message,
  actionUrl,
  chatId,
  type,
}: {
  recipientUid: string;
  notifDocRef: FirebaseFirestore.DocumentReference;
  title: string;
  message: string;
  actionUrl: string;
  chatId: string;
  type: string;
}): Promise<{ success: boolean; error?: string }> {
  // ── Step 1: Query device tokens BEFORE the claim transaction ────────────
  const devicesSnap = await adminDb
    .collection("users")
    .doc(recipientUid)
    .collection("devices")
    .get();

  const allTokens: string[] = [];
  const docIdsByToken: Record<string, string> = {};

  devicesSnap.forEach((d) => {
    const data = d.data();
    if (data.token) {
      allTokens.push(data.token);
      docIdsByToken[data.token] = d.id;
    }
  });

  // Fallback: Check user_fcm_tokens collection if devices subcollection has no tokens
  if (allTokens.length === 0) {
    try {
      const cleanPhone = recipientUid.replace(/\D/g, "").slice(-10);
      if (cleanPhone) {
        const tokenDoc = await adminDb.collection("user_fcm_tokens").doc(cleanPhone).get();
        if (tokenDoc.exists) {
          const fcmTok = tokenDoc.data()?.fcmToken;
          if (fcmTok && !allTokens.includes(fcmTok)) {
            allTokens.push(fcmTok);
            docIdsByToken[fcmTok] = cleanPhone;
          }
        }
      }
    } catch (e) {}
  }

  // NO_DEVICES: recipient has zero registered push targets.
  if (allTokens.length === 0) {
    await notifDocRef.update({ pushStatus: "NO_DEVICES", updatedAt: new Date() });
    return { success: true };
  }

  // ── Step 2: Atomic leased claim transaction + read notificationVersion ───────
  const claimId = randomUUID();
  const now = Date.now();
  let tokensToClaim: string[] = [];
  let claimedVersion: string | null = null;

  await adminDb.runTransaction(async (tx) => {
    const doc = await tx.get(notifDocRef);
    const data = doc.data() || {};
    claimedVersion = data.notificationVersion || null;

    const deliveredTokens: string[] = data.deliveredTokens || [];
    const existingClaims: TokenClaim[] = data.claims || [];

    const activeClaims = existingClaims.filter(
      (c) => now - toMs(c.claimedAt) < CLAIM_LEASE_MS
    );
    const activelyClaimedTokens = new Set(activeClaims.map((c) => c.token));

    tokensToClaim = allTokens.filter(
      (t) => !deliveredTokens.includes(t) && !activelyClaimedTokens.has(t)
    );

    if (tokensToClaim.length === 0) return;

    const newClaims: TokenClaim[] = tokensToClaim.map((token) => ({
      token,
      claimedAt: new Date(),
      claimId,
    }));

    tx.update(notifDocRef, {
      claims: [...activeClaims, ...newClaims],
      updatedAt: new Date(),
    });
  });

  if (tokensToClaim.length === 0) {
    return { success: true };
  }

  // ── Step 3: Send FCM to our claimed tokens with worker-side 90s timeout ───
  let successTokens: string[] = [];
  let failedTokenCount = 0;

  try {
    const fcmTimeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`FCM worker timeout after ${FCM_TIMEOUT_MS / 1000}s`)), FCM_TIMEOUT_MS)
    );

    const response = await Promise.race([
      adminMessaging.sendEachForMulticast({
        tokens: tokensToClaim,
        notification: {
          title: title || "Namma Thanjai Alert",
          body: message || "New update received",
        },
        data: {
          type: type || "CHAT",
          actionUrl: actionUrl || "/chat",
          chatId: chatId || "",
          conversationId: chatId || "",
          click_action: "FLUTTER_NOTIFICATION_CLICK",
          timestamp: new Date().toISOString(),
        },
        android: {
          priority: "high",
          notification: {
            channelId: "namma_thanjai_alerts",
            sound: "default",
            visibility: "public",
            priority: "high",
          },
        },
      }),
      fcmTimeoutPromise,
    ]);

    response.responses.forEach((resp, idx) => {
      if (resp.success) {
        successTokens.push(tokensToClaim[idx]);
      } else {
        failedTokenCount++;
      }
    });

    // Safe invalid token cleanup: verify document STILL holds failedToken before deleting
    const cleanupPromises: Promise<any>[] = [];
    response.responses.forEach((resp, idx) => {
      if (!resp.success && resp.error) {
        const errCode = resp.error.code;
        if (
          errCode === "messaging/registration-token-not-registered" ||
          errCode === "messaging/invalid-registration-token"
        ) {
          const failedToken = tokensToClaim[idx];
          const failedDocId = docIdsByToken[failedToken];
          if (failedDocId) {
            const deviceRef = adminDb
              .collection("users")
              .doc(recipientUid)
              .collection("devices")
              .doc(failedDocId);

            cleanupPromises.push(
              adminDb
                .runTransaction(async (tx) => {
                  const devSnap = await tx.get(deviceRef);
                  if (devSnap.exists && devSnap.data()?.token === failedToken) {
                    tx.delete(deviceRef);
                  }
                })
                .catch(() => {})
            );
          }
        }
      }
    });
    await Promise.all(cleanupPromises);
  } catch (fcmErr: any) {
    console.error("executeServerPushWithClaim FCM error:", fcmErr);
    await adminDb.runTransaction(async (tx) => {
      const doc = await tx.get(notifDocRef);
      const data = doc.data() || {};

      // Cycle protection: check if notificationVersion changed while FCM was in flight
      if (claimedVersion && data.notificationVersion && data.notificationVersion !== claimedVersion) {
        return; // Discard state update — belongs to a stale cycle
      }

      const currentClaims: TokenClaim[] = data.claims || [];
      tx.update(notifDocRef, {
        claims: currentClaims.filter((c) => c.claimId !== claimId),
        pushStatus: "FAILED",
        updatedAt: new Date(),
      });
    });
    return { success: false, error: fcmErr?.message || "FCM SDK error" };
  }

  // ── Step 4: Atomic post-FCM state write with cycle version verification ──
  await adminDb.runTransaction(async (tx) => {
    const doc = await tx.get(notifDocRef);
    const data = doc.data() || {};

    // Cycle protection: check if notificationVersion changed while FCM was in flight
    if (claimedVersion && data.notificationVersion && data.notificationVersion !== claimedVersion) {
      return; // Discard state update — user opened chat or new cycle started
    }

    const currentClaims: TokenClaim[] = data.claims || [];
    const currentDelivered: string[] = data.deliveredTokens || [];

    const newClaims = currentClaims.filter((c) => c.claimId !== claimId);
    const newDelivered = Array.from(new Set([...currentDelivered, ...successTokens]));
    const newStatus: PushStatus = failedTokenCount > 0 ? "FAILED" : "DELIVERED";

    tx.update(notifDocRef, {
      claims: newClaims,
      deliveredTokens: newDelivered,
      pushStatus: newStatus,
      updatedAt: new Date(),
    });
  });

  if (failedTokenCount > 0) {
    return {
      success: false,
      error: `FCM multicast failure: ${failedTokenCount}/${tokensToClaim.length} tokens failed`,
    };
  }

  return { success: true };
}
