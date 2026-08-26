import { NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase-admin";

const COLLECTIONS = ["needs_and_sales", "services", "shops", "offers"];

export async function POST(request: Request) {
  try {
    const { postId, colName, payload } = await request.json();

    if (!postId || !colName || !payload) {
      return NextResponse.json(
        { success: false, error: "postId, colName, and payload are required" },
        { status: 400 }
      );
    }

    if (!COLLECTIONS.includes(colName)) {
      return NextResponse.json({ success: false, error: "Invalid target collection" }, { status: 400 });
    }

    // 1. Verify existence of target document
    const docRef = adminDb.collection(colName).doc(postId);
    const snap = await docRef.get();

    if (!snap.exists) {
      return NextResponse.json({ success: false, error: `Document ${postId} not found in ${colName}` }, { status: 404 });
    }

    // 2. Perform Privileged Update via Admin SDK
    const updateData = {
      ...payload,
      updated_at: new Date(),
    };

    await docRef.update(updateData);

    return NextResponse.json({
      success: true,
      message: `Listing ${postId} updated successfully in ${colName}.`,
    });
  } catch (error: any) {
    console.error("Post Update API Error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Server update failed" },
      { status: 500 }
    );
  }
}
