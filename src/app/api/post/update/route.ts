import { NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase-admin";

const ADMIN_PHONE_LAST10 = "9994837342";
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
  "status",
];

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
      return NextResponse.json({ success: false, error: "Invalid update request" }, { status: 400 });
    }

    if (!COLLECTIONS.includes(colName)) {
      return NextResponse.json({ success: false, error: "Invalid collection" }, { status: 400 });
    }

    // 3. Retrieve Document & Check Ownership / Admin Privilege
    const ref = adminDb.collection(colName).doc(postId);
    const snap = await ref.get();

    if (!snap.exists) {
      return NextResponse.json({ success: false, error: "Listing not found" }, { status: 404 });
    }

    const existingData = snap.data() || {};
    const requesterPhone = decodedToken.phone_number || "";
    const isAdmin = decodedToken.admin === true || requesterPhone.slice(-10) === ADMIN_PHONE_LAST10;
    const ownerUid = existingData.userId || existingData.seller_id;

    // Strict UID Ownership Check
    const isOwner = Boolean(decodedToken.uid && ownerUid && decodedToken.uid === ownerUid);

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ success: false, error: "Forbidden: You do not own this listing" }, { status: 403 });
    }

    // 4. Whitelist Payload Fields to Prevent Mass Assignment Vulnerabilities
    const safePayload: Record<string, any> = {};
    for (const field of ALLOWED_UPDATE_FIELDS) {
      if (field in payload) {
        safePayload[field] = payload[field];
      }
    }

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
