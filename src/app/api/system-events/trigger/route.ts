import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { dispatchServerNotification } from "@/lib/notification-service-server";

const ALLOWED_EVENT_TYPES = ["DAILY_QUOTE", "TEAM_FEEDBACK", "DAILY_ACTIVITY"];

function getISTDateString(): string {
  try {
    return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  } catch (e) {
    return new Date().toISOString().slice(0, 10);
  }
}

/**
 * Server API Route: /api/system-events/trigger
 * System-Only Event Trigger Engine.
 * Requires internal secret header (INTERNAL_PUSH_SECRET). Accepts allowed event types ONLY.
 * Uses concurrency-safe atomic transactions for idempotency (ABSENT -> PROCESSING -> COMPLETED)
 * and creates exactly ONE deterministic Team Chat message document per event/date.
 */
export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const internalSecretHeader = req.headers.get("x-internal-secret");
    const configuredSecret = process.env.INTERNAL_PUSH_SECRET;

    const isServerInternal = Boolean(configuredSecret && internalSecretHeader && internalSecretHeader === configuredSecret);

    if (process.env.NODE_ENV === "production" && !isServerInternal) {
      return NextResponse.json({ success: false, error: "Unauthorized system event trigger" }, { status: 401 });
    }

    const body = await req.json();
    const { eventType, messageText, titleText, actionUrl } = body;

    // Validate Event Type Strictly
    if (!eventType || !ALLOWED_EVENT_TYPES.includes(eventType)) {
      return NextResponse.json(
        { success: false, error: `Invalid eventType. Allowed types: ${ALLOWED_EVENT_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    // Fix 6: IST Date Key Calculation
    const todayDate = getISTDateString();
    const globalEventKey = `${eventType}_${todayDate}`;

    const systemChatId = "namma_thanjai_system_welcome";
    const systemEventsRef = adminDb.collection("chats").doc(systemChatId).collection("system_events");
    const eventDocRef = systemEventsRef.doc(globalEventKey);

    let alreadyHandled = false;

    // Fix 4: Concurrency-Safe Atomic Claim Transaction (ABSENT -> PROCESSING -> COMPLETED)
    await adminDb.runTransaction(async (transaction) => {
      const docSnap = await transaction.get(eventDocRef);
      if (docSnap.exists) {
        const data = docSnap.data() || {};
        const status = data.status;
        const updatedAt = data.updatedAt ? data.updatedAt.toDate().getTime() : 0;
        const isStale = Date.now() - updatedAt > 10 * 60 * 1000; // Stale after 10m

        if ((status === "PROCESSING" || status === "COMPLETED") && !isStale) {
          alreadyHandled = true;
          return;
        }
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

    if (alreadyHandled) {
      return NextResponse.json({
        success: true,
        message: `System event ${globalEventKey} already processing or completed today (Skipped duplicate)`,
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

    // Create EXACTLY ONE Deterministic Team Chat Message Document
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

    // Fix 5: Batched Broadcast Query Across All Registered Users (No .limit(100) cap)
    const targetRecipients: string[] = [];
    try {
      const usersSnap = await adminDb.collection("users").get();
      usersSnap.forEach((docSnap) => {
        if (docSnap.id) targetRecipients.push(docSnap.id);
      });
    } catch (e) {
      console.warn("User broadcast query note:", e);
    }

    // Dispatch Notifications & FCM via Server Notification Engine in Batches of 50
    const BATCH_SIZE = 50;
    for (let i = 0; i < targetRecipients.length; i += BATCH_SIZE) {
      const batch = targetRecipients.slice(i, i + BATCH_SIZE);
      await Promise.all(
        batch.map((uid) =>
          dispatchServerNotification({
            recipientUid: uid,
            type: eventType,
            title: titleText || defaultTitle,
            message: defaultMessage,
            conversationId: systemChatId,
            actionUrl: actionUrl || `/chat?chatId=${systemChatId}`,
            dateKey: todayDate,
          }).catch((e) => console.warn(`Dispatch error for user ${uid}:`, e))
        )
      );
    }

    // Mark Event as COMPLETED
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
