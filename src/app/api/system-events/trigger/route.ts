import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { dispatchServerNotification } from "@/lib/notification-service-server";

const ALLOWED_EVENT_TYPES = ["DAILY_QUOTE", "TEAM_FEEDBACK", "DAILY_ACTIVITY"];

/**
 * Server API Route: /api/system-events/trigger
 * System-Only Event Trigger Engine.
 * Requires internal secret header (INTERNAL_PUSH_SECRET). Accepts allowed event types only.
 * Uses atomic Firestore transactions for idempotency and creates exactly ONE deterministic Team Chat message document (daily_quote_YYYY-MM-DD).
 */
export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const internalSecretHeader = req.headers.get("x-internal-secret");
    const configuredSecret = process.env.INTERNAL_PUSH_SECRET;

    // Strict internal secret header comparison
    const isServerInternal = Boolean(configuredSecret && internalSecretHeader && internalSecretHeader === configuredSecret);

    if (process.env.NODE_ENV === "production" && !isServerInternal) {
      return NextResponse.json({ success: false, error: "Unauthorized system event trigger" }, { status: 401 });
    }

    const body = await req.json();
    const { eventType, recipientUid: requestedRecipientUid, messageText, titleText, actionUrl } = body;

    // Validate Event Type
    if (!eventType || !ALLOWED_EVENT_TYPES.includes(eventType)) {
      return NextResponse.json(
        { success: false, error: `Invalid eventType. Allowed types: ${ALLOWED_EVENT_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    const todayDate = new Date().toISOString().slice(0, 10);
    const globalEventKey = `${eventType}_${todayDate}`;

    const systemChatId = "namma_thanjai_system_welcome";
    const systemEventsRef = adminDb.collection("chats").doc(systemChatId).collection("system_events");
    const eventDocRef = systemEventsRef.doc(globalEventKey);

    let alreadyCompleted = false;

    // 1. Atomic Transaction to Claim System Event Key (PROCESSING -> COMPLETED)
    await adminDb.runTransaction(async (transaction) => {
      const docSnap = await transaction.get(eventDocRef);
      if (docSnap.exists && docSnap.data()?.status === "COMPLETED") {
        alreadyCompleted = true;
        return;
      }
      transaction.set(
        eventDocRef,
        {
          eventType,
          date: todayDate,
          status: "PROCESSING",
          updatedAt: new Date(),
        },
        { merge: true }
      );
    });

    if (alreadyCompleted) {
      return NextResponse.json({
        success: true,
        message: `System event ${globalEventKey} already completed today (Skipped duplicate)`,
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

    // 2. Create EXACTLY ONE Deterministic Team Chat Message Document
    const messageDocRef = adminDb.collection("chats").doc(systemChatId).collection("messages").doc(globalEventKey);
    await messageDocRef.set(
      {
        senderId: "namma_thanjai_official",
        senderName: "Namma Thanjai Team",
        text: defaultMessage,
        timestamp: new Date(),
      },
      { merge: true }
    );

    // 3. Resolve Target Recipients Server-Side
    let targetRecipients: string[] = [];

    if (requestedRecipientUid) {
      targetRecipients = [requestedRecipientUid];
    } else {
      // Query users from Firestore Admin for broadcast dispatch
      try {
        const usersSnap = await adminDb.collection("users").limit(100).get();
        usersSnap.forEach((docSnap) => {
          if (docSnap.id) targetRecipients.push(docSnap.id);
        });
      } catch (e) {
        console.warn("Target user query note:", e);
      }
    }

    // 4. Dispatch Notifications & FCM via Authoritative Server Notification Engine
    const dispatchPromises = targetRecipients.map((uid) =>
      dispatchServerNotification({
        recipientUid: uid,
        type: eventType,
        title: titleText || defaultTitle,
        message: defaultMessage,
        conversationId: systemChatId,
        actionUrl: actionUrl || `/chat?chatId=${systemChatId}`,
        dateKey: todayDate,
      }).catch((e) => console.warn(`Dispatch error for user ${uid}:`, e))
    );

    await Promise.all(dispatchPromises);

    // 5. Mark System Event as COMPLETED in Firestore
    await eventDocRef.update({
      status: "COMPLETED",
      completedAt: new Date(),
      recipientsCount: targetRecipients.length,
    });

    return NextResponse.json({
      success: true,
      message: `System event ${globalEventKey} completed and dispatched successfully`,
      idempotencyKey: globalEventKey,
      recipientsCount: targetRecipients.length,
    });
  } catch (error: any) {
    console.error("API /api/system-events/trigger error:", error);
    return NextResponse.json({ success: false, error: error?.message || "Failed to dispatch system event" }, { status: 500 });
  }
}
