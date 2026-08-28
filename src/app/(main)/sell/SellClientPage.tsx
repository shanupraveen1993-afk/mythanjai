"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFirestore } from "@/hooks/use-firestore";
import ListingCard, { ListingItem } from "@/components/cards/ListingCard";
import { NeedOrSalePost } from "@/types";
import { Plus, ShoppingBag, Loader2, Filter, ArrowUpDown, UserCheck, MessageSquare } from "lucide-react";
import { CLASSIFIED_CATEGORIES } from "@/lib/constants";
import { isListingQuarantined } from "@/lib/moderation";
import CustomDropdown from "@/components/ui/CustomDropdown";
import { useAuth } from "@/hooks/use-auth";
import UniversalSearchBarRow from "@/components/layout/UniversalSearchBarRow";


export default function SellClientPage() {
  const router = useRouter();
  const { user, profile, isVerified } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState<"recent" | "price_low" | "price_high">("recent");
  // NOTE: localStorage posts are ONLY for My Listings page.
  // Public feed always shows only Firestore data — never own posts.

  const categoryOptions = React.useMemo(() => [
    { label: "All Categories", value: "All" },
    ...CLASSIFIED_CATEGORIES.map((cat) => ({ label: cat, value: cat })),
  ], []);

  const sortOptions = React.useMemo(() => [
    { label: "Recently Added", value: "recent" },
    { label: "Price: Low to High", value: "price_low" },
    { label: "Price: High to Low", value: "price_high" },
  ], []);

  const isAuthVerified = isVerified;

  const handlePostItem = () => {
    if (!isAuthVerified) {
      if (typeof window !== "undefined") {
        sessionStorage.setItem("namma_thanjai_target_post_route", "/post/sell");
        window.dispatchEvent(new Event("namma_thanjai_open_signin"));
      }
      return;
    }
    router.push("/post/sell");
  };

  const { data: firestorePosts, loading } = useFirestore<NeedOrSalePost>({
    collectionName: "needs_and_sales",
    areaTag: "All Areas",
    category: "All",
  });



  // Public feed: ONLY Firestore data — no localStorage merge.
  // Published post data is strictly managed via Firestore live queries.
  const allPosts = React.useMemo(() => {
    return firestorePosts || [];
  }, [firestorePosts]);

  const filteredPosts = React.useMemo(() => {
    let list: NeedOrSalePost[] = allPosts.filter((p: any) => {
      if (p.status === "moderation_review" || p.status === "inactive") return false;
      if (isListingQuarantined(p.id)) return false;
      if (!p.title || p.title.trim() === "") return false;
      const pType = (p.type || "SELL").toUpperCase();
      if (pType === "NEED") return false;
      if (p.is_sold || p.is_inactive || p.is_offline) return false;
      return true;
    });

    if (selectedCategory !== "All") {
      list = list.filter(
        (p) => (p.category || "").toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    if (sortBy === "price_low") {
      list.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
    } else if (sortBy === "price_high") {
      list.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
    }
    return list;
  }, [allPosts, selectedCategory, sortBy]);

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 15; // 5 rows for 1 page (3 cols x 5 rows)

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, sortBy]);

  const totalPages = Math.ceil(filteredPosts.length / ITEMS_PER_PAGE) || 1;
  const paginatedPosts = React.useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredPosts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredPosts, currentPage]);

  return (
    <div className="flex flex-col gap-0 pb-6 sm:pb-10 w-full font-sans">


      <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 flex flex-col gap-3.5 pt-2 sm:pt-4">
        {/* 1. TITLE BAR */}
        <div className="py-1 flex items-center justify-between gap-3 w-full">
          <h2 className="font-heading font-black text-base sm:text-lg text-slate-900 tracking-tight">
            Items for Sale (விற்பனை)
          </h2>
        </div>

      {/* LISTING CONTAINER */}
      <div className="flex flex-col gap-3">
        {/* Category & Sort Custom Dropdown Controls (Hug Content) */}
        <div className="py-1 flex items-center gap-2 sm:gap-3 bg-transparent w-full flex-wrap">
          {/* Category Dropdown */}
          <CustomDropdown
            options={categoryOptions}
            value={selectedCategory}
            onChange={(val) => setSelectedCategory(val)}
            icon={<Filter className="w-3.5 h-3.5" />}
            className="w-fit shrink-0"
          />

          {/* Sort By Dropdown */}
          <CustomDropdown
            options={sortOptions}
            value={sortBy}
            onChange={(val) => setSortBy(val as any)}
            icon={<ArrowUpDown className="w-3.5 h-3.5" />}
            className="w-fit shrink-0"
          />
        </div>

      {/* Feed */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 text-amber-600 animate-spin" /></div>
      ) : filteredPosts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-2 text-center">
          <ShoppingBag className="w-8 h-8 text-slate-300" />
          <p className="text-sm font-bold text-slate-500">No items listed yet.</p>
          <button onClick={handlePostItem} className="btn-tertiary text-xs px-4 py-2 uppercase tracking-wider cursor-pointer">+ Post Item</button>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedPosts.map((post) => (
              <ListingCard key={post.id} listing={post as unknown as ListingItem} />
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between gap-2 pt-6 pb-2 border-t border-slate-200/80">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-2xs"
              >
                Previous
              </button>
              <span className="text-xs font-bold text-slate-700">
                Page {currentPage} of {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-2xs"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
      </div>
      </div>
    </div>
  );
}
