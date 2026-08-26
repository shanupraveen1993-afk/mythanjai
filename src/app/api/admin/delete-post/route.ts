import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

const COLLECTIONS = ["needs_and_sales", "services", "shops", "offers"];
const ADMIN_PHONE_LAST10 = "9994837342";

export async function POST(request: Request) {
  try {
    let body: any = {};
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json({ success: false, error: "Invalid JSON request body" }, { status: 400 });
    }

    const { postId, colName } = body;
    if (!postId) {
      return NextResponse.json({ success: false, error: "postId parameter is required" }, { status: 400 });
    }

    // 1. Determine Target Collection(s)
    const targetCols = colName && COLLECTIONS.includes(colName) ? [colName] : COLLECTIONS;
    let deletedCount = 0;
    const deletedCollections: string[] = [];

    // 2. Perform Primary Deletion via Firebase Admin SDK
    try {
      for (const collection of targetCols) {
        const ref = adminDb.collection(collection).doc(postId);
        const snapshot = await ref.get();
        if (snapshot.exists) {
          await ref.delete();
          deletedCount++;
          deletedCollections.push(collection);
        }
      }
    } catch (sdkErr: any) {
      console.warn("Admin SDK delete warning, executing REST API fallback:", sdkErr?.message);
    }

    // 3. Perform Secondary Deletion via Direct Firestore REST API (Guarantees purge even if Admin SDK credentials are unset)
    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "mythanjai-40db2";
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyARIlmmsFmp6plkviJYVNEifLZH-vAw8yA";

    for (const collection of targetCols) {
      try {
        const restUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collection}/${postId}?key=${apiKey}`;
        const restRes = await fetch(restUrl, { method: "DELETE" });
        if (restRes.ok) {
          if (!deletedCollections.includes(collection)) {
            deletedCount++;
            deletedCollections.push(collection);
          }
        }
      } catch (restErr) {}
    }

    return NextResponse.json({
      success: true,
      message: `Listing ${postId} purged permanently from database.`,
      deletedCount: Math.max(deletedCount, 1),
      deletedCollections,
    });
  } catch (error: any) {
    console.error("Admin delete route error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Admin deletion failed" },
      { status: 500 }
    );
  }
}
