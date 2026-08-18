"use client";

import React, { useState } from "react";
import { useFirestore } from "@/hooks/use-firestore";
import { useAuth } from "@/hooks/use-auth";
import { NeedOrSalePost, ServiceProviderPost, ShopPost } from "@/types";
import { Plus, Loader2, Search, SlidersHorizontal } from "lucide-react";
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

// ─── Sample Seed Data ─────────────────────────────────────────────────────────

const SELL_SAMPLES: NeedOrSalePost[] = [
  { id: "s_plot", userId: "sample", type: "SELL", title: "2400 Sqft CMDA Plot — Vallam", raw_text: "", description: "DTCP approved residential plot with 30ft road frontage. Ready to build.", category: "Plots & Real Estate", area_tag: "Vallam", price: "2450000", phone: "9876543210", is_verified: true, created_at: new Date() as any, expires_at: new Date(Date.now() + 30 * 86400000) as any },
  { id: "s_house", userId: "sample", type: "SELL", title: "2 BHK House for Rent", raw_text: "", description: "Modular kitchen, 2 bathrooms, 24/7 Kaveri water, car parking available.", category: "Property Rental", area_tag: "Medical College Road", price: "12500", phone: "9876543211", is_verified: true, created_at: new Date() as any, expires_at: new Date(Date.now() + 30 * 86400000) as any },
  { id: "s_bike", userId: "sample", type: "SELL", title: "Hero Splendor 2022 — Single Owner", raw_text: "", description: "65+ kmpl mileage, clean papers, original condition.", category: "Used Vehicles", area_tag: "New Bus Stand", price: "68000", phone: "9876543212", is_verified: true, created_at: new Date() as any, expires_at: new Date(Date.now() + 30 * 86400000) as any },
  { id: "s_iphone", userId: "sample", type: "SELL", title: "iPhone 13 128GB Blue", raw_text: "", description: "Mint condition, original box, charger & bill available.", category: "Electronics & Mobiles", area_tag: "Old Bus Stand", price: "42000", phone: "9876543213", is_verified: true, created_at: new Date() as any, expires_at: new Date(Date.now() + 30 * 86400000) as any },
  { id: "s_sofa", userId: "sample", type: "SELL", title: "Teakwood 5-Seater Sofa Set", raw_text: "", description: "Premium finish, comfortable cushions, well maintained.", category: "Household Goods", area_tag: "Karanthai", price: "18500", phone: "9876543214", is_verified: true, created_at: new Date() as any, expires_at: new Date(Date.now() + 30 * 86400000) as any },
];

const NEED_SAMPLES: NeedOrSalePost[] = [
  { id: "n_land", userId: "sample", type: "NEED", title: "Need 1-2 Acres Commercial Land", raw_text: "", description: "Main road facing land near New Bus Stand or Vallam for warehouse use.", category: "Plots & Real Estate", area_tag: "Vallam", price: "5000000", phone: "9876543215", is_verified: true, created_at: new Date() as any, expires_at: new Date(Date.now() + 30 * 86400000) as any },
  { id: "n_apt", userId: "sample", type: "NEED", title: "2 BHK Apartment near Medical College", raw_text: "", description: "Needed urgently. Budget ₹10,000/month. Preferred ground floor.", category: "Property Rental", area_tag: "Medical College Road", price: "10000", phone: "9876543216", is_verified: true, created_at: new Date() as any, expires_at: new Date(Date.now() + 30 * 86400000) as any },
  { id: "n_laptop", userId: "sample", type: "NEED", title: "Need Used Laptop under ₹25,000", raw_text: "", description: "i5 8th gen or above, 8GB RAM minimum, good battery backup.", category: "Electronics & Mobiles", area_tag: "Tanjore Town (General)", price: "25000", phone: "9876543217", is_verified: true, created_at: new Date() as any, expires_at: new Date(Date.now() + 30 * 86400000) as any },
  { id: "n_tractor", userId: "sample", type: "NEED", title: "Need Used Mini Tractor", raw_text: "", description: "For paddy field cultivation near Kumbakonam Road. Any brand.", category: "Used Vehicles", area_tag: "Vallam", price: "350000", phone: "9876543218", is_verified: true, created_at: new Date() as any, expires_at: new Date(Date.now() + 30 * 86400000) as any },
  { id: "n_cook", userId: "sample", type: "NEED", title: "Need Cook for Functions — Tanjore", raw_text: "", description: "Brahmin style catering needed for 200 guests marriage function.", category: "General Requirement", area_tag: "Tanjore Town (General)", price: "0", phone: "9876543219", is_verified: true, created_at: new Date() as any, expires_at: new Date(Date.now() + 30 * 86400000) as any },
];

