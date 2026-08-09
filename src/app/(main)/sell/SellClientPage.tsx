"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useFirestore } from "@/hooks/use-firestore";
import NeedCard from "@/components/cards/NeedCard";
import { NeedOrSalePost } from "@/types";
import { Plus, Loader2, ShoppingBag } from "lucide-react";

const SAMPLE_POSTS: NeedOrSalePost[] = [
  { id: "cmda_plot", userId: "sample", type: "SELL", title: "2400 Sqft CMDA Plot — Vallam", raw_text: "", description: "DTCP approved residential plot with 30ft road frontage. Kaveri water line. Ready to build.", category: "Plots & Real Estate", area_tag: "Vallam", price: "2450000", phone: "9876543210", is_verified: true, created_at: new Date() as any, expires_at: new Date(Date.now() + 30 * 86400000) as any },
  { id: "house_rental", userId: "sample", type: "SELL", title: "2 BHK House for Rent", raw_text: "", description: "Modular kitchen, 2 bathrooms, 24/7 Kaveri water, car parking included.", category: "Property Rental", area_tag: "Medical College Road", price: "12500", phone: "9876543211", is_verified: true, created_at: new Date() as any, expires_at: new Date(Date.now() + 30 * 86400000) as any },
  { id: "hero_bike", userId: "sample", type: "SELL", title: "Hero Splendor 2022 — Single Owner", raw_text: "", description: "65+ kmpl mileage, clean papers, original condition throughout.", category: "Used Vehicles", area_tag: "New Bus Stand", price: "68000", phone: "9876543212", is_verified: true, created_at: new Date() as any, expires_at: new Date(Date.now() + 30 * 86400000) as any },
  { id: "iphone_sale", userId: "sample", type: "SELL", title: "iPhone 13 128GB Blue", raw_text: "", description: "Mint condition, original box, charger & bill available.", category: "Electronics & Mobiles", area_tag: "Old Bus Stand", price: "42000", phone: "9876543213", is_verified: true, created_at: new Date() as any, expires_at: new Date(Date.now() + 30 * 86400000) as any },
  { id: "sofa_sale", userId: "sample", type: "SELL", title: "Teakwood 5-Seater Sofa Set", raw_text: "", description: "Premium polish finish, comfortable cushions, well maintained.", category: "Household Goods", area_tag: "Karanthai", price: "18500", phone: "9876543214", is_verified: true, created_at: new Date() as any, expires_at: new Date(Date.now() + 30 * 86400000) as any },
];

export default function SellClientPage() {
  const router = useRouter();
  const [sortBy, setSortBy] = useState<"recent" | "price_low" | "price_high">("recent");

  const { data: firestorePosts, loading } = useFirestore<NeedOrSalePost>({
    collectionName: "needs_and_sales",
    areaTag: "All Areas",
    category: "All",
    postType: "sale",
  });

  const allPosts = React.useMemo(() => {
    const ids = new Set((firestorePosts || []).map((p) => p.id));
    const seeds = SAMPLE_POSTS.filter((p) => !ids.has(p.id));
    let list = [...seeds, ...(firestorePosts || [])];
    if (sortBy === "price_low") list.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
    if (sortBy === "price_high") list.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
    return list;
  }, [firestorePosts, sortBy]);

  return (
    <div className="flex flex-col gap-4 mt-3 pb-24 max-w-7xl mx-auto px-4 sm:px-6">

      {/* Hero */}
      <div className="relative w-full min-h-[160px] sm:min-h-[200px] rounded-3xl overflow-hidden bg-slate-950 text-white flex items-center px-6 sm:px-10 py-8 shadow-md">
        <img src="/thanjavur_temple_illustration.png" alt="Sell" className="absolute right-0 top-0 h-full w-1/2 object-cover opacity-25 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent" />
        <div className="relative z-10 flex flex-col gap-2 max-w-lg">
          <span className="bg-yellow-500 text-slate-950 font-black text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-widest w-fit">Direct Marketplace · Thanjavur</span>
          <h1 className="font-heading font-black text-2xl sm:text-3xl text-white leading-tight">Buy & Sell in Thanjavur</h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-sm">Real estate plots, 2 BHK rentals, bikes, cars & electronics — directly from locals.</p>
        </div>
      </div>

      {/* Sort + Post */}
      <div className="sticky top-[57px] z-30 bg-white border-b border-slate-200 py-2.5 flex items-center justify-between gap-3">
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="text-xs font-black bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none cursor-pointer">
          <option value="recent">Newest First</option>
          <option value="price_low">Price: Low → High</option>
          <option value="price_high">Price: High → Low</option>
        </select>
        <button onClick={() => router.push("/post?type=sell")} className="flex items-center gap-1.5 bg-yellow-500 hover:bg-yellow-400 active:scale-95 text-slate-950 font-black px-4 py-2 rounded-xl text-xs uppercase tracking-wider transition-all border border-yellow-400 shadow-sm cursor-pointer">
          <Plus className="w-3.5 h-3.5 stroke-[3]" /> Post Sale
        </button>
      </div>

      {/* Feed */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 text-yellow-500 animate-spin" /></div>
      ) : allPosts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <ShoppingBag className="w-8 h-8 text-slate-300" />
          <p className="text-sm font-black text-slate-500">No listings yet — be the first to post!</p>
          <button onClick={() => router.push("/post?type=sell")} className="bg-yellow-500 text-slate-900 font-black text-xs px-5 py-2.5 rounded-xl border border-yellow-400 hover:bg-yellow-400 transition-all cursor-pointer">+ Post Sale</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {allPosts.map((post) => <NeedCard key={post.id} post={post} />)}
        </div>
      )}
    </div>
  );
}
