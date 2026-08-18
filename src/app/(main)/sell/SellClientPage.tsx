"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFirestore } from "@/hooks/use-firestore";
import ListingCard, { ListingItem } from "@/components/cards/ListingCard";
import { NeedOrSalePost } from "@/types";
import { Plus, ShoppingBag, Loader2, Filter, ArrowUpDown } from "lucide-react";
import { CLASSIFIED_CATEGORIES } from "@/lib/constants";
import { isListingQuarantined } from "@/lib/moderation";
import WebAppScrollFAB from "@/components/common/WebAppScrollFAB";
import CustomDropdown from "@/components/ui/CustomDropdown";

const SAMPLE_POSTS: NeedOrSalePost[] = [
  { id: "sl_cmda", userId: "sample", type: "SELL", raw_text: "2400 Sqft CMDA Approved Plot for sale near New Busstand, Thanjavur.", title: "2400 Sqft Plot near New Busstand", description: "CMDA approved residential land, 40ft tar road, clear title deeds, immediate registration.", category: "Plots & Real Estate", area_tag: "New Bus Stand", price: 3600000, phone: "9876543210", is_verified: true, image_url: "/hero_building_visual.png", created_at: new Date() as any, expires_at: new Date() as any },
  { id: "sl_splendor", userId: "sample", type: "SELL", raw_text: "Hero Splendor Plus 2022 model, 14000 km driven, single owner.", title: "Hero Splendor Plus (2022 Model)", description: "First owner, mint condition, 65 kmpl mileage, all service records available.", category: "Used Vehicles", area_tag: "Medical College Road", price: 62000, phone: "9876543211", is_verified: true, image_url: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=600&auto=format&fit=crop", created_at: new Date() as any, expires_at: new Date() as any },
  { id: "sl_iphone", userId: "sample", type: "SELL", raw_text: "iPhone 13 128GB Blue color with bill and box.", title: "iPhone 13 (128GB Blue)", description: "88% battery health, scratchless screen, box, original cable & invoice included.", category: "Electronics & Mobiles", area_tag: "Old Bus Stand", price: 38500, phone: "9876543212", is_verified: true, image_url: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&auto=format&fit=crop", created_at: new Date() as any, expires_at: new Date() as any },
  { id: "sl_teak", userId: "sample", type: "SELL", raw_text: "Teakwood 6 Seater Dining Table with Cushion Chairs.", title: "Teakwood 6-Seater Dining Set", description: "Pure Burma teakwood table with glass top and 6 cushioned matching chairs.", category: "Household Goods", area_tag: "Srinivasapuram", price: 24000, phone: "9876543213", is_verified: true, image_url: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&auto=format&fit=crop", created_at: new Date() as any, expires_at: new Date() as any },
];

import { useAuth } from "@/hooks/use-auth";

export default function SellClientPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState<"recent" | "price_low" | "price_high">("recent");
  const [localPosts, setLocalPosts] = useState<NeedOrSalePost[]>([]);

  const categoryOptions = React.useMemo(() => [
    { label: "All Categories (அனைத்தும்)", value: "All" },
    ...CLASSIFIED_CATEGORIES.map((cat) => ({ label: cat, value: cat })),
  ], []);

  const sortOptions = React.useMemo(() => [
    { label: "Recently Added", value: "recent" },
    { label: "Price: Low to High", value: "price_low" },
    { label: "Price: High to Low", value: "price_high" },
  ], []);

  const isAuthVerified = Boolean(profile?.isVerified || user);

  const handlePostItem = () => {
    if (!isAuthVerified) {
      if (typeof window !== "undefined") {
        sessionStorage.setItem("namma_thanjai_target_post_route", "/post/sell");
        window.dispatchEvent(new Event("namma_thanjai_open_signin"));
      }
      return;
    }
    router.push("/post/sell");
  };

  const { data: firestorePosts, loading } = useFirestore<NeedOrSalePost>({
    collectionName: "needs_and_sales",
    areaTag: "All Areas",
    category: "All",
  });

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("namma_thanjai_local_posts") || "[]");
      const sellPosts = stored.filter((p: any) => p.type?.toUpperCase() === "SELL");
      setLocalPosts(sellPosts);
    } catch (e) {}
  }, []);

  const filteredPosts = React.useMemo(() => {
    const ids = new Set([...(firestorePosts || []).map((p) => p.id), ...localPosts.map((p) => p.id)]);
    const seeds = SAMPLE_POSTS.filter((p) => !ids.has(p.id));
    let list = [...localPosts, ...seeds, ...(firestorePosts || [])];

    list = list.filter((p) => {
      if ((p as any).status === "moderation_review") return false;
      if (isListingQuarantined(p.id)) return false;
      return p.type?.toUpperCase() === "SELL";
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

  return (
    <div className="flex flex-col gap-3 pb-24 w-full font-sans">

      {/* 1. Hero Banner — Reduced top margin & Local Matchmaker tagline */}
      <div className="relative w-full min-h-[90px] rounded-2xl overflow-hidden bg-slate-950 text-white flex items-center px-4 sm:px-6 py-3.5 shadow-2xs mt-1">
        <img src="/thanjavur_temple_illustration.png" alt="Sell" className="absolute right-0 top-0 h-full w-1/2 object-cover opacity-20 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-transparent" />
        <div className="relative z-10 flex flex-col gap-1 max-w-xl">
          <span className="bg-[#FBBF24] text-[#0F172A] font-bold text-xs px-2.5 py-0.5 rounded-md tracking-wider w-fit">
            Local Marketplace • உள்ளூர் சந்தை
          </span>
          <h1 className="font-heading font-black text-lg sm:text-xl text-white tracking-tight">
            Find great items straight from people in our city. <span className="text-amber-400 block text-xs sm:text-sm font-extrabold mt-0.5">நம்ம ஊர் மக்களிடமிருந்து நேரடியாக வாங்குங்கள்.</span>
          </h1>
          <p className="text-xs text-slate-300 font-semibold leading-relaxed">
            CMDA plots, vehicles, electronics &amp; household goods directly from local Tanjore owners (0% brokerage).
          </p>
        </div>
      </div>

      {/* 2. TITLE BAR */}
      <div className="py-2.5 flex items-center justify-between gap-3 w-full border-b border-slate-200/80">
        <h2 className="font-heading font-black text-lg sm:text-xl text-slate-900 tracking-tight">
          Items for Sale
        </h2>
      </div>

      {/* LISTING CONTAINER */}
      <div className="flex flex-col gap-3">
        {/* Category & Sort Custom Dropdown Controls */}
        <div className="py-1 flex items-center gap-2 sm:gap-3 bg-transparent w-full">
          {/* Category Dropdown */}
          <CustomDropdown
            options={categoryOptions}
            value={selectedCategory}
            onChange={(val) => setSelectedCategory(val)}
            icon={<Filter className="w-3.5 h-3.5" />}
            className="flex-1 max-w-[210px] sm:max-w-[250px]"
          />

          {/* Sort By Dropdown */}
          <CustomDropdown
            options={sortOptions}
            value={sortBy}
            onChange={(val) => setSortBy(val as any)}
            icon={<ArrowUpDown className="w-3.5 h-3.5" />}
            className="shrink-0"
          />
        </div>

      {/* Feed */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 text-amber-600 animate-spin" /></div>
      ) : filteredPosts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-2 text-center">
          <ShoppingBag className="w-8 h-8 text-slate-300" />
          <p className="text-sm font-bold text-slate-500">No items listed yet.</p>
          <button onClick={handlePostItem} className="btn-tertiary text-xs px-4 py-2 uppercase tracking-wider cursor-pointer">+ Post Item</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPosts.map((post) => (
            <ListingCard key={post.id} listing={post as unknown as ListingItem} />
          ))}
        </div>
      )}
      </div>

      {/* Web App Floating Action Button (FAB) on 2nd Screen Scroll */}
      <WebAppScrollFAB postRoute="/post/sell" label="Post Item" />
    </div>
  );
}
