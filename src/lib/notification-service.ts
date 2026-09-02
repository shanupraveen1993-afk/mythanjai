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
 * Client Notification Service (Disabled Authoritative Creation & Client Push)
 * All notification document creation and FCM push delivery are handled 100% server-authoritatively via
 * server-side Admin SDK handlers (`dispatchServerNotification`).
 * This client helper exists strictly to satisfy legacy component signatures without mutating Firestore or invoking push APIs.
 */
export async function dispatchNotification(_params: DispatchNotificationParams) {
  // Authoritative notification creation and push delivery happen exclusively server-side.
  // Zero client writes to notifications collection and zero client push API calls.
  return Promise.resolve();
}
