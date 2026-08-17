"use client";

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Handshake } from "lucide-react";
import { NeedOrSalePost } from "@/types";
import { useFirestore } from "@/hooks/use-firestore";
import { PreviewSection, PreviewCard } from "@/app/(main)/HomeClientPage";
import { useLanguage } from "@/context/LanguageContext";

import { useAuth } from "@/hooks/use-auth";

export default function CategoryBridgeFeed() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useLanguage();

  const handlePostAction = (route: string) => {
    if (!user) {
      if (typeof window !== "undefined") {
        localStorage.setItem("namma_thanjai_target_post_route", route);
        window.dispatchEvent(new Event("namma_thanjai_open_signin"));
      }
      return;
    }
    router.push(route);
  };
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
      <div className="w-full bg-slate-900 text-white rounded-2xl p-5 shadow-md font-sans my-3 flex flex-col sm:flex-row items-center justify-between gap-4 border border-slate-800">
        <div className="flex items-center gap-3.5">
          {/* Clean White Two Hands Connecting Icon Container */}
          <div className="icon-box-dark shrink-0">
            <Handshake className="w-6 h-6 text-[#FBBF24] stroke-[2.5]" />
          </div>
          <div className="flex flex-col gap-0.5">
            <h4 className="font-heading font-extrabold text-sm text-white flex items-center gap-2">
              <span>{t("matchmakerTitle")}</span>
              <span className="text-xs bg-[#FBBF24] text-[#0F172A] px-2 py-0.5 rounded font-black uppercase border-b border-[#D97706]">Instant</span>
            </h4>
            <p className="text-xs text-slate-300 font-medium leading-relaxed">
              {t("matchmakerDesc")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          <button
            onClick={() => handlePostAction("/post/need")}
            className="flex-1 sm:flex-none px-3.5 py-2 btn-primary text-xs uppercase tracking-wider text-center cursor-pointer"
          >
            {t("postRequirement")}
          </button>
          <button
            onClick={() => handlePostAction("/post/sell")}
            className="flex-1 sm:flex-none px-3.5 py-2 btn-secondary text-xs uppercase tracking-wider text-center cursor-pointer"
          >
            {t("sellItem")}
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
