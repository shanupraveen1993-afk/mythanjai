"use client";

import React, { useState } from "react";
import { useFirestore } from "@/hooks/use-firestore";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { NeedOrSalePost, ServiceProviderPost, ShopPost } from "@/types";
import { Plus, Loader2, Search, SlidersHorizontal, ArrowLeft } from "lucide-react";
import CreatePostModal from "@/components/modals/CreatePostModal";
import NeedCard from "@/components/cards/NeedCard";
import ServiceCard from "@/components/cards/ServiceCard";
import ShopCard from "@/components/cards/ShopCard";

// ─── Segment Config ──────────────────────────────────────────────────────────

type SegmentType = "sell" | "need" | "services" | "shops";

interface SegmentConfig {
  label: string;
  postLabel: string;
  collectionName: "needs_and_sales" | "services" | "shops";
  modalType: "needs" | "services" | "shops";
  classifiedType?: "SELL" | "NEED";
  subCategories: string[];
  emptyMessage: string;
  heroTitle: string;
  heroSubtitle: string;
  heroBadge: string;
  heroImage: string;
  emptyIcon: string;
  accentColor: string;
}

const SEGMENT_CONFIG: Record<SegmentType, SegmentConfig> = {
  sell: {
    label: "Sell",
    postLabel: "Post Sale",
    collectionName: "needs_and_sales",
    modalType: "needs",
    classifiedType: "SELL",
    subCategories: ["Property Rental", "Plots & Real Estate", "Used Vehicles", "Electronics & Mobiles", "Household Goods", "Jobs & Opportunities", "General Requirement"],
    emptyMessage: "No sell listings yet. Be the first to post!",
    heroTitle: "Buy & Sell in Thanjavur",
    heroSubtitle: "Real estate plots in Vallam, 2 BHK rentals, bikes, cars & electronics — all directly from Thanjavur locals.",
    heroBadge: "Direct Marketplace",
    heroImage: "/thanjavur_temple_illustration.png",
    emptyIcon: "🛒",
    accentColor: "bg-orange-500",
  },
  need: {
    label: "Need",
    postLabel: "Post Requirement",
    collectionName: "needs_and_sales",
    modalType: "needs",
    classifiedType: "NEED",
    subCategories: ["Property Rental", "Plots & Real Estate", "Used Vehicles", "Electronics & Mobiles", "Household Goods", "Jobs & Opportunities", "General Requirement"],
    emptyMessage: "No requirements posted yet. Post what you need!",
    heroTitle: "Find What You Need",
    heroSubtitle: "Post your requirements — land, vehicles, electronics or rentals — and get connected with local sellers in Thanjavur.",
    heroBadge: "Buyer Requirements",
    heroImage: "/hero_building_visual.png",
    emptyIcon: "🔍",
    accentColor: "bg-blue-500",
  },
  services: {
    label: "Service",
    postLabel: "Post Service",
    collectionName: "services",
    modalType: "services",
    subCategories: ["Electrician", "Plumber", "AC & Fridge Repair", "Mechanic (Bike & Car)", "Carpenter", "Painter", "Cleaning & Housekeeping", "Catering & Cooking", "Driver", "General Technician"],
    emptyMessage: "No service providers listed yet. Register your trade!",
    heroTitle: "Local Skilled Services",
    heroSubtitle: "Find verified electricians, plumbers, carpenters, painters, AC technicians and more — available across Thanjavur.",
    heroBadge: "Verified Tradespeople",
    heroImage: "/thanjavur_temple_illustration.png",
    emptyIcon: "🔧",
    accentColor: "bg-green-600",
  },
  shops: {
    label: "Offer",
    postLabel: "Post Offer",
    collectionName: "shops",
    modalType: "shops",
    subCategories: ["Cafe & Restaurant", "Grocery & Supermarket", "Textiles & Readymades", "Gold & Jewelry", "Medical & Pharmacy", "Electronics & Mobiles", "Hardware & Electricals", "Automobile Showroom", "Education & Coaching", "General Store"],
    emptyMessage: "No offers listed yet. Add your store offer!",
    heroTitle: "Local Store Offers & Deals",
    heroSubtitle: "Grand opening discounts, festival sales, silk saree offers and cafe promotions — exclusively from Thanjavur stores.",
    heroBadge: "Store Discounts",
    heroImage: "/hero_building_visual.png",
    emptyIcon: "🏪",
    accentColor: "bg-purple-600",
  },
};

