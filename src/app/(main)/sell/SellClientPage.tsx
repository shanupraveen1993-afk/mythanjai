"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useFirestore } from "@/hooks/use-firestore";
import NeedCard from "@/components/cards/NeedCard";
import { NeedOrSalePost } from "@/types";
import { Plus, Loader2, ArrowUpDown, ShoppingBag } from "lucide-react";
import { CLASSIFIED_CATEGORIES } from "@/lib/constants";

const SAMPLE_POSTS: NeedOrSalePost[] = [
  { id: "sl_cmda", userId: "sample", type: "SELL", raw_text: "2400 Sqft CMDA Approved Plot for sale near New Busstand, Thanjavur.", title: "2400 Sqft Plot near New Busstand", description: "CMDA approved residential land, 40ft tar road, clear title deeds, immediate registration.", category: "Plots & Real Estate", area_tag: "New Bus Stand", price: 3600000, phone: "9876543210", is_verified: true, created_at: new Date() as any, expires_at: new Date() as any },
  { id: "sl_splendor", userId: "sample", type: "SELL", raw_text: "Hero Splendor Plus 2022 model, 14000 km driven, single owner.", title: "Hero Splendor Plus (2022 Model)", description: "First owner, mint condition, 65 kmpl mileage, all service records available.", category: "Used Vehicles", area_tag: "Medical College Road", price: 62000, phone: "9876543211", is_verified: true, created_at: new Date() as any, expires_at: new Date() as any },
  { id: "sl_iphone", userId: "sample", type: "SELL", raw_text: "iPhone 13 128GB Blue color with bill and box.", title: "iPhone 13 (128GB Blue)", description: "88% battery health, scratchless screen, box, original cable & invoice included.", category: "Electronics & Mobiles", area_tag: "Old Bus Stand", price: 38500, phone: "9876543212", is_verified: true, created_at: new Date() as any, expires_at: new Date() as any },
  { id: "sl_teak", userId: "sample", type: "SELL", raw_text: "Teakwood 6 Seater Dining Table with Cushion Chairs.", title: "Teakwood 6-Seater Dining Set", description: "Pure Burma teakwood table with glass top and 6 cushioned matching chairs.", category: "Household Goods", area_tag: "Srinivasapuram", price: 24000, phone: "9876543213", is_verified: true, created_at: new Date() as any, expires_at: new Date() as any },
];

export default function SellClientPage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [sortBy, setSortBy] = useState<"recent" | "price_low" | "price_high">("recent");

  const { data: firestorePosts, loading } = useFirestore<NeedOrSalePost>({
    collectionName: "needs_and_sales",
    areaTag: "All Areas",
    category: "All",
  });

  const filteredPosts = React.useMemo(() => {
    const ids = new Set((firestorePosts || []).map((p) => p.id));
    const seeds = SAMPLE_POSTS.filter((p) => !ids.has(p.id));
    let list = [...seeds, ...(firestorePosts || [])];

    list = list.filter((p) => p.type?.toUpperCase() === "SELL");

    if (selectedCategory !== "All") {
      list = list.filter(
        (p) => (p.category || "").toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    if (sortBy === "price_low") {
      list.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
    } else if (sortBy === "price_high") {
      list.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
    }
    return list;
  }, [firestorePosts, selectedCategory, sortBy]);

  return (
    <div className="flex flex-col gap-3 pb-24 w-full font-sans">

      {/* Hero Banner */}
      <div className="relative w-full min-h-[120px] rounded-xl overflow-hidden bg-slate-950 text-white flex items-center px-5 sm:px-8 py-5 shadow-2xs mt-2">
        <img src="/thanjavur_temple_illustration.png" alt="Sell" className="absolute right-0 top-0 h-full w-1/2 object-cover opacity-20 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-transparent" />
        <div className="relative z-10 flex flex-col gap-1 max-w-lg">
          <span className="bg-yellow-500 text-slate-950 font-bold text-[10px] px-2 py-0.5 rounded-md uppercase tracking-wider w-fit">Direct Marketplace</span>
          <h1 className="font-heading font-bold text-lg sm:text-xl text-white">Buy & Sell in Thanjavur</h1>
          <p className="text-xs text-slate-300">Plots, rentals, vehicles & electronics directly from Tanjore locals.</p>
        </div>
      </div>

      {/* TIER 1: STICKY TITLE BAR (100% FLUSH TO HEADER WITH 0 TOP GAP) */}
      <div className="sticky top-[52px] sm:top-[57px] z-30 bg-white border-b border-slate-200/90 py-2.5 px-4 -mx-4 flex items-center justify-between gap-2 shadow-2xs">
        <h2 className="font-heading font-bold text-base text-slate-900 tracking-tight">
          Items for Sale
        </h2>
        <button
          onClick={() => router.push("/post/sell")}
          className="flex items-center gap-1 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs transition-all border border-yellow-400 cursor-pointer shadow-2xs"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Post Item</span>
        </button>
      </div>

      {/* TIER 2: NATURAL SCROLL FILTER BAR */}
      <div className="py-1.5 flex items-center justify-between gap-2 bg-white">
        {/* Category Dropdown (Far Left) */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="text-xs font-semibold bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 focus:outline-none cursor-pointer"
        >
          <option value="All">All Categories</option>
          {CLASSIFIED_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        {/* Sort By Dropdown (Far Right) */}
        <div className="flex items-center gap-1">
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-xs font-semibold bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 focus:outline-none cursor-pointer"
          >
            <option value="recent">Recently Added</option>
            <option value="price_low">Price: Low to High</option>
            <option value="price_high">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* Feed */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 text-amber-600 animate-spin" /></div>
      ) : filteredPosts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-2 text-center">
          <ShoppingBag className="w-8 h-8 text-slate-300" />
          <p className="text-sm font-bold text-slate-500">No items listed yet.</p>
          <button onClick={() => router.push("/post/sell")} className="bg-yellow-500 text-slate-950 font-bold text-xs px-4 py-2 rounded-lg border border-yellow-400 hover:bg-yellow-400 transition-all cursor-pointer">+ Post Item</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPosts.map((post) => <NeedCard key={post.id} post={post} />)}
        </div>
      )}
    </div>
  );
}
