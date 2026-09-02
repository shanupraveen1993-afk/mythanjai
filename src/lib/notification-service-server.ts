import { adminDb, adminMessaging } from "@/lib/firebase-admin";
import { NotificationType } from "@/types/notification";
import { randomUUID } from "crypto";

/**
 * Claim lease duration: 2 minutes.
 * A claim older than this is considered stale (server likely crashed) and is reclaimable.
 * New claims that arrive after expiry will purge stale entries and issue fresh claims.
 */
const CLAIM_LEASE_MS = 2 * 60 * 1000;

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
 * Authoritative Server Notification Engine — v46
 * Powered by Firebase Admin SDK.
 *
 * Delivery contract:
 *   AT-LEAST-ONCE delivery with duplicate prevention during normal concurrent execution.
 *
 *   This engine guarantees that:
 *   - Under normal operation (no mid-flight crashes), each device token receives the FCM
 *     push exactly once per notification.
 *   - Two concurrent /api/chat/notify calls for the same conversation will not both send
 *     FCM to the same device token.
 *   - Stale claims (from crashed server instances) are automatically recovered after the
 *     claim lease expires (CLAIM_LEASE_MS = 2 minutes).
 *   - Tokens confirmed as successfully delivered are recorded in `deliveredTokens` and
 *     are never retargeted by future retries.
 *
 *   Unavoidable edge case (at-least-once):
 *   - If the server delivers FCM successfully but crashes before writing `deliveredTokens`
 *     back to Firestore, a later retry will resend to that token. This is an inherent
 *     tradeoff of at-least-once delivery across two independent systems (FCM + Firestore)
 *     without a distributed lock. Exactly-once FCM delivery is not achievable here.
 *
 * Document fields used by this engine:
 *   claims:           TokenClaim[]  — active per-token claim leases (2-min TTL)
 *   deliveredTokens:  string[]      — tokens that confirmed FCM receipt
 *   pushStatus:       PushStatus    — overall delivery state
 *   processedMessageIds: string[]   — messageIds that have already been processed (chat only)
 *   messageCount:     number        — grouped unread count (chat only)
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

      // Phase A: create or update the notification document
      // (message content grouping + messageId deduplication)
      await adminDb.runTransaction(async (tx) => {
        const notifDoc = await tx.get(targetDocRef);

        if (!notifDoc.exists || notifDoc.data()?.read === true) {
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
              processedMessageIds: messageId ? [messageId] : [],
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            { merge: true }
          );
        } else {
          const currentData = notifDoc.data() || {};
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
            updatedAt: new Date(),
          });
        }
      });

      // Phase B: FCM delivery with leased per-token claiming
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
 * Firestore Admin SDK deserializes Timestamps as objects with `.toMillis()`.
 */
function toMs(value: unknown): number {
  if (!value) return 0;
  if (typeof (value as any).toMillis === "function") return (value as any).toMillis();
  if (typeof (value as any).toDate === "function") return (value as any).toDate().getTime();
  if (value instanceof Date) return value.getTime();
  return 0;
}

