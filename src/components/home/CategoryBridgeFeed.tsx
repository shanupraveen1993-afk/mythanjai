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
    <div className="flex flex-col gap-3">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading font-black text-base md:text-lg text-slate-900 flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-yellow-500" />
            Your Matches
          </h2>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5">
            Matched listings based on your active requirement
          </p>
        </div>
        <button
          onClick={() => router.push(activeType === "SELL" ? "/sell" : "/need")}
          className="flex items-center gap-1 text-xs font-black text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
        >
          View All <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Matching Listings (Identical Compact PreviewCard Design across all 5 sections) */}
      <div className="-mx-4 px-4 flex md:grid overflow-x-auto md:overflow-visible snap-x snap-mandatory gap-3 pb-2 scrollbar-none">
        {matchingListings.map((post) => {
          const imgUrl = (post.images && post.images.length > 0) ? post.images[0] : (post.image_url || "/thanjavur_temple_illustration.png");
          const priceText = post.price ? (typeof post.price === "number" ? `₹${post.price.toLocaleString("en-IN")}` : String(post.price)) : "Best Offer";
          const seePath = activeType === "SELL" ? "/need" : "/sell";

          return (
            <div
              key={post.id}
              onClick={() => router.push(seePath)}
              className="shrink-0 w-[260px] sm:w-[290px] md:w-auto snap-start bg-white rounded-2xl overflow-hidden shadow-[0_2px_10px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-all cursor-pointer border-0 hover:-translate-y-0.5 active:scale-[0.98]"
            >
              <div className="w-full h-28 overflow-hidden bg-slate-100 relative">
                <img
                  src={imgUrl}
                  alt={post.title}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute top-2 left-2 text-[9px] font-black bg-white/95 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-md shadow-sm">
                  {post.category || "Matched Item"}
                </span>
              </div>
              <div className="p-3 flex flex-col gap-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-heading font-extrabold text-xs text-slate-900 leading-snug line-clamp-2 flex-1">
                    {post.title}
                  </h3>
                  <span className="text-xs font-black text-slate-800 shrink-0">{priceText}</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                  <MapPin className="w-3 h-3 shrink-0" />
                  <span>{post.area_tag || "Thanjavur"}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
