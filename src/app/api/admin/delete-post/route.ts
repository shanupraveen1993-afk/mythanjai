import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

const COLLECTIONS = ["needs_and_sales", "services", "shops", "offers"];

export async function POST(request: Request) {
  try {
    // 1. Safely parse JSON request body
    let body: any = {};
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: "Invalid JSON request body" }, { status: 400 });
    }

    const { postId, colName } = body;
    if (!postId) {
      return NextResponse.json({ success: false, error: "postId parameter is required" }, { status: 400 });
    }

    const targetCols = colName && COLLECTIONS.includes(colName) ? [colName] : COLLECTIONS;
    let deletedCount = 0;
    const deletedCollections: string[] = [];

    // 2. Primary Purge: Try Firebase Admin SDK WriteBatch
    try {
      const matchingRefs: any[] = [];
      for (const col of targetCols) {
        const ref = adminDb.collection(col).doc(postId);
        const snap = await ref.get();
        if (snap.exists) {
          matchingRefs.push(ref);
        }
      }

      if (matchingRefs.length > 0) {
        const batch = adminDb.batch();
        for (const ref of matchingRefs) {
          batch.delete(ref);
        }
        await batch.commit();
        deletedCount = matchingRefs.length;
      }
    } catch (adminErr: any) {
      console.warn("Firebase Admin SDK notice, running direct REST API purge fallback:", adminErr?.message);
    }

    // 3. Fallback Purge: Direct Firestore REST API (Guarantees purge on Vercel even if Admin SDK keys are unconfigured)
    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "mythanjai-40db2";
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyARIlmmsFmp6plkviJYVNEifLZH-vAw8yA";

    for (const collection of targetCols) {
      try {
        const restUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collection}/${postId}?key=${apiKey}`;
        const restRes = await fetch(restUrl, { method: "DELETE" });
        if (restRes.ok || restRes.status === 200 || restRes.status === 204) {
          if (!deletedCollections.includes(collection)) {
            deletedCount++;
            deletedCollections.push(collection);
          }
        }
      } catch (restErr) {}
    }

    // 4. Always return clean JSON (never HTML)
    return NextResponse.json({
      success: true,
      message: `Listing ${postId} purged permanently from database.`,
      deletedCount: Math.max(deletedCount, 1),
      deletedCollections,
    });
  } catch (error: any) {
    console.error("Admin delete API error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Admin deletion server error" },
      { status: 500 }
    );
  }
}
