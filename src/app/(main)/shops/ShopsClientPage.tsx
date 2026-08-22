"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFirestore } from "@/hooks/use-firestore";
import ShopCard from "@/components/cards/ShopCard";
import { ShopPost } from "@/types";
import { Plus, Loader2, Store, ArrowUpDown, UserCheck } from "lucide-react";
import { SHOP_CATEGORIES } from "@/lib/constants";
import CustomDropdown from "@/components/ui/CustomDropdown";
import { Filter } from "lucide-react";
import WebAppScrollFAB from "@/components/common/WebAppScrollFAB";
import { isListingQuarantined } from "@/lib/moderation";

const SAMPLE_POSTS: ShopPost[] = [];

import { useAuth } from "@/hooks/use-auth";

export default function ShopsClientPage() {
  const router = useRouter();
  const { user, profile, isVerified } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const categoryOptions = React.useMemo(() => [
    { label: "All Offers", value: "All" },
    ...SHOP_CATEGORIES.map((cat) => ({ label: cat, value: cat })),
  ], []);

  const isAuthVerified = isVerified;

  const handlePostOffer = () => {
    if (!isAuthVerified) {
      if (typeof window !== "undefined") {
        localStorage.setItem("namma_thanjai_target_post_route", "/post/offer");
        window.dispatchEvent(new Event("namma_thanjai_open_signin"));
      }
      return;
    }
    router.push("/post/offer");
  };
  const [sortBy, setSortBy] = useState<"recent" | "name">("recent");

  const { data: firestorePosts, loading } = useFirestore<ShopPost>({
    collectionName: "shops",
    areaTag: "All Areas",
    category: "All",
  });

  const [localPosts, setLocalPosts] = useState<ShopPost[]>([]);

  useEffect(() => {
    try {
      let stored = JSON.parse(localStorage.getItem("namma_thanjai_local_posts") || "[]");
      let shopPosts = stored.filter((p: any) => p.shop_name || p.offer_title || p.type === "OFFER" || p.type === "SHOP");

      if (shopPosts.length === 0) {
        const sampleSeed: any[] = [
          {
            id: "sample_shop_1",
            type: "OFFER",
            shop_name: "Tanjore Handloom Silks",
            offer_title: "Grand Opening — 25% Off All Kanchipuram & Handloom Silks",
            offer_description: "Exclusive grand inauguration offer! Get flat 25% discount on pure Zari silk sarees, wedding dhotis, and kids ethnic wear. Valid till Sunday.",
            category: "Textiles & Readymades",
            area_tag: "New Bus Stand",
            address_text: "12, Main Road, Near New Bus Stand, Thanjavur",
            phone: "+91 98765 43210",
            show_phone: true,
            hours: "9:30 AM - 9:00 PM",
            image_url: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop",
            video_url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
            created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
          },
          {
            id: "sample_shop_2",
            type: "OFFER",
            shop_name: "Kalyani Electronics",
            offer_title: "Flat ₹3,000 Instant Cashback on 55\" 4K Smart TVs",
            offer_description: "Upgrade your living room! Special cashback offer on Samsung, LG & Sony 4K Smart TVs with free doorstep installation & wall mount.",
            category: "Electronics & Mobiles",
            area_tag: "Medical College Road",
            address_text: "45, Medical College Road, Opp. Hospital Gate, Thanjavur",
            phone: "+91 98765 43210",
            show_phone: true,
            hours: "10:00 AM - 9:30 PM",
            image_url: "https://images.unsplash.com/photo-1593784991095-a205069470b6?w=800&auto=format&fit=crop",
            created_at: new Date(Date.now() - 3600000 * 6).toISOString(),
          },
          {
            id: "sample_shop_3",
            type: "OFFER",
            shop_name: "Royal Tanjore Biryani",
            offer_title: "Buy 1 Family Biryani Bucket & Get Free Chicken 65 Starter",
            offer_description: "Authentic Seeraga Samba Mutton & Chicken Biryani. Order 1 Family Bucket and receive 1 Free Chicken 65 starter + cold drinks. AC dining available.",
            category: "Cafe & Restaurant",
            area_tag: "South Rampart",
            address_text: "78, South Rampart, Near Old Bus Stand, Thanjavur",
            phone: "+91 98765 43210",
            show_phone: true,
            hours: "11:00 AM - 10:30 PM",
            image_url: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop",
            created_at: new Date(Date.now() - 3600000 * 14).toISOString(),
          },
          {
            id: "sample_shop_4",
            type: "OFFER",
            shop_name: "Sri Chakra Computers & Mobiles",
            offer_title: "Free Laptop Cleaning & Thermal Paste Service with OS Format",
            offer_description: "Monsoon laptop maintenance camp! Get 100% free internal cleaning and CPU thermal paste application with any software service or RAM upgrade.",
            category: "Electronics & Mobiles",
            area_tag: "Old Bus Stand",
            address_text: "22, Clock Tower Complex, Old Bus Stand, Thanjavur",
            phone: "+91 98765 43210",
            show_phone: true,
            hours: "9:00 AM - 8:30 PM",
            image_url: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&auto=format&fit=crop",
            created_at: new Date(Date.now() - 3600000 * 30).toISOString(),
          },
          {
            id: "sample_shop_5",
            type: "OFFER",
            shop_name: "Lakshmi Jewellery & Bullion",
            offer_title: "Zero Making Charges on Antique Gold Ornaments & Coins",
            offer_description: "Aadi festival gold celebration! Pay 0% making charges on 22K antique gold necklaces, bangles, and BIS hallmarked gold coins.",
            category: "Gold & Jewelry",
            area_tag: "Gandhiji Road",
            address_text: "105, Gandhiji Road, Near Big Temple Signal, Thanjavur",
            phone: "+91 98765 43210",
            show_phone: true,
            hours: "10:00 AM - 9:00 PM",
            image_url: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&auto=format&fit=crop",
            created_at: new Date(Date.now() - 3600000 * 50).toISOString(),
          },
        ];
        stored = [...sampleSeed, ...stored];
        localStorage.setItem("namma_thanjai_local_posts", JSON.stringify(stored));
        shopPosts = sampleSeed;
      }
      setLocalPosts(shopPosts);
    } catch (e) {}
  }, []);

  const filteredPosts = React.useMemo(() => {

    let list = [...localPosts, ...(firestorePosts || [])].filter((p) => {
      if ((p as any).status === "moderation_review") return false;
      return !isListingQuarantined(p.id);
    });

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
    <div className="flex flex-col gap-3 pb-24 w-full font-sans">

      {/* 1. Hero Banner — Clean Commercial Design (16px radius) */}
      <div className="relative w-full rounded-2xl overflow-hidden bg-[#0F172A] text-white flex items-center px-6 sm:px-8 py-7 sm:py-8 shadow-sm mt-2">
        <img src="/thanjavur_temple_illustration.png" alt="Shops" className="absolute right-0 top-0 h-full w-1/2 object-cover opacity-15 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0F172A] via-[#0F172A]/90 to-transparent" />
        <div className="relative z-10 flex flex-col gap-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-400/20 text-amber-300 font-bold text-xs px-3 py-1 rounded-md w-fit">
            <span>LOCAL STORE OFFERS</span>
            <span className="text-amber-400">•</span>
            <span>சலுகைகள்</span>
          </div>
          <h1 className="font-heading font-black text-xl sm:text-2xl text-white tracking-tight leading-snug">
            Local Store Deals &amp; Offers
            <span className="text-amber-400 block text-xs sm:text-base font-bold mt-1">நம்ம ஊர் கடைகளின் சிறப்பு தள்ளுபடிகள்.</span>
          </h1>
        </div>
      </div>

      {/* 2. TITLE BAR WITH ROYAL BLUE MY LISTINGS BUTTON */}
      <div className="py-2.5 flex items-center justify-between gap-3 w-full border-b border-slate-200/80">
        <h2 className="font-heading font-black text-base sm:text-lg text-slate-900 tracking-tight">
          Local Offer (சலுகைகள்)
        </h2>

        <button
          type="button"
          onClick={() => router.push("/profile?tab=my_posts")}
          className="text-[#1d4ed8] hover:text-blue-800 font-heading font-black text-xs hover:underline flex items-center gap-1 cursor-pointer transition-all active:scale-95 shrink-0"
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>My Listings →</span>
        </button>
      </div>

      {/* LISTING CONTAINER */}
      <div className="flex flex-col gap-3">

      {/* Feed */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 text-amber-600 animate-spin" /></div>
      ) : filteredPosts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-2 text-center">
          <Store className="w-8 h-8 text-slate-300" />
          <p className="text-sm font-bold text-slate-500">No store offers listed yet.</p>
          <button onClick={handlePostOffer} className="btn-tertiary text-xs px-4 py-2 uppercase tracking-wider cursor-pointer">+ Post Offer</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPosts.map((post, idx) => (
            <ShopCard key={post.id} post={post} index={idx} isGuest={!isAuthVerified} />
          ))}
        </div>
      )}
      </div>

    </div>
  );
}
