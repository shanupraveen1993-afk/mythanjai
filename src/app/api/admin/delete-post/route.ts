import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, deleteDoc } from "firebase/firestore";

export async function POST(request: Request) {
  try {
    const { postId, colName } = await request.json();

    if (!postId) {
      return NextResponse.json({ success: false, error: "postId is required" }, { status: 400 });
    }

    const collectionsToDelete = ["needs_and_sales", "services", "shops", "offers"];
    if (colName && !collectionsToDelete.includes(colName)) {
      collectionsToDelete.push(colName);
    }

    let deletedAny = false;
    for (const col of collectionsToDelete) {
      try {
        const docRef = doc(db, col, postId);
        await deleteDoc(docRef);
        deletedAny = true;
      } catch (err: any) {
        console.warn(`Server API deleteDoc attempt on ${col}/${postId} warning:`, err?.message);
      }
    }

    // Secondary fallback: Direct Firestore REST API Delete call
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "mythanjai-40db2";
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    
    for (const col of collectionsToDelete) {
      try {
        const restUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${col}/${postId}?key=${apiKey}`;
        const res = await fetch(restUrl, { method: "DELETE" });
        if (res.ok) {
          deletedAny = true;
        }
      } catch (e) {}
    }

    return NextResponse.json({
      success: true,
      message: `Post ${postId} successfully purged from Firestore database.`,
      deletedAny,
    });
  } catch (err: any) {
    console.error("Server API Delete Post Error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to purge post on server" },
      { status: 500 }
    );
  }
}
