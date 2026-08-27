import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { shopId } = await request.json();

    if (!shopId || typeof shopId !== "string") {
      return NextResponse.json({ success: false, error: "Invalid shopId" }, { status: 400 });
    }

    const rawIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    const ipHash = crypto.createHash("sha256").update(rawIp).digest("hex");
    const logDocId = `${ipHash}_${shopId}`;

    const logRef = adminDb.collection("view_logs").doc(logDocId);
    const shopRef = adminDb.collection("shops").doc(shopId);

    let recorded = false;

    // Transactional read + write lock inside runTransaction
    await adminDb.runTransaction(async (transaction) => {
      const logSnap = await transaction.get(logRef);

      if (logSnap.exists) {
        const lastViewData = logSnap.data();
        const lastViewTime = lastViewData?.timestamp?.toMillis ? lastViewData.timestamp.toMillis() : 0;
        const oneHourAgo = Date.now() - 60 * 60 * 1000;

        if (lastViewTime > oneHourAgo) {
          recorded = false;
          return;
        }
      }

      transaction.set(logRef, {
        timestamp: FieldValue.serverTimestamp(),
      });

      transaction.update(shopRef, {
        views_count: FieldValue.increment(1),
      });

      recorded = true;
    });

    return NextResponse.json({ success: true, recorded });
  } catch (error: any) {
    console.error("Error recording view in transaction:", error);
    return NextResponse.json({ success: false, error: error?.message || "Failed to record view" }, { status: 500 });
  }
}
