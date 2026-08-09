"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useFirestore } from "@/hooks/use-firestore";
import NeedCard from "@/components/cards/NeedCard";
import { CLASSIFIED_CATEGORIES, TANJORE_LOCALITIES, TanjoreLocality, CATEGORY_ILLUSTRATIONS } from "@/lib/constants";
import { NeedOrSalePost } from "@/types";
import { Search, Plus, ChevronUp, ChevronDown, Loader2, ArrowRight, ArrowLeft, Tag, FileText, Upload, Calendar, Share2, Home, Car, Tv, Compass, Check, MapPin, ShoppingBag } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import confetti from "canvas-confetti";
import { useAuth } from "@/hooks/use-auth";
import CreatePostModal from "@/components/modals/CreatePostModal";

export default function NeedClientPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, profile, loading } = useAuth();
  
  const area = (searchParams.get("area") || "All Areas") as TanjoreLocality | "All Areas";
  const rawCat = searchParams.get("category");
  const urlCategory = rawCat ? decodeURIComponent(rawCat.replace(/\+/g, " ")) : null;
  const [selectedCategory, setSelectedCategory] = useState<string | null>(urlCategory);
  const searchQuery = searchParams.get("query") || "";

  useEffect(() => {
    const cat = searchParams.get("category");
    if (cat) {
      setSelectedCategory(decodeURIComponent(cat.replace(/\+/g, " ")));
    }
  }, [searchParams]);

  // Dedicated Need Channel (Type = NEED)
  const activeType = "need";

  // Inline Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formArea, setFormArea] = useState("");
  
  const [uploading, setUploading] = useState(false);
  const [polishLoading, setPolishLoading] = useState(false);
  const [sortBy, setSortBy] = useState<"recent" | "price_low" | "price_high">("recent");

  // Seed initial sample Need posts
  const [localPosts, setLocalPosts] = useState<NeedOrSalePost[]>([
    {
      id: "need_commercial_land",
      userId: "sample_user_4",
      type: "NEED",
      title: "Need 1-2 Acres Commercial Land",
      raw_text: "Need 1-2 Acres Commercial Land",
      description: "Required main road facing land near New Bus Stand or Vallam for warehouse.",
      category: "Plots & Real Estate",
      area_tag: "Vallam",
      price: "5000000",
      phone: "9876543212",
      image_url: "/thanjavur_temple_illustration.png",
      is_verified: true,
      created_at: new Date() as any,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) as any,
    },
    {
      id: "need_3bhk_house",
      userId: "sample_user_10",
      type: "NEED",
      title: "Need 3 BHK Independent House",
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
    },
    {
      id: "need_laptop_sample",
      userId: "sample_user_7",
      type: "NEED",
      title: "Urgent Need i5 Laptop",
      raw_text: "Urgent Need i5 Laptop",
      description: "Looking for used Dell/HP laptop for online classes.",
      category: "Electronics & Mobiles",
      area_tag: "Medical College Rd",
      price: "22000",
      phone: "9876543216",
      image_url: "/hero_building_visual.png",
      is_verified: true,
      created_at: new Date() as any,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) as any,
    },
    {
      id: "need_furniture_sample",
      userId: "sample_user_8",
      type: "NEED",
      title: "Need Wooden Dining Table",
      raw_text: "Need Wooden Dining Table",
      description: "Looking for 4-seater wooden dining table set in good condition.",
      category: "Household Goods",
      area_tag: "Vallam",
      price: "8000",
      phone: "9876543217",
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
      router.replace(`/need?${params.toString()}`, { scroll: false });
    }
  };

  const handleClearCategory = () => {
    setSelectedCategory(null);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("category");
    const queryString = params.toString();
    router.replace(queryString ? `/need?${queryString}` : "/need", { scroll: false });
  };

  const allPosts = React.useMemo(() => {
    const normSelected = (selectedCategory || "").toLowerCase().trim();
    const activeLocal = localPosts.filter((p) => {
      const pType = p.type?.toUpperCase();
      const matchType = !pType || pType === "NEED";
      const pCat = (p.category || "").toLowerCase().trim();
      const matchCat = !normSelected || pCat === normSelected || pCat.includes(normSelected) || normSelected.includes(pCat);
      return matchType && matchCat;
    });
    const list = [
      ...activeLocal,
      ...(posts || []).filter((p) => {
        const pType = p.type?.toUpperCase();
        return !pType || pType === "NEED";
      }),
    ];
    if (targetPostId) {
      list.sort((a, b) => {
        if (a.id === targetPostId) return -1;
        if (b.id === targetPostId) return 1;
        return 0;
      });
    }
    return list;
  }, [localPosts, posts, selectedCategory, targetPostId]);

  // Filter posts by search query
  const filteredPosts = React.useMemo(() => {
    return allPosts.filter((p) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        p.title?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q) ||
        p.area_tag?.toLowerCase().includes(q)
      );
    });
  }, [allPosts, searchQuery]);

  // Sort posts
  const sortedPosts = React.useMemo(() => {
    return [...filteredPosts].sort((a, b) => {
      if (sortBy === "price_low") {
        return (Number(a.price) || 0) - (Number(b.price) || 0);
      }
      if (sortBy === "price_high") {
        return (Number(b.price) || 0) - (Number(a.price) || 0);
      }
      return 0;
    });
  }, [filteredPosts, sortBy]);

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const activeUserId = user?.uid || profile?.uid || "localStorage_user";
    const phoneNum = profile?.phone || user?.phoneNumber || "9876543210";
    if (!formTitle || !selectedCategory || !formDesc) {
      alert("Please fill in all required fields.");
      return;
    }

    setUploading(true);

    try {
      const newPost: NeedOrSalePost = {
        id: `post_${Date.now()}`,
        userId: activeUserId,
        type: "NEED",
        title: formTitle,
        raw_text: formTitle,
        description: formDesc,
        category: selectedCategory,
        area_tag: formArea || "Tanjore Town",
        price: formPrice || "Price on Request",
        phone: phoneNum,
        is_verified: true,
        created_at: new Date() as any,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) as any,
      };

      setLocalPosts((prev) => [newPost, ...prev]);
      confetti({ particleCount: 80, spread: 60 });
    } finally {
      setFormTitle("");
      setFormDesc("");
      setFormPrice("");
      setFormArea("");
      setIsFormOpen(false);
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-5 mt-3 md:mt-4 pt-1 pb-12 max-w-7xl mx-auto px-4 sm:px-6">
      {/* HERO BANNER: Shown ONLY on Main Category Overview Page */}
      {!selectedCategory && (
        <div className="relative w-full min-h-[190px] sm:min-h-[210px] rounded-3xl overflow-hidden shadow-md border border-slate-800 bg-slate-955 text-white flex items-center p-6 sm:p-8">
          <img 
            src="/hero_building_visual.png" 
            alt="Buyer Requirements Banner" 
            className="absolute right-0 top-0 h-full w-full sm:w-3/5 object-cover opacity-45 pointer-events-none"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-955 via-slate-955/90 to-transparent pointer-events-none" />
          
          <div className="relative z-10 flex flex-col gap-2.5 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="bg-yellow-500 text-slate-955 font-black text-[10px] sm:text-xs px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Require / Looking For
              </span>
              <span className="text-[11px] text-slate-300 font-bold">
                Thanjavur District
              </span>
            </div>

            <h1 className="font-heading font-black text-2xl sm:text-3xl md:text-4xl text-white tracking-tight uppercase leading-tight">
              Post Your Needs & Buy Requests
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed max-w-md">
              Looking for 3 BHK rental house, commercial land in Vallam, or goods auto? Post your exact requirement for sellers to contact you directly.
            </p>
          </div>
        </div>
      )}

      {/* STEP 1: CATEGORY SELECTION OVERVIEW GRID */}
      {!selectedCategory ? (
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center border-b border-slate-200/80 pb-3">
            <div>
              <h2 className="font-heading font-black text-base sm:text-lg text-slate-900 tracking-tight">
                Browse Buyer Categories
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Select a category to view active buyer requirements in Thanjavur
              </p>
            </div>
            
            <button
              onClick={() => setIsFormOpen(true)}
              className="flex items-center gap-1.5 bg-yellow-500 hover:bg-yellow-600 text-slate-955 font-black px-3.5 sm:px-4 py-2 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer border border-yellow-400 active:scale-95 shadow-2xs shrink-0"
            >
              <Plus className="w-4 h-4 text-slate-955 stroke-[2.5]" />
              <span>Post Need</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 gap-3.5 sm:gap-4">
            {CLASSIFIED_CATEGORIES.map((cat) => {
              const illustration = CATEGORY_ILLUSTRATIONS[cat] || "/thanjavur_temple_illustration.png";
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => handleCategorySelect(cat)}
                  className="bg-white border border-slate-200 hover:border-slate-300 p-2.5 sm:p-3 rounded-2xl shadow-2xs text-left transition-all active:scale-[0.98] hover:shadow-xs flex flex-col gap-2.5 group w-full cursor-pointer overflow-hidden justify-between items-center"
                >
                  <div className="w-full h-16 sm:h-20 rounded-xl overflow-hidden bg-slate-100/80 relative flex items-center justify-center border border-slate-200/50">
                    <img 
                      src={illustration} 
                      alt={cat} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="w-full text-center">
                    <span className="text-[11px] sm:text-xs font-black text-slate-900 block group-hover:text-slate-700 transition-colors line-clamp-1">
                      {cat}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex flex-col gap-3 pt-2 border-t border-slate-200/80">
            <div className="flex items-center justify-between">
              <h2 className="font-heading font-black text-sm sm:text-base text-slate-900 tracking-tight">
                Recent Requirements
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
        /* ACTIVE CATEGORY LISTINGS GRID & BORDERLESS STICKY CONTROLS BAR */
        <div className="flex flex-col gap-4">
          {/* Active Category Title Bar */}
          <div className="flex items-center justify-between bg-slate-100/90 border border-slate-200/90 rounded-2xl p-3 shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="bg-yellow-500 text-slate-955 font-black text-xs px-2.5 py-1 rounded-xl shadow-2xs">
                {selectedCategory}
              </span>
              <span className="text-xs text-slate-600 font-bold">
                ({sortedPosts.length} {sortedPosts.length === 1 ? "Requirement" : "Requirements"})
              </span>
            </div>
            <button
              onClick={handleClearCategory}
              className="text-xs font-black text-slate-700 hover:text-slate-900 bg-white border border-slate-250 px-3 py-1 rounded-xl shadow-2xs cursor-pointer hover:bg-slate-50 transition-colors"
            >
              ✕ All Categories
            </button>
          </div>

          <div className="sticky top-[57px] z-30 bg-white/95 backdrop-blur-md py-2 flex items-center justify-between gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-xs font-black bg-slate-50 border border-slate-250 rounded-xl px-3 py-2 text-slate-800 focus:outline-none cursor-pointer shrink-0 shadow-2xs"
            >
              <option value="recent">Latest First</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
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

          {/* Posts Grid */}
          {postsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((n) => (
                <div key={n} className="bg-white border border-slate-200/60 rounded-2xl p-4 flex flex-col gap-3 animate-pulse">
                  <div className="w-24 h-4 bg-slate-200 rounded-full" />
                  <div className="w-full h-20 bg-slate-200 rounded-xl" />
                </div>
              ))}
            </div>
          ) : sortedPosts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 bg-white border border-slate-200/60 rounded-2xl text-center gap-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200/80 text-slate-400">
                <ShoppingBag className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h4 className="font-heading font-extrabold text-sm text-slate-800">No Posts Found</h4>
                <p className="text-[11px] text-slate-500 mt-1 max-w-[220px] mx-auto leading-relaxed">
                  No buyer requirements listed in <span className="font-bold text-slate-800">{selectedCategory}</span> for {area} yet.
                </p>
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
      )}

      {/* Post Modal */}
      {isFormOpen && (
        <CreatePostModal
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          defaultCategory={selectedCategory || "General Requirement"}
          defaultType="needs"
          defaultClassifiedType="NEED"
        />
      )}
    </div>
  );
}
