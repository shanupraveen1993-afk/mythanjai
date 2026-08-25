import { NextResponse } from "next/server";

// Global in-memory & persistent fallback cache for live posts across all devices
let globalPublicPosts: any[] = [
  {
    id: "pub_demo_1",
    type: "SELL",
    title: "iPhone 15 Pro Max 256GB - Brand New",
    description: "Brand new sealed box iPhone 15 Pro Max for sale in Thanjavur. Full warranty and bill available.",
    area_tag: "Old Bus Stand",
    price: "95000",
    phone: "9994837342",
    show_phone: true,
    image_url: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&auto=format&fit=crop&q=80",
    is_verified: true,
    created_at: new Date().toISOString(),
  }
];

export async function GET() {
  return NextResponse.json({ success: true, posts: globalPublicPosts }, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "no-cache, no-store, must-revalidate",
    }
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (body && (body.title || body.name || body.shop_name)) {
      const newPost = {
        id: body.id || "pub_" + Date.now(),
        created_at: new Date().toISOString(),
        is_verified: true,
        ...body,
      };
      // Keep up to 200 posts in global public feed memory
      globalPublicPosts = [newPost, ...globalPublicPosts.filter(p => p.id !== newPost.id)].slice(0, 200);
      return NextResponse.json({ success: true, post: newPost });
    }
    return NextResponse.json({ success: false, error: "Invalid post payload" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (id) {
      globalPublicPosts = globalPublicPosts.filter((p) => p.id !== id);
      return NextResponse.json({ success: true, deletedId: id });
    }
    return NextResponse.json({ success: false, error: "Missing id" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
