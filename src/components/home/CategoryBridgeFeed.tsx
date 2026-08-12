"use client";

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowRight, Tag, MapPin, MessageSquare, ShoppingBag, HelpCircle, CheckCircle2 } from "lucide-react";
import { NeedOrSalePost } from "@/types";
import { useFirestore } from "@/hooks/use-firestore";
import NeedCard from "@/components/cards/NeedCard";

const SAMPLE_SELL_POSTS: NeedOrSalePost[] = [
  {
    id: "sample_sell_1",
    userId: "seller_101",
    type: "SELL",
    title: "Hero Splendor Plus 2022 — Single Owner, Mint Condition",
    description: "Driven 12,000 km in Thanjavur town. Clean service history at authorized center. Insurance active.",
    raw_text: "Driven 12,000 km in Thanjavur town. Clean service history at authorized center. Insurance active.",
    category: "Used Vehicles",
    area_tag: "Old Bus Stand",
    price: 68000,
    phone: "9876543210",
    image_url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&auto=format&fit=crop",
    is_verified: true,
    created_at: new Date() as any,
    expires_at: new Date(Date.now() + 30 * 86400000) as any,
  },
  {
    id: "sample_sell_2",
    userId: "seller_102",
    type: "SELL",
    title: "Honda Activa 6G Scooter (2021) — Low Kms",
    description: "Matte grey color, single owner scooter. New tyres and fresh engine oil service completed.",
    raw_text: "Matte grey color, single owner scooter. New tyres and fresh engine oil service completed.",
    category: "Used Vehicles",
    area_tag: "New Bus Stand",
    price: 62000,
    phone: "9876543210",
    image_url: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=600&auto=format&fit=crop",
    is_verified: true,
    created_at: new Date() as any,
    expires_at: new Date(Date.now() + 30 * 86400000) as any,
  },
  {
    id: "sample_sell_3",
    userId: "seller_103",
    type: "SELL",
    title: "2 BHK Independent House for Rent near South Rampart",
    description: "Spacious 2 BHK with Kaveri water connection, modular kitchen, and dedicated car parking.",
    raw_text: "Spacious 2 BHK with Kaveri water connection, modular kitchen, and dedicated car parking.",
    category: "Property Rental",
    area_tag: "South Rampart (Thenkeezh Street)",
    price: 12000,
    phone: "9876543210",
    image_url: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=600&auto=format&fit=crop",
    is_verified: true,
    created_at: new Date() as any,
    expires_at: new Date(Date.now() + 30 * 86400000) as any,
  },
  {
    id: "sample_sell_4",
    userId: "seller_104",
    type: "SELL",
    title: "iPhone 13 128GB Blue — Mint Condition with Box",
    description: "Battery health 88%. Original cable and bill included. No scratches or repairs.",
    raw_text: "Battery health 88%. Original cable and bill included. No scratches or repairs.",
    category: "Electronics",
    area_tag: "Medical College Road",
    price: 38500,
    phone: "9876543210",
    image_url: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&auto=format&fit=crop",
    is_verified: true,
    created_at: new Date() as any,
    expires_at: new Date(Date.now() + 30 * 86400000) as any,
  },
];

export default function CategoryBridgeFeed() {
  const router = useRouter();
  const { data: firestorePosts } = useFirestore<NeedOrSalePost>({
    collectionName: "needs_and_sales",
    areaTag: "All Areas",
  });

  // Read local posts and user's latest requirement
  const { userLatestPost, allCombinedPosts } = useMemo(() => {
    let localPosts: NeedOrSalePost[] = [];
    if (typeof window !== "undefined") {
      try {
        const stored = JSON.parse(localStorage.getItem("namma_thanjai_local_posts") || "[]");
        localPosts = stored;
      } catch (e) {}
    }

    const ids = new Set([...(firestorePosts || []).map((p) => p.id), ...localPosts.map((p) => p.id)]);
    const seeds = SAMPLE_SELL_POSTS.filter((p) => !ids.has(p.id));
    const combined = [...localPosts, ...seeds, ...(firestorePosts || [])];

    const latest = localPosts[0] || combined.find((p) => p.type === "NEED") || null;
    return { userLatestPost: latest, allCombinedPosts: combined };
  }, [firestorePosts]);

  // Determine active category bridge
  const activeCategory = userLatestPost?.category || "Used Vehicles";
  const activeType = userLatestPost?.type === "NEED" ? "SELL" : "NEED";

  // Category-First Matching Rule:
  // Primary match: items of opposite type in the exact same category
  const matchingListings = useMemo(() => {
    let matches = allCombinedPosts.filter(
      (p) => p.type?.toUpperCase() === activeType && p.category === activeCategory
    );

    // Mandatory Fallback: If 0 matches in exact category, show any active SELL listings
    if (matches.length === 0) {
      matches = allCombinedPosts.filter((p) => p.type?.toUpperCase() === "SELL");
    }

    return matches.slice(0, 3);
  }, [allCombinedPosts, activeCategory, activeType]);

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 text-white shadow-xl flex flex-col gap-6 relative overflow-hidden font-sans my-2">
      {/* Background Glow Effect */}
      <div className="absolute -top-12 -right-12 w-72 h-72 bg-yellow-500/10 blur-3xl rounded-full pointer-events-none" />

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 bg-yellow-400 text-slate-955 font-black text-[10px] uppercase px-3 py-1 rounded-lg tracking-wider">
            <Sparkles className="w-3 h-3 fill-current" />
            CATEGORY MATCHMAKER
          </span>
          <div>
            <h2 className="font-heading font-black text-lg sm:text-xl text-white tracking-tight">
              Matched Sellers for <span className="text-yellow-400">{activeCategory}</span>
            </h2>
            <p className="text-[11px] text-slate-400 font-medium">
              Connecting buyers & sellers in {activeCategory} across Thanjavur
            </p>
          </div>
        </div>

        <button
          onClick={() => router.push(activeType === "SELL" ? "/sell" : "/need")}
          className="flex items-center gap-1.5 text-xs font-black text-yellow-400 hover:text-yellow-300 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <span>Explore All {activeCategory}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* User's Posted Requirement Summary Badge (If active requirement exists) */}
      {userLatestPost && (
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <span className="w-8 h-8 rounded-xl bg-yellow-500/20 text-yellow-400 flex items-center justify-center font-bold text-sm shrink-0">
              {userLatestPost.type === "NEED" ? "🛒" : "🏷️"}
            </span>
            <div className="flex flex-col truncate">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                Your Active Requirement
              </span>
              <span className="font-extrabold text-white truncate">{userLatestPost.title}</span>
            </div>
          </div>
          <span className="text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-lg shrink-0 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>Matching Live</span>
          </span>
        </div>
      )}

      {/* Matching Listings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {matchingListings.map((post) => (
          <NeedCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}
