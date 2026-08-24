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

  const [localPosts, setLocalPosts] = useState<ShopPost[]>([]);

  useEffect(() => {
    try {
      let stored = JSON.parse(localStorage.getItem("namma_thanjai_local_posts") || "[]");
      let shopPosts = stored.filter((p: any) => p.shop_name || p.offer_title || p.type === "OFFER" || p.type === "SHOP");
      setLocalPosts(shopPosts);
    } catch (e) {}
  }, []);

  const filteredPosts = React.useMemo(() => {

    let list = [...localPosts, ...(firestorePosts || [])].filter((p) => {
      if ((p as any).status === "moderation_review") return false;
      if (isListingQuarantined(p.id)) return false;
      if (!p.shop_name || p.shop_name.trim() === "" || p.offer_description === "No detailed description provided.") return false;
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
  }, [firestorePosts, selectedCategory, sortBy]);

  return (
    <div className="flex flex-col gap-3 pb-24 w-full font-sans max-w-7xl mx-auto px-4 sm:px-6">
      <HomeCategorySegmentBar />
      <UniversalSearchBarRow />

      {/* Sleek Hero Banner for Offer Segment with Conditional WhatsApp Login */}
      <div className="relative w-full rounded-2xl overflow-hidden bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 text-white p-5 sm:p-6 shadow-md border border-slate-800 my-1">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div className="flex flex-col gap-1 max-w-lg">
            <div className="flex items-center gap-2">
              <span className="bg-amber-400 text-slate-950 font-heading font-black text-[10px] uppercase px-2 py-0.5 rounded-md tracking-wider">
                Local Offers
              </span>
              <span className="text-xs text-amber-300 font-bold">Exclusive Thanjavur Deals</span>
            </div>
            <h1 className="font-heading font-black text-xl sm:text-2xl text-white tracking-tight leading-tight mt-1">
              Explore Exclusive Store Discounts & Offers
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-medium">
              தஞ்சாவூர் கடைக்காரர்களின் சிறப்பு சலுகைகள்.
            </p>
          </div>

          {!user && (
            <button
              type="button"
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.dispatchEvent(new Event("namma_thanjai_open_signin"));
                }
              }}
              className="bg-[#128C7E] hover:bg-[#075e54] text-white font-heading font-black text-xs sm:text-sm py-2.5 px-4 rounded-xl shadow-md cursor-pointer transition-all active:scale-95 flex items-center gap-2 shrink-0 border border-emerald-500/50"
            >
              <MessageSquare className="w-4 h-4 fill-white stroke-[2.5]" />
              <span>Login with WhatsApp</span>
            </button>
          )}
        </div>
      </div>



      {/* 2. TITLE BAR */}
      <div className="py-2 flex items-center justify-between gap-3 w-full border-b border-slate-200/80">
        <h2 className="font-heading font-black text-base sm:text-lg text-slate-900 tracking-tight">
          Local Offer (சலுகைகள்)
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
  );
}
