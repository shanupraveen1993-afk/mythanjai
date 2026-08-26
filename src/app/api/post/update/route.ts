import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

const COLLECTIONS = ["needs_and_sales", "services", "shops", "offers"];

// Only these fields may be changed by the listing owner.
// System/moderation fields (userId, seller_id, is_verified, status, created_at) are never exposed.
const ALLOWED_UPDATE_FIELDS = [
  "title",
  "name",
  "shop_name",
  "offer_title",
  "description",
  "offer_description",
  "raw_text",
  "area_tag",
  "address_text",
  "category",
  "skill_category",
  "price",
  "phone",
  "show_phone",
  "image_url",
  "image_urls",
  "youtube_url",
  "video_url",
  "offer_social_link",
  "google_maps_url",
  "valid_from",
  "valid_to",
  "is_available_now",
  "experience",
  "working_hours",
  "is_inactive",
  "is_sold",
  "is_offline",
  "is_contacted",
  "status",
];

export async function POST(request: Request) {
  try {
    // ── 1. Parse & validate request body ─────────────────────────────────────
    let body: any = {};
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: "Invalid JSON request body" }, { status: 400 });
    }

    const { postId, colName, payload } = body;

    if (!postId || !colName || !payload || typeof payload !== "object" || Array.isArray(payload)) {
      return NextResponse.json({ success: false, error: "Invalid update parameters" }, { status: 400 });
    }

    if (!COLLECTIONS.includes(colName)) {
      return NextResponse.json({ success: false, error: "Invalid collection" }, { status: 400 });
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

    // ── 3. Fetch the existing listing ─────────────────────────────────────────
    const ref = adminDb.collection(colName).doc(postId);
    const snapshot = await ref.get();

    if (!snapshot.exists) {
      return NextResponse.json({ success: false, error: "Listing not found" }, { status: 404 });
    }

    const existingData = snapshot.data() || {};
    const ownerUid = existingData.userId || existingData.seller_id;

    // ── 4. Strict ownership check — ONLY the owner may edit ───────────────────
    // Admin deliberately CANNOT edit another user's listing per product policy.
    const isOwner = Boolean(ownerUid && decodedToken.uid === ownerUid);

    if (!isOwner) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Only the post owner can edit this listing" },
        { status: 403 }
      );
    }

    // ── 5. Whitelist payload fields ───────────────────────────────────────────
    const safePayload: Record<string, unknown> = {};
    for (const field of ALLOWED_UPDATE_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(payload, field)) {
        safePayload[field] = payload[field];
      }
    }

    if (Object.keys(safePayload).length === 0) {
      return NextResponse.json({ success: false, error: "No permitted fields supplied" }, { status: 400 });
    }

    // ── 6. Privileged update via Firebase Admin SDK ───────────────────────────
    await ref.update({
      ...safePayload,
      updated_at: new Date(),
    });

    return NextResponse.json({ success: true, updated: true });
  } catch (error: any) {
    console.error("Post update error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Update failed" },
      { status: 500 }
    );
  }
}
