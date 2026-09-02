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
 * Authoritative Server Notification Engine — v44
 * Powered by Firebase Admin SDK.
 *
 * Guarantees:
 * 1. pushStatus: "NO_DEVICES" | "PENDING" | "DELIVERED" | "FAILED".
 *    - tokens.length === 0 results in pushStatus = "NO_DEVICES" (never falsely "DELIVERED").
 * 2. Per-device token deduplication via deliveredTokens: string[].
 *    - Retries target ONLY tokens that have not yet succeeded.
 * 3. Message-Idempotent Chat Notifications via messageId.
 *    - Duplicate calls for the same messageId do NOT increment messageCount twice.
 * 4. Strict error propagation on FCM failures.
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

    // ─── 1. CHAT NOTIFICATIONS ───────────────────────────────────────────────
    if (type === "CHAT" && conversationId) {
      const deterministicNotifId = `${recipientUid}_${conversationId}`;
      const targetDocRef = adminDb.collection("notifications").doc(deterministicNotifId);

      let shouldAttemptPush = false;
      let existingDeliveredTokens: string[] = [];

      await adminDb.runTransaction(async (transaction) => {
        const notifDoc = await transaction.get(targetDocRef);

        if (!notifDoc.exists || notifDoc.data()?.read === true) {
          // Fresh notification document
          shouldAttemptPush = true;
          existingDeliveredTokens = [];
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
              pushStatus: "PENDING",
              deliveredTokens: [],
              processedMessageIds: messageId ? [messageId] : [],
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            { merge: true }
          );
        } else {
          // Existing unread notification document
          const currentData = notifDoc.data() || {};
          existingDeliveredTokens = currentData.deliveredTokens || [];
          const currentProcessedMsgIds: string[] = currentData.processedMessageIds || [];

          const alreadyProcessed = messageId ? currentProcessedMsgIds.includes(messageId) : false;

          let newCount = currentData.messageCount || 1;
          if (!alreadyProcessed) {
            newCount += 1;
          }

          const updatedMessage = senderName
            ? `${senderName} (${newCount} new messages): "${message}"`
            : `${newCount} new messages: "${message}"`;

          const updatedMsgIds = messageId && !alreadyProcessed
            ? Array.from(new Set([...currentProcessedMsgIds, messageId]))
            : currentProcessedMsgIds;

          // Re-attempt push if pushStatus is not yet fully DELIVERED
          shouldAttemptPush = currentData.pushStatus !== "DELIVERED";

          transaction.update(targetDocRef, {
            message: updatedMessage,
            messageCount: newCount,
            processedMessageIds: updatedMsgIds,
            updatedAt: new Date(),
          });
        }
      });

      if (shouldAttemptPush) {
        try {
          const pushResult = await executeServerPush({
            recipientUid,
            title,
            message,
            actionUrl: finalActionUrl,
            chatId: conversationId,
            type,
            existingDeliveredTokens,
          });

          const combinedTokens = Array.from(
            new Set([...existingDeliveredTokens, ...pushResult.newSuccessTokens])
          );

          await targetDocRef.update({
            pushStatus: pushResult.status,
            deliveredTokens: combinedTokens,
            updatedAt: new Date(),
          });

          if (pushResult.status === "FAILED") {
            return { success: false, error: "FCM delivery failed for one or more device tokens" };
          }
        } catch (pushErr: any) {
          console.error("FCM Push delivery error for CHAT notification:", pushErr);
          await targetDocRef.update({
            pushStatus: "FAILED",
            updatedAt: new Date(),
          });
          return { success: false, error: pushErr?.message || "FCM push delivery failed" };
        }
      }

      return { success: true, grouped: true };
    }

    // ─── 2. SYSTEM / ACTIVITY NOTIFICATIONS ──────────────────────────────────
    const deterministicSystemId = `${type}_${todayDate}_${recipientUid}`;
    const systemNotifRef = adminDb.collection("notifications").doc(deterministicSystemId);

    let shouldAttemptSystemPush = false;
    let existingDeliveredTokens: string[] = [];

    await adminDb.runTransaction(async (transaction) => {
      const docSnap = await transaction.get(systemNotifRef);
      if (!docSnap.exists) {
        shouldAttemptSystemPush = true;
        existingDeliveredTokens = [];
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
          pushStatus: "PENDING",
          deliveredTokens: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      } else {
        const existingData = docSnap.data() || {};
        existingDeliveredTokens = existingData.deliveredTokens || [];
        shouldAttemptSystemPush = existingData.pushStatus !== "DELIVERED";
      }
    });

    if (shouldAttemptSystemPush) {
      try {
        const pushResult = await executeServerPush({
          recipientUid,
          title,
          message,
          actionUrl: finalActionUrl,
          chatId: conversationId || "namma_thanjai_system_welcome",
          type,
          existingDeliveredTokens,
        });

        const combinedTokens = Array.from(
          new Set([...existingDeliveredTokens, ...pushResult.newSuccessTokens])
        );

        await systemNotifRef.update({
          pushStatus: pushResult.status,
          deliveredTokens: combinedTokens,
          updatedAt: new Date(),
        });

        if (pushResult.status === "FAILED") {
          return { success: false, error: "FCM delivery failed for system notification" };
        }
      } catch (pushErr: any) {
        console.error("FCM Push delivery error for system notification:", pushErr);
        await systemNotifRef.update({
          pushStatus: "FAILED",
          updatedAt: new Date(),
        });
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
 * Internal FCM multicast delivery helper.
 * - If tokens.length === 0, returns status: "NO_DEVICES"
 * - Deduplicates against existingDeliveredTokens to prevent duplicate pushes to already-successful devices
 * - Cleans up invalid/unregistered tokens from Firestore
 * - Throws an error if any candidate token fails, returning status: "FAILED"
 */
async function executeServerPush({
  recipientUid,
  title,
  message,
  actionUrl,
  chatId,
  type,
  existingDeliveredTokens = [],
}: {
  recipientUid: string;
  title: string;
  message: string;
  actionUrl: string;
  chatId: string;
  type: string;
  existingDeliveredTokens?: string[];
}): Promise<{ status: PushStatus; newSuccessTokens: string[] }> {
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

  // Explicit status: NO_DEVICES when user has zero push tokens registered
  if (tokens.length === 0) {
    return { status: "NO_DEVICES", newSuccessTokens: [] };
  }

  // Target ONLY tokens that have not yet successfully received this notification
  const tokensToTry = tokens.filter((t) => !existingDeliveredTokens.includes(t));

  if (tokensToTry.length === 0) {
    return { status: "DELIVERED", newSuccessTokens: [] };
  }

  const response = await adminMessaging.sendEachForMulticast({
    tokens: tokensToTry,
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

  const newSuccessTokens: string[] = [];

  response.responses.forEach((resp, idx) => {
    if (resp.success) {
      newSuccessTokens.push(tokensToTry[idx]);
    }
  });

  // Clean up invalid/unregistered tokens from Firestore
  if (response.failureCount > 0) {
    const cleanupPromises: Promise<any>[] = [];
    response.responses.forEach((resp, idx) => {
      if (!resp.success && resp.error) {
        const errCode = resp.error.code;
        if (
          errCode === "messaging/registration-token-not-registered" ||
          errCode === "messaging/invalid-registration-token"
        ) {
          const failedToken = tokensToTry[idx];
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

    // Throw error so caller records pushStatus = "FAILED"
    throw new Error(
      `FCM multicast failure: ${response.failureCount}/${tokensToTry.length} tokens failed`
    );
  }

  return { status: "DELIVERED", newSuccessTokens };
}
