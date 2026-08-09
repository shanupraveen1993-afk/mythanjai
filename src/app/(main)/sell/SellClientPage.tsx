"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useFirestore } from "@/hooks/use-firestore";
import NeedCard from "@/components/cards/NeedCard";
import { CLASSIFIED_CATEGORIES, TANJORE_LOCALITIES, TanjoreLocality, CATEGORY_ILLUSTRATIONS } from "@/lib/constants";
import { NeedOrSalePost } from "@/types";
import { MessageSquare, Plus, ChevronUp, ChevronDown, Loader2, ArrowRight, ArrowLeft, Tag, FileText, Search, Upload, Calendar, Share2, Home, Car, Tv, Compass, Check, MapPin, ShoppingBag } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/hooks/use-auth";
import CreatePostModal from "@/components/modals/CreatePostModal";

export default function SellClientPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, profile, loading } = useAuth();
  
  const area = (searchParams.get("area") || "All Areas") as TanjoreLocality | "All Areas";
  const searchQuery = searchParams.get("query") || "";
  // Pure client-side state — NO URL query params for category (prevents Vercel RSC crash)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);


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
      category: "Plots & Real Estate",
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
    },
    {
      id: "iphone_sale",
      userId: "sample_user_4",
      type: "SELL",
      title: "iPhone 13 128GB Blue",
      raw_text: "iPhone 13 128GB Blue",
      description: "Mint condition, original box, charger cable & bill available.",
      category: "Electronics & Mobiles",
      area_tag: "Old Bus Stand",
      price: "42000",
      phone: "9876543213",
      image_url: "/namma_thanjai_logo.png",
      is_verified: true,
      created_at: new Date() as any,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) as any,
    },
    {
      id: "sofa_set_sale",
      userId: "sample_user_5",
      type: "SELL",
      title: "Teakwood 5 Seater Sofa Set",
      raw_text: "Teakwood 5 Seater Sofa Set",
      description: "Premium polish, comfortable cushions, well maintained.",
      category: "Household Goods",
      area_tag: "Karanthai",
      price: "18500",
      phone: "9876543214",
      image_url: "/hero_building_visual.png",
      is_verified: true,
      created_at: new Date() as any,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) as any,
    },
    {
      id: "treadmill_sale",
      userId: "sample_user_6",
      type: "SELL",
      title: "Motorized Fitness Treadmill",
      raw_text: "Motorized Fitness Treadmill",
      description: "Heavy duty motor, digital display, foldable design.",
      category: "Others",
      area_tag: "Pullanabhoothangudi",
      price: "15000",
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

  // Pure client-side category switching — zero URL updates, zero Vercel server re-fetch
  const handleCategorySelect = (category?: string | null) => {
    if (category && typeof category === "string") {
      setSelectedCategory(category);
    }
  };

  const handleClearCategory = () => {
    setSelectedCategory(null);
  };

  // Combine real Firestore posts with local test fallback posts
  const allPosts = React.useMemo(() => {
    const normSelected = (selectedCategory || "").toLowerCase().trim();
    const activeLocal = localPosts.filter((p) => {
      const pType = p.type?.toUpperCase();
      const matchType = !pType || pType === "SELL" || pType === "SALE";
      const pCat = (p.category || "").toLowerCase().trim();
      const matchCat = !normSelected || pCat === normSelected || pCat.includes(normSelected) || normSelected.includes(pCat);
      return matchType && matchCat;
    });
    const list = [
      ...activeLocal,
      ...(posts || []).filter((p) => {
        const pType = p.type?.toUpperCase();
        return !pType || pType === "SELL" || pType === "SALE";
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

  return (
    <div className="flex flex-col gap-5 mt-3 md:mt-4 pt-1 pb-12 max-w-7xl mx-auto px-4 sm:px-6">
      {/* HERO BANNER: Shown ONLY on Main Category Overview Page */}
      {!selectedCategory && (
        <div className="relative w-full min-h-[190px] sm:min-h-[210px] rounded-3xl overflow-hidden shadow-md border border-slate-800 bg-slate-955 text-white flex items-center p-6 sm:p-8">
          <img 
            src="/thanjavur_temple_illustration.png" 
            alt="Sell Listings Banner" 
            className="absolute right-0 top-0 h-full w-full sm:w-3/5 object-cover opacity-45 pointer-events-none"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-955 via-slate-955/90 to-transparent pointer-events-none" />
          
          <div className="relative z-10 flex flex-col gap-2.5 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="bg-yellow-500 text-slate-955 font-black text-[10px] sm:text-xs px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Direct Marketplace
              </span>
              <span className="text-[11px] text-slate-300 font-bold">
                Thanjavur District
              </span>
            </div>

            <h1 className="font-heading font-black text-2xl sm:text-3xl md:text-4xl text-white tracking-tight uppercase leading-tight">
              Buy & Sell In Thanjavur
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed max-w-md">
              Buy or sell real estate plots in Vallam, 2 BHK rental houses on Medical College Rd, bikes, cars & electronics directly.
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
                Browse Sell Categories
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Select a category to view active listings across Thanjavur
              </p>
            </div>

            <button
              onClick={() => setIsFormOpen(true)}
              className="flex items-center gap-1.5 bg-yellow-500 hover:bg-yellow-600 text-slate-955 font-black px-3.5 sm:px-4 py-2 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer border border-yellow-400 active:scale-95 shadow-2xs shrink-0"
            >
              <Plus className="w-4 h-4 text-slate-955 stroke-[2.5]" />
              <span>Post Sale</span>
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
                Recent Sell Listings
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
                ({sortedPosts.length} {sortedPosts.length === 1 ? "Listing" : "Listings"})
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
              <span>Post Sale</span>
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
                  No items listed in <span className="font-bold text-slate-800">{selectedCategory}</span> for {area} yet.
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
          defaultCategory={selectedCategory || "Plots & Real Estate"}
          defaultType="needs"
          defaultClassifiedType="SELL"
        />
      )}
    </div>
  );
}