/**
 * FCM delivery with leased per-token claiming.
 *
 * Concurrency & recovery contract:
 * - Each attempt generates a unique claimId (UUID).
 * - Before claiming, stale claims (> CLAIM_LEASE_MS old) are purged from the document.
 *   This recovers tokens stuck by previously crashed server instances.
 * - Only tokens that are not delivered and not actively claimed are targeted.
 * - After FCM, our claims are released by claimId. Successful tokens are added to
 *   deliveredTokens. Failed tokens remain unclaimed and retryable.
 *
 * NO_DEVICES contract:
 * - Zero registered device tokens → pushStatus = "NO_DEVICES", success: true.
 *   In-app notification document was created and is visible in the drawer.
 *
 * At-least-once edge case:
 * - If the server delivers FCM successfully but crashes before writing deliveredTokens,
 *   a later retry will resend to that token. This is an inherent tradeoff and is
 *   accepted as part of the at-least-once delivery contract.
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

  // NO_DEVICES: recipient has zero registered push targets.
  // In-app notification is still visible in the drawer.
  if (allTokens.length === 0) {
    await notifDocRef.update({ pushStatus: "NO_DEVICES", updatedAt: new Date() });
    return { success: true };
  }

  // ── Step 2: Atomic leased claim transaction ──────────────────────────────
  // Firestore serializes transactions on the same document. Two concurrent calls
  // will be serialized; the second will see the first's active claims and skip.
  // Expired claims (server crash recovery) are purged before new claims are issued.
  const claimId = randomUUID();
  const now = Date.now();
  let tokensToClaim: string[] = [];

  await adminDb.runTransaction(async (tx) => {
    const doc = await tx.get(notifDocRef);
    const data = doc.data() || {};
    const deliveredTokens: string[] = data.deliveredTokens || [];
    const existingClaims: TokenClaim[] = data.claims || [];

    // Partition existing claims: active (within lease) vs stale (reclaimable)
    const activeClaims = existingClaims.filter(
      (c) => now - toMs(c.claimedAt) < CLAIM_LEASE_MS
    );
    const activelyClaimedTokens = new Set(activeClaims.map((c) => c.token));

    // Tokens eligible for this attempt: not delivered and not currently active-claimed
    tokensToClaim = allTokens.filter(
      (t) => !deliveredTokens.includes(t) && !activelyClaimedTokens.has(t)
    );

    if (tokensToClaim.length === 0) return; // Nothing to do

    // Create our claim records (stale claims are implicitly purged by only writing activeClaims)
    const newClaims: TokenClaim[] = tokensToClaim.map((token) => ({
      token,
      claimedAt: new Date(),
      claimId,
    }));

    tx.update(notifDocRef, {
      claims: [...activeClaims, ...newClaims], // purge stale + add ours
      updatedAt: new Date(),
    });
  });

  if (tokensToClaim.length === 0) {
    // All tokens either delivered or actively claimed by a live concurrent attempt.
    return { success: true };
  }

  // ── Step 3: Send FCM to our claimed tokens ────────────────────────────────
  let successTokens: string[] = [];
  let failedTokenCount = 0;

  try {
    const response = await adminMessaging.sendEachForMulticast({
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
    });

    response.responses.forEach((resp, idx) => {
      if (resp.success) {
        successTokens.push(tokensToClaim[idx]);
      } else {
        failedTokenCount++;
      }
    });

    // Remove invalid/unregistered device tokens from Firestore
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
            cleanupPromises.push(
              adminDb
                .collection("users")
                .doc(recipientUid)
                .collection("devices")
                .doc(failedDocId)
                .delete()
                .catch(() => {})
            );
          }
        }
      }
    });
    await Promise.all(cleanupPromises);
  } catch (fcmErr: any) {
    // SDK/network-level error: release only our specific claims (by claimId)
    // so the next retry can reclaim and retry these tokens.
    console.error("executeServerPushWithClaim FCM SDK error:", fcmErr);
    await adminDb.runTransaction(async (tx) => {
      const doc = await tx.get(notifDocRef);
      const data = doc.data() || {};
      const currentClaims: TokenClaim[] = data.claims || [];
      tx.update(notifDocRef, {
        claims: currentClaims.filter((c) => c.claimId !== claimId),
        pushStatus: "FAILED",
        updatedAt: new Date(),
      });
    });
    return { success: false, error: fcmErr?.message || "FCM SDK error" };
  }

  // ── Step 4: Atomic post-FCM state write ──────────────────────────────────
  // Release our specific claims (by claimId) and record successful deliveries.
  //
  // At-least-once edge case: if the server crashes between Step 3 (FCM send) and
  // this write, a later retry will re-send to successTokens. This is accepted as
  // part of the at-least-once delivery contract. deliveredTokens prevents resends
  // under normal conditions (no mid-flight crash).
  await adminDb.runTransaction(async (tx) => {
    const doc = await tx.get(notifDocRef);
    const data = doc.data() || {};
    const currentClaims: TokenClaim[] = data.claims || [];
    const currentDelivered: string[] = data.deliveredTokens || [];

    // Release only our claimId, leave other concurrent attempts' claims intact
    const newClaims = currentClaims.filter((c) => c.claimId !== claimId);
    // Record tokens that FCM confirmed as delivered
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
