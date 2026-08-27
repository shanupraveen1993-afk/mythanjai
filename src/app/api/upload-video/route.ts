import { NextResponse } from "next/server";
import adminApp from "@/lib/firebase-admin";
import { getStorage } from "firebase-admin/storage";
import crypto from "crypto";

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
      const downloadToken = crypto.randomUUID();

      // Use Firebase Storage download tokens to support Uniform Bucket-Level Access without 403 ACL errors
      await storageFile.save(buffer, {
        contentType: mimeType,
        metadata: {
          cacheControl: "public, max-age=31536000",
          metadata: {
            firebaseStorageDownloadTokens: downloadToken,
          },
        },
      });

      const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(fileName)}?alt=media&token=${downloadToken}`;
      return NextResponse.json({
        success: true,
        url: publicUrl,
        fileName,
      });
    } catch (adminErr: any) {
      console.error("Admin Storage bucket upload error:", adminErr);
      return NextResponse.json({ success: false, error: adminErr?.message || "Storage bucket save failed" }, { status: 500 });
    }
  } catch (error: any) {
    console.error("Server video upload error:", error);
    return NextResponse.json({ success: false, error: error?.message || "Server upload failed" }, { status: 500 });
  }
}
