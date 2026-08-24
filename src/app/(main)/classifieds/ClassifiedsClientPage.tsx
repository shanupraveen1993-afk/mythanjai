"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useFirestore } from "@/hooks/use-firestore";
import NeedCard from "@/components/cards/NeedCard";
import { CLASSIFIED_CATEGORIES, TANJORE_LOCALITIES, TanjoreLocality, CATEGORY_ILLUSTRATIONS } from "@/lib/constants";
import { NeedOrSalePost } from "@/types";
import { MessageSquare, Plus, ChevronUp, ChevronDown, Loader2, ArrowRight, ArrowLeft, Tag, FileText, Search, Upload, Calendar, Share2, Home, Car, Tv, Compass, Check, MapPin, Sparkles } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/hooks/use-auth";
import { isListingQuarantined } from "@/lib/moderation";

export default function ClassifiedsClientPage() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [area, setArea] = useState<TanjoreLocality | "All Areas">("All Areas");
  const [searchQuery, setSearchQuery] = useState("");
  const [targetPostId, setTargetPostId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const rawCat = params.get("category");
      if (rawCat) {
        setSelectedCategory(decodeURIComponent(rawCat.replace(/\+/g, " ")));
      }
      setArea((params.get("area") || "All Areas") as TanjoreLocality | "All Areas");
      setSearchQuery(params.get("query") || "");
      setTargetPostId(params.get("post"));
    }
  }, []);

  const [activeType, setActiveType] = useState<"need" | "sale">("need");

  // Inline Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formType, setFormType] = useState<"need" | "sale">("need");
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formArea, setFormArea] = useState("");
  
  const [uploading, setUploading] = useState(false);
  const [sortBy, setSortBy] = useState<"recent" | "price_low" | "price_high">("recent");

  // Initial sample posts purged for clean 100% live user testing
  const [localPosts, setLocalPosts] = useState<NeedOrSalePost[]>([]);

  // Real-time Firestore Query subscription
  const { data: posts, loading: postsLoading } = useFirestore<NeedOrSalePost>({
    collectionName: "needs_and_sales",
    areaTag: area,
    category: selectedCategory || "All",
    postType: activeType,
  });

  const combinedPosts = React.useMemo(() => {
    const normSelected = (selectedCategory || "").toLowerCase().trim();
    const activeLocal = localPosts.filter((p) => {
      const pType = p.type?.toUpperCase();
      const targetType = activeType.toUpperCase();
      const matchType = !pType || pType === targetType || (targetType === "SALE" && pType === "SELL");
      const pCat = (p.category || "").toLowerCase().trim();
      const matchCat = !normSelected || pCat === normSelected || pCat.includes(normSelected) || normSelected.includes(pCat);
      return matchType && matchCat;
    });
    const list = [
      ...activeLocal,
      ...(posts || []).filter((p) => {
        const pType = p.type?.toUpperCase();
        const targetType = activeType.toUpperCase();
        return !pType || pType === targetType || (targetType === "SALE" && pType === "SELL");
      }),
    ];
    if (targetPostId) {
      list.sort((a, b) => {
        if (a.id === targetPostId) return -1;
        if (b.id === targetPostId) return 1;
        return 0;
      });
    }
    return list;
  }, [localPosts, posts, activeType, selectedCategory, targetPostId]);

  const handleCategorySelect = (category?: string | null) => {
    if (category && typeof category === "string") {
      setSelectedCategory(category);
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        params.set("category", category);
        router.replace(`/classifieds?${params.toString()}`, { scroll: false });
      }
    }
  };

  const handleClearCategory = () => {
    setSelectedCategory(null);
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      params.delete("category");
      const queryString = params.toString();
      router.replace(queryString ? `/classifieds?${queryString}` : "/classifieds", { scroll: false });
    }
  };

  // Filter posts by search query & moderation quarantine status
  const filteredPosts = React.useMemo(() => {
    return combinedPosts.filter((p) => {
      if ((p as any).status === "moderation_review" || isListingQuarantined(p.id)) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        p.title?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q) ||
        p.area_tag?.toLowerCase().includes(q)
      );
    });
  }, [combinedPosts, searchQuery]);

  return (
    <div className="flex flex-col gap-5 mt-3 md:mt-4 pt-1 pb-12 max-w-7xl mx-auto px-4 sm:px-6">
      {/* Active Category Title Bar */}
      {selectedCategory && (
        <div className="flex items-center justify-between bg-[#f0f2f5]/90 backdrop-blur-md py-2 -mx-4 px-4 sm:mx-0 sm:px-0 border-0">
          <div className="flex items-center gap-2">
            <span className="bg-[#FBBF24] text-[#0F172A] font-black text-xs px-2.5 py-1 rounded-xl shadow-2xs border-b border-[#D97706]">
              {selectedCategory}
            </span>
            <span className="text-xs text-slate-600 font-bold">
              ({filteredPosts.length} {filteredPosts.length === 1 ? "Listing" : "Listings"})
            </span>
          </div>
          <button
            onClick={handleClearCategory}
            className="text-xs font-black text-slate-700 hover:text-slate-900 bg-white border border-slate-200/80 px-3 py-1 rounded-xl shadow-2xs cursor-pointer hover:bg-slate-50 transition-colors"
          >
            ✕ All Categories
          </button>
        </div>
      )}

      {/* Posts Grid */}
      {postsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white border border-slate-200/60 rounded-2xl p-4 flex flex-col gap-3 animate-pulse">
              <div className="w-24 h-4 bg-slate-200 rounded-full" />
              <div className="w-full h-20 bg-slate-200 rounded-xl" />
            </div>
          ))}
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 bg-white border border-slate-200/60 rounded-2xl text-center gap-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200/80 text-slate-400">
            <MessageSquare className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h4 className="font-heading font-extrabold text-sm text-slate-800">No Posts Found</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-[220px] mx-auto leading-relaxed">
              No classifieds listed in <span className="font-bold text-slate-800">{selectedCategory || "All"}</span> for {area} yet.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPosts.map((post) => (
            <div key={post.id} id={`post-${post.id}`} className="transition-all duration-500">
              <NeedCard post={post} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
