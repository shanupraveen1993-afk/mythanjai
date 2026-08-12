"use client";

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowRight, Tag, MapPin, MessageSquare, ShoppingBag, HelpCircle, CheckCircle2 } from "lucide-react";
import { NeedOrSalePost } from "@/types";
import { useFirestore } from "@/hooks/use-firestore";
import { PreviewSection, PreviewCard } from "@/app/(main)/HomeClientPage";

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

  // Read local user posts ONLY (Matchmaker requires user to have posted a NEED or SELL item)
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

    // User's latest active post (NEED or SELL)
    const latest = localPosts.find((p) => p.type === "NEED" || p.type === "SELL") || null;
    return { userLatestPost: latest, allCombinedPosts: combined };
  }, [firestorePosts]);

  // If user HAS NOT posted any NEED or SELL item yet, display Smart Match prompt CTA
  if (!userLatestPost) {
    return (
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-md border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 font-sans my-4">
        <div className="flex items-center gap-3 text-center sm:text-left">
          <div className="w-12 h-12 rounded-xl bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 flex items-center justify-center shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-sm sm:text-base text-white">
              Unlock Smart AI Matches in Thanjavur
            </h3>
            <p className="text-xs text-slate-300 font-medium mt-0.5 max-w-md">
              Post what you need or what you want to sell to see automated local buyer & seller matches!
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
          <button
            onClick={() => router.push("/post/need")}
            className="flex-1 sm:flex-initial h-9 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold px-4 rounded-xl text-xs transition-all cursor-pointer shadow-sm text-center flex items-center justify-center gap-1"
          >
            <span>Post a Need</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => router.push("/post/sell")}
            className="flex-1 sm:flex-initial h-9 bg-slate-800 hover:bg-slate-700 text-white font-bold px-4 rounded-xl text-xs transition-all border border-slate-700 cursor-pointer text-center flex items-center justify-center"
          >
            <span>Sell an Item</span>
          </button>
        </div>
      </div>
    );
  }

  // Determine active category bridge
  const activeCategory = userLatestPost.category || "Used Vehicles";
  const activeType = userLatestPost.type === "NEED" ? "SELL" : "NEED";

  // Category-First Matching Rule:
  // Primary match: items of opposite type in the exact same category
  const matchingListings = useMemo(() => {
    let matches = allCombinedPosts.filter(
      (p) => p.type?.toUpperCase() === activeType && p.category === activeCategory
    );

    // Mandatory Fallback: If 0 matches in exact category, show any active SELL listings
    if (matches.length === 0) {
      matches = allCombinedPosts.filter((p) => p.type?.toUpperCase() === activeType);
    }

    return matches.slice(0, 3);
  }, [allCombinedPosts, activeCategory, activeType]);

  const previewCards: PreviewCard[] = useMemo(() => {
    return matchingListings.map((post) => {
      const imgList = post.image_urls || (post as any).images || [];
      const imgUrl = imgList.length > 0 ? imgList[0] : (post.image_url || "/thanjavur_temple_illustration.png");
      const priceText = post.price
        ? typeof post.price === "number"
          ? `₹${post.price.toLocaleString("en-IN")}`
          : String(post.price)
        : "Best Offer";

      return {
        title: post.title,
        sub: post.category || "Matched Item",
        price: priceText,
        area: post.area_tag || "Thanjavur",
        img: imgUrl,
      };
    });
  }, [matchingListings]);

  const targetPath = activeType === "SELL" ? "/sell" : "/need";
  const matchSubtitle = `Matched ${activeType === "SELL" ? "sellers" : "buyers"} for your recent ${userLatestPost.type.toLowerCase()} listing: "${userLatestPost.title}"`;

  return (
    <PreviewSection
      title="Your Matches"
      subtitle={matchSubtitle}
      seeAllPath={targetPath}
      accentColor="bg-yellow-500"
      onCardClick={() => router.push(targetPath)}
      cards={previewCards}
    />
  );
}
