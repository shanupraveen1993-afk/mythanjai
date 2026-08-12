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
    <div className="w-full bg-slate-200/60 rounded-3xl p-4 sm:p-5 flex flex-col gap-4 font-sans my-1 border-0 shadow-inner">
      {/* Header Banner */}
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
        <h2 className="font-heading font-black text-base md:text-lg text-slate-900 flex items-center gap-2">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500" />
          Your Matches
        </h2>
        <button
          onClick={() => router.push(activeType === "SELL" ? "/sell" : "/need")}
          className="flex items-center gap-1 text-xs font-black text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
        >
          View All <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>



      {/* Matching Listings (Horizontal Carousel on Mobile, 3-Col Grid on Desktop) */}
      <div className="flex md:grid overflow-x-auto md:overflow-visible snap-x snap-mandatory gap-3 pb-2 scrollbar-none -mx-1 px-1">
        {matchingListings.map((post) => (
          <div key={post.id} className="w-[82vw] sm:w-[300px] md:w-auto shrink-0 snap-start">
            <NeedCard post={post} />
          </div>
        ))}
      </div>
    </div>
  );
}
