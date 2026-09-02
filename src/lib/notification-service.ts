import { collection, query, where, getDocs, addDoc, updateDoc, doc, serverTimestamp } from "firebase/firestore";
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
 * Centralized Notification Dispatch Service
 * Handles grouped chat notifications by conversationId, updates unread message counts,
 * and triggers high-priority FCM Push delivery via /api/send-push.
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

    // For CHAT notifications, check if an unread notification document already exists for this conversation
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
        // Group & update existing notification document
        const existingDoc = querySnapshot.docs[0];
        const existingData = existingDoc.data();
        const currentCount = existingData.messageCount || 1;
        const newCount = currentCount + 1;

        const updatedMessage = senderName
          ? `${senderName} (${newCount} new messages): "${message}"`
          : `${newCount} new messages: "${message}"`;

        await updateDoc(doc(db, "notifications", existingDoc.id), {
          title: `New Message regarding ${existingData.title?.replace("New Message regarding ", "") || "Listing"}`,
          message: updatedMessage,
          messageCount: newCount,
          updatedAt: serverTimestamp(),
        });

        // Trigger Push API
        triggerPushApi({ recipientUid, recipientPhone, title: `Chat Alert (${newCount})`, message: updatedMessage, actionUrl: finalActionUrl, chatId: conversationId });
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

    // Trigger Push API
    triggerPushApi({ recipientUid, recipientPhone, title, message, actionUrl: finalActionUrl, chatId: conversationId });
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
