"use client";

import React, { useState, useEffect } from "react";
import nextDynamic from "next/dynamic";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import { useFirestore } from "@/hooks/use-firestore";
import ShopCard from "@/components/cards/ShopCard";
import { SHOP_CATEGORIES, TANJORE_LOCALITIES, TanjoreLocality, CATEGORY_ILLUSTRATIONS } from "@/lib/constants";
import { ShopPost } from "@/types";
import { Store, Plus, ChevronDown, ChevronUp, Loader2, ArrowRight, ArrowLeft, Upload, Compass, X, MapPin, Sparkles, Check, Calendar, Share2, MessageSquare, Video, Search, Utensils, ShoppingBag, Shirt, ShieldCheck, Tv, Car } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/hooks/use-auth";
import CreatePostModal from "@/components/modals/CreatePostModal";

// Locality coordinates centers to auto-coordinate map markers
const LOCALITY_COORDS: Record<string, { lat: number; lng: number }> = {
  "Tanjore Town (General)": { lat: 10.7870, lng: 79.1378 },
  "Big Temple Area": { lat: 10.7915, lng: 79.1305 },
  "Medical College Road": { lat: 10.7588, lng: 79.1092 },
  "New Bus Stand": { lat: 10.7852, lng: 79.1162 },
  "Old Bus Stand": { lat: 10.7905, lng: 79.1385 },
  "Vallam": { lat: 10.7161, lng: 79.0305 },
  "East Gate": { lat: 10.7955, lng: 79.1485 },
  "South Rampart": { lat: 10.7858, lng: 79.1285 },
  "Srinivasapuram": { lat: 10.7765, lng: 79.1315 },
  "Yagappa Nagar": { lat: 10.7688, lng: 79.1495 },
  "Pillaiyarpatti": { lat: 10.7551, lng: 79.0705 },
  "Karanthai": { lat: 10.8095, lng: 79.1415 },
  "Pookara Street": { lat: 10.7825, lng: 79.1445 },
  "Nanjikottai Road": { lat: 10.7495, lng: 79.1405 },
  "Vilar Road": { lat: 10.7585, lng: 79.1555 },
  "Ramanathan Hospital Area": { lat: 10.7785, lng: 79.1255 },
  "New Housing Unit": { lat: 10.7795, lng: 79.1125 },
  "Mariamman Kovil": { lat: 10.7935, lng: 79.1825 },
  "Sanjivi Nagar": { lat: 10.7635, lng: 79.1625 },
  "Manojipatti": { lat: 10.7485, lng: 79.0885 },
};

// Load LeafletMap client-side only
const LeafletMap = nextDynamic(() => import("@/components/maps/LeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-slate-105 animate-pulse flex items-center justify-center text-xs text-slate-550">
      Loading OpenStreetMap Assets...
    </div>
  ),
});

