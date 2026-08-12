"use client";

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import { NeedOrSalePost } from "@/types";
import { useFirestore } from "@/hooks/use-firestore";
import { PreviewSection, PreviewCard } from "@/app/(main)/HomeClientPage";

export default function CategoryBridgeFeed() {
  const router = useRouter();
  const { data: firestorePosts } = useFirestore<NeedOrSalePost>({
    collectionName: "needs_and_sales",
    areaTag: "All Areas",
  });

  // Read user's real local posts ONLY from localStorage
  const { userLatestPost, allCombinedPosts } = useMemo(() => {
    let localPosts: NeedOrSalePost[] = [];
    if (typeof window !== "undefined") {
      try {
        const stored = JSON.parse(localStorage.getItem("namma_thanjai_local_posts") || "[]");
        localPosts = stored;
      } catch (e) {}
    }

    const combined = [...localPosts, ...(firestorePosts || [])];

    // User's latest active post (NEED or SELL)
    const latest = localPosts.find((p) => p.type === "NEED" || p.type === "SELL") || null;
    return { userLatestPost: latest, allCombinedPosts: combined };
  }, [firestorePosts]);

  // If user has 0 active listings, show high-converting Matchmaker Onboarding Card
  if (!userLatestPost) {
    return (
      <div className="w-full bg-gradient-to-br from-yellow-500/10 via-amber-500/15 to-yellow-500/10 border border-amber-400/40 rounded-2xl p-5 shadow-xs font-sans my-3 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-yellow-500 text-slate-955 flex items-center justify-center font-bold shadow-sm shrink-0">
            <span className="text-xl">🤝</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <h4 className="font-heading font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
              <span>AI Matchmaker — Post & Connect in Tanjore</span>
              <span className="text-[9px] bg-yellow-500 text-slate-955 px-2 py-0.5 rounded font-black uppercase">Instant</span>
            </h4>
            <p className="text-xs text-slate-600 font-medium">
              Post what you want to Buy, Sell, or Rent. We automatically match you with local buyers & sellers!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          <button
            onClick={() => router.push("/post/need")}
            className="flex-1 sm:flex-none px-3.5 py-2 bg-yellow-500 hover:bg-yellow-400 text-slate-955 font-heading font-extrabold text-xs rounded-xl border border-yellow-400 shadow-2xs transition-all cursor-pointer text-center"
          >
            + Post Requirement
          </button>
          <button
            onClick={() => router.push("/post/sell")}
            className="flex-1 sm:flex-none px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-heading font-extrabold text-xs rounded-xl transition-all cursor-pointer text-center"
          >
            + Sell Item
          </button>
        </div>
      </div>
    );
  }

  // Determine active category & opposite type for real match
  const activeCategory = userLatestPost.category;
  const activeType = userLatestPost.type === "NEED" ? "SELL" : "NEED";

  // Real Logic Rule 2: Strict matching of opposite type in exact category/area
  const matchingListings = useMemo(() => {
    // Exclude user's own post from matches
    const otherPosts = allCombinedPosts.filter((p) => p.id !== userLatestPost.id);

    let matches = otherPosts.filter((p) => {
      const typeMatch = p.type?.toUpperCase() === activeType;
      const catMatch = !activeCategory || p.category === activeCategory;
      return typeMatch && catMatch;
    });

    return matches.slice(0, 3);
  }, [allCombinedPosts, userLatestPost, activeCategory, activeType]);

  // Real Logic Rule 3: If 0 real matches exist for user's post, hide component completely
  if (matchingListings.length === 0) {
    return null;
  }

  const previewCards: PreviewCard[] = matchingListings.map((post) => {
    const imgList = post.image_urls || (post as any).images || [];
    const imgUrl = imgList.length > 0 ? imgList[0] : (post.image_url || "/thanjavur_temple_illustration.png");
    const priceText = post.price
      ? typeof post.price === "number"
        ? `₹${post.price.toLocaleString("en-IN")}`
        : String(post.price)
      : "Best Offer";

    return {
      title: post.title,
      sub: post.category || "Matched Listing",
      price: priceText,
      area: post.area_tag || "Thanjavur",
      img: imgUrl,
    };
  });

  const targetPath = activeType === "SELL" ? "/sell" : "/need";
  const matchSubtitle = `Matched ${activeType === "SELL" ? "sellers" : "buyers"} for your ${userLatestPost.type.toLowerCase()} listing: "${userLatestPost.title}"`;

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
