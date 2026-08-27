import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { colName, payload } = body;

    if (!colName || !payload) {
      return NextResponse.json({ success: false, error: "Missing colName or payload" }, { status: 400 });
    }

    const validCols = ["needs_and_sales", "services", "shops", "offers"];
    if (!validCols.includes(colName)) {
      return NextResponse.json({ success: false, error: "Invalid collection target" }, { status: 400 });
    }

    const documentData = {
      ...payload,
      created_at: Timestamp.now(),
      updated_at: Timestamp.now(),
      status: payload.status || "active",
    };

    const docRef = await adminDb.collection(colName).add(documentData);

    return NextResponse.json({
      success: true,
      id: docRef.id,
      message: "Post created successfully in Firestore.",
    });
  } catch (error: any) {
    console.error("Create post API error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to create post" },
      { status: 500 }
    );
  }
}
