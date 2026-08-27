"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFirestore } from "@/hooks/use-firestore";
import ShopCard from "@/components/cards/ShopCard";
import { ShopPost } from "@/types";
import { Plus, Loader2, Store, ArrowUpDown, UserCheck, MessageSquare } from "lucide-react";
import { SHOP_CATEGORIES } from "@/lib/constants";
import CustomDropdown from "@/components/ui/CustomDropdown";
import { Filter } from "lucide-react";
import { isListingQuarantined } from "@/lib/moderation";
import { useAuth } from "@/hooks/use-auth";
import HomeCategorySegmentBar from "@/components/layout/HomeCategorySegmentBar";
import UniversalSearchBarRow from "@/components/layout/UniversalSearchBarRow";

export default function ShopsClientPage() {
  const router = useRouter();
  const { user, profile, isVerified } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const categoryOptions = React.useMemo(() => [
    { label: "All Offers", value: "All" },
    ...SHOP_CATEGORIES.map((cat) => ({ label: cat, value: cat })),
  ], []);

  const isAuthVerified = isVerified;

  const handlePostOffer = () => {
    if (!isAuthVerified) {
      if (typeof window !== "undefined") {
        localStorage.setItem("namma_thanjai_target_post_route", "/post/offer");
        window.dispatchEvent(new Event("namma_thanjai_open_signin"));
      }
      return;
    }
    router.push("/post/offer");
  };
  const [sortBy, setSortBy] = useState<"recent" | "name">("recent");

  const { data: firestorePosts, loading } = useFirestore<ShopPost>({
    collectionName: "shops",
    areaTag: "All Areas",
    category: "All",
  });

  // Public feed: ONLY Firestore data — no localStorage merge.
  // Published post data is strictly managed via Firestore live queries.
  const allPosts = React.useMemo(() => {
    return firestorePosts || [];
  }, [firestorePosts]);

  const filteredPosts = React.useMemo(() => {
    let list = allPosts.filter((p) => {
      if ((p as any).status === "moderation_review" || (p as any).status === "inactive") return false;
      if ((p as any).is_sold || (p as any).is_inactive || (p as any).is_offline) return false;
      if (isListingQuarantined(p.id)) return false;
      if (!p.shop_name && !(p as any).title && !p.offer_title) return false;
      return true;
    });

    if (selectedCategory !== "All") {
      list = list.filter(
        (p) => (p.category || "").toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    if (sortBy === "name") {
      list.sort((a, b) => (a.shop_name || "").localeCompare(b.shop_name || ""));
    }
    return list;
  }, [allPosts, selectedCategory, sortBy]);

  return (
    <div className="flex flex-col gap-0 pb-6 sm:pb-10 w-full font-sans">
      <HomeCategorySegmentBar />

      <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 flex flex-col gap-3 mt-4 sm:mt-6 pt-1 sm:pt-2">
        {/* 1. TITLE BAR */}
        <div className="py-1 flex items-center justify-between gap-3 w-full">
          <h2 className="font-heading font-black text-base sm:text-lg text-slate-900 tracking-tight">
            Local Offers (சலுகைகள்)
          </h2>
        </div>

      {/* LISTING CONTAINER */}
      <div className="flex flex-col gap-3">

      {/* Feed */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 text-amber-600 animate-spin" /></div>
      ) : filteredPosts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-2 text-center">
          <Store className="w-8 h-8 text-slate-300" />
          <p className="text-sm font-bold text-slate-500">No store offers listed yet.</p>
          <button onClick={handlePostOffer} className="btn-tertiary text-xs px-4 py-2 uppercase tracking-wider cursor-pointer">+ Post Offer</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPosts.map((post, idx) => (
            <ShopCard key={post.id} post={post} index={idx} isGuest={!isAuthVerified} />
          ))}
        </div>
      )}
      </div>
      </div>
    </div>
  );
}
