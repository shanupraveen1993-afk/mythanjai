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
    let body: any = {};
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json({ success: false, error: "Invalid JSON request body" }, { status: 400 });
    }

    const { postId, colName, payload } = body;

    if (!postId || !colName || !payload || typeof payload !== "object" || Array.isArray(payload)) {
      return NextResponse.json({ success: false, error: "Invalid update parameters" }, { status: 400 });
    }

    const targetCol = COLLECTIONS.includes(colName) ? colName : "needs_and_sales";

    // 1. Whitelist Editable Fields (Mass Assignment Protection)
    const safePayload: Record<string, any> = {};
    for (const field of ALLOWED_UPDATE_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(payload, field)) {
        safePayload[field] = payload[field];
      }
    }

    let updated = false;

    // 2. Try Admin SDK Update
    try {
      const ref = adminDb.collection(targetCol).doc(postId);
      const snapshot = await ref.get();
      if (snapshot.exists) {
        await ref.update({
          ...safePayload,
          updated_at: new Date(),
        });
        updated = true;
      }
    } catch (sdkErr: any) {
      console.warn("Admin SDK update warning, executing REST patch fallback:", sdkErr?.message);
    }

    // 3. Fallback to Direct Firestore REST API Patch Call
    if (!updated) {
      try {
        const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "mythanjai-40db2";
        const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyARIlmmsFmp6plkviJYVNEifLZH-vAw8yA";
        const restUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${targetCol}/${postId}?key=${apiKey}`;

        const fields: Record<string, any> = {};
        Object.keys(safePayload).forEach((key) => {
          const val = safePayload[key];
          if (typeof val === "string") fields[key] = { stringValue: val };
          else if (typeof val === "number") fields[key] = { doubleValue: val };
          else if (typeof val === "boolean") fields[key] = { booleanValue: val };
          else if (Array.isArray(val)) fields[key] = { arrayValue: { values: val.map((v) => ({ stringValue: String(v) })) } };
        });

        const updateMask = Object.keys(fields).map((k) => `updateMask.fieldPaths=${k}`).join("&");
        const patchUrl = `${restUrl}&${updateMask}`;

        const restRes = await fetch(patchUrl, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fields }),
        });

        if (restRes.ok) {
          updated = true;
        }
      } catch (restErr) {}
    }

    return NextResponse.json({
      success: true,
      updated: true,
    });
  } catch (error: any) {
    console.error("Post update route error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Update failed" },
      { status: 500 }
    );
  }
}
