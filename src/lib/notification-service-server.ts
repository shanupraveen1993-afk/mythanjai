import { adminDb, adminMessaging } from "@/lib/firebase-admin";
import { NotificationType } from "@/types/notification";

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
 * Authoritative Server Notification Engine — v45
 * Powered by Firebase Admin SDK.
 *
 * Reliability guarantees:
 *
 * 1. Atomic per-token FCM claiming (claimedTokens: string[]).
 *    - Device tokens are claimed inside a Firestore transaction BEFORE FCM is sent.
 *    - Two concurrent notification requests for the same document will serialize on
 *      the transaction; the second will see its tokens already claimed and skip FCM.
 *    - On success: claimed tokens are atomically moved to deliveredTokens.
 *    - On failure: claimed tokens are released so the next retry attempt can re-claim them.
 *
 * 2. pushStatus semantics (NO_DEVICES | PENDING | DELIVERED | FAILED):
 *    - NO_DEVICES: recipient has no registered push devices. The in-app notification
 *      document is still created and visible in the notification drawer. This is treated
 *      as success: true because no push delivery is possible or expected. System events
 *      with NO_DEVICES recipients are still marked COMPLETED (notification shown in-app).
 *    - PENDING: notification created, FCM not yet attempted.
 *    - DELIVERED: all target device tokens received the FCM push successfully.
 *    - FAILED: one or more target tokens failed FCM delivery; retryable.
 *
 * 3. Message-idempotent chat notifications via messageId (processedMessageIds: string[]).
 *    - Duplicate calls for the same messageId do NOT increment messageCount twice.
 *
 * 4. Strict FCM failure propagation: any token failure causes success: false so
 *    system-events/trigger can reach the FAILED path and be safely retried.
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

      // Phase A: create or update the notification document (message content + messageId tracking)
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
              claimedTokens: [],
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

      // Phase B: attempt FCM with atomic per-token claiming
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
          claimedTokens: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      } else {
        isExistingDoc = true;
        existingPushStatus = (docSnap.data()?.pushStatus || "PENDING") as PushStatus;
      }
    });

    // Skip FCM if already fully delivered
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
 * Atomic per-token FCM delivery with claim/release mechanism.
 *
 * Concurrency contract:
 * - Device tokens are queried, then claimed atomically inside a Firestore transaction.
 * - Firestore serializes transactions on the same document, so two concurrent calls
 *   targeting the same notification document cannot both claim the same token.
 * - After FCM: successfully delivered tokens move to deliveredTokens; failed claims
 *   are released so the next retry can attempt them.
 *
 * NO_DEVICES contract:
 * - If the recipient has no registered device tokens, pushStatus is set to "NO_DEVICES".
 * - This is treated as success: true because the in-app notification document is still
 *   created and visible in the notification drawer. No push delivery is possible or
 *   expected for users without registered devices.
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
  // ── Step 1: Query device tokens BEFORE the claim transaction ─────────────
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

  // NO_DEVICES: recipient has no push devices. In-app notification still visible.
  if (allTokens.length === 0) {
    await notifDocRef.update({ pushStatus: "NO_DEVICES", updatedAt: new Date() });
    return { success: true }; // No push possible; in-app notification was created.
  }

  // ── Step 2: Atomic claim transaction ─────────────────────────────────────
  // Tokens are claimed here. Because Firestore serializes transactions per document,
  // concurrent calls will serialize here and cannot both claim the same token.
  let tokensToClaim: string[] = [];

  await adminDb.runTransaction(async (tx) => {
    const doc = await tx.get(notifDocRef);
    const data = doc.data() || {};
    const deliveredTokens: string[] = data.deliveredTokens || [];
    const claimedTokens: string[] = data.claimedTokens || [];

    // Only attempt tokens not yet delivered and not currently claimed by another attempt
    tokensToClaim = allTokens.filter(
      (t) => !deliveredTokens.includes(t) && !claimedTokens.includes(t)
    );

    if (tokensToClaim.length === 0) return; // Nothing to claim

    tx.update(notifDocRef, {
      claimedTokens: [...claimedTokens, ...tokensToClaim],
      updatedAt: new Date(),
    });
  });

  if (tokensToClaim.length === 0) {
    // All tokens are either already delivered or claimed by a concurrent attempt.
    // The concurrent attempt will handle them; this call can return successfully.
    return { success: true };
  }

  // ── Step 3: Send FCM to claimed tokens only ───────────────────────────────
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

    // Clean up stale/invalid tokens from Firestore (registration errors)
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
    // SDK/network error: release all claims so retry can attempt them again
    console.error("executeServerPushWithClaim FCM SDK error:", fcmErr);
    await adminDb.runTransaction(async (tx) => {
      const doc = await tx.get(notifDocRef);
      const data = doc.data() || {};
      const currentClaimed: string[] = data.claimedTokens || [];
      tx.update(notifDocRef, {
        claimedTokens: currentClaimed.filter((t) => !tokensToClaim.includes(t)),
        pushStatus: "FAILED",
        updatedAt: new Date(),
      });
    });
    return { success: false, error: fcmErr?.message || "FCM SDK error" };
  }

  // ── Step 4: Atomic post-FCM state update ─────────────────────────────────
  // Release claims + record successes + update pushStatus
  await adminDb.runTransaction(async (tx) => {
    const doc = await tx.get(notifDocRef);
    const data = doc.data() || {};
    const currentClaimed: string[] = data.claimedTokens || [];
    const currentDelivered: string[] = data.deliveredTokens || [];

    // Release our claims (all of tokensToClaim, regardless of success/failure)
    const newClaimed = currentClaimed.filter((t) => !tokensToClaim.includes(t));
    // Record successfully delivered tokens
    const newDelivered = Array.from(new Set([...currentDelivered, ...successTokens]));
    const newStatus: PushStatus = failedTokenCount > 0 ? "FAILED" : "DELIVERED";

    tx.update(notifDocRef, {
      claimedTokens: newClaimed,
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
