"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useFirestore } from "@/hooks/use-firestore";
import ServiceCard from "@/components/cards/ServiceCard";
import { ServiceProviderPost } from "@/types";
import { Plus, Loader2, Wrench, ArrowUpDown } from "lucide-react";
import { SERVICE_CATEGORIES } from "@/lib/constants";

const SAMPLE_POSTS: ServiceProviderPost[] = [
  { id: "sv_elec", userId: "sample", name: "Senthil Kumar — Home Electrician", skill_category: "Electrician", experience: "8+ Years", area_tag: "Tanjore Town (General)", phone: "9876543220", rating: 4.9, description: "Expert house wiring, DB box installation, inverter assembly, three-phase connections.", is_verified: true, created_at: new Date() as any },
  { id: "sv_plumb", userId: "sample", name: "Rajesh K — Expert Plumber", skill_category: "Plumber", experience: "6+ Years", area_tag: "Medical College Road", phone: "9876543221", rating: 4.8, description: "Pipe fitting, water tank washing, Kaveri line tap connections, motor pump installation.", is_verified: true, created_at: new Date() as any },
  { id: "sv_ac", userId: "sample", name: "Muthu Cool Tech — AC & Fridge", skill_category: "AC & Fridge Repair", experience: "7+ Years", area_tag: "Old Bus Stand", phone: "9876543222", rating: 4.9, description: "Split AC gas filling, deep foam wash, refrigerator compressor repairs.", is_verified: true, created_at: new Date() as any },
  { id: "sv_carp", userId: "sample", name: "Venu Gopal — Wood Architect", skill_category: "Carpenter", experience: "10+ Years", area_tag: "South Rampart (Thenkeezh Street)", phone: "9876543223", rating: 5.0, description: "Modular kitchen woodworks, door laminations, bespoke wardrobes & furniture.", is_verified: true, created_at: new Date() as any },
  { id: "sv_paint", userId: "sample", name: "Murugan Professional Painters", skill_category: "Painter", experience: "12+ Years", area_tag: "Vallam", phone: "9876543224", rating: 4.8, description: "Interior & exterior wall painting, waterproof putty, Asian Paints wall texture.", is_verified: true, created_at: new Date() as any },
];

export default function ServicesClientPage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [sortBy, setSortBy] = useState<"recent" | "rating" | "name">("recent");

  const { data: firestorePosts, loading } = useFirestore<ServiceProviderPost>({
    collectionName: "services",
    areaTag: "All Areas",
    category: "All",
  });

  const filteredPosts = React.useMemo(() => {
    const ids = new Set((firestorePosts || []).map((p) => p.id));
    const seeds = SAMPLE_POSTS.filter((p) => !ids.has(p.id));
    let list = [...seeds, ...(firestorePosts || [])];

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

      {/* Hero Banner */}
      <div className="relative w-full min-h-[120px] rounded-xl overflow-hidden bg-slate-950 text-white flex items-center px-5 sm:px-8 py-5 shadow-2xs mt-2">
        <img src="/thanjavur_temple_illustration.png" alt="Services" className="absolute right-0 top-0 h-full w-1/2 object-cover opacity-20 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-transparent" />
        <div className="relative z-10 flex flex-col gap-1 max-w-lg">
          <span className="bg-emerald-600 text-white font-bold text-[10px] px-2 py-0.5 rounded-md uppercase tracking-wider w-fit">Verified Tradespeople</span>
          <h1 className="font-heading font-bold text-lg sm:text-xl text-white">Local Skilled Services</h1>
          <p className="text-xs text-slate-300">Electricians, plumbers, carpenters & technicians in Thanjavur.</p>
        </div>
      </div>

      {/* TIER 1: STICKY TITLE BAR (100% FLUSH TO 56PX HEADER WITH 0 TOP GAP) */}
      <div className="sticky top-14 z-40 bg-white border-b border-slate-200 py-3 mb-3 flex items-center justify-between gap-2 shadow-2xs">
        <h2 className="font-heading font-bold text-base text-slate-900 tracking-tight">
          Skilled Services
        </h2>
        <button
          onClick={() => router.push("/post/service")}
          className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition-all border border-emerald-500 cursor-pointer shadow-2xs"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Add Service</span>
        </button>
      </div>

      {/* TIER 2: NATURAL SCROLL FILTER BAR */}
      <div className="py-1.5 flex items-center justify-between gap-2 bg-white">
        {/* Category Dropdown (Far Left) */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="text-xs font-semibold bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 focus:outline-none cursor-pointer"
        >
          <option value="All">All Services</option>
          {SERVICE_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        {/* Sort By Dropdown (Far Right) */}
        <div className="flex items-center gap-1">
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-xs font-semibold bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 focus:outline-none cursor-pointer"
          >
            <option value="recent">Recently Added</option>
            <option value="rating">Highest Rated</option>
            <option value="name">Name (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Feed */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 text-emerald-600 animate-spin" /></div>
      ) : filteredPosts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-2 text-center">
          <Wrench className="w-8 h-8 text-slate-300" />
          <p className="text-sm font-bold text-slate-500">No service providers listed yet.</p>
          <button onClick={() => router.push("/post/service")} className="bg-emerald-600 text-white font-bold text-xs px-4 py-2 rounded-lg border border-emerald-500 hover:bg-emerald-500 transition-all cursor-pointer">+ Add Service</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPosts.map((post) => <ServiceCard key={post.id} post={post} />)}
        </div>
      )}
    </div>
  );
}