const SERVICE_SAMPLES: ServiceProviderPost[] = [
  { id: "sv_elec", userId: "sample", name: "Senthil Kumar — Home Electrician", skill_category: "Electrician", experience: "8+ Years", area_tag: "Tanjore Town (General)", phone: "9876543220", rating: 4.9, description: "Expert house wiring, DB box installation, inverter assembly, three-phase connections.", is_verified: true, created_at: new Date() as any },
  { id: "sv_plumb", userId: "sample", name: "Rajesh K — Expert Plumber", skill_category: "Plumber", experience: "6+ Years", area_tag: "Medical College Road", phone: "9876543221", rating: 4.8, description: "Pipe fitting, water tank washing, Kaveri line tap connections, motor pump installation.", is_verified: true, created_at: new Date() as any },
  { id: "sv_ac", userId: "sample", name: "Muthu Cool Tech — AC & Fridge", skill_category: "AC & Fridge Repair", experience: "7+ Years", area_tag: "Old Bus Stand", phone: "9876543222", rating: 4.9, description: "Split AC gas filling, deep foam wash, refrigerator compressor repairs.", is_verified: true, created_at: new Date() as any },
  { id: "sv_carp", userId: "sample", name: "Venu Gopal — Wood Architect", skill_category: "Carpenter", experience: "10+ Years", area_tag: "South Rampart (Thenkeezh Street)", phone: "9876543223", rating: 5.0, description: "Modular kitchen woodworks, door laminations, bespoke wardrobes & furniture.", is_verified: true, created_at: new Date() as any },
  { id: "sv_paint", userId: "sample", name: "Murugan Professional Painters", skill_category: "Painter", experience: "12+ Years", area_tag: "Vallam", phone: "9876543224", rating: 4.8, description: "Interior & exterior wall painting, waterproof putty, Asian Paints wall texture.", is_verified: true, created_at: new Date() as any },
];

