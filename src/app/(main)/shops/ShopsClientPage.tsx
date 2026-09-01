"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFirestore } from "@/hooks/use-firestore";
import ShopCard from "@/components/cards/ShopCard";
import { ShopPost } from "@/types";
import { Plus, Loader2, Store, ArrowUpDown, UserCheck, MessageSquare, Search } from "lucide-react";
import { SHOP_CATEGORIES } from "@/lib/constants";
import CustomDropdown from "@/components/ui/CustomDropdown";
import { Filter } from "lucide-react";
import { isListingQuarantined } from "@/lib/moderation";
import { useAuth } from "@/hooks/use-auth";

import UniversalSearchBarRow from "@/components/layout/UniversalSearchBarRow";

export default function ShopsClientPage() {
  const router = useRouter();
  const { user, profile, isVerified } = useAuth();
  const [searchQuery, setSearchQuery] = useState<string>("");

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

  const { data: firestorePosts, loading } = useFirestore<ShopPost>({
    collectionName: "shops",
    areaTag: "All Areas",
    category: "All",
  });

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

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          (p.shop_name || "").toLowerCase().includes(q) ||
          (p.offer_title || "").toLowerCase().includes(q) ||
          (p.offer_description || "").toLowerCase().includes(q) ||
          (p.address_text || "").toLowerCase().includes(q) ||
          (p.area_tag || "").toLowerCase().includes(q)
      );
    }

    return list;
  }, [allPosts, searchQuery]);

  // Highlight ID Auto-Scroll: Bring clicked sample item to top first-fold
  useEffect(() => {
    if (typeof window !== "undefined" && filteredPosts.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const highlightId = params.get("highlightId");
      if (highlightId) {
        setTimeout(() => {
          const el = document.getElementById(`post-${highlightId}`);
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }, 200);
      }
    }
  }, [filteredPosts]);

  return (
    <div className="flex flex-col gap-0 pb-6 sm:pb-10 w-full font-sans">
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 flex flex-col gap-3 pt-2 sm:pt-4">
        
        {/* SEARCH BAR ABOVE TITLE */}
        <div className="w-full bg-white border border-slate-200/90 rounded-2xl p-2.5 shadow-2xs flex items-center gap-2">
          <Search className="w-4.5 h-4.5 text-amber-600 stroke-[2.5] shrink-0 ml-2" />
          <input
            type="text"
            placeholder="Search stores, offers, discounts or areas in Thanjavur..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full py-1.5 px-2 text-xs sm:text-sm font-semibold bg-transparent border-0 focus:outline-none text-slate-900 placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="text-xs text-slate-400 hover:text-slate-600 font-bold px-2 py-1 cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 sm:gap-4">
          {filteredPosts.map((post, idx) => (
            <React.Fragment key={post.id}>
              {idx > 0 && <div className="h-3 bg-slate-100 border-y border-slate-200/80 -mx-3 my-0 sm:hidden" />}
              <div id={`post-${post.id}`} className="w-full scroll-mt-24">
                <ShopCard post={post} index={idx} isGuest={!isAuthVerified} />
              </div>
            </React.Fragment>
          ))}
        </div>
      )}
      </div>
      </div>
    </div>
  );
}
