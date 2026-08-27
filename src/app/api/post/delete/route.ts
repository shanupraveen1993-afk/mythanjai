import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { postId, colName } = body;

    if (!postId || !colName) {
      return NextResponse.json({ success: false, error: "Missing postId or colName" }, { status: 400 });
    }

    const validCols = ["needs_and_sales", "services", "shops", "offers"];
    if (!validCols.includes(colName)) {
      return NextResponse.json({ success: false, error: "Invalid collection target" }, { status: 400 });
    }

    await adminDb.collection(colName).doc(postId).delete();

    return NextResponse.json({
      success: true,
      message: `Document ${postId} deleted successfully from ${colName}.`,
    });
  } catch (error: any) {
    console.error("Delete post API error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to delete post" },
      { status: 500 }
    );
  }
}
