import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

const TARGET_DOCS = [
  { col: "needs_and_sales", id: "BmYFpfwd8APB6aZAXQB0" },
  { col: "needs_and_sales", id: "E903crhFkydZ0nq8OyLR" },
  { col: "needs_and_sales", id: "HJNbajEVptS3bqdWLbvD" },
  { col: "needs_and_sales", id: "b0NG03Uff4Nvya2GamTH" },
  { col: "needs_and_sales", id: "vJ26KM6vigTElZl0CnNj" },
  { col: "services", id: "aoe6ZXAeINOmDH5nrF11" },
  { col: "shops", id: "9KJbKLhTuC2EKobb3pO0" },
];

const COLLECTIONS = ["needs_and_sales", "services", "shops", "offers", "reports"];

export async function GET() {
  try {
    let purgedCount = 0;
    const details: string[] = [];

    // 1. Target specific document IDs
    for (const item of TARGET_DOCS) {
      try {
        await adminDb.collection(item.col).doc(item.id).delete();
        purgedCount++;
        details.push(`Purged ${item.col}/${item.id}`);
      } catch (err: any) {
        console.error(`Failed to delete ${item.col}/${item.id}:`, err?.message);
      }
    }

    // 2. Query and purge any remaining documents across all marketplace collections
    for (const col of COLLECTIONS) {
      try {
        const snap = await adminDb.collection(col).get();
        if (!snap.empty) {
          const batch = adminDb.batch();
          snap.forEach((doc) => {
            batch.delete(doc.ref);
            purgedCount++;
            details.push(`Batch purged ${col}/${doc.id}`);
          });
          await batch.commit();
        }
      } catch (colErr: any) {
        console.error(`Collection ${col} error:`, colErr?.message);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Database purged successfully. Removed ${purgedCount} total document(s).`,
      purgedCount,
      details,
    });
  } catch (error: any) {
    console.error("Wipe all endpoint error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Wipe failed" },
      { status: 500 }
    );
  }
}
