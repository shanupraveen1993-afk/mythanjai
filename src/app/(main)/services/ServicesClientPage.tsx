"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useFirestore } from "@/hooks/use-firestore";
import ServiceCard from "@/components/cards/ServiceCard";
import { ServiceProviderPost } from "@/types";
import { Plus, Loader2, Wrench } from "lucide-react";
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
    return list;
  }, [firestorePosts, selectedCategory]);

  return (
    <div className="flex flex-col gap-4 mt-3 pb-24 w-full">

      {/* Hero */}
      <div className="relative w-full min-h-[160px] sm:min-h-[200px] rounded-3xl overflow-hidden bg-slate-950 text-white flex items-center px-6 sm:px-10 py-8 shadow-md">
        <img src="/thanjavur_temple_illustration.png" alt="Services" className="absolute right-0 top-0 h-full w-1/2 object-cover opacity-25 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent" />
        <div className="relative z-10 flex flex-col gap-2 max-w-lg">
          <span className="bg-green-600 text-white font-black text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-widest w-fit">Verified Tradespeople · Thanjavur</span>
          <h1 className="font-heading font-black text-2xl sm:text-3xl text-white leading-tight">Local Skilled Services</h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-sm">Verified electricians, plumbers, carpenters, painters & AC technicians available across Thanjavur.</p>
        </div>
      </div>

      {/* Control Bar */}
      <div className="sticky top-[57px] z-30 bg-white border-b border-slate-200 py-2.5 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs font-black bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none cursor-pointer shadow-sm"
          >
            <option value="All">All Trade Services</option>
            {SERVICE_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <span className="text-xs font-black text-slate-500 uppercase tracking-wider hidden sm:inline">
            ({filteredPosts.length} Available)
          </span>
        </div>

        {/* Register Service Button */}
        <button
          onClick={() => router.push("/post/service")}
          className="flex items-center gap-1.5 bg-green-600 hover:bg-green-500 active:scale-95 text-white font-black px-4 py-2 rounded-xl text-xs uppercase tracking-wider transition-all border border-green-500 shadow-sm cursor-pointer ml-auto"
        >
          <Plus className="w-3.5 h-3.5 stroke-[3]" /> Register Service
        </button>
      </div>

      {/* Feed */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 text-green-600 animate-spin" /></div>
      ) : filteredPosts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <Wrench className="w-8 h-8 text-slate-300" />
          <p className="text-sm font-black text-slate-500">
            {selectedCategory !== "All" ? `No technicians found for "${selectedCategory}"` : "No service providers listed yet."}
          </p>
          <button onClick={() => router.push("/post/service")} className="bg-green-600 text-white font-black text-xs px-5 py-2.5 rounded-xl border border-green-500 hover:bg-green-500 transition-all cursor-pointer">+ Register Service</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPosts.map((post) => <ServiceCard key={post.id} post={post} />)}
        </div>
      )}
    </div>
  );
}
