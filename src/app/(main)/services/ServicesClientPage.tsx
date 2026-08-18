"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useFirestore } from "@/hooks/use-firestore";
import ServiceCard from "@/components/cards/ServiceCard";
import { ServiceProviderPost } from "@/types";
import { Plus, Loader2, Wrench, ArrowUpDown } from "lucide-react";
import { SERVICE_CATEGORIES } from "@/lib/constants";
import { isListingQuarantined } from "@/lib/moderation";

const SAMPLE_POSTS: ServiceProviderPost[] = [
  { id: "sv_elec", userId: "sample", name: "Senthil Kumar — Home Electrician", skill_category: "Electrician", experience: "8+ Years", area_tag: "Tanjore Town (General)", phone: "9876543220", rating: 4.9, description: "Expert house wiring, DB box installation, inverter assembly, three-phase connections.", is_verified: true, created_at: new Date() as any },
  { id: "sv_plumb", userId: "sample", name: "Rajesh K — Expert Plumber", skill_category: "Plumber", experience: "6+ Years", area_tag: "Medical College Road", phone: "9876543221", rating: 4.8, description: "Pipe fitting, water tank washing, Kaveri line tap connections, motor pump installation.", is_verified: true, created_at: new Date() as any },
  { id: "sv_ac", userId: "sample", name: "Muthu Cool Tech — AC & Fridge", skill_category: "AC & Fridge Repair", experience: "7+ Years", area_tag: "Old Bus Stand", phone: "9876543222", rating: 4.9, description: "Split AC gas filling, deep foam wash, refrigerator compressor repairs.", is_verified: true, created_at: new Date() as any },
  { id: "sv_carp", userId: "sample", name: "Venu Gopal — Wood Architect", skill_category: "Carpenter", experience: "10+ Years", area_tag: "South Rampart (Thenkeezh Street)", phone: "9876543223", rating: 5.0, description: "Modular kitchen woodworks, door laminations, bespoke wardrobes & furniture.", is_verified: true, created_at: new Date() as any },
  { id: "sv_paint", userId: "sample", name: "Murugan Professional Painters", skill_category: "Painter", experience: "12+ Years", area_tag: "Vallam", phone: "9876543224", rating: 4.8, description: "Interior & exterior wall painting, waterproof putty, Asian Paints wall texture.", is_verified: true, created_at: new Date() as any },
];

import { useAuth } from "@/hooks/use-auth";

export default function ServicesClientPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const isAuthVerified = Boolean(profile?.isVerified || user);

  const handlePostService = () => {
    if (!isAuthVerified) {
      if (typeof window !== "undefined") {
        sessionStorage.setItem("namma_thanjai_target_post_route", "/post/service");
        window.dispatchEvent(new Event("namma_thanjai_open_signin"));
      }
      return;
    }
    router.push("/post/service");
  };
  const [sortBy, setSortBy] = useState<"recent" | "rating" | "name">("recent");

  const { data: firestorePosts, loading } = useFirestore<ServiceProviderPost>({
    collectionName: "services",
    areaTag: "All Areas",
    category: "All",
  });

  const filteredPosts = React.useMemo(() => {
    let localPosts: ServiceProviderPost[] = [];
    if (typeof window !== "undefined") {
      try {
        const stored = JSON.parse(localStorage.getItem("namma_thanjai_local_posts") || "[]");
        localPosts = stored.filter((p: any) => p.name || p.skill_category);
      } catch (e) {}
    }

    const ids = new Set([...(firestorePosts || []).map((p) => p.id), ...localPosts.map((p) => p.id)]);
    const seeds = SAMPLE_POSTS.filter((p) => !ids.has(p.id));
    let list = [...localPosts, ...seeds, ...(firestorePosts || [])].filter((p) => {
      if ((p as any).status === "moderation_review") return false;
      return !isListingQuarantined(p.id);
    });

    if (selectedCategory !== "All") {
      list = list.filter(
        (p) => (p.skill_category || "").toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    if (sortBy === "rating") {
      list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortBy === "name") {
      list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    }
    return list;
  }, [firestorePosts, selectedCategory, sortBy]);

  return (
    <div className="flex flex-col gap-3 pb-24 w-full font-sans">

      {/* 1. Hero Banner */}
      <div className="relative w-full min-h-[120px] rounded-2xl overflow-hidden bg-slate-950 text-white flex items-center px-5 sm:px-8 py-5 shadow-2xs mt-2">
        <img src="/thanjavur_temple_illustration.png" alt="Services" className="absolute right-0 top-0 h-full w-1/2 object-cover opacity-20 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-transparent" />
        <div className="relative z-10 flex flex-col gap-1 max-w-lg">
          <span className="bg-[#FBBF24] text-[#0F172A] font-bold text-xs px-2 py-0.5 rounded-md tracking-wider w-fit border-b border-[#D97706]">Verified tradespeople</span>
          <h1 className="font-heading font-bold text-lg sm:text-xl text-white">Local Skilled Services</h1>
          <p className="text-xs text-slate-300">Electricians, plumbers, carpenters & technicians in Thanjavur.</p>
        </div>
      </div>

      {/* 2. TITLE & POST BAR */}
      <div className="py-3 flex items-center justify-between gap-3 w-full border-b border-slate-200/80">
        <h2 className="font-heading font-black text-lg sm:text-xl text-slate-900 tracking-tight">
          Skilled Services
        </h2>
        {/* PRIMARY GOLD POST BUTTON */}
        <button
          onClick={handlePostService}
          className="flex items-center gap-1.5 btn-primary text-xs px-4 py-2 uppercase tracking-wider cursor-pointer shrink-0"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5] text-[#0F172A]" />
          <span>Add Service</span>
        </button>
      </div>

      {/* LISTING CONTAINER */}
      <div className="flex flex-col gap-3">
        {/* Category & Sort Side-by-Side Filter Bar */}
        <div className="py-1 flex items-center gap-2 sm:gap-3 bg-transparent w-full">
          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="custom-select-arrow pr-8 pl-3.5 py-2 text-xs sm:text-sm font-bold bg-white border border-slate-300 rounded-xl shadow-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 cursor-pointer max-w-[170px] sm:max-w-[220px] truncate"
          >
            <option value="All">All Services</option>
            {SERVICE_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Sort By Dropdown (Side-by-Side directly next to Category) */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="custom-select-arrow pr-8 pl-3.5 py-2 text-xs sm:text-sm font-bold bg-white border border-slate-300 rounded-xl shadow-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 cursor-pointer shrink-0 font-bold text-slate-800"
          >
            <option value="recent">Recently Added</option>
            <option value="rating">Highest Rated</option>
            <option value="name">Name (A-Z)</option>
          </select>
        </div>

      {/* Feed */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 text-amber-600 animate-spin" /></div>
      ) : filteredPosts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-2 text-center">
          <Wrench className="w-8 h-8 text-slate-300" />
          <p className="text-sm font-bold text-slate-500">No service providers listed yet.</p>
          <button onClick={handlePostService} className="btn-primary text-xs px-4 py-2 uppercase tracking-wider cursor-pointer">+ Add Service</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPosts.map((post) => <ServiceCard key={post.id} post={post} />)}
        </div>
      )}
      </div>
    </div>
  );
}
