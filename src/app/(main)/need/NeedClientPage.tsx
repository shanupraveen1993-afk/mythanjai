"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFirestore } from "@/hooks/use-firestore";
import NeedCard from "@/components/cards/NeedCard";
import { NeedOrSalePost } from "@/types";
import { Plus, Loader2, Search, ArrowUpDown, Filter, UserCheck, MessageSquare } from "lucide-react";
import { CLASSIFIED_CATEGORIES } from "@/lib/constants";
import { isListingQuarantined } from "@/lib/moderation";
import CustomDropdown from "@/components/ui/CustomDropdown";

import { useAuth } from "@/hooks/use-auth";
import HomeCategorySegmentBar from "@/components/layout/HomeCategorySegmentBar";
import UniversalSearchBarRow from "@/components/layout/UniversalSearchBarRow";

export default function NeedClientPage() {
  const router = useRouter();
  const { user, profile, isVerified } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [sortBy, setSortBy] = useState<"recent" | "price_low" | "price_high">("recent");

  const categoryOptions = React.useMemo(() => [
    { label: "All Categories", value: "All" },
    ...CLASSIFIED_CATEGORIES.map((cat) => ({ label: cat, value: cat })),
  ], []);

  const sortOptions = React.useMemo(() => [
    { label: "Recently Added", value: "recent" },
    { label: "Budget: Low to High", value: "price_low" },
    { label: "Budget: High to Low", value: "price_high" },
  ], []);

  const isAuthVerified = isVerified;

  const handlePostNeed = () => {
    if (!isAuthVerified) {
      if (typeof window !== "undefined") {
        sessionStorage.setItem("namma_thanjai_target_post_route", "/post/need");
        window.dispatchEvent(new Event("namma_thanjai_open_signin"));
      }
      return;
    }
    router.push("/post/need");
  };

  const { data: firestorePosts, loading } = useFirestore<NeedOrSalePost>({
    collectionName: "needs_and_sales",
    areaTag: "All Areas",
    category: "All",
  });

  const [localPosts, setLocalPosts] = useState<NeedOrSalePost[]>([]);

  useEffect(() => {
    try {
      let stored = JSON.parse(localStorage.getItem("namma_thanjai_local_posts") || "[]");
      let needPosts = stored.filter((p: any) => p.type?.toUpperCase() === "NEED");
      setLocalPosts(needPosts);
    } catch (e) {}
  }, []);

  const filteredPosts = React.useMemo(() => {
    let list = [...localPosts, ...(firestorePosts || [])];

    list = list.filter((p) => {
      if ((p as any).status === "moderation_review") return false;
      if (isListingQuarantined(p.id)) return false;
      if (!p.title || p.title.trim() === "" || p.description === "No detailed description provided.") return false;
      return p.type?.toUpperCase() === "NEED";
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
  }, [firestorePosts, localPosts, selectedCategory, sortBy]);

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
    <div className="flex flex-col gap-3 pb-24 w-full font-sans max-w-7xl mx-auto px-4 sm:px-6">
      <HomeCategorySegmentBar />
      <UniversalSearchBarRow />

      {/* Sleek Hero Banner for Need Segment with Conditional WhatsApp Login */}
      <div className="relative w-full rounded-2xl overflow-hidden bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 text-white p-5 sm:p-6 shadow-md border border-slate-800 my-1">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div className="flex flex-col gap-1 max-w-lg">
            <div className="flex items-center gap-2">
              <span className="bg-amber-400 text-slate-950 font-heading font-black text-[10px] uppercase px-2 py-0.5 rounded-md tracking-wider">
                Requirements
              </span>
              <span className="text-xs text-amber-300 font-bold">Post Your Local Needs</span>
            </div>
            <h1 className="font-heading font-black text-xl sm:text-2xl text-white tracking-tight leading-tight mt-1">
              Find Anything You Need in Thanjavur
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-medium">
              உங்களுக்கு தேவையான பொருட்களை உடனடியாக கேட்கலாம்.
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
          Items Looking For (தேவைகள்)
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
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 text-blue-600 animate-spin" /></div>
      ) : filteredPosts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-2 text-center">
          <Search className="w-8 h-8 text-slate-300" />
          <p className="text-sm font-bold text-slate-500">No requirements listed yet.</p>
          <button onClick={handlePostNeed} className="btn-tertiary text-xs px-4 py-2 uppercase tracking-wider cursor-pointer">+ Post Requirement</button>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedPosts.map((post) => <NeedCard key={post.id} post={post} />)}
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
  );
}
