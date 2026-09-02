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
 * Authoritative Server Notification Engine
 * Powered by Firebase Admin SDK.
 * Handles deterministic document IDs for chat & system notifications, atomic transactions,
 * unread count grouping, push spam throttling, and direct FCM multicast delivery.
 * Strict Error Propagation: FCM push failures throw exceptions so system event triggers receive success: false.
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

    // 1. CHAT Notifications: Atomic grouping on deterministic doc ID `${recipientUid}_${conversationId}`
    if (type === "CHAT" && conversationId) {
      const deterministicNotifId = `${recipientUid}_${conversationId}`;
      const targetDocRef = adminDb.collection("notifications").doc(deterministicNotifId);

      let isFirstUnread = false;

      await adminDb.runTransaction(async (transaction) => {
        const notifDoc = await transaction.get(targetDocRef);

        if (!notifDoc.exists || notifDoc.data()?.read === true) {
          isFirstUnread = true;
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
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            { merge: true }
          );
        } else {
          const currentCount = notifDoc.data()?.messageCount || 1;
          const newCount = currentCount + 1;
          const updatedMessage = senderName
            ? `${senderName} (${newCount} new messages): "${message}"`
            : `${newCount} new messages: "${message}"`;

          transaction.update(targetDocRef, {
            message: updatedMessage,
            messageCount: newCount,
            updatedAt: new Date(),
          });
        }
      });

      // Push Spam Throttling: Send FCM push ONLY on 1st unread message
      if (isFirstUnread) {
        try {
          await executeServerPush({ recipientUid, title, message, actionUrl: finalActionUrl, chatId: conversationId, type });
        } catch (pushErr: any) {
          console.error("FCM Push delivery error for chat notification:", pushErr);
          return { success: false, error: pushErr?.message || "FCM push delivery failed" };
        }
      }
      return { success: true, grouped: true };
    }

    // 2. System & Activity Notifications: Deterministic doc ID `${type}_${todayDate}_${recipientUid}`
    const deterministicSystemId = `${type}_${todayDate}_${recipientUid}`;
    const systemNotifRef = adminDb.collection("notifications").doc(deterministicSystemId);

    let isNewSystemDoc = false;

    await adminDb.runTransaction(async (transaction) => {
      const docSnap = await transaction.get(systemNotifRef);
      if (!docSnap.exists) {
        isNewSystemDoc = true;
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
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    });

    if (isNewSystemDoc) {
      try {
        await executeServerPush({ recipientUid, title, message, actionUrl: finalActionUrl, chatId: conversationId || "namma_thanjai_system_welcome", type });
      } catch (pushErr: any) {
        console.error("FCM Push delivery error for system notification:", pushErr);
        return { success: false, error: pushErr?.message || "FCM push delivery failed" };
      }
    }

    return { success: true, newDoc: isNewSystemDoc };
  } catch (error: any) {
    console.error("dispatchServerNotification error:", error);
    return { success: false, error: error?.message || "Server notification error" };
  }
}

async function executeServerPush({ recipientUid, title, message, actionUrl, chatId, type }: any) {
  try {
    const devicesSnap = await adminDb.collection("users").doc(recipientUid).collection("devices").get();
    const tokens: string[] = [];
    const docIdsByToken: Record<string, string> = {};

    devicesSnap.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.token) {
        tokens.push(data.token);
        docIdsByToken[data.token] = docSnap.id;
      }
    });

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

    // Clean Up Stale / Invalid Device Tokens from Firestore
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
                adminDb.collection("users").doc(recipientUid).collection("devices").doc(failedDocId).delete().catch(() => {})
              );
            }
          }
        }
      });
      await Promise.all(cleanupPromises);

      // Strict Error Propagation: Throw error if all FCM tokens failed
      if (response.failureCount === tokens.length) {
        throw new Error(`FCM multicast failed completely: ${response.failureCount} tokens failed`);
      }
    }
  } catch (e) {
    console.error("executeServerPush FCM error:", e);
    throw e;
  }
}
