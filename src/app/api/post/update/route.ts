import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, updateDoc, setDoc } from "firebase/firestore";

export async function POST(request: Request) {
  try {
    const { postId, colName, payload } = await request.json();

    if (!postId || !colName || !payload) {
      return NextResponse.json({ success: false, error: "postId, colName, and payload are required" }, { status: 400 });
    }

    let updated = false;

    // 1. Try Firebase Web SDK updateDoc on server
    try {
      const docRef = doc(db, colName, postId);
      await updateDoc(docRef, payload);
      updated = true;
    } catch (e: any) {
      console.warn("Server API updateDoc Web SDK failed, trying setDoc merge:", e?.message);
      try {
        const docRef = doc(db, colName, postId);
        await setDoc(docRef, payload, { merge: true });
        updated = true;
      } catch (err2) {}
    }

    // 2. Direct Firestore REST API Patch Fallback
    if (!updated) {
      const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "mythanjai-40db2";
      const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
      const restUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${colName}/${postId}?key=${apiKey}`;

      // Convert payload fields to Firestore REST API value format
      const fields: Record<string, any> = {};
      Object.keys(payload).forEach((key) => {
        const val = payload[key];
        if (typeof val === "string") fields[key] = { stringValue: val };
        else if (typeof val === "number") fields[key] = { doubleValue: val };
        else if (typeof val === "boolean") fields[key] = { booleanValue: val };
        else if (Array.isArray(val)) fields[key] = { arrayValue: { values: val.map((v) => ({ stringValue: String(v) })) } };
      });

      const updateMask = Object.keys(fields).map((k) => `updateMask.fieldPaths=${k}`).join("&");
      const patchUrl = `${restUrl}&${updateMask}`;

      const res = await fetch(patchUrl, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields }),
      });

      if (res.ok) {
        updated = true;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Post ${postId} updated in collection ${colName}.`,
      updated,
    });
  } catch (err: any) {
    console.error("Server API Update Post Error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to update post on server" },
      { status: 500 }
    );
  }
}
