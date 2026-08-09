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

  const handleCategorySelect = (category?: string | null) => {
    if (category && typeof category === "string") {
      setSelectedCategory(category);
      const params = new URLSearchParams(searchParams.toString());
      params.set("category", category);
      router.replace(`/sell?${params.toString()}`, { scroll: false });
    }
  };

  const handleClearCategory = () => {
    setSelectedCategory(null);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("category");
    const queryString = params.toString();
    router.replace(queryString ? `/sell?${queryString}` : "/sell", { scroll: false });
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

  // Client-side search and sort
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
      {/* Create Post Modal Component */}
      <CreatePostModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        defaultType="needs"
        defaultClassifiedType="SELL"
        defaultCategory={selectedCategory || "Plots & Real Estate"}
      />

      {/* HERO BANNER: Shown ONLY on Main Category Overview Page */}
      {!selectedCategory && (
        <div className="relative w-full min-h-[190px] sm:min-h-[210px] rounded-3xl overflow-hidden shadow-md border border-slate-800 bg-slate-950 text-white flex items-center p-6 sm:p-8">
          <img 
            src="/thanjavur_house_rental.png" 
            alt="Sell Listings Banner" 
            className="absolute right-0 top-0 h-full w-full sm:w-3/5 object-cover opacity-50 pointer-events-none"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-transparent pointer-events-none" />
          
          <div className="relative z-10 max-w-xl flex flex-col gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-400/10 border border-emerald-400/30 px-3 py-1 rounded-full w-fit">
              Verified Local Marketplace
            </span>
            <h1 className="font-heading font-black text-2xl sm:text-3xl text-white tracking-tight uppercase leading-tight">
              Buy & Sell In Thanjavur
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
              Explore plots for sale, house rentals, used bikes, cars, and electronics directly from local owners.
            </p>
          </div>
        </div>
      )}

      {/* CATEGORIES GRID OR LISTINGS FEED */}
      {!selectedCategory ? (
        <div className="flex flex-col gap-6">
          {/* 3-Column Compact Category Selection Grid */}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5 sm:gap-3.5">
            {CLASSIFIED_CATEGORIES.map((cat) => {
              const getVectorIcon = (categoryName: string) => {
                switch (categoryName) {
                  case "Property Rental": return <Home className="w-6 h-6 text-emerald-600" />;
                  case "Plots & Real Estate": return <Compass className="w-6 h-6 text-blue-600" />;
                  case "Used Vehicles": return <Car className="w-6 h-6 text-amber-600" />;
                  case "Electronics & Mobiles": return <Tv className="w-6 h-6 text-indigo-600" />;
                  case "Household Goods": return <ShoppingBag className="w-6 h-6 text-rose-600" />;
                  default: return <Tag className="w-6 h-6 text-slate-600" />;
                }
              };

              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => handleCategorySelect(cat)}
                  className="bg-white border border-slate-200 hover:border-slate-300 p-2.5 sm:p-3 rounded-2xl shadow-2xs text-left transition-all active:scale-[0.98] hover:shadow-xs flex flex-col gap-2.5 group w-full cursor-pointer overflow-hidden justify-between items-center"
                >
                  <div className="w-full h-12 sm:h-16 rounded-xl flex items-center justify-center bg-slate-100/80 group-hover:bg-slate-200/80 transition-colors border border-slate-200/50">
                    {getVectorIcon(cat)}
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

          {/* Horizontal Scrollable Preview Feed of Recent Listings */}
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedPosts.map((post) => (
              <div key={post.id} id={`post-${post.id}`} className="transition-all duration-500">
                <NeedCard post={post} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