// ─── Sample Seed Data loaded from sampleData.ts ─────────────────────────────

interface CategoryFeedClientProps {
  segmentType: SegmentType;
}

export default function CategoryFeedClient({ segmentType }: CategoryFeedClientProps) {
  const router = useRouter();
  const config = SEGMENT_CONFIG[segmentType];
  const { user, profile, isVerified } = useAuth();
  const isAuthVerified = isVerified;

  // Always use All Areas — no URL query params (prevents Vercel RSC crash)
  const area: "All Areas" = "All Areas";

  // Pure client-side state — zero URL updates
  const [selectedSub, setSelectedSub] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"recent" | "price_low" | "price_high">("recent");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Firestore live data
  const { data: firestoreData, loading } = useFirestore<any>({
    collectionName: config.collectionName,
    areaTag: area,
    category: "All",
    postType: segmentType === "sell" ? "sale" : segmentType === "need" ? "need" : null,
  });



  // Pure Firestore live data feed
  const allPosts = React.useMemo(() => {
    return firestoreData || [];
  }, [firestoreData]);

  // Sub-category filter (client-side)
  const filteredBySub = React.useMemo(() => {
    if (!selectedSub) return allPosts;
    return allPosts.filter((p: any) => {
      const cat = (p.category || p.skill_category || "").toLowerCase();
      return cat === selectedSub.toLowerCase() || cat.includes(selectedSub.toLowerCase());
    });
  }, [allPosts, selectedSub]);

  // Search Filter & Active Status
  const filteredBySearch = React.useMemo(() => {
    let list = filteredBySub.filter((p: any) => {
      if (p.is_sold || p.is_inactive || p.is_expired || p.is_offline || p.status === "inactive") return false;
      return true;
    });

    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter((p: any) =>
      (p.title || p.name || p.shop_name || "").toLowerCase().includes(q) ||
      (p.description || p.offer_title || "").toLowerCase().includes(q) ||
      (p.category || p.skill_category || "").toLowerCase().includes(q) ||
      (p.area_tag || "").toLowerCase().includes(q)
    );
  }, [filteredBySub, searchQuery, profile, user]);

  // Sort
  const sortedPosts = React.useMemo(() => {
    const list = [...filteredBySearch];
    if (sortBy === "price_low") {
      list.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
    } else if (sortBy === "price_high") {
      list.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
    }
    return list;
  }, [filteredBySearch, sortBy]);

  // Card renderer per type
  const renderCard = (post: any, index: number) => {
    if (segmentType === "services") {
      return <ServiceCard post={post as ServiceProviderPost} />;
    } else if (segmentType === "shops") {
      return <ShopCard post={post as ShopPost} index={index} isGuest={!isVerified} />;
    }
    return <NeedCard post={post as NeedOrSalePost} />;
  };

  return (
    <div className="flex flex-col gap-0 mt-0 pb-24">
      {/* ── Hero Banner ──────────────────────────────── */}
      <div className="relative w-full min-h-[160px] sm:min-h-[200px] overflow-hidden bg-slate-950 text-white flex items-center px-6 sm:px-10 py-8">
        <img
          src={config.heroImage}
          alt={config.heroTitle}
          className="absolute right-0 top-0 h-full w-1/2 object-cover opacity-30 pointer-events-none"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent" />
        <div className="relative z-10 flex flex-col gap-2 max-w-lg">
          <span className="inline-block bg-[#FBBF24] text-[#0F172A] font-black text-xs px-2.5 py-0.5 rounded-full uppercase tracking-widest w-fit border-b border-[#D97706]">
            {config.heroBadge} · Thanjavur
          </span>
          <h1 className="font-heading font-black text-2xl sm:text-3xl text-white leading-tight">
            {config.heroTitle}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-sm">
            {config.heroSubtitle}
          </p>
        </div>
      </div>

      <div 
        className="bg-white/95 border-b border-slate-200/90 shadow-2xs px-4 sm:px-6 py-2.5 flex flex-col gap-2 transition-all"
      >
        {/* Row 1: Search + Sort + Post button */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder={`Search ${config.label}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoComplete="on"
              autoCorrect="on"
              spellCheck={true}
              autoCapitalize="sentences"
              className="w-full pl-8 pr-3 py-1.5 text-xs font-medium border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:border-slate-400 text-slate-800"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-xs font-black bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-800 focus:outline-none cursor-pointer shrink-0"
          >
            <option value="recent">Newest</option>
            <option value="price_low">Price ↑</option>
            <option value="price_high">Price ↓</option>
          </select>
          <button
            onClick={() => {
              if (!isAuthVerified) {
                if (typeof window !== "undefined") {
                  const target = segmentType === "sell" ? "/post/sell"
                    : segmentType === "need" ? "/post/need"
                    : segmentType === "services" ? "/post/service"
                    : "/post/offer";
                  localStorage.setItem("namma_thanjai_target_post_route", target);
                  window.dispatchEvent(new Event("namma_thanjai_open_signin"));
                }
                return;
              }
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1.5 btn-primary text-xs uppercase tracking-wider cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3] text-[#0F172A]" />
            <span className="hidden sm:inline">{config.postLabel}</span>
            <span className="sm:hidden">Post</span>
          </button>
        </div>

        {/* Row 2: Sub-category chip filters */}
        <div className="flex overflow-x-auto scrollbar-none gap-1.5 pb-0.5">
          <button
            onClick={() => setSelectedSub(null)}
            className={`shrink-0 text-xs font-black px-3 py-1 rounded-full border transition-all ${
              !selectedSub
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
            }`}
          >
            All
          </button>
          {config.subCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedSub(selectedSub === cat ? null : cat)}
              className={`shrink-0 text-xs font-black px-3 py-1 rounded-full border transition-all whitespace-nowrap ${
                selectedSub === cat
                  ? "bg-[#FBBF24] text-[#0F172A] border-b-2 border-[#D97706]"
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ── Results count ─────────────────────────────── */}
      <div className="px-4 sm:px-6 pt-3 pb-1 flex items-center justify-between">
        <span className="text-xs font-black text-slate-500 uppercase tracking-wider">
          {sortedPosts.length} {sortedPosts.length === 1 ? "result" : "results"}
          {selectedSub ? ` in "${selectedSub}"` : ""}
        </span>
        {selectedSub && (
          <button
            onClick={() => setSelectedSub(null)}
            className="text-xs font-black text-slate-500 hover:text-slate-900 transition-colors underline"
          >
            Clear filter
          </button>
        )}
      </div>

      {/* ── Feed ──────────────────────────────────────── */}
      <div className="px-4 sm:px-6 pt-2">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-yellow-500 animate-spin" />
          </div>
        ) : sortedPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <span className="text-5xl">{config.emptyIcon}</span>
            <div>
              <h3 className="font-heading font-black text-base text-slate-800">No listings found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-[220px] mx-auto">{config.emptyMessage}</p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="btn-primary text-xs px-5 py-2.5 uppercase tracking-wider cursor-pointer"
            >
              + {config.postLabel}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 md:gap-4 pb-4">
            {sortedPosts.map((post: any, index: number) => (
              <React.Fragment key={post.id}>
                <div className="transition-all duration-300">
                  {renderCard(post, index)}
                </div>
                {/* Crisp 100% Visible Light-Grey Separator Bar between post cards on Mobile App / APK */}
                {index < sortedPosts.length - 1 && (
                  <div className="block md:hidden h-2.5 bg-slate-200/90 border-y border-slate-300/80 w-full my-0" />
                )}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>

      {/* ── Create Post Modal (pre-filled to this segment) ── */}
      {isModalOpen && (
        <CreatePostModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          defaultType={config.modalType}
          defaultClassifiedType={config.classifiedType}
          defaultCategory={selectedSub || config.subCategories[0]}
        />
      )}
    </div>
  );
}
