import { NextResponse } from "next/server";
import { adminDb, adminMessaging } from "@/lib/firebase-admin";

function getISTDateString(): string {
  try {
    return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  } catch (e) {
    return new Date().toISOString().slice(0, 10);
  }
}

/**
 * Server API Route: /api/send-push
 * INTERNAL SERVER ONLY Push Delivery Endpoint.
 * Browser users CANNOT invoke push delivery directly. Requires x-internal-secret header matching INTERNAL_PUSH_SECRET.
 * Derives recipient UID strictly from trusted chat room data on the server.
 */
export async function POST(req: Request) {
  try {
    const internalSecretHeader = req.headers.get("x-internal-secret");
    const configuredSecret = process.env.INTERNAL_PUSH_SECRET;

    // Fix 2: Internal-Server-Only Authentication Check
    const isServerInternal = Boolean(configuredSecret && internalSecretHeader && internalSecretHeader === configuredSecret);

    if (!isServerInternal) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: /api/send-push is an internal-server-only endpoint" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { title, message, actionUrl, chatId, conversationId, type, recipientUid: serverRecipientUid } = body;

    const targetChatId = conversationId || chatId || "";
    if (!title || !message) {
      return NextResponse.json({ success: false, error: "Missing title or message" }, { status: 400 });
    }

    let targetRecipientUid = serverRecipientUid || "";

    // Server CHAT Recipient Derivation
    if (type === "CHAT" && targetChatId) {
      const chatDoc = await adminDb.collection("chats").doc(targetChatId).get();
      if (!chatDoc.exists) {
        return NextResponse.json({ success: false, error: "Target chat conversation does not exist" }, { status: 404 });
      }

      const chatData = chatDoc.data() || {};
      const participants: string[] = chatData.participants || [];
      const derivedRecipient = participants.find((uid) => uid !== serverRecipientUid) || participants[0];

      if (derivedRecipient) {
        targetRecipientUid = derivedRecipient;
      }
    }

    if (!targetRecipientUid) {
      return NextResponse.json({ success: false, error: "Missing target recipient UID" }, { status: 400 });
    }

    // Query Device Push Tokens from `users/{targetRecipientUid}/devices`
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
        message: "No active push device tokens registered for derived recipient",
        recipientUid: targetRecipientUid,
        tokensCount: 0,
      });
    }

    // Construct FCM Multicast Payload
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
        istDate: getISTDateString(),
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

    // Execute Real Firebase Admin FCM Multicast Send Network Call
    const response = await adminMessaging.sendEachForMulticast(multicastMessage);

    // Clean Up Stale / Invalid Device Tokens from Firestore
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
