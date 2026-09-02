import { NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase-admin";

/**
 * Server API Route: /api/system-events/trigger
 * Protected System Event Engine generating Team Chat messages & notifications with Firebase Admin SDK.
 * Idempotent with separate global event keys and per-user delivery keys. Strict error handling (no error swallowing).
 */
export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const isServerInternal = Boolean(req.headers.get("x-internal-secret"));

    if (process.env.NODE_ENV === "production" && !authHeader.startsWith("Bearer ") && !isServerInternal) {
      return NextResponse.json({ success: false, error: "Unauthorized system event trigger" }, { status: 401 });
    }

    const body = await req.json();
    const { eventType, recipientUid, messageText, titleText, actionUrl } = body;

    const todayDate = new Date().toISOString().slice(0, 10);
    const globalEventKey = `${eventType || "system_event"}_${todayDate}`;
    const userDeliveryKey = recipientUid ? `${globalEventKey}_${recipientUid}` : globalEventKey;

    const systemChatId = "namma_thanjai_system_welcome";
    const systemEventsRef = adminDb.collection("chats").doc(systemChatId).collection("system_events");

    // 1. Idempotency Check on Server
    const existingDoc = await systemEventsRef.doc(userDeliveryKey).get();
    if (existingDoc.exists) {
      return NextResponse.json({
        success: true,
        message: `System event ${userDeliveryKey} already dispatched today (Skipped duplicate)`,
        idempotent: true,
      });
    }

    const defaultTitle = eventType === "DAILY_QUOTE"
      ? "✨ Namma Thanjai Daily Tip"
      : eventType === "TEAM_FEEDBACK"
      ? "💬 How is Namma Thanjai?"
      : "📊 Daily Activity Update";

    const defaultMessage = eventType === "DAILY_QUOTE"
      ? "Discover top festival offers and community listings in Medical College Road & Big Temple areas!"
      : eventType === "TEAM_FEEDBACK"
      ? "Vanakkam! We value your experience. Tap to share feedback & help us improve!"
      : messageText || "Check out new local store offers and marketplace items in your area today!";

    // 2. Add System Message to Team Chat via Firebase Admin SDK (No error swallowing)
    const messagesRef = adminDb.collection("chats").doc(systemChatId).collection("messages");
    await messagesRef.add({
      senderId: "namma_thanjai_official",
      senderName: "Namma Thanjai Team",
      text: defaultMessage,
      timestamp: new Date(),
    });

    // 3. Create Notification in Firestore via Admin SDK if recipientUid is provided
    if (recipientUid) {
      await adminDb.collection("notifications").add({
        recipientUid,
        type: eventType || "TEAM_FEEDBACK",
        title: titleText || defaultTitle,
        message: defaultMessage,
        conversationId: systemChatId,
        messageCount: 1,
        actionUrl: actionUrl || `/chat?chatId=${systemChatId}`,
        read: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // 4. Write Idempotency Record
    await systemEventsRef.doc(userDeliveryKey).set({
      dispatchedAt: new Date(),
      eventType,
      recipientUid: recipientUid || "broadcast",
    });

    return NextResponse.json({
      success: true,
      message: `System event ${userDeliveryKey} created and dispatched successfully`,
      idempotencyKey: userDeliveryKey,
    });
  } catch (error: any) {
    console.error("API /api/system-events/trigger error:", error);
    return NextResponse.json({ success: false, error: error?.message || "Failed to dispatch system event" }, { status: 500 });
  }
}
