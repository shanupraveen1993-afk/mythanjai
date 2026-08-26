import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

const COLLECTIONS = ["needs_and_sales", "services", "shops", "offers"];

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
];

export async function POST(request: Request) {
  try {
    // 1. Authenticate Firebase user
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

    // 2. Validate Request Body
    const { postId, colName, payload } = await request.json();

    if (!postId || !colName || !payload || typeof payload !== "object" || Array.isArray(payload)) {
      return NextResponse.json({ success: false, error: "Invalid update request" }, { status: 400 });
    }

    if (!COLLECTIONS.includes(colName)) {
      return NextResponse.json({ success: false, error: "Invalid collection" }, { status: 400 });
    }

    // 3. Find Listing Document
    const ref = adminDb.collection(colName).doc(postId);
    const snapshot = await ref.get();

    if (!snapshot.exists) {
      return NextResponse.json({ success: false, error: "Listing not found" }, { status: 404 });
    }

    const existingData = snapshot.data() || {};

    // 4. Authorization (Admin Claim / Admin Phone or UID Owner)
    const userPhone = decodedToken.phone_number || "";
    const isAdmin = decodedToken.admin === true || Boolean(userPhone && userPhone.slice(-10) === "9994837342");
    const ownerUid = existingData.userId || existingData.seller_id;
    const isOwner = Boolean(ownerUid && decodedToken.uid === ownerUid);

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ success: false, error: "Forbidden: You do not own this listing" }, { status: 403 });
    }

    // 5. Whitelist Payload Fields (Mass Assignment Protection)
    const safePayload: Record<string, unknown> = {};

    for (const field of ALLOWED_UPDATE_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(payload, field)) {
        safePayload[field] = payload[field];
      }
    }

    if (Object.keys(safePayload).length === 0) {
      return NextResponse.json({ success: false, error: "No permitted fields supplied" }, { status: 400 });
    }

    // 6. Perform Privileged Update via Admin SDK
    await ref.update({
      ...safePayload,
      updated_at: new Date(),
    });

    return NextResponse.json({
      success: true,
      updated: true,
    });
  } catch (error: any) {
    console.error("Post update error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Update failed" },
      { status: 500 }
    );
  }
}
