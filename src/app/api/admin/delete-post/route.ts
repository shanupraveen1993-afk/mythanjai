import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

const COLLECTIONS = ["needs_and_sales", "services", "shops", "offers"];

export async function POST(request: Request) {
  try {
    // ── 1. Parse & validate request body ─────────────────────────────────────
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

    if (colName && !COLLECTIONS.includes(colName)) {
      return NextResponse.json({ success: false, error: "Invalid target collection" }, { status: 400 });
    }

    // ── 2. Authenticate caller ────────────────────────────────────────────────
    const authHeader = request.headers.get("authorization") || "";
    if (!authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
    }

    const token = authHeader.substring("Bearer ".length).trim();
    let decodedToken: any;
    try {
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch {
      return NextResponse.json({ success: false, error: "Invalid or expired session token" }, { status: 401 });
    }

    // ── 3. Find matching documents across all candidate collections ───────────
    const targetCols = colName ? [colName] : COLLECTIONS;
    const matchingRefs: FirebaseFirestore.DocumentReference[] = [];

    for (const col of targetCols) {
      const ref = adminDb.collection(col).doc(postId);
      const snap = await ref.get();
      if (!snap.exists) continue;

      const data = snap.data() || {};
      const ownerUid = data.userId || data.seller_id;

      // ── 4. Authorization: owner OR admin (via custom claim) ─────────────────
      const isAdmin = decodedToken.admin === true;
      const isOwner = Boolean(ownerUid && decodedToken.uid === ownerUid);

      if (!isAdmin && !isOwner) {
        return NextResponse.json(
          { success: false, error: "Forbidden: You do not own this listing" },
          { status: 403 }
        );
      }

      matchingRefs.push(ref);
    }

    if (matchingRefs.length === 0) {
      return NextResponse.json({ success: false, error: "Listing not found in database" }, { status: 404 });
    }

    // ── 5. Batch delete all matching documents via Admin SDK ──────────────────
    const batch = adminDb.batch();
    for (const ref of matchingRefs) {
      batch.delete(ref);
    }
    await batch.commit();

    return NextResponse.json({
      success: true,
      deletedCount: matchingRefs.length,
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
