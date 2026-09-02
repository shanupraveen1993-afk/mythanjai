import { collection, doc, addDoc, serverTimestamp, runTransaction } from "firebase/firestore";
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
 * Production Centralized Notification Engine
 * Uses deterministic document IDs (${recipientUid}_${conversationId}) to guarantee 100% atomic grouping
 * transactions, update unread message counts, and throttle FCM push alerts to the 1st unread message.
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

    // For CHAT notifications, use a deterministic document ID for atomic grouping
    if (type === "CHAT" && conversationId) {
      const deterministicNotifId = `${recipientUid}_${conversationId}`;
      const targetDocRef = doc(db, "notifications", deterministicNotifId);

      let isFirstUnread = false;

      // Atomic Transaction on Deterministic Document ID
      await runTransaction(db, async (transaction) => {
        const notifDoc = await transaction.get(targetDocRef);

        if (!notifDoc.exists() || notifDoc.data().read === true) {
          // 1st Unread Message: Create/reset notification document
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
          // Subsequent Unread Messages: Increment messageCount atomically
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

      // Push Spam Throttling: Trigger FCM push ONLY on 1st unread message
      if (isFirstUnread) {
        triggerPushApi({
          callerUid: senderUid,
          recipientUid,
          recipientPhone,
          type: "CHAT",
          title,
          message,
          actionUrl: finalActionUrl,
          chatId: conversationId,
          conversationId,
        });
      }
      return;
    }

    // Non-chat notifications (System events / Activity updates)
    await addDoc(collection(db, "notifications"), {
      recipientUid,
      recipientPhone: recipientPhone || "",
      type,
      title,
      message,
      senderUid: senderUid || "",
      senderName: senderName || "",
      senderPhone: senderPhone || "",
      conversationId: conversationId || "",
      messageCount: 1,
      actionUrl: finalActionUrl,
      read: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    triggerPushApi({
      callerUid: senderUid,
      recipientUid,
      recipientPhone,
      type,
      title,
      message,
      actionUrl: finalActionUrl,
      chatId: conversationId,
      conversationId,
    });
  } catch (error) {
    console.warn("Centralized dispatchNotification error:", error);
  }
}

async function triggerPushApi(payload: any) {
  try {
    if (typeof window !== "undefined") {
      fetch("/api/send-push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).catch((e) => console.warn("Push API trigger note:", e));
    }
  } catch (e) {
    console.warn("Push API execution note:", e);
  }
}
