import { NextResponse } from "next/server";
import adminApp from "@/lib/firebase-admin";
import { getStorage } from "firebase-admin/storage";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: "No video file provided" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const fileName = `videos/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const mimeType = file.type || "video/mp4";

    try {
      const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "mythanjai-40db2.firebasestorage.app";
      const bucket = getStorage(adminApp).bucket(bucketName);
      const storageFile = bucket.file(fileName);

      await storageFile.save(buffer, {
        contentType: mimeType,
        public: true,
        metadata: {
          cacheControl: "public, max-age=31536000",
        },
      });

      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
      return NextResponse.json({
        success: true,
        url: publicUrl,
        fileName,
      });
    } catch (adminErr) {
      console.warn("Admin Storage bucket save fallback to Data URL:", adminErr);
      const base64Data = buffer.toString("base64");
      const dataUrl = `data:${mimeType};base64,${base64Data}`;
      return NextResponse.json({
        success: true,
        url: dataUrl,
        fileName,
      });
    }
  } catch (error: any) {
    console.error("Server video upload error:", error);
    return NextResponse.json({ success: false, error: error?.message || "Server upload failed" }, { status: 500 });
  }
}
