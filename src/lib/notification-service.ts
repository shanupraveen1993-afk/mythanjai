import { collection, query, where, getDocs, addDoc, updateDoc, doc, serverTimestamp, runTransaction } from "firebase/firestore";
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
 * Centralized Production Notification Dispatch Service
 * Handles atomic chat grouping transactions, updates unread message counts,
 * throttles push spam (FCM push sent ONLY on 1st unread message), and dispatches system notifications.
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

    // For CHAT notifications, atomically check and group existing unread notification
    if (type === "CHAT" && conversationId) {
      const notifRef = collection(db, "notifications");
      const q = query(
        notifRef,
        where("recipientUid", "==", recipientUid),
        where("conversationId", "==", conversationId),
        where("read", "==", false)
      );

      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const existingDoc = querySnapshot.docs[0];
        const targetDocRef = doc(db, "notifications", existingDoc.id);

        // Atomic Transaction for Incrementing Message Count
        await runTransaction(db, async (transaction) => {
          const sfDoc = await transaction.get(targetDocRef);
          if (!sfDoc.exists()) return;

          const currentCount = sfDoc.data().messageCount || 1;
          const newCount = currentCount + 1;
          const updatedMessage = senderName
            ? `${senderName} (${newCount} new messages): "${message}"`
            : `${newCount} new messages: "${message}"`;

          transaction.update(targetDocRef, {
            message: updatedMessage,
            messageCount: newCount,
            updatedAt: serverTimestamp(),
          });
        });

        // Push Spam Throttling: Do NOT trigger another push alert for subsequent unread messages in the same thread
        return;
      }
    }

    // Create new notification document
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

    // Trigger Push API (First unread message / non-chat event)
    triggerPushApi({ recipientUid, recipientPhone, type, title, message, actionUrl: finalActionUrl, chatId: conversationId });
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
