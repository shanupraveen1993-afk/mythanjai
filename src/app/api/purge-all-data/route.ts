import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

const COLLECTIONS = ["needs_and_sales", "services", "shops", "offers", "reports", "audit_logs"];

export async function GET() {
  try {
    let deletedCount = 0;
    const details: Record<string, number> = {};

    for (const colName of COLLECTIONS) {
      const snapshot = await adminDb.collection(colName).get();
      details[colName] = snapshot.size;

      if (!snapshot.empty) {
        const batch = adminDb.batch();
        snapshot.docs.forEach((doc) => {
          batch.delete(doc.ref);
          deletedCount++;
        });
        await batch.commit();
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully purged ${deletedCount} documents from Cloud Firestore.`,
      details,
    });
  } catch (error: any) {
    console.error("Purge error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to purge database" },
      { status: 500 }
    );
  }
}
