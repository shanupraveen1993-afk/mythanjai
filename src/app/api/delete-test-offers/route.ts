import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const shopsSnap = await adminDb.collection("shops").get();
    let deletedCount = 0;
    const batch = adminDb.batch();

    shopsSnap.docs.forEach((doc) => {
      const data = doc.data();
      const shopName = (data.shop_name || "").toLowerCase();
      const offerTitle = (data.offer_title || "").toLowerCase();
      const videoUrl = data.video_url || data.video_reel_url || data.videoUrl || "";

      // Delete test posts or posts with damaged/blob video URLs
      if (
        shopName.includes("test") ||
        offerTitle.includes("test") ||
        videoUrl.startsWith("blob:") ||
        !videoUrl ||
        videoUrl.trim() === ""
      ) {
        batch.delete(doc.ref);
        deletedCount++;
      }
    });

    if (deletedCount > 0) {
      await batch.commit();
    }

    return NextResponse.json({
      success: true,
      deletedCount,
      message: `Wiped ${deletedCount} damaged/test video offer posts from Cloud Firestore shops collection.`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}
