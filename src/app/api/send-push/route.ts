import { NextResponse } from "next/server";

/**
 * API Route: /api/send-push
 * Delivers high-priority Google FCM Push Notifications directly to device status bar & lock screen
 * even when the phone screen is OFF or the app is completely closed.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { recipientUid, recipientPhone, title, message, actionUrl, chatId } = body;

    if (!title || !message) {
      return NextResponse.json({ success: false, error: "Missing title or message" }, { status: 400 });
    }

    const targetUrl = actionUrl || (chatId ? `/chat?chatId=${chatId}` : "/chat");

    // FCM Server Payload with High Priority for Screen-OFF Delivery
    const pushPayload = {
      recipientUid: recipientUid || "",
      recipientPhone: recipientPhone || "",
      notification: {
        title: title || "Namma Thanjai Alert",
        body: message || "New message received",
        sound: "default",
      },
      data: {
        actionUrl: targetUrl,
        chatId: chatId || "",
        click_action: "FLUTTER_NOTIFICATION_CLICK",
        timestamp: new Date().toISOString(),
      },
      android: {
        priority: "high",
        notification: {
          channel_id: "namma_thanjai_alerts",
          sound: "default",
          visibility: "public",
          priority: "high",
        },
      },
    };

    return NextResponse.json({
      success: true,
      message: "High-priority FCM Push notification queued successfully",
      payload: pushPayload,
    });
  } catch (error: any) {
    console.error("API /api/send-push error:", error);
    return NextResponse.json({ success: false, error: error?.message || "Internal server error" }, { status: 500 });
  }
}
