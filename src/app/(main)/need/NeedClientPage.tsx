"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFirestore } from "@/hooks/use-firestore";
import NeedCard from "@/components/cards/NeedCard";
import { NeedOrSalePost } from "@/types";
import { Plus, Loader2, Search, ArrowUpDown, Filter, UserCheck } from "lucide-react";
import { CLASSIFIED_CATEGORIES } from "@/lib/constants";
import { isListingQuarantined } from "@/lib/moderation";
import CustomDropdown from "@/components/ui/CustomDropdown";

const SAMPLE_POSTS: NeedOrSalePost[] = [
  { id: "nd_2bhk", userId: "sample", type: "NEED", raw_text: "Urgent need 2 BHK individual house for rent near Medical College.", title: "Need 2 BHK House for Rent", description: "Looking for independent 2 BHK with car parking in Medical College area.", category: "Property Rental", area_tag: "Medical College Road", price: 12000, phone: "9876543214", is_verified: true, created_at: new Date() as any, expires_at: new Date() as any },
  { id: "nd_activa", userId: "sample", type: "NEED", raw_text: "Need Honda Activa 6G in good condition.", title: "Need Honda Activa 6G", description: "Buying Activa 6G (2021-2023 model). Budget up to Rs. 55,000.", category: "Used Vehicles", area_tag: "Old Bus Stand", price: 55000, phone: "9876543215", is_verified: true, created_at: new Date() as any, expires_at: new Date() as any },
  { id: "nd_laptop", userId: "sample", type: "NEED", raw_text: "Need Core i5 laptop for online college classes.", title: "Need i5 Laptop for Studies", description: "Looking for used Dell/HP i5 laptop with 8GB RAM for engineering student.", category: "Electronics & Mobiles", area_tag: "Vallam", price: 22000, phone: "9876543216", is_verified: true, created_at: new Date() as any, expires_at: new Date() as any },
];

import { useAuth } from "@/hooks/use-auth";

import WebAppScrollFAB from "@/components/common/WebAppScrollFAB";

export default function NeedClientPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
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

  const isAuthVerified = Boolean(profile?.isVerified || user);

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
      const stored = JSON.parse(localStorage.getItem("namma_thanjai_local_posts") || "[]");
      const needPosts = stored.filter((p: any) => p.type?.toUpperCase() === "NEED");
      setLocalPosts(needPosts);
    } catch (e) {}
  }, []);

  const filteredPosts = React.useMemo(() => {
    const ids = new Set([...(firestorePosts || []).map((p) => p.id), ...localPosts.map((p) => p.id)]);
    const seeds = SAMPLE_POSTS.filter((p) => !ids.has(p.id));
    let list = [...localPosts, ...seeds, ...(firestorePosts || [])];

    list = list.filter((p) => {
      if ((p as any).status === "moderation_review") return false;
      if (isListingQuarantined(p.id)) return false;
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
    <div className="flex flex-col gap-3 pb-24 w-full font-sans">

      {/* 1. Hero Banner — Clean Commercial Design (16px radius) */}
      <div className="relative w-full rounded-2xl overflow-hidden bg-[#0F172A] text-white flex items-center px-6 sm:px-8 py-7 sm:py-8 shadow-sm mt-2">
        <img src="/thanjavur_temple_illustration.png" alt="Need" className="absolute right-0 top-0 h-full w-1/2 object-cover opacity-15 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0F172A] via-[#0F172A]/90 to-transparent" />
        <div className="relative z-10 flex flex-col gap-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-400/20 text-amber-300 font-bold text-xs px-3 py-1 rounded-md w-fit">
            <span>LOCAL REQUIREMENTS</span>
            <span className="text-amber-400">•</span>
            <span>உங்கள் தேவைகள்</span>
          </div>
          <h1 className="font-heading font-black text-xl sm:text-2xl text-white tracking-tight leading-snug">
            Local Requirements &amp; Needs
            <span className="text-amber-400 block text-xs sm:text-base font-bold mt-1">உங்களுக்கு தேவையானதை இங்கே பதிவிடுங்கள்.</span>
          </h1>
        </div>
      </div>

      {/* 2. TITLE BAR WITH ROYAL BLUE MY LISTINGS BUTTON */}
      <div className="py-2.5 flex items-center justify-between gap-3 w-full border-b border-slate-200/80">
        <h2 className="font-heading font-black text-base sm:text-lg text-slate-900 tracking-tight">
          Items Looking For (தேவைகள்)
        </h2>

        <button
          type="button"
          onClick={() => router.push("/profile?tab=my_posts")}
          className="text-[#1d4ed8] hover:text-blue-800 font-heading font-black text-xs hover:underline flex items-center gap-1 cursor-pointer transition-all active:scale-95 shrink-0"
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>My Listings →</span>
        </button>
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
