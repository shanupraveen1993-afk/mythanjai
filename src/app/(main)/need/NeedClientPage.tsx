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

import { NEED_SAMPLES } from "@/lib/sampleData";

import { useAuth } from "@/hooks/use-auth";

import WebAppScrollFAB from "@/components/common/WebAppScrollFAB";

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

      if (needPosts.length === 0) {
        const sampleSeed: any[] = [
          {
            id: "sample_need_1",
            type: "NEED",
            title: "Looking for 2BHK House for Rent near Medical College Road",
            description: "Family looking for 2BHK independent house or apartment for rent with car parking. Prefer 24hr water facility and peaceful residential location.",
            price: 12000,
            price_from: 8000,
            price_to: 12000,
            category: "Real Estate",
            area_tag: "Medical College Road",
            phone: "+91 98765 43210",
            created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
          },
          {
            id: "sample_need_2",
            type: "NEED",
            title: "Looking for Used Honda Activa 5G / 6G in Good Condition",
            description: "Required well-maintained Honda Activa 5G or 6G scooter. Single owner preferred with clean RC document and good engine condition.",
            price: 45000,
            price_from: 35000,
            price_to: 45000,
            category: "Vehicles",
            area_tag: "New Bus Stand",
            phone: "+91 98765 43210",
            created_at: new Date(Date.now() - 3600000 * 7).toISOString(),
          },
          {
            id: "sample_need_3",
            type: "NEED",
            title: "Need Used Core i5 / Ryzen 5 Laptop for College Project",
            description: "Engineering student looking for secondhand laptop with 8GB RAM, SSD, and decent battery backup. Immediate purchase for cash.",
            price: 25000,
            price_from: null,
            price_to: 25000,
            category: "Electronics",
            area_tag: "Old Bus Stand",
            phone: "+91 98765 43210",
            created_at: new Date(Date.now() - 3600000 * 14).toISOString(),
          },
          {
            id: "sample_need_4",
            type: "NEED",
            title: "Required 1 Acre Agricultural Land near Vallam for Lease",
            description: "Farmer looking for 1 to 2 acres of fertile agricultural land near Vallam for seasonal cultivation. Borewell water facility preferred.",
            price: null,
            price_from: null,
            price_to: null,
            category: "Real Estate",
            area_tag: "Vallam",
            phone: "+91 98765 43210",
            created_at: new Date(Date.now() - 3600000 * 28).toISOString(),
          },
          {
            id: "sample_need_5",
            type: "NEED",
            title: "Looking for Used iPad or Android Tablet for Digital Drawing",
            description: "Artist looking for pre-owned iPad (9th Gen+) or Samsung Galaxy Tab with Stylus support. Good screen condition essential.",
            price: 15000,
            price_from: 10000,
            price_to: 15000,
            category: "Electronics",
            area_tag: "South Rampart",
            phone: "+91 98765 43210",
            created_at: new Date(Date.now() - 3600000 * 50).toISOString(),
          },
        ];
        stored = [...sampleSeed, ...stored];
        localStorage.setItem("namma_thanjai_local_posts", JSON.stringify(stored));
        needPosts = sampleSeed;
      }
      setLocalPosts(needPosts);
    } catch (e) {}
  }, []);

  const filteredPosts = React.useMemo(() => {
    const ids = new Set([...(firestorePosts || []).map((p) => p.id), ...localPosts.map((p) => p.id)]);
    const seeds = NEED_SAMPLES.filter((p) => !ids.has(p.id));
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
