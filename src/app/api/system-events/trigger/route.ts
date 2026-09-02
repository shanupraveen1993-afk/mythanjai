import { NextResponse } from "next/server";
import { doc, getDoc, setDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

/**
 * Server API: /api/system-events/trigger
 * Idempotently generates server-side Team Chat system messages & central notifications
 * with deterministic date keys (e.g. daily_quote_2026-09-02) to guarantee zero duplicates.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { eventType, recipientUid, messageText, titleText, actionUrl } = body;

    const todayDate = new Date().toISOString().slice(0, 10);
    const idempotencyKey = `${eventType || "system_event"}_${todayDate}`;

    const systemChatId = "namma_thanjai_system_welcome";
    const eventDocRef = doc(db, "chats", systemChatId, "system_events", idempotencyKey);

    // 1. Idempotency Check: Prevent duplicate system messages for the same date
    const existingDoc = await getDoc(eventDocRef).catch(() => null);
    if (existingDoc && existingDoc.exists()) {
      return NextResponse.json({
        success: true,
        message: `System event ${idempotencyKey} already dispatched today (Skipped duplicate)`,
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

    // 2. Add System Message to Team Chat
    await addDoc(collection(db, "chats", systemChatId, "messages"), {
      senderId: "namma_thanjai_official",
      senderName: "Namma Thanjai Team",
      text: defaultMessage,
      timestamp: serverTimestamp(),
    }).catch((e) => console.warn("Team message creation note:", e));

    // 3. Dispatch Central Notification if recipientUid is provided
    if (recipientUid) {
      await addDoc(collection(db, "notifications"), {
        recipientUid,
        type: eventType || "TEAM_FEEDBACK",
        title: titleText || defaultTitle,
        message: defaultMessage,
        conversationId: systemChatId,
        messageCount: 1,
        actionUrl: actionUrl || `/chat?chatId=${systemChatId}`,
        read: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }).catch((e) => console.warn("System notification dispatch note:", e));
    }

    // 4. Record Idempotency Key in Firestore
    await setDoc(eventDocRef, {
      dispatchedAt: serverTimestamp(),
      eventType,
      recipientUid: recipientUid || "broadcast",
    });

    return NextResponse.json({
      success: true,
      message: `System event ${idempotencyKey} dispatched successfully`,
      idempotencyKey,
    });
  } catch (error: any) {
    console.error("API /api/system-events/trigger error:", error);
    return NextResponse.json({ success: false, error: error?.message || "Internal server error" }, { status: 500 });
  }
}
