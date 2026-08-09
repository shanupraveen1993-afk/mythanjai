"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useFirestore } from "@/hooks/use-firestore";
import NeedCard from "@/components/cards/NeedCard";
import { CLASSIFIED_CATEGORIES, TANJORE_LOCALITIES, TanjoreLocality, CATEGORY_ILLUSTRATIONS } from "@/lib/constants";
import { NeedOrSalePost } from "@/types";
import { Search, Plus, ChevronUp, ChevronDown, Loader2, ArrowRight, ArrowLeft, Tag, FileText, Upload, Calendar, Share2, Home, Car, Tv, Compass, Check, MapPin } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import confetti from "canvas-confetti";
import { useAuth } from "@/hooks/use-auth";
import CreatePostModal from "@/components/modals/CreatePostModal";

export default function NeedPage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-center text-xs font-bold text-slate-400">Loading Buyer Requirements...</div>}>
      <NeedPageContent />
    </React.Suspense>
  );
}

function NeedPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, profile, loading } = useAuth();
  
  const area = (searchParams.get("area") || "All Areas") as TanjoreLocality | "All Areas";
  const urlCategory = searchParams.get("category") || null;
  const [selectedCategory, setSelectedCategory] = useState<string | null>(urlCategory);
  const searchQuery = searchParams.get("query") || "";

  useEffect(() => {
    const cat = searchParams.get("category");
    if (cat) {
      setSelectedCategory(cat);
    }
  }, [searchParams]);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [sortBy, setSortBy] = useState<"recent" | "price_low" | "price_high">("recent");

  const [localPosts, setLocalPosts] = useState<NeedOrSalePost[]>([
    {
      id: "need_3bhk_medical",
      userId: "sample_user_4",
      type: "NEED",
      title: "Need 3 BHK House",
      raw_text: "Need 3 BHK House",
      description: "Doctor family searching for clean 3 BHK house with car parking.",
      category: "Property Rental",
      area_tag: "Medical College Rd",
      price: "18000",
      phone: "9876543213",
      image_url: "/hero_building_visual.png",
      is_verified: true,
      created_at: new Date() as any,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) as any,
    },
    {
      id: "need_goods_auto",
      userId: "sample_user_5",
      type: "NEED",
      title: "Need Commercial Auto",
      raw_text: "Need Commercial Auto",
      description: "Required used goods autorickshaw or Tata Ace with valid FC.",
      category: "Used Vehicles",
      area_tag: "New Bus Stand",
      price: "120000",
      phone: "9876543214",
      image_url: "/namma_thanjai_logo.png",
      is_verified: true,
      created_at: new Date() as any,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) as any,
    },
    {
      id: "need_accountant",
      userId: "sample_user_6",
      type: "NEED",
      title: "Hiring Accountant",
      raw_text: "Hiring Accountant",
      description: "Required Tally Prime accountant for retail store.",
      category: "Jobs & Opportunities",
      area_tag: "Gandhiji Road",
      price: "18000",
      phone: "9876543215",
      image_url: "/thanjavur_temple_illustration.png",
      is_verified: true,
      created_at: new Date() as any,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) as any,
    }
  ]);

  const targetPostId = searchParams.get("post");
  
  const { data: posts, loading: postsLoading } = useFirestore<NeedOrSalePost>({
    collectionName: "needs_and_sales",
    areaTag: area,
    category: selectedCategory || "All",
  });

  const handleCategorySelect = (category?: string | null) => {
    if (category && typeof category === "string") {
      setSelectedCategory(category);
      const params = new URLSearchParams(searchParams.toString());
      params.set("category", category);
      router.push(`/need?${params.toString()}`);
    }
  };

  const handleClearCategory = () => {
    setSelectedCategory(null);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("category");
    const q = params.toString();
    router.push(q ? `/need?${q}` : "/need");
  };

  const allPosts = React.useMemo(() => {
    const activeLocal = localPosts.filter((p) => {
      const matchType = p.type?.toUpperCase() === "NEED";
      const matchCat = !selectedCategory || p.category === selectedCategory;
      return matchType && matchCat;
    });
    const list = [...activeLocal, ...(posts || []).filter((p) => p.type?.toUpperCase() === "NEED")];
    if (targetPostId) {
      list.sort((a, b) => {
        if (a.id === targetPostId) return -1;
        if (b.id === targetPostId) return 1;
        return 0;
      });
    }
    return list;
  }, [localPosts, posts, selectedCategory, targetPostId]);

  const sortedPosts = React.useMemo(() => {
    let result = [...allPosts];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.title?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.area_tag?.toLowerCase().includes(q)
      );
    }

    if (sortBy === "price_low") {
      result.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
    } else if (sortBy === "price_high") {
      result.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
    }
    return result;
  }, [allPosts, searchQuery, sortBy]);

  return (
    <div className="flex flex-col gap-5 mt-3 md:mt-4 pt-1 pb-12 max-w-7xl mx-auto px-4 sm:px-6">
      <CreatePostModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        defaultType="needs"
        defaultClassifiedType="NEED"
        defaultCategory={selectedCategory || "Property Rental"}
      />

      {/* HERO BANNER: Shown ONLY on Main Category Overview Page */}
      {!selectedCategory && (
        <div className="relative w-full min-h-[190px] sm:min-h-[210px] rounded-3xl overflow-hidden shadow-md border border-slate-800 bg-slate-950 text-white flex items-center p-6 sm:p-8">
          <img 
            src="/thanjavur_hero_banner.png" 
            alt="Need Requirements Banner" 
            className="absolute right-0 top-0 h-full w-full sm:w-3/5 object-cover opacity-50 pointer-events-none"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-transparent pointer-events-none" />
          
          <div className="relative z-10 max-w-xl flex flex-col gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-yellow-400 bg-yellow-400/10 border border-yellow-400/30 px-3 py-1 rounded-full w-fit">
              Wanted & Requirements
            </span>
            <h1 className="font-heading font-black text-2xl sm:text-3xl text-white tracking-tight uppercase leading-tight">
              Looking For In Thanjavur
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
              Post and search buyer requirements, job openings, wanted houses for rent, and local services needed.
            </p>
          </div>
        </div>
      )}

      {/* CONTROLS BAR ABOVE LISTING: ONLY Sort By & Post Button */}
      <div className="sticky top-[57px] z-30 bg-white/95 backdrop-blur-md py-2.5 px-3.5 border border-slate-200 rounded-2xl shadow-2xs flex items-center justify-between gap-2">
        <span className="font-heading font-black text-xs sm:text-sm text-slate-800 uppercase tracking-tight">
          {selectedCategory || "Requirement Categories"}
        </span>

        <div className="flex items-center gap-2 ml-auto">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-xs font-black bg-slate-50 border border-slate-250 rounded-xl px-3 py-2 text-slate-800 focus:outline-none cursor-pointer shrink-0 shadow-2xs"
          >
            <option value="recent">Latest First</option>
            <option value="price_low">Budget: Low to High</option>
            <option value="price_high">Budget: High to Low</option>
          </select>

          <button
            type="button"
            onClick={() => setIsFormOpen(true)}
            className="flex items-center gap-1.5 bg-yellow-500 hover:bg-yellow-600 text-slate-955 font-black px-3.5 sm:px-4 py-2 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer border border-yellow-400 active:scale-95 shadow-2xs shrink-0"
          >
            <Plus className="w-4 h-4 text-slate-955 stroke-[2.5]" />
            <span>Post Need</span>
          </button>
        </div>
      </div>

      {!selectedCategory ? (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5 sm:gap-3.5">
            {CLASSIFIED_CATEGORIES.map((cat) => {
              const illustration = CATEGORY_ILLUSTRATIONS[cat] || "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=600&auto=format&fit=crop";
              return (
                <button
                  key={cat}
                  onClick={() => handleCategorySelect(cat)}
                  className="bg-white border border-slate-200 hover:border-slate-400 p-2 sm:p-3 rounded-2xl shadow-2xs text-left transition-all active:scale-[0.98] hover:shadow-md flex flex-col gap-2 group w-full cursor-pointer overflow-hidden justify-between"
                >
                  <div className="w-full h-16 sm:h-24 rounded-xl overflow-hidden relative bg-slate-100 border border-slate-100">
                    <img
                      src={illustration}
                      alt={cat}
                      className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-300"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] sm:text-xs font-black text-slate-900 block group-hover:text-slate-700 transition-colors line-clamp-1">
                      {cat}
                    </span>
                    <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 block mt-0.5">Explore →</span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex flex-col gap-3 pt-2 border-t border-slate-200/80">
            <div className="flex items-center justify-between">
              <h2 className="font-heading font-black text-base sm:text-lg text-slate-900 tracking-tight">
                Recent Buyer & Requirement Listings
              </h2>
            </div>
            <div className="flex overflow-x-auto snap-x scrollbar-none gap-4 pb-2">
              {sortedPosts.map((post) => (
                <div 
                  key={post.id} 
                  onClick={() => handleCategorySelect(post.category)}
                  className="shrink-0 w-[280px] sm:w-[320px] snap-start cursor-pointer hover:scale-[1.01] transition-transform"
                >
                  <NeedCard post={post} />
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedPosts.map((post) => (
            <div key={post.id} id={`post-${post.id}`} className="transition-all duration-500">
              <NeedCard post={post} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
