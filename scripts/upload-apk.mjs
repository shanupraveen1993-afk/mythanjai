// scripts/upload-apk.mjs
// Uploads the APK to Firebase Storage using the public REST API (no service account needed)
// Uses the Firebase Storage REST upload endpoint with the web API key

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const API_KEY = "AIzaSyARIlmmsFmp6plkviJYVNEifLZH-vAw8yA";
const BUCKET = "mythanjai-40db2.appspot.com";
const APK_PATH = path.join(__dirname, "../public/NammaThanjai-v12.apk");
const DEST_PATH = "apk/NammaThanjai-v12.apk";

async function uploadApk() {
  console.log("📦 Reading APK file...");
  const fileBuffer = fs.readFileSync(APK_PATH);
  const fileSize = fileBuffer.length;
  console.log(`📦 APK size: ${(fileSize / 1024 / 1024).toFixed(1)} MB`);

  // Firebase Storage REST upload URL
  const uploadUrl = `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o?uploadType=media&name=${encodeURIComponent(DEST_PATH)}&key=${API_KEY}`;

  console.log("🚀 Uploading to Firebase Storage...");

  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/vnd.android.package-archive",
      "Content-Length": fileSize.toString(),
    },
    body: fileBuffer,
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("❌ Upload failed:", errText);
    process.exit(1);
  }

  const result = await response.json();
  console.log("✅ Upload successful!");
  console.log("📁 Storage path:", result.name);

  // Make the file publicly accessible
  const makePublicUrl = `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o/${encodeURIComponent(DEST_PATH)}?key=${API_KEY}`;
  const publicResponse = await fetch(makePublicUrl);
  const publicData = await publicResponse.json();

  const downloadToken = publicData.downloadTokens;
  const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o/${encodeURIComponent(DEST_PATH)}?alt=media&token=${downloadToken}`;

  console.log("\n🔗 PUBLIC DOWNLOAD URL:");
  console.log(downloadUrl);
  console.log("\n✅ Copy this URL and update TopHeader.tsx and StaticApkCard.tsx");
}

uploadApk().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
