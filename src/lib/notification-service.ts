import { doc, serverTimestamp, runTransaction } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { NotificationType } from "@/types/notification";

interface DispatchNotificationParams {
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
}

/**
 * Client Notification Helper
 * Handles client-side unread message count grouping on deterministic doc ID (${recipientUid}_${conversationId}).
 * Does NOT directly create cross-user notifications or make unauthenticated FCM push calls.
 */
export async function dispatchNotification({
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
}: DispatchNotificationParams) {
  if (!recipientUid) return;

  try {
    const finalActionUrl = actionUrl || (conversationId ? `/chat?chatId=${conversationId}` : "/chat");

    // For CHAT notifications, use deterministic document ID for atomic grouping
    if (type === "CHAT" && conversationId) {
      const deterministicNotifId = `${recipientUid}_${conversationId}`;
      const targetDocRef = doc(db, "notifications", deterministicNotifId);

      let isFirstUnread = false;

      // Atomic Transaction on Deterministic Document ID
      await runTransaction(db, async (transaction) => {
        const notifDoc = await transaction.get(targetDocRef);

        if (!notifDoc.exists() || notifDoc.data().read === true) {
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
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );
        } else {
          const currentCount = notifDoc.data().messageCount || 1;
          const newCount = currentCount + 1;
          const updatedMessage = senderName
            ? `${senderName} (${newCount} new messages): "${message}"`
            : `${newCount} new messages: "${message}"`;

          transaction.update(targetDocRef, {
            message: updatedMessage,
            messageCount: newCount,
            updatedAt: serverTimestamp(),
          });
        }
      });

      // Trigger Push via Server Push API with Bearer Authorization token ONLY on 1st unread message
      if (isFirstUnread) {
        triggerAuthorizedPushApi({
          callerUid: senderUid,
          type: "CHAT",
          title,
          message,
          actionUrl: finalActionUrl,
          chatId: conversationId,
          conversationId,
        });
      }
    }
  } catch (error) {
    console.warn("Client dispatchNotification note:", error);
  }
}

async function triggerAuthorizedPushApi(payload: any) {
  try {
    if (typeof window !== "undefined") {
      const { auth } = await import("@/lib/firebase");
      const idToken = auth.currentUser ? await auth.currentUser.getIdToken().catch(() => "") : "";
      if (!idToken) return;

      fetch("/api/send-push", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(payload),
      }).catch((e) => console.warn("Push API trigger note:", e));
    }
  } catch (e) {
    console.warn("Push API execution note:", e);
  }
}
