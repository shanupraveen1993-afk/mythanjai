export type NotificationType =
  | "CHAT"
  | "TEAM_WELCOME"
  | "TEAM_FEEDBACK"
  | "DAILY_QUOTE"
  | "DAILY_ACTIVITY"
  | "POST_ACTIVITY";

export interface AppNotification {
  id: string;
  recipientUid: string;
  recipientPhone?: string;
  type: NotificationType;
  title: string;
  message: string;
  senderUid?: string;
  senderName?: string;
  senderPhone?: string;
  conversationId?: string;
  messageCount?: number;
  actionUrl: string;
  read: boolean;
  createdAt: any;
  updatedAt: any;
}

export interface UserDeviceToken {
  token: string;
  platform: "android" | "ios" | "web";
  lastUpdated: any;
}
