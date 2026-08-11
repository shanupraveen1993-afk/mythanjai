"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useFirestore } from "@/hooks/use-firestore";
import NeedCard from "@/components/cards/NeedCard";
import { NeedOrSalePost } from "@/types";
import { Plus, Loader2, Search, ArrowUpDown } from "lucide-react";
import { CLASSIFIED_CATEGORIES } from "@/lib/constants";

const SAMPLE_POSTS: NeedOrSalePost[] = [
  { id: "nd_2bhk", userId: "sample", type: "NEED", raw_text: "Urgent need 2 BHK individual house for rent near Medical College.", title: "Need 2 BHK House for Rent", description: "Looking for independent 2 BHK with car parking in Medical College area.", category: "Property Rental", area_tag: "Medical College Road", price: 12000, phone: "9876543214", is_verified: true, created_at: new Date() as any, expires_at: new Date() as any },
  { id: "nd_activa", userId: "sample", type: "NEED", raw_text: "Need Honda Activa 6G in good condition.", title: "Need Honda Activa 6G", description: "Buying Activa 6G (2021-2023 model). Budget up to Rs. 55,000.", category: "Used Vehicles", area_tag: "Old Bus Stand", price: 55000, phone: "9876543215", is_verified: true, created_at: new Date() as any, expires_at: new Date() as any },
  { id: "nd_laptop", userId: "sample", type: "NEED", raw_text: "Need Core i5 laptop for online college classes.", title: "Need i5 Laptop for Studies", description: "Looking for used Dell/HP i5 laptop with 8GB RAM for engineering student.", category: "Electronics & Mobiles", area_tag: "Vallam", price: 22000, phone: "9876543216", is_verified: true, created_at: new Date() as any, expires_at: new Date() as any },
];

export default function NeedClientPage() {
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

    list = list.filter((p) => p.type?.toUpperCase() === "NEED");

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
        <img src="/hero_building_visual.png" alt="Need" className="absolute right-0 top-0 h-full w-1/2 object-cover opacity-20 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-transparent" />
        <div className="relative z-10 flex flex-col gap-1 max-w-lg">
          <span className="bg-blue-600 text-white font-bold text-[10px] px-2 py-0.5 rounded-md uppercase tracking-wider w-fit">Buyer Requirements</span>
          <h1 className="font-heading font-bold text-lg sm:text-xl text-white">Find What You Need</h1>
          <p className="text-xs text-slate-300">Post your requirement — land, vehicles or rentals — connect with sellers.</p>
        </div>
      </div>

      {/* TIER 1: STICKY TITLE BAR (100% FLUSH TO 56PX HEADER WITH 0 TOP GAP) */}
      <div className="sticky top-14 z-40 bg-white border-b border-slate-200 py-3 mb-3 flex items-center justify-between gap-2 shadow-2xs">
        <h2 className="font-heading font-bold text-base text-slate-900 tracking-tight">
          Buying Needs
        </h2>
        <button
          onClick={() => router.push("/post/need")}
          className="flex items-center gap-1 bg-blue-600 hover:bg-blue-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition-all border border-blue-500 cursor-pointer shadow-2xs"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Post Need</span>
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
            <option value="price_low">Budget: Low to High</option>
            <option value="price_high">Budget: High to Low</option>
          </select>
        </div>
      </div>

      {/* Feed */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 text-blue-600 animate-spin" /></div>
      ) : filteredPosts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-2 text-center">
          <Search className="w-8 h-8 text-slate-300" />
          <p className="text-sm font-bold text-slate-500">No requirements listed yet.</p>
          <button onClick={() => router.push("/post/need")} className="bg-blue-600 text-white font-bold text-xs px-4 py-2 rounded-lg border border-blue-500 hover:bg-blue-500 transition-all cursor-pointer">+ Post Need</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPosts.map((post) => <NeedCard key={post.id} post={post} />)}
        </div>
      )}
    </div>
  );
}
