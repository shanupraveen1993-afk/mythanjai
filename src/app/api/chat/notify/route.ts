import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { dispatchServerNotification } from "@/lib/notification-service-server";

/**
 * POST /api/chat/notify
 *
 * Called by ChatClientPage after creating a chat message.
 * Authenticates caller via Firebase ID token (Bearer header).
 * Verifies that messageId exists in chats/{chatId}/messages/{messageId} and senderId === verifiedSenderUid.
 * Derives recipient UID strictly from trusted chat participants in Firestore.
 *
 * Body: { chatId: string; messageId: string; senderName: string; text: string }
 */
export async function POST(req: Request) {
  try {
    // ── 1. Verify Firebase ID token ─────────────────────────────────────────
    const authHeader = req.headers.get("authorization") || "";
    const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

    if (!idToken) {
      return NextResponse.json(
        { success: false, error: "Missing Authorization Bearer token" },
        { status: 401 }
      );
    }

    let verifiedSenderUid: string;
    try {
      const decoded = await adminAuth.verifyIdToken(idToken);
      verifiedSenderUid = decoded.uid;
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid or expired ID token" },
        { status: 401 }
      );
    }

    // ── 2. Parse and validate request body ──────────────────────────────────
    const body = await req.json();
    const { chatId, messageId, senderName, text } = body as {
      chatId: string;
      messageId: string;
      senderName: string;
      text: string;
    };

    if (!chatId || !messageId || !text) {
      return NextResponse.json(
        { success: false, error: "Missing chatId, messageId, or text" },
        { status: 400 }
      );
    }

    if (chatId === "namma_thanjai_system_welcome") {
      return NextResponse.json({ success: true, skipped: "system_chat" });
    }

    // ── 3. Verify message existence and sender ownership in Firestore ──────
    const msgRef = adminDb.collection("chats").doc(chatId).collection("messages").doc(messageId);
    const msgSnap = await msgRef.get();

    if (!msgSnap.exists) {
      return NextResponse.json(
        { success: false, error: "Message document not found in Firestore" },
        { status: 404 }
      );
    }

    const msgData = msgSnap.data() || {};
    if (msgData.senderId !== verifiedSenderUid) {
      return NextResponse.json(
        { success: false, error: "Sender UID does not match verified token" },
        { status: 403 }
      );
    }

    // ── 4. Derive recipient UID strictly from trusted chat document ──────────
    const chatDoc = await adminDb.collection("chats").doc(chatId).get();
    if (!chatDoc.exists) {
      return NextResponse.json(
        { success: false, error: "Chat conversation not found" },
        { status: 404 }
      );
    }

    const chatData = chatDoc.data() || {};
    const participants: string[] = chatData.participants || [];

    if (!participants.includes(verifiedSenderUid)) {
      return NextResponse.json(
        { success: false, error: "Caller is not a participant in this chat" },
        { status: 403 }
      );
    }

    const recipientUid = participants.find((uid) => uid !== verifiedSenderUid);
    if (!recipientUid) {
      return NextResponse.json(
        { success: false, error: "Could not derive recipient from chat participants" },
        { status: 400 }
      );
    }

    // ── 5. Dispatch server-authoritative notification + FCM ──────────────────
    const result = await dispatchServerNotification({
      recipientUid,
      type: "CHAT",
      title: `💬 New message from ${senderName || "Member"}`,
      message: text.slice(0, 100),
      senderUid: verifiedSenderUid,
      senderName: senderName || "Member",
      conversationId: chatId,
      messageId,
      actionUrl: `/chat?chatId=${chatId}`,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Notification dispatch failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("POST /api/chat/notify error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
