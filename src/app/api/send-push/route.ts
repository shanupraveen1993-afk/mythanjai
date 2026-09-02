import { NextResponse } from "next/server";
import { adminAuth, adminDb, adminMessaging } from "@/lib/firebase-admin";

function getISTDateString(): string {
  try {
    return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  } catch (e) {
    return new Date().toISOString().slice(0, 10);
  }
}

/**
 * Production Server API Route: /api/send-push
 * Server-Authorized FCM Push Delivery Endpoint.
 * Strict CHAT Recipient Derivation: Target recipient is derived STRICTLY from trusted chat participants on the server.
 * Zero fallback to client-supplied recipientUid.
 */
export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const internalSecretHeader = req.headers.get("x-internal-secret");
    const configuredSecret = process.env.INTERNAL_PUSH_SECRET;

    // Strict internal secret comparison
    const isServerInternal = Boolean(configuredSecret && internalSecretHeader && internalSecretHeader === configuredSecret);

    let callerUid = "";

    // 1. Authenticate Request via Bearer Firebase ID Token
    if (authHeader.startsWith("Bearer ")) {
      try {
        const idToken = authHeader.substring(7);
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        callerUid = decodedToken.uid;
      } catch (e) {
        if (!isServerInternal) {
          return NextResponse.json({ success: false, error: "Invalid or expired Bearer authorization token" }, { status: 401 });
        }
      }
    } else if (!isServerInternal) {
      return NextResponse.json({ success: false, error: "Missing or unauthorized Bearer authorization token" }, { status: 401 });
    }

    const body = await req.json();
    const { title, message, actionUrl, chatId, conversationId, type } = body;

    const targetChatId = conversationId || chatId || "";
    if (!title || !message) {
      return NextResponse.json({ success: false, error: "Missing title or message" }, { status: 400 });
    }

    let targetRecipientUid = "";

    // 2. Strict CHAT Recipient Derivation (Zero Client Recipient Fallback)
    if (type === "CHAT" || targetChatId) {
      if (!callerUid && !isServerInternal) {
        return NextResponse.json({ success: false, error: "Authentication required for CHAT push delivery" }, { status: 401 });
      }

      if (!targetChatId) {
        return NextResponse.json({ success: false, error: "Missing conversationId/chatId for CHAT push delivery" }, { status: 400 });
      }

      const chatDoc = await adminDb.collection("chats").doc(targetChatId).get();
      if (!chatDoc.exists) {
        return NextResponse.json({ success: false, error: "Target chat conversation does not exist" }, { status: 404 });
      }

      const chatData = chatDoc.data() || {};
      const participants: string[] = chatData.participants || [];

      if (callerUid && participants.length > 0 && !participants.includes(callerUid)) {
        return NextResponse.json({ success: false, error: "Caller is not an authorized participant in this conversation" }, { status: 403 });
      }

      const derivedRecipient = participants.find((uid) => uid !== callerUid);
      if (!derivedRecipient) {
        return NextResponse.json({ success: false, error: "Unable to derive distinct target recipient from room participants" }, { status: 400 });
      }

      targetRecipientUid = derivedRecipient;
    }

    if (!targetRecipientUid) {
      return NextResponse.json({ success: false, error: "Unauthorized push target: recipient cannot be resolved server-side" }, { status: 400 });
    }

    // 3. Query Device Push Tokens from `users/{targetRecipientUid}/devices`
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

    // 4. Construct FCM Multicast Payload
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

    // 5. Execute Real Firebase Admin FCM Multicast Send Network Call
    const response = await adminMessaging.sendEachForMulticast(multicastMessage);

    // 6. Clean Up Stale / Invalid Device Tokens from Firestore
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
