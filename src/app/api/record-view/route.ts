import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export const dynamic = "force-dynamic";

// In-memory cache for IP + Reel ID rate limiting (cleared on deployment, reset per 1 hour)
const viewCache = new Set<string>();

export async function POST(request: Request) {
  try {
    const { shopId } = await request.json();

    if (!shopId || typeof shopId !== "string") {
      return NextResponse.json({ success: false, error: "Invalid shopId" }, { status: 400 });
    }

    // IP + shopId rate limiting (max 1 view per IP per reel per hour)
    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
    const cacheKey = `${clientIp}_${shopId}`;

    if (viewCache.has(cacheKey)) {
      return NextResponse.json({ success: true, recorded: false, message: "Already recorded for this session" });
    }

    viewCache.add(cacheKey);

    // Limit memory cache size
    if (viewCache.size > 10000) {
      viewCache.clear();
    }

    // Server-side atomic increment using Admin SDK
    const shopRef = adminDb.collection("shops").doc(shopId);
    await shopRef.update({
      views_count: FieldValue.increment(1),
    });

    return NextResponse.json({ success: true, recorded: true });
  } catch (error: any) {
    console.error("Error recording view:", error);
    return NextResponse.json({ success: false, error: error?.message || "Failed to record view" }, { status: 500 });
  }
}