export default function ShopsClientPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, profile, loading } = useAuth();
  
  const area = (searchParams.get("area") || "All Areas") as TanjoreLocality | "All Areas";
  // Pure client-side state — NO URL query params for category (prevents Vercel RSC crash)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);


  const rawMapParam = searchParams.get("map");
  const mapShop = React.useMemo(() => {
    if (!rawMapParam) return null;
    try {
      return JSON.parse(decodeURIComponent(rawMapParam)) as ShopPost;
    } catch {
      return null;
    }
  }, [rawMapParam]);

  const CATEGORY_STOCK_IMAGES: Record<string, string> = {
    "Cafe & Restaurant": "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=400&q=80",
    "Grocery & Supermarket": "https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=400&q=80",
    "Textiles & Readymades": "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=400&q=80",
    "Gold & Jewelry": "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=400&q=80",
    "Electronics & Mobiles": "https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=400&q=80",
    "Others": "https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=400&q=80",
  };

  // Seed initial sample shops in local state
  const [localShops, setLocalShops] = useState<ShopPost[]>([
    {
      id: "glen_gallery",
      userId: "sample_user_shop1",
      shop_name: "GLEN EXCLUSIVE GALLERY",
      category: "Electronics & Mobiles",
      address_text: "New Busstand Road, Thanjavur",
      landmark: "Near New Bus Stand",
      hours: "9:30 AM - 9:00 PM",
      phone: "9876543216",
      area_tag: "New Busstand Rd",
      offer_title: "Up to 60% OFF - Grand Opening Sale",
      offer_description: "Grand Opening Sale! Up to 60% discount on all kitchen chimneys, built-in hobs, cooktops & gas stoves.",
      video_url: "/videos/glen_gallery_offer.mp4",
      image_url: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=600&auto=format&fit=crop",
      latitude: 10.7852,
      longitude: 79.1162,
      is_claimed: true,
      created_at: new Date() as any,
    },
    {
      id: "degree_coffee",
      userId: "sample_user_shop2",
      shop_name: "Tanjore Degree Coffee & Sweets",
      category: "Cafe & Restaurant",
      address_text: "South Rampart Road, Tanjore Town",
      landmark: "Near Big Temple South Gate",
      hours: "6:00 AM - 10:00 PM",
      phone: "9876543217",
      area_tag: "South Rampart",
      offer_title: "Free Filter Coffee with Special Halwa",
      offer_description: "Get 1 brass tumbler pure Kaveri milk filter coffee complimentary on purchasing 250g Tirunelveli Halwa.",
      image_url: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop",
      latitude: 10.7858,
      longitude: 79.1285,
      is_claimed: true,
      created_at: new Date() as any,
    },
    {
      id: "silk_saree_offer",
      userId: "sample_user_shop3",
      shop_name: "Thanjavur Silk Handloom Silks",
      category: "Textiles & Readymades",
      address_text: "Karanthai Main Road, Thanjavur",
      landmark: "Opposite Karandhai Tamil Sangam",
      hours: "9:00 AM - 9:00 PM",
      phone: "9876543218",
      area_tag: "Karanthai",
      offer_title: "Flat 25% OFF Wedding Pure Zari Silks",
      offer_description: "Direct handloom weavers discount! Flat 25% price reduction on Kanchipuram & Thanjavur pure silk sarees.",
      image_url: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&auto=format&fit=crop",
      latitude: 10.8095,
      longitude: 79.1415,
      is_claimed: true,
      created_at: new Date() as any,
    }
  ]);

  const { data: shops, loading: shopsLoading } = useFirestore<ShopPost>({
    collectionName: "shops",
    areaTag: area,
    category: selectedCategory || "All",
  });

  const combinedShops = React.useMemo(() => {
    const normSelected = (selectedCategory || "").toLowerCase().trim();
    const activeLocal = localShops.filter(s => {
      const sCat = (s.category || "").toLowerCase().trim();
      return !normSelected || sCat === normSelected || sCat.includes(normSelected) || normSelected.includes(sCat);
    });
    return [...activeLocal, ...(shops || [])];
  }, [localShops, shops, selectedCategory]);

  // Pure client-side category switching — zero URL updates, zero Vercel server re-fetch
  const handleCategorySelect = (category?: string | null) => {
    if (category && typeof category === "string") {
      setSelectedCategory(category);
    }
  };

  const handleClearCategory = () => {
    setSelectedCategory(null);
  };

  const searchQuery = searchParams.get("query") || "";

  // Filter shops by search query
  const filteredShops = React.useMemo(() => {
    return combinedShops.filter(s => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        s.shop_name?.toLowerCase().includes(q) ||
        s.offer_title?.toLowerCase().includes(q) ||
        s.category?.toLowerCase().includes(q) ||
        s.area_tag?.toLowerCase().includes(q)
      );
    });
  }, [combinedShops, searchQuery]);

  return (
    <div className="flex flex-col gap-5 mt-3 md:mt-4 pt-1 pb-12 max-w-7xl mx-auto px-4 sm:px-6">
      {/* HERO BANNER: Shown ONLY on Main Category Overview Page */}
      {!selectedCategory && (
        <div className="relative w-full min-h-[190px] sm:min-h-[210px] rounded-3xl overflow-hidden shadow-md border border-slate-800 bg-slate-955 text-white flex items-center p-6 sm:p-8">
          <img 
            src="/hero_building_visual.png" 
            alt="Local Offers Banner" 
            className="absolute right-0 top-0 h-full w-full sm:w-3/5 object-cover opacity-50 pointer-events-none"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-955 via-slate-955/90 to-transparent pointer-events-none" />
          
          <div className="relative z-10 flex flex-col gap-2.5 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="bg-yellow-500 text-slate-955 font-black text-[10px] sm:text-xs px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Store Discounts & Deals
              </span>
              <span className="text-[11px] text-slate-300 font-bold">
                Thanjavur District
              </span>
            </div>

            <h1 className="font-heading font-black text-2xl sm:text-3xl md:text-4xl text-white tracking-tight uppercase leading-tight">
              Exclusive Tanjore Store Offers
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed max-w-md">
              Discover grand opening discounts, video deals from Glen Gallery, silk saree handloom offers, and local cafe promotions.
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
                Select Store Category
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Choose a store category to view active discounts & video deals in Thanjavur
              </p>
            </div>

            <button
              onClick={() => setIsFormOpen(true)}
              className="flex items-center gap-1.5 bg-yellow-500 hover:bg-yellow-600 text-slate-955 font-black px-3.5 sm:px-4 py-2 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer border border-yellow-400 active:scale-95 shadow-2xs shrink-0"
            >
              <Plus className="w-4 h-4 text-slate-955 stroke-[2.5]" />
              <span>Post Offer</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 gap-3.5 sm:gap-4">
            {SHOP_CATEGORIES.map((cat) => {
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

          {/* Horizontal Scrollable Preview Feed of Recent Stores & Offers */}
          <div className="flex flex-col gap-3 pt-2 border-t border-slate-200/80">
            <div className="flex items-center justify-between">
              <h2 className="font-heading font-black text-sm sm:text-base text-slate-900 tracking-tight">
                Recent Local Offers
              </h2>
            </div>
            <div className="flex overflow-x-auto snap-x scrollbar-none gap-4 pb-2">
              {filteredShops.map((shop) => (
                <div 
                  key={shop.id} 
                  onClick={() => handleCategorySelect(shop.category)}
                  className="shrink-0 w-[280px] sm:w-[320px] snap-start cursor-pointer hover:scale-[1.01] transition-transform"
                >
                  <ShopCard post={shop} />
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* DIRECT OFFERS FEED & STICKY ACTION BAR */
        <div className="flex flex-col gap-4">
          {/* Active Category Title Bar */}
          <div className="flex items-center justify-between bg-slate-100/90 border border-slate-200/90 rounded-2xl p-3 shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="bg-yellow-500 text-slate-955 font-black text-xs px-2.5 py-1 rounded-xl shadow-2xs">
                {selectedCategory}
              </span>
              <span className="text-xs text-slate-600 font-bold">
                ({filteredShops.length} {filteredShops.length === 1 ? "Offer" : "Offers"})
              </span>
            </div>
            <button
              onClick={handleClearCategory}
              className="text-xs font-black text-slate-700 hover:text-slate-900 bg-white border border-slate-250 px-3 py-1 rounded-xl shadow-2xs cursor-pointer hover:bg-slate-50 transition-colors"
            >
              ✕ All Categories
            </button>
          </div>

          {/* Shops Grid */}
          {shopsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2].map((n) => (
                <div key={n} className="bg-white border border-slate-200/60 rounded-2xl p-4 flex flex-col gap-3 animate-pulse">
                  <div className="w-24 h-4 bg-slate-200 rounded-full" />
                  <div className="w-full h-20 bg-slate-200 rounded-xl" />
                </div>
              ))}
            </div>
          ) : filteredShops.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 bg-white border border-slate-200/60 rounded-2xl text-center gap-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200/80 text-slate-400">
                <Store className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h4 className="font-heading font-extrabold text-sm text-slate-800">No Store Offers Found</h4>
                <p className="text-[11px] text-slate-500 mt-1 max-w-[220px] mx-auto leading-relaxed">
                  No active store discounts listed in <span className="font-bold text-slate-800">{selectedCategory}</span> for {area} yet.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredShops.map((shop) => (
                <div key={shop.id} id={`post-${shop.id}`} className="transition-all duration-500">
                  <ShopCard post={shop} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Unified Create Post Modal — pre-set to Shops/Offers */}
      {isFormOpen && (
        <CreatePostModal
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          defaultType="shops"
          defaultCategory={selectedCategory || SHOP_CATEGORIES[0]}
        />
      )}
    </div>
  );
}
