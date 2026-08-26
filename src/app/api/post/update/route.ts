import { NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase-admin";

const ADMIN_PHONES = ["+919994837342", "9994837342"];
const COLLECTIONS = ["needs_and_sales", "services", "shops", "offers"];

export async function POST(request: Request) {
  try {
    // 1. Authenticate via Bearer Token
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

    // 2. Validate Request Parameters
    const { postId, colName, payload } = await request.json();
    if (!postId || !colName || !payload || typeof payload !== "object") {
      return NextResponse.json({ success: false, error: "Invalid update parameters" }, { status: 400 });
    }

    if (!COLLECTIONS.includes(colName)) {
      return NextResponse.json({ success: false, error: "Invalid collection" }, { status: 400 });
    }

    // 3. Retrieve Document & Check Ownership / Admin Privilege
    const ref = adminDb.collection(colName).doc(postId);
    const snap = await ref.get();

    if (!snap.exists) {
      return NextResponse.json({ success: false, error: `Listing ${postId} not found in ${colName}` }, { status: 404 });
    }

    const existingData = snap.data() || {};
    const requesterPhone = decodedToken.phone_number || "";
    const isAdmin = decodedToken.admin === true || ADMIN_PHONES.some((p) => requesterPhone.includes(p));
    const ownerUid = existingData.userId || existingData.seller_id;
    const ownerPhone = existingData.phone || "";

    const isOwner =
      decodedToken.uid === ownerUid ||
      (requesterPhone && ownerPhone && requesterPhone.slice(-10) === ownerPhone.slice(-10));

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ success: false, error: "Forbidden: You do not own this listing" }, { status: 403 });
    }

    // 4. Perform Privileged Update via Admin SDK
    await ref.update({
      ...payload,
      updated_at: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: `Listing ${postId} updated successfully.`,
      updated: true,
    });
  } catch (error: any) {
    console.error("Post Update API Error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Post update failed" },
      { status: 500 }
    );
  }
}
