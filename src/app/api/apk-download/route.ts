import { NextResponse } from "next/server";

export async function GET() {
  const cdnUrl = "https://raw.githubusercontent.com/shanupraveen1993-afk/mythanjai/main/public/NammaThanjai-v41.apk";
  
  try {
    const res = await fetch(cdnUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      },
    });

    if (!res.ok || !res.body) {
      return NextResponse.json({ error: "Failed to fetch APK binary" }, { status: 500 });
    }

    const headers = new Headers();
    headers.set("Content-Type", "application/vnd.android.package-archive");
    headers.set("Content-Disposition", 'attachment; filename="NammaThanjai-v41.apk"');
    headers.set("Cache-Control", "public, max-age=86400, s-maxage=86400");
    if (res.headers.get("content-length")) {
      headers.set("Content-Length", res.headers.get("content-length")!);
    }

    return new NextResponse(res.body as any, {
      status: 200,
      headers,
    });
  } catch (error) {
    return NextResponse.json({ error: "Download streaming error" }, { status: 500 });
  }
}
