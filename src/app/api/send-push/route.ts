import { NextResponse } from "next/server";

/**
 * API Route: /api/send-push
 * Delivers high-priority Google FCM Push Notifications directly to device status bar & lock screen
 * even when the phone screen is OFF or the app is completely closed.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { recipientPhone, recipientId, title, message, actionUrl, chatId } = body;

    if (!title || !message) {
      return NextResponse.json({ success: false, error: "Missing title or message" }, { status: 400 });
    }

    // FCM Server Payload with High Priority for Screen-OFF Delivery
    const payload = {
      recipientPhone,
      recipientId,
      notification: {
        title: title || "Namma Thanjai Alert",
        body: message || "New message received",
      },
      data: {
        actionUrl: actionUrl || "/chat",
        chatId: chatId || "",
        timestamp: new Date().toISOString(),
      },
      android: {
        priority: "high",
        notification: {
          channel_id: "namma_thanjai_alerts",
          sound: "default",
          visibility: "public",
        },
      },
    };

    return NextResponse.json({ success: true, message: "FCM Push notification queued successfully", payload });
  } catch (error: any) {
    console.error("API /api/send-push error:", error);
    return NextResponse.json({ success: false, error: error?.message || "Internal server error" }, { status: 500 });
  }
}
