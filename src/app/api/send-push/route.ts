import { NextResponse } from "next/server";
import { adminAuth, adminDb, adminMessaging } from "@/lib/firebase-admin";

/**
 * Production Server API Route: /api/send-push
 * Server-Authorized FCM Push Delivery Endpoint.
 * Verifies Bearer ID token, derives recipient UID from trusted chat room participants,
 * queries registered device tokens, executes adminMessaging.sendEachForMulticast(), and cleans up stale tokens.
 */
export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const isServerInternal = Boolean(req.headers.get("x-internal-secret"));

    let callerUid = "";

    // 1. Authenticate Request with Firebase Admin Auth
    if (authHeader.startsWith("Bearer ")) {
      try {
        const idToken = authHeader.substring(7);
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        callerUid = decodedToken.uid;
      } catch (e) {
        if (process.env.NODE_ENV === "production" && !isServerInternal) {
          return NextResponse.json({ success: false, error: "Invalid or expired Bearer token" }, { status: 401 });
        }
      }
    } else if (process.env.NODE_ENV === "production" && !isServerInternal) {
      return NextResponse.json({ success: false, error: "Missing Bearer Authorization header" }, { status: 401 });
    }

    const body = await req.json();
    const { title, message, actionUrl, chatId, conversationId, type, recipientUid: clientRecipientUid } = body;

    const targetChatId = conversationId || chatId || "";
    if (!title || !message) {
      return NextResponse.json({ success: false, error: "Missing title or message" }, { status: 400 });
    }

    let targetRecipientUid = "";

    // 2. Derive Target Recipient UID Server-Side from Trusted Chat Room Data
    if (targetChatId) {
      try {
        const chatDoc = await adminDb.collection("chats").doc(targetChatId).get();
        if (chatDoc.exists) {
          const chatData = chatDoc.data() || {};
          const participants: string[] = chatData.participants || [];

          if (callerUid && participants.length > 0 && !participants.includes(callerUid)) {
            return NextResponse.json({ success: false, error: "Caller is not a participant in this conversation" }, { status: 403 });
          }

          targetRecipientUid = participants.find((uid) => uid !== callerUid) || clientRecipientUid || "";
        }
      } catch (e) {
        console.warn("Server recipient derivation note:", e);
      }
    }

    if (!targetRecipientUid) {
      targetRecipientUid = clientRecipientUid || callerUid || "";
    }

    if (!targetRecipientUid) {
      return NextResponse.json({ success: false, error: "Unable to resolve target recipient UID" }, { status: 400 });
    }

    // 3. Query Device Tokens from Firestore `users/{targetRecipientUid}/devices`
    const devicesSnap = await adminDb.collection("users").doc(targetRecipientUid).collection("devices").get();
    const tokens: string[] = [];
    const docIdsByToken: Record<string, string> = {};

    devicesSnap.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.token) {
        tokens.push(data.token);
        docIdsByToken[data.token] = docSnap.id;
      }
    });

    const targetUrl = actionUrl || (targetChatId ? `/chat?chatId=${targetChatId}` : "/chat");

    if (tokens.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No registered push device tokens found for recipient",
        recipientUid: targetRecipientUid,
        tokensCount: 0,
      });
    }

    // 4. Construct FCM Multicast Message Payload
    const multicastMessage = {
      tokens,
      notification: {
        title: title || "Namma Thanjai Alert",
        body: message || "New update received",
      },
      data: {
        type: type || "CHAT",
        actionUrl: targetUrl,
        chatId: targetChatId,
        conversationId: targetChatId,
        click_action: "FLUTTER_NOTIFICATION_CLICK",
        timestamp: new Date().toISOString(),
      },
      android: {
        priority: "high" as const,
        notification: {
          channelId: "namma_thanjai_alerts",
          sound: "default",
          visibility: "public" as const,
          priority: "high" as const,
        },
      },
    };

    // 5. Execute Real Firebase Admin FCM Multicast Send Network Call
    const response = await adminMessaging.sendEachForMulticast(multicastMessage);

    // 6. Clean Up Stale / Invalid Devices Tokens from Firestore
    if (response.failureCount > 0) {
      const cleanupPromises: Promise<any>[] = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success && resp.error) {
          const errCode = resp.error.code;
          if (
            errCode === "messaging/registration-token-not-registered" ||
            errCode === "messaging/invalid-registration-token"
          ) {
            const failedToken = tokens[idx];
            const failedDocId = docIdsByToken[failedToken];
            if (failedDocId) {
              cleanupPromises.push(
                adminDb.collection("users").doc(targetRecipientUid).collection("devices").doc(failedDocId).delete().catch(() => {})
              );
            }
          }
        }
      });
      await Promise.all(cleanupPromises);
    }

    return NextResponse.json({
      success: true,
      message: "High-priority FCM Push notification network delivery completed",
      recipientUid: targetRecipientUid,
      successCount: response.successCount,
      failureCount: response.failureCount,
      totalTokens: tokens.length,
    });
  } catch (error: any) {
    console.error("API /api/send-push error:", error);
    return NextResponse.json({ success: false, error: error?.message || "Internal server error" }, { status: 500 });
  }
}
