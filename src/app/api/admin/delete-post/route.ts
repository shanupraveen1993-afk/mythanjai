import { NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase-admin";

const ADMIN_PHONE_LAST10 = "9994837342";
const COLLECTIONS = ["needs_and_sales", "services", "shops", "offers"];

export async function POST(request: Request) {
  try {
    // 1. Authenticate Request via Bearer Token
    const authHeader = request.headers.get("authorization") || request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
    }

    const token = authHeader.substring("Bearer ".length).trim();
    let decodedToken: any = null;

    try {
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch (err: any) {
      console.error("Token verification failed:", err?.message);
      return NextResponse.json({ success: false, error: "Invalid or expired session token" }, { status: 401 });
    }

    // 2. Verify Admin Role (Custom Claim or Verified Admin Phone Token)
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

    // 4. Perform Privileged Admin SDK Deletion
    const collections = colName ? [colName] : COLLECTIONS;
    let deletedCount = 0;
    const deletedCollections: string[] = [];

    for (const col of collections) {
      const ref = adminDb.collection(col).doc(postId);
      const snap = await ref.get();
      if (snap.exists) {
        await ref.delete();
        deletedCount++;
        deletedCollections.push(col);
      }
    }

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
