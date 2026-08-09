"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useFirestore } from "@/hooks/use-firestore";
import NeedCard from "@/components/cards/NeedCard";
import { CLASSIFIED_CATEGORIES, TANJORE_LOCALITIES, TanjoreLocality, CATEGORY_ILLUSTRATIONS } from "@/lib/constants";
import { NeedOrSalePost } from "@/types";
import { MessageSquare, Plus, ChevronUp, ChevronDown, Loader2, ArrowRight, ArrowLeft, Tag, FileText, Search, Upload, Calendar, Share2, Home, Car, Tv, Compass, Check, MapPin } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import confetti from "canvas-confetti";
import { useAuth } from "@/hooks/use-auth";
import CreatePostModal from "@/components/modals/CreatePostModal";

export default function SellPage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-center text-xs font-bold text-slate-400">Loading Sell Marketplace...</div>}>
      <SellPageContent />
    </React.Suspense>
  );
}

function SellPageContent() {
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

  // Dedicated Sell Channel (Type = SELL)
  const activeType = "sale";

  // Inline Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formArea, setFormArea] = useState("");
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [youtubeThumbnail, setYoutubeThumbnail] = useState("");
  const [googleMapsUrl, setGoogleMapsUrl] = useState("");
  
  const [uploading, setUploading] = useState(false);
  const [polishLoading, setPolishLoading] = useState(false);
  const [sortBy, setSortBy] = useState<"recent" | "price_low" | "price_high">("recent");

  // Seed initial sample Sell posts
  const [localPosts, setLocalPosts] = useState<NeedOrSalePost[]>([
    {
      id: "cmda_plot",
      userId: "sample_user_1",
      type: "SELL",
      title: "2400 Sqft CMDA Plot",
      raw_text: "2400 Sqft CMDA Plot",
      description: "DTCP approved residential plot with 30ft road frontage in Vallam.",
      category: "Plot / Real Estate",
      area_tag: "Vallam",
      price: "2450000",
      phone: "9876543210",
      image_url: "/thanjavur_temple_illustration.png",
      is_verified: true,
      created_at: new Date() as any,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) as any,
    },
    {
      id: "house_rental",
      userId: "sample_user_2",
      type: "SELL",
      title: "2 BHK House for Rent",
      raw_text: "2 BHK House for Rent",
      description: "Modular kitchen, 2 bathrooms, 24/7 Kaveri water, car parking.",
      category: "Property Rental",
      area_tag: "Medical College Rd",
      price: "12500",
      phone: "9876543211",
      image_url: "/hero_building_visual.png",
      is_verified: true,
      created_at: new Date() as any,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) as any,
    },
    {
      id: "hero_bike",
      userId: "sample_user_3",
      type: "SELL",
      title: "Hero Splendor 2022",
      raw_text: "Hero Splendor 2022",
      description: "Single owner, 65+ kmpl mileage, clean papers.",
      category: "Used Vehicles",
      area_tag: "New Bus Stand",
      price: "68000",
      phone: "9876543212",
      image_url: "/namma_thanjai_logo.png",
      is_verified: true,
      created_at: new Date() as any,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) as any,
    }
  ]);

  const targetPostId = searchParams.get("post");
  useEffect(() => {
    if (targetPostId) {
      const timer = setTimeout(() => {
        const el = document.getElementById(`post-${targetPostId}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [targetPostId]);

  // Real-time Firestore Query subscription
  const { data: posts, loading: postsLoading } = useFirestore<NeedOrSalePost>({
    collectionName: "needs_and_sales",
    areaTag: area,
    category: selectedCategory || "All",
  });

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
  };

  const handleClearCategory = () => {
    setSelectedCategory(null);
  };

  // Combine real Firestore posts with local test fallback posts
  const allPosts = React.useMemo(() => {
    const activeLocal = localPosts.filter(p => {
      const pType = p.type.toLowerCase();
      const matchType = pType === "sell" || pType === "sale";
      const matchCategory = !selectedCategory || p.category === selectedCategory;
      return matchType && matchCategory;
    });
    return [...activeLocal, ...(posts || []).filter(p => p.type?.toLowerCase() === "sell" || p.type?.toLowerCase() === "sale")];
  }, [localPosts, posts, selectedCategory]);

  // Filter posts locally if there's a search query
  const filteredPosts = allPosts.filter((post: NeedOrSalePost) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const titleMatch = post.title?.toLowerCase().includes(query);
    const descMatch = post.description?.toLowerCase().includes(query);
    const textMatch = post.raw_text?.toLowerCase().includes(query);
    return titleMatch || descMatch || textMatch;
  });

  // Client-side sorting
  const sortedPosts = [...filteredPosts].sort((a, b) => {
    if (targetPostId) {
      if (a.id === targetPostId) return -1;
      if (b.id === targetPostId) return 1;
    }
    if (sortBy === "price_low") {
      return (Number(a.price) || 0) - (Number(b.price) || 0);
    }
    if (sortBy === "price_high") {
      return (Number(b.price) || 0) - (Number(a.price) || 0);
    }
    const timeA = a.created_at?.seconds || 0;
    const timeB = b.created_at?.seconds || 0;
    return timeB - timeA;
  });

  return (
    <div className="flex flex-col gap-5 mt-3 md:mt-4 pt-1 pb-12 max-w-7xl mx-auto px-4 sm:px-6">
      {/* Create Post Modal Component */}
      <CreatePostModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        defaultType="needs"
        defaultClassifiedType="SELL"
        defaultCategory={selectedCategory || "Plot / Real Estate"}
      />

      {/* TOP CONTROLS & POST SALE ACTION BAR */}
      <div className="sticky top-[57px] z-30 bg-white/95 backdrop-blur-md py-2.5 px-3.5 border border-slate-200 rounded-2xl shadow-2xs flex items-center justify-between gap-2">
        {selectedCategory ? (
          <button
            onClick={handleClearCategory}
            className="flex items-center gap-1.5 font-black text-xs text-slate-800 hover:text-slate-950 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-xl border border-slate-250 cursor-pointer transition-colors shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-slate-900" />
            <span className="truncate max-w-[120px] sm:max-w-none">{selectedCategory}</span>
          </button>
        ) : (
          <span className="font-heading font-black text-xs sm:text-sm text-slate-800 uppercase tracking-tight">
            Sell Categories
          </span>
        )}

        <div className="flex items-center gap-2">
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
            onClick={() => {
              if (!profile?.isVerified) {
                router.push("/sell?auth=popup");
              } else {
                setIsFormOpen(true);
              }
            }}
            className="flex items-center gap-1.5 bg-yellow-500 hover:bg-yellow-600 text-slate-955 font-black px-3.5 sm:px-4 py-2 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer border border-yellow-400 active:scale-95 shadow-2xs shrink-0"
          >
            <Plus className="w-4 h-4 text-slate-955 stroke-[2.5]" />
            <span>Post Sale</span>
          </button>
        </div>
      </div>

      {/* CATEGORIES GRID OR LISTINGS FEED */}
      {!selectedCategory ? (
        <div className="flex flex-col gap-6">
          {/* 3-Column Compact Category Selection Grid */}
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

          {/* Horizontal Scrollable Preview Feed of Recent Listings */}
          <div className="flex flex-col gap-3 pt-2 border-t border-slate-200/80">
            <div className="flex items-center justify-between">
              <h2 className="font-heading font-black text-base sm:text-lg text-slate-900 tracking-tight">
                Recent Sell & Rental Listings
              </h2>
              <span className="text-xs font-bold text-slate-500">Click card to view category →</span>
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
        /* ACTIVE CATEGORY LISTINGS GRID */
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