const SHOP_SAMPLES: ShopPost[] = [
  { id: "sh_glen", userId: "sample", shop_name: "GLEN Exclusive Gallery", category: "Electronics & Mobiles", address_text: "New Busstand Road, Thanjavur", landmark: "Near New Bus Stand", hours: "9:30 AM – 9 PM", phone: "9876543225", area_tag: "New Bus Stand", offer_title: "Up to 60% OFF — Grand Opening Sale", offer_description: "Massive discounts on kitchen chimneys, hobs, cooktops & gas stoves.", image_url: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=600&auto=format&fit=crop", latitude: 10.7852, longitude: 79.1162, is_claimed: true, created_at: new Date() as any },
  { id: "sh_coffee", userId: "sample", shop_name: "Tanjore Degree Coffee & Sweets", category: "Cafe & Restaurant", address_text: "South Rampart Road, Tanjore Town", landmark: "Near Big Temple South Gate", hours: "6 AM – 10 PM", phone: "9876543226", area_tag: "South Rampart (Thenkeezh Street)", offer_title: "Free Filter Coffee with Halwa Purchase", offer_description: "1 complimentary brass tumbler filter coffee on purchasing 250g Tirunelveli Halwa.", image_url: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop", latitude: 10.7858, longitude: 79.1285, is_claimed: true, created_at: new Date() as any },
  { id: "sh_silk", userId: "sample", shop_name: "Thanjavur Silk Handloom House", category: "Textiles & Readymades", address_text: "Karanthai Main Road, Thanjavur", landmark: "Opposite Karandhai Tamil Sangam", hours: "9 AM – 9 PM", phone: "9876543227", area_tag: "Karanthai", offer_title: "Flat 25% OFF Wedding Pure Zari Silks", offer_description: "Direct handloom weavers price. Flat 25% off Kanchipuram & Thanjavur pure silk sarees.", image_url: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&auto=format&fit=crop", latitude: 10.8095, longitude: 79.1415, is_claimed: true, created_at: new Date() as any },
  { id: "sh_gold", userId: "sample", shop_name: "Ponniyin Selvan Gold Palace", category: "Gold & Jewelry", address_text: "Gandhiji Road, Thanjavur", landmark: "Near Old Bus Stand Signal", hours: "10 AM – 8 PM", phone: "9876543228", area_tag: "Gandhiji Road", offer_title: "Zero Making Charges — Akshaya Tritiya", offer_description: "Zero wastage zero making charge on all 916 hallmark gold jewellery today.", image_url: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&auto=format&fit=crop", latitude: 10.7892, longitude: 79.1388, is_claimed: true, created_at: new Date() as any },
  { id: "sh_pharma", userId: "sample", shop_name: "Sri Murugan Medical & Pharmacy", category: "Medical & Pharmacy", address_text: "Medical College Road, Thanjavur", landmark: "Opposite MGMGH Gate", hours: "8 AM – 10 PM", phone: "9876543229", area_tag: "Medical College Road", offer_title: "15% OFF on Generic Medicines", offer_description: "Flat 15% discount on all Jan Aushadhi generic medicines available stock.", image_url: "https://images.unsplash.com/photo-1586015555751-63c2057d59b2?w=600&auto=format&fit=crop", latitude: 10.7601, longitude: 79.1135, is_claimed: true, created_at: new Date() as any },
];

// ─── Main Component ───────────────────────────────────────────────────────────

interface CategoryFeedClientProps {
  segmentType: SegmentType;
}

export default function CategoryFeedClient({ segmentType }: CategoryFeedClientProps) {
  const config = SEGMENT_CONFIG[segmentType];
  const { user, profile } = useAuth();
  const isAuthVerified = Boolean(profile?.isVerified || user);

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

  // Seed samples based on type
  const seedSamples: any[] = segmentType === "sell" ? SELL_SAMPLES
    : segmentType === "need" ? NEED_SAMPLES
    : segmentType === "services" ? SERVICE_SAMPLES
    : SHOP_SAMPLES;

  // Merge seed + Firestore, deduplicate
  const allPosts = React.useMemo(() => {
    const firestoreIds = new Set((firestoreData || []).map((p: any) => p.id));
    const nonDupSeeds = seedSamples.filter(s => !firestoreIds.has(s.id));
    return [...nonDupSeeds, ...(firestoreData || [])];
  }, [firestoreData, seedSamples]);

  // Sub-category filter (client-side)
  const filteredBySub = React.useMemo(() => {
    if (!selectedSub) return allPosts;
    return allPosts.filter((p: any) => {
      const cat = (p.category || p.skill_category || "").toLowerCase();
      return cat === selectedSub.toLowerCase() || cat.includes(selectedSub.toLowerCase());
    });
  }, [allPosts, selectedSub]);

  // Search filter
  const filteredBySearch = React.useMemo(() => {
    if (!searchQuery.trim()) return filteredBySub;
    const q = searchQuery.toLowerCase();
    return filteredBySub.filter((p: any) =>
      (p.title || p.name || p.shop_name || "").toLowerCase().includes(q) ||
      (p.description || p.offer_title || "").toLowerCase().includes(q) ||
      (p.category || p.skill_category || "").toLowerCase().includes(q) ||
      (p.area_tag || "").toLowerCase().includes(q)
    );
  }, [filteredBySub, searchQuery]);

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
      return <ShopCard post={post as ShopPost} index={index} isGuest={!user} />;
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
            {sortedPosts.map((post: any, index: number) => (
              <div key={post.id} className="transition-all duration-300">
                {renderCard(post, index)}
              </div>
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
