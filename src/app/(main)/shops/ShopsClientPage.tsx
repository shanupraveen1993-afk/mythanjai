"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useFirestore } from "@/hooks/use-firestore";
import ShopCard from "@/components/cards/ShopCard";
import { ShopPost } from "@/types";
import { Plus, Loader2, Store, ArrowUpDown } from "lucide-react";
import { SHOP_CATEGORIES } from "@/lib/constants";

const SAMPLE_POSTS: ShopPost[] = [
  { id: "sh_glen", userId: "sample", shop_name: "GLEN Exclusive Gallery", category: "Electronics & Mobiles", address_text: "New Busstand Road, Thanjavur", landmark: "Near New Bus Stand", hours: "9:30 AM – 9 PM", phone: "9876543225", area_tag: "New Bus Stand", offer_title: "Up to 60% OFF — Grand Opening Sale", offer_description: "Massive discounts on kitchen chimneys, hobs, cooktops & gas stoves.", image_url: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=600&auto=format&fit=crop", latitude: 10.7852, longitude: 79.1162, is_claimed: true, created_at: new Date() as any },
  { id: "sh_coffee", userId: "sample", shop_name: "Tanjore Degree Coffee & Sweets", category: "Cafe & Restaurant", address_text: "South Rampart Road, Tanjore Town", landmark: "Near Big Temple South Gate", hours: "6 AM – 10 PM", phone: "9876543226", area_tag: "South Rampart (Thenkeezh Street)", offer_title: "Free Filter Coffee with Halwa Purchase", offer_description: "1 complimentary brass tumbler filter coffee on purchasing 250g Tirunelveli Halwa.", image_url: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop", latitude: 10.7858, longitude: 79.1285, is_claimed: true, created_at: new Date() as any },
  { id: "sh_silk", userId: "sample", shop_name: "Thanjavur Silk Handloom House", category: "Textiles & Readymades", address_text: "Karanthai Main Road, Thanjavur", landmark: "Opposite Karandhai Tamil Sangam", hours: "9 AM – 9 PM", phone: "9876543227", area_tag: "Karanthai", offer_title: "Flat 25% OFF Wedding Pure Zari Silks", offer_description: "Direct handloom weavers price. Flat 25% off Kanchipuram & Thanjavur pure silk sarees.", image_url: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&auto=format&fit=crop", latitude: 10.8095, longitude: 79.1415, is_claimed: true, created_at: new Date() as any },
  { id: "sh_gold", userId: "sample", shop_name: "Ponniyin Selvan Gold Palace", category: "Gold & Jewelry", address_text: "Gandhiji Road, Thanjavur", landmark: "Near Old Bus Stand Signal", hours: "10 AM – 8 PM", phone: "9876543228", area_tag: "Gandhiji Road", offer_title: "Zero Making Charges — Akshaya Tritiya", offer_description: "Zero wastage zero making charge on all 916 hallmark gold jewellery today.", image_url: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&auto=format&fit=crop", latitude: 10.7892, longitude: 79.1388, is_claimed: true, created_at: new Date() as any },
  { id: "sh_pharma", userId: "sample", shop_name: "Sri Murugan Medical & Pharmacy", category: "Medical & Pharmacy", address_text: "Medical College Road, Thanjavur", landmark: "Opposite MGMGH Gate", hours: "8 AM – 10 PM", phone: "9876543229", area_tag: "Medical College Road", offer_title: "15% OFF on Generic Medicines", offer_description: "Flat 15% discount on all Jan Aushadhi generic medicines available stock.", image_url: "https://images.unsplash.com/photo-1586015555751-63c2057d59b2?w=600&auto=format&fit=crop", latitude: 10.7601, longitude: 79.1135, is_claimed: true, created_at: new Date() as any },
];

export default function ShopsClientPage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [sortBy, setSortBy] = useState<"recent" | "name">("recent");

  const { data: firestorePosts, loading } = useFirestore<ShopPost>({
    collectionName: "shops",
    areaTag: "All Areas",
    category: "All",
  });

  const filteredPosts = React.useMemo(() => {
    const ids = new Set((firestorePosts || []).map((p) => p.id));
    const seeds = SAMPLE_POSTS.filter((p) => !ids.has(p.id));
    let list = [...seeds, ...(firestorePosts || [])];

    if (selectedCategory !== "All") {
      list = list.filter(
        (p) => (p.category || "").toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    if (sortBy === "name") {
      list.sort((a, b) => (a.shop_name || "").localeCompare(b.shop_name || ""));
    }
    return list;
  }, [firestorePosts, selectedCategory, sortBy]);

  return (
    <div className="flex flex-col gap-4 mt-3 pb-24 w-full font-sans">

      {/* Hero Banner */}
      <div className="relative w-full min-h-[140px] sm:min-h-[180px] rounded-xl overflow-hidden bg-slate-950 text-white flex items-center px-6 sm:px-10 py-6 shadow-xs">
        <img src="/hero_building_visual.png" alt="Offers" className="absolute right-0 top-0 h-full w-1/2 object-cover opacity-25 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent" />
        <div className="relative z-10 flex flex-col gap-1.5 max-w-lg">
          <span className="bg-purple-600 text-white font-bold text-[10px] px-2.5 py-0.5 rounded-md uppercase tracking-wider w-fit">Store Discounts · Thanjavur</span>
          <h1 className="font-heading font-bold text-xl sm:text-2xl text-white leading-tight">Local Store Offers & Deals</h1>
          <p className="text-xs text-slate-300 leading-relaxed max-w-sm">Grand opening discounts, festival sales & handloom saree offers from Thanjavur stores.</p>
        </div>
      </div>

      {/* Natural Scrolling Control Bar (Category & Sort By) */}
      <div className="py-2 flex flex-wrap items-center justify-between gap-2.5 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs font-semibold bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 focus:outline-none cursor-pointer"
          >
            <option value="All">All Store Offers</option>
            {SHOP_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-1">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-xs font-semibold bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="recent">Recently Added</option>
              <option value="name">Store Name (A-Z)</option>
            </select>
          </div>

          <span className="text-xs font-medium text-slate-500 hidden sm:inline">
            ({filteredPosts.length} Active Offers)
          </span>
        </div>

        {/* Post Offer Button */}
        <button
          onClick={() => router.push("/post/offer")}
          className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold px-3.5 py-1.5 rounded-lg text-xs transition-all shadow-2xs cursor-pointer ml-auto"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" /> Post Offer
        </button>
      </div>

      {/* Feed */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 text-purple-600 animate-spin" /></div>
      ) : filteredPosts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <Store className="w-8 h-8 text-slate-300" />
          <p className="text-sm font-bold text-slate-500">
            {selectedCategory !== "All" ? `No store offers found in "${selectedCategory}"` : "No store offers listed yet."}
          </p>
          <button onClick={() => router.push("/post/offer")} className="bg-purple-600 text-white font-bold text-xs px-4 py-2 rounded-lg border border-purple-500 hover:bg-purple-500 transition-all cursor-pointer">+ Post Offer</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPosts.map((post) => <ShopCard key={post.id} post={post} />)}
        </div>
      )}
    </div>
  );
}
