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
}

/**
 * Authoritative Server Notification Engine — v43
 * Powered by Firebase Admin SDK.
 *
 * Key reliability guarantees:
 * 1. pushDelivered: boolean field on every notification document tracks FCM delivery state.
 *    - Created as false. Updated to true only after successful FCM delivery.
 *    - On retry: if doc exists and pushDelivered is false, FCM is attempted again.
 *    - This makes FAILED → retry cycles fully reliable without duplicate docs.
 * 2. executeServerPush throws on ANY FCM failure (failureCount > 0), not just full failure.
 * 3. dispatchServerNotification returns success: false whenever FCM has any failed token.
 * 4. system-events/trigger therefore reaches FAILED whenever any FCM delivery fails.
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
}: ServerNotificationParams) {
  if (!recipientUid) return { success: false, error: "Missing recipientUid" };

  try {
    const finalActionUrl = actionUrl || (conversationId ? `/chat?chatId=${conversationId}` : "/chat");
    const todayDate = dateKey || new Date().toISOString().slice(0, 10);

    // ─── CHAT NOTIFICATIONS ──────────────────────────────────────────────────
    // Deterministic doc ID: `${recipientUid}_${conversationId}`
    // Atomic grouping: increment messageCount on existing unread, create on new/already-read.
    // FCM retry: if doc exists unread but pushDelivered=false → attempt FCM again.
    if (type === "CHAT" && conversationId) {
      const deterministicNotifId = `${recipientUid}_${conversationId}`;
      const targetDocRef = adminDb.collection("notifications").doc(deterministicNotifId);

      // Tracks whether we need to attempt (or re-attempt) FCM for this notification.
      let shouldAttemptPush = false;

      await adminDb.runTransaction(async (transaction) => {
        const notifDoc = await transaction.get(targetDocRef);

        if (!notifDoc.exists || notifDoc.data()?.read === true) {
          // New notification or previously-read: create fresh doc.
          shouldAttemptPush = true;
          const updatedMessage = senderName ? `${senderName}: "${message}"` : `"${message}"`;

          transaction.set(
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
              pushDelivered: false,   // Will be set true after successful FCM
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            { merge: true }
          );
        } else {
          // Existing unread notification: increment count.
          const currentData = notifDoc.data() || {};
          const currentCount = currentData.messageCount || 1;
          const newCount = currentCount + 1;
          const updatedMessage = senderName
            ? `${senderName} (${newCount} new messages): "${message}"`
            : `${newCount} new messages: "${message}"`;

          // Re-attempt FCM only if previous push delivery failed.
          shouldAttemptPush = currentData.pushDelivered === false;

          transaction.update(targetDocRef, {
            message: updatedMessage,
            messageCount: newCount,
            updatedAt: new Date(),
          });
        }
      });

      if (shouldAttemptPush) {
        try {
          await executeServerPush({
            recipientUid,
            title,
            message,
            actionUrl: finalActionUrl,
            chatId: conversationId,
            type,
          });
          // Mark push as delivered only after fully successful FCM execution.
          await targetDocRef.update({ pushDelivered: true });
        } catch (pushErr: any) {
          console.error("FCM Push delivery error for CHAT notification:", pushErr);
          // Leave pushDelivered: false so next retry re-attempts FCM.
          return { success: false, error: pushErr?.message || "FCM push delivery failed" };
        }
      }

      return { success: true, grouped: true };
    }

    // ─── SYSTEM / ACTIVITY NOTIFICATIONS ─────────────────────────────────────
    // Deterministic doc ID: `${type}_${todayDate}_${recipientUid}`
    // On retry: if doc exists with pushDelivered=false → attempt FCM again.
    const deterministicSystemId = `${type}_${todayDate}_${recipientUid}`;
    const systemNotifRef = adminDb.collection("notifications").doc(deterministicSystemId);

    let shouldAttemptSystemPush = false;

    await adminDb.runTransaction(async (transaction) => {
      const docSnap = await transaction.get(systemNotifRef);
      if (!docSnap.exists) {
        // First attempt: create doc with pushDelivered: false.
        shouldAttemptSystemPush = true;
        transaction.set(systemNotifRef, {
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
          pushDelivered: false,   // Will be set true after successful FCM
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      } else {
        // Doc already exists — retry FCM only if previous push failed.
        const existingData = docSnap.data() || {};
        shouldAttemptSystemPush = existingData.pushDelivered === false;
      }
    });

    if (shouldAttemptSystemPush) {
      try {
        await executeServerPush({
          recipientUid,
          title,
          message,
          actionUrl: finalActionUrl,
          chatId: conversationId || "namma_thanjai_system_welcome",
          type,
        });
        // Mark push as delivered only after fully successful FCM execution.
        await systemNotifRef.update({ pushDelivered: true });
      } catch (pushErr: any) {
        console.error("FCM Push delivery error for system notification:", pushErr);
        // Leave pushDelivered: false so next retry re-attempts FCM.
        return { success: false, error: pushErr?.message || "FCM push delivery failed" };
      }
    }

    return { success: true };
  } catch (error: any) {
    console.error("dispatchServerNotification error:", error);
    return { success: false, error: error?.message || "Server notification error" };
  }
}

/**
 * Internal FCM multicast delivery.
 * Throws on ANY token failure (failureCount > 0), not only when all tokens fail.
 * Cleans up stale/invalid tokens before throwing.
 */
async function executeServerPush({
  recipientUid,
  title,
  message,
  actionUrl,
  chatId,
  type,
}: {
  recipientUid: string;
  title: string;
  message: string;
  actionUrl: string;
  chatId: string;
  type: string;
}) {
  const devicesSnap = await adminDb
    .collection("users")
    .doc(recipientUid)
    .collection("devices")
    .get();

  const tokens: string[] = [];
  const docIdsByToken: Record<string, string> = {};

  devicesSnap.forEach((docSnap) => {
    const data = docSnap.data();
    if (data.token) {
      tokens.push(data.token);
      docIdsByToken[data.token] = docSnap.id;
    }
  });

  // No registered devices — not an error; recipient simply has no push targets.
  if (tokens.length === 0) return;

  const response = await adminMessaging.sendEachForMulticast({
    tokens,
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

  // ── Clean up stale / invalid tokens regardless of whether we throw ──────────
  if (response.failureCount > 0) {
    const cleanupPromises: Promise<any>[] = [];
    response.responses.forEach((resp, idx) => {
      if (!resp.success && resp.error) {
        const errCode = resp.error.code;
        if (
          errCode === "messaging/registration-token-not-registered" ||
          errCode === "messaging/invalid-registration-token"
        ) {
          const failedToken = tokens[idx];
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

    // ── v43 strict contract: ANY failure → throw ────────────────────────────
    throw new Error(
      `FCM multicast partial/full failure: ${response.failureCount}/${tokens.length} tokens failed`
    );
  }
}
