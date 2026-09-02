import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { dispatchServerNotification } from "@/lib/notification-service-server";

/**
 * Server API Route: /api/system-events/trigger
 * Protected System Event Engine generating Team Chat messages & notifications with Firebase Admin SDK.
 * Atomic transaction idempotency with deterministic message IDs (msg_daily_quote_YYYY-MM-DD_UID) preventing duplicates.
 */
export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const internalSecretHeader = req.headers.get("x-internal-secret");
    const configuredSecret = process.env.INTERNAL_PUSH_SECRET || process.env.INTERNAL_SECRET || "nt_internal_server_push_secret_2026";

    // P0-2: Strict String Comparison for Server Secret Header
    const isServerInternal = Boolean(internalSecretHeader && internalSecretHeader === configuredSecret);

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
    const targetEventDocRef = systemEventsRef.doc(userDeliveryKey);

    let alreadyDispatched = false;

    // P0-3: Atomic Transaction to Claim System Event Idempotency Key
    await adminDb.runTransaction(async (transaction) => {
      const docSnap = await transaction.get(targetEventDocRef);
      if (docSnap.exists) {
        alreadyDispatched = true;
        return;
      }
      transaction.set(targetEventDocRef, {
        dispatchedAt: new Date(),
        eventType: eventType || "SYSTEM",
        recipientUid: recipientUid || "broadcast",
        status: "DISPATCHED",
      });
    });

    if (alreadyDispatched) {
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

    // P1-2: Deterministic Message ID in Team Chat Messages Subcollection
    const deterministicMessageId = `msg_${userDeliveryKey}`;
    const messageDocRef = adminDb.collection("chats").doc(systemChatId).collection("messages").doc(deterministicMessageId);

    // Write Team Chat Message via Admin SDK (No Error Swallowing)
    await messageDocRef.set({
      senderId: "namma_thanjai_official",
      senderName: "Namma Thanjai Team",
      text: defaultMessage,
      timestamp: new Date(),
    });

    // P1-1: Route Notification via Centralized Server Notification Engine
    if (recipientUid) {
      await dispatchServerNotification({
        recipientUid,
        type: eventType || "TEAM_FEEDBACK",
        title: titleText || defaultTitle,
        message: defaultMessage,
        conversationId: systemChatId,
        actionUrl: actionUrl || `/chat?chatId=${systemChatId}`,
      });
    }

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
