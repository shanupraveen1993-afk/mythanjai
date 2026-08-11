"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useFirestore } from "@/hooks/use-firestore";
import NeedCard from "@/components/cards/NeedCard";
import { NeedOrSalePost } from "@/types";
import { Plus, Loader2, Search } from "lucide-react";
import { CLASSIFIED_CATEGORIES } from "@/lib/constants";

const SAMPLE_POSTS: NeedOrSalePost[] = [
  { id: "n_land", userId: "sample", type: "NEED", title: "Need 1-2 Acres Commercial Land", raw_text: "", description: "Main road facing land near New Bus Stand or Vallam for warehouse use.", category: "Plots & Real Estate", area_tag: "Vallam", price: "5000000", phone: "9876543215", is_verified: true, created_at: new Date() as any, expires_at: new Date(Date.now() + 30 * 86400000) as any },
  { id: "n_apt", userId: "sample", type: "NEED", title: "Need 2 BHK near Medical College", raw_text: "", description: "Needed urgently. Budget ₹10,000/month. Preferred ground floor with parking.", category: "Property Rental", area_tag: "Medical College Road", price: "10000", phone: "9876543216", is_verified: true, created_at: new Date() as any, expires_at: new Date(Date.now() + 30 * 86400000) as any },
  { id: "n_laptop", userId: "sample", type: "NEED", title: "Need Used Laptop under ₹25,000", raw_text: "", description: "i5 8th gen or above, 8GB RAM minimum, good battery backup.", category: "Electronics & Mobiles", area_tag: "Tanjore Town (General)", price: "25000", phone: "9876543217", is_verified: true, created_at: new Date() as any, expires_at: new Date(Date.now() + 30 * 86400000) as any },
  { id: "n_tractor", userId: "sample", type: "NEED", title: "Need Used Mini Tractor", raw_text: "", description: "For paddy field cultivation near Kumbakonam Road. Any brand considered.", category: "Used Vehicles", area_tag: "Vallam", price: "350000", phone: "9876543218", is_verified: true, created_at: new Date() as any, expires_at: new Date(Date.now() + 30 * 86400000) as any },
  { id: "n_cook", userId: "sample", type: "NEED", title: "Need Cook for Marriage Function", raw_text: "", description: "Brahmin style catering for 200 guests. Date: next month. Tanjore area only.", category: "General Requirement", area_tag: "Tanjore Town (General)", price: "0", phone: "9876543219", is_verified: true, created_at: new Date() as any, expires_at: new Date(Date.now() + 30 * 86400000) as any },
];

export default function NeedClientPage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [sortBy, setSortBy] = useState<"recent" | "price_low" | "price_high">("recent");

  const { data: firestorePosts, loading } = useFirestore<NeedOrSalePost>({
    collectionName: "needs_and_sales",
    areaTag: "All Areas",
    category: "All",
    postType: "need",
  });

  const filteredPosts = React.useMemo(() => {
    const ids = new Set((firestorePosts || []).map((p) => p.id));
    const seeds = SAMPLE_POSTS.filter((p) => !ids.has(p.id));
    let list = [...seeds, ...(firestorePosts || [])];

    if (selectedCategory !== "All") {
      list = list.filter(
        (p) => (p.category || "").toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    if (sortBy === "price_low") list.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
    if (sortBy === "price_high") list.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
    return list;
  }, [firestorePosts, selectedCategory, sortBy]);

  return (
    <div className="flex flex-col gap-4 mt-3 pb-24 w-full">

      {/* Hero */}
      <div className="relative w-full min-h-[160px] sm:min-h-[200px] rounded-3xl overflow-hidden bg-slate-950 text-white flex items-center px-6 sm:px-10 py-8 shadow-md">
        <img src="/hero_building_visual.png" alt="Need" className="absolute right-0 top-0 h-full w-1/2 object-cover opacity-25 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent" />
        <div className="relative z-10 flex flex-col gap-2 max-w-lg">
          <span className="bg-blue-500 text-white font-black text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-widest w-fit">Buyer Requirements · Thanjavur</span>
          <h1 className="font-heading font-black text-2xl sm:text-3xl text-white leading-tight">Find What You Need</h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-sm">Post what you need — land, vehicles, electronics or rentals — connect with local sellers instantly.</p>
        </div>
      </div>

      {/* Category Dropdown + Sort + Post */}
      <div className="sticky top-[57px] z-30 bg-white border-b border-slate-200 py-2.5 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs font-black bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none cursor-pointer shadow-sm max-w-[180px] sm:max-w-none"
          >
            <option value="All">All Categories</option>
            {CLASSIFIED_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-xs font-black bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none cursor-pointer shadow-sm"
          >
            <option value="recent">Newest First</option>
            <option value="price_low">Budget: Low → High</option>
            <option value="price_high">Budget: High → Low</option>
          </select>
        </div>

        {/* Post Button */}
        <button
          onClick={() => router.push("/post/need")}
          className="flex items-center gap-1.5 bg-blue-500 hover:bg-blue-400 active:scale-95 text-white font-black px-4 py-2 rounded-xl text-xs uppercase tracking-wider transition-all border border-blue-400 shadow-sm cursor-pointer ml-auto"
        >
          <Plus className="w-3.5 h-3.5 stroke-[3]" /> Post Requirement
        </button>
      </div>

      {/* Feed */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 text-blue-500 animate-spin" /></div>
      ) : filteredPosts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <Search className="w-8 h-8 text-slate-300" />
          <p className="text-sm font-black text-slate-500">
            {selectedCategory !== "All" ? `No requirements found in "${selectedCategory}"` : "No requirements yet — post what you need!"}
          </p>
          <button onClick={() => router.push("/post/need")} className="bg-blue-500 text-white font-black text-xs px-5 py-2.5 rounded-xl border border-blue-400 hover:bg-blue-400 transition-all cursor-pointer">+ Post Requirement</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPosts.map((post) => <NeedCard key={post.id} post={post} />)}
        </div>
      )}
    </div>
  );
}
