import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

const COLLECTIONS = ["needs_and_sales", "services", "shops", "offers"];
const ADMIN_PHONE_LAST10 = "9994837342";

export async function POST(request: Request) {
  try {
    // 1. Authenticate Request via Bearer Token
    const authHeader = request.headers.get("authorization") || request.headers.get("Authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
    }

    const token = authHeader.substring("Bearer ".length).trim();
    let decodedToken: any;

    try {
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch {
      return NextResponse.json({ success: false, error: "Invalid or expired session token" }, { status: 401 });
    }

    // 2. Verify Admin Authorization (Custom Claim or Verified Phone Token)
    const userPhone = decodedToken.phone_number || "";
    const isAdmin =
      decodedToken.admin === true ||
      (userPhone && userPhone.slice(-10) === ADMIN_PHONE_LAST10);

    if (!isAdmin) {
      return NextResponse.json({ success: false, error: "Admin privileges required" }, { status: 403 });
    }

    // 3. Validate Request Parameters
    const { postId, colName } = await request.json();

    if (!postId) {
      return NextResponse.json({ success: false, error: "postId parameter is required" }, { status: 400 });
    }

    if (colName && !COLLECTIONS.includes(colName)) {
      return NextResponse.json({ success: false, error: "Invalid target collection" }, { status: 400 });
    }

    // 4. Determine Target Collection(s)
    const collections = colName ? [colName] : COLLECTIONS;
    let deletedCount = 0;
    const deletedCollections: string[] = [];

    // 5. Perform Privileged Delete via Firebase Admin SDK
    for (const collection of collections) {
      const ref = adminDb.collection(collection).doc(postId);
      const snapshot = await ref.get();

      if (!snapshot.exists) {
        continue;
      }

      await ref.delete();
      deletedCount++;
      deletedCollections.push(collection);
    }

    // 6. Verify Result
    if (deletedCount === 0) {
      return NextResponse.json({ success: false, error: "Listing not found in database" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      deletedCount,
      deletedCollections,
      deletedBy: decodedToken.uid,
    });
  } catch (error: any) {
    console.error("Admin delete error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Admin deletion failed" },
      { status: 500 }
    );
  }
}
