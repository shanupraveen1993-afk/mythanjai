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

  // Real Logic Rule 1: If user has 0 active listings (or deleted them from profile), hide component completely
  if (!userLatestPost) {
    return null;
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
