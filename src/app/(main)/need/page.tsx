"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useFirestore } from "@/hooks/use-firestore";
import NeedCard from "@/components/cards/NeedCard";
import { CLASSIFIED_CATEGORIES, TANJORE_LOCALITIES, TanjoreLocality, CATEGORY_ILLUSTRATIONS } from "@/lib/constants";
import { NeedOrSalePost } from "@/types";
import { Search, Plus, ChevronUp, ChevronDown, Loader2, ArrowRight, ArrowLeft, Tag, FileText, Upload, Calendar, Share2, Home, Car, Tv, Compass, Check, MapPin } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import confetti from "canvas-confetti";
import { useAuth } from "@/hooks/use-auth";

export default function NeedPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, profile, loading } = useAuth();
  
  const area = (searchParams.get("area") || "All Areas") as TanjoreLocality | "All Areas";
  const selectedCategory = searchParams.get("category") || null;
  const searchQuery = searchParams.get("query") || "";

  // Dedicated Need Channel (Type = NEED)
  const activeType = "need";

  // Inline Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formArea, setFormArea] = useState("");
  
  const [uploading, setUploading] = useState(false);
  const [sortBy, setSortBy] = useState<"recent" | "price_low" | "price_high">("recent");

  // Seed initial sample Need requirement posts
  const [localPosts, setLocalPosts] = useState<NeedOrSalePost[]>([
    {
      id: "need_3bhk_medical",
      userId: "sample_user_4",
      type: "NEED",
      title: "Looking for 3 BHK House in Medical College Rd",
      raw_text: "Looking for 3 BHK House in Medical College Rd",
      description: "Doctor family searching for clean 3 BHK house with covered car parking and 24/7 Kaveri water connection.",
      category: "Property Rental",
      area_tag: "Medical College Rd",
      price: "18000",
      phone: "9876543213",
      image_url: "/hero_building_visual.png",
      is_verified: true,
      created_at: new Date() as any,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) as any,
    },
    {
      id: "need_goods_auto",
      userId: "sample_user_5",
      type: "NEED",
      title: "Need Commercial Goods Auto / Mini Truck",
      raw_text: "Need Commercial Goods Auto / Mini Truck",
      description: "Required used 3-wheeler goods autorickshaw or Tata Ace in good running condition with valid FC near New Bus Stand.",
      category: "Used Vehicles",
      area_tag: "New Bus Stand",
      price: "120000",
      phone: "9876543214",
      image_url: "/namma_thanjai_logo.png",
      is_verified: true,
      created_at: new Date() as any,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) as any,
    },
    {
      id: "need_accountant",
      userId: "sample_user_6",
      type: "NEED",
      title: "Hiring Full-Time Accountant for Retail Store",
      raw_text: "Hiring Full-Time Accountant for Retail Store",
      description: "Hiring accountant experienced in Tally Prime, GST filing, and daily ledger management in Gandhiji Road.",
      category: "Jobs & Opportunities",
      area_tag: "Gandhiji Road",
      price: "18000",
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

  const handleCategorySelect = (category: string) => {
    const currentParams = new URLSearchParams(searchParams.toString());
    currentParams.set("category", category);
    router.push(`/need?${currentParams.toString()}`);
  };

  const handleClearCategory = () => {
    const currentParams = new URLSearchParams(searchParams.toString());
    currentParams.delete("category");
    router.push(`/need?${currentParams.toString()}`);
  };

  // Combine real Firestore posts with local test fallback posts
  const allPosts = React.useMemo(() => {
    const activeLocal = localPosts.filter(p => {
      const pType = p.type.toLowerCase();
      const matchType = pType === "need" || pType === "buy";
      const matchCategory = !selectedCategory || p.category === selectedCategory;
      return matchType && matchCategory;
    });
    return [...activeLocal, ...(posts || []).filter(p => p.type?.toLowerCase() === "need" || p.type?.toLowerCase() === "buy")];
  }, [localPosts, posts, selectedCategory]);

  // Filter posts locally if there's a search query
  const filteredPosts = allPosts.filter((post: NeedOrSalePost) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const titleMatch = post.title?.toLowerCase().includes(query);
    const descMatch = post.description?.toLowerCase().includes(query);
    const textMatch = post.raw_text?.toLowerCase().includes(query);
    return titleMatch || descMatch || textMatch;
  });

  // Client-side sorting
  const sortedPosts = [...filteredPosts].sort((a, b) => {
    if (targetPostId) {
      if (a.id === targetPostId) return -1;
      if (b.id === targetPostId) return 1;
    }
    if (sortBy === "price_low") {
      return (Number(a.price) || 0) - (Number(b.price) || 0);
    }
    if (sortBy === "price_high") {
      return (Number(b.price) || 0) - (Number(a.price) || 0);
    }
    const timeA = a.created_at?.seconds || 0;
    const timeB = b.created_at?.seconds || 0;
    return timeB - timeA;
  });

  return (
    <div className="flex flex-col gap-6 mt-4 md:mt-6 pt-2 pb-12 max-w-7xl mx-auto px-4 sm:px-6">
      {/* HERO ILLUSTRATION BANNER */}
      <div className="relative w-full min-h-[210px] sm:min-h-[220px] rounded-3xl overflow-hidden shadow-lg border border-slate-800 bg-slate-950 text-white flex items-center p-6 sm:p-8">
        <img 
          src="/thanjavur_hero_banner.png" 
          alt="Need Requirements Banner" 
          className="absolute right-0 top-0 h-full w-full sm:w-3/5 object-cover opacity-50 pointer-events-none"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-transparent pointer-events-none" />
        
        <div className="relative z-10 max-w-xl flex flex-col gap-2.5">
          <span className="text-[10px] font-black uppercase tracking-widest text-yellow-400 bg-yellow-400/10 border border-yellow-400/30 px-3 py-1 rounded-full w-fit">
            Wanted & Requirements
          </span>
          <h1 className="font-heading font-black text-2xl sm:text-3xl md:text-4xl text-white tracking-tight uppercase leading-tight">
            Looking For In Thanjavur
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
            Post and search buyer requirements, job openings, wanted houses for rent, and local services needed.
          </p>
        </div>
      </div>

      {/* UNIVERSAL STICKY ACTION BAR: Sort on Left | Post Need on Right */}
      <div className="sticky top-[57px] z-30 bg-white/95 backdrop-blur-md py-2.5 px-4 border border-slate-200/90 rounded-none shadow-xs flex items-center justify-between">
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="text-xs font-black bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none cursor-pointer shrink-0"
        >
          <option value="recent">Latest First</option>
          <option value="price_low">Budget: Low to High</option>
          <option value="price_high">Budget: High to Low</option>
        </select>

        <button
          onClick={() => {
            if (!profile?.isVerified) {
              router.push("/need?auth=popup");
            } else {
              setIsFormOpen(!isFormOpen);
            }
          }}
          className="flex items-center gap-1.5 bg-yellow-500 hover:bg-yellow-600 text-slate-955 font-black px-4 py-2 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer border border-yellow-400 active:scale-95 shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4 text-slate-955 stroke-[2.5]" />
          <span>Post Need</span>
        </button>
      </div>



      {/* CATEGORIES SELECTION */}
      {!selectedCategory ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {CLASSIFIED_CATEGORIES.map((cat) => {
            const illustration = CATEGORY_ILLUSTRATIONS[cat] || "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=600&auto=format&fit=crop";
            return (
              <button
                key={cat}
                onClick={() => handleCategorySelect(cat)}
                className="bg-white border border-slate-200 hover:border-slate-400 p-3.5 rounded-2xl shadow-2xs text-left transition-all active:scale-[0.98] hover:shadow-md flex flex-col gap-3 group w-full cursor-pointer overflow-hidden aspect-square justify-between"
              >
                <div className="w-full h-32 rounded-xl overflow-hidden relative bg-slate-100 border border-slate-100">
                  <img
                    src={illustration}
                    alt={cat}
                    className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-300"
                  />
                </div>
                <div>
                  <span className="text-xs font-black text-slate-900 block group-hover:text-slate-700 transition-colors line-clamp-1">
                    {cat}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 block mt-0.5">Explore Need →</span>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        /* LISTINGS FEED */
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between bg-slate-100 p-2.5 rounded-xl border border-slate-200">
            <span className="text-xs font-black text-slate-800">
              Category: {selectedCategory}
            </span>
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
