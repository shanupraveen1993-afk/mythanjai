"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Package,
  Bookmark,
  Trash2,
  Loader2,
  Lock,
  Plus,
  ShoppingBag,
  ExternalLink,
  MessageSquare,
  Phone,
  Tag,
  MapPin,
  Clock,
  ArrowRight,
} from "lucide-react";
import { useToast } from "@/context/ToastContext";
import ListingCard, { ListingItem } from "@/components/cards/ListingCard";

export default function ListingsClientPage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-amber-500" /></div>}>
      <ListingsContent />
    </React.Suspense>
  );
}

function ListingsContent() {
  const { toast } = useToast();
  const { user, profile, isVerified, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams?.get("tab") === "saved" ? "saved" : "my_posts";

  const [activeTab, setActiveTab] = useState<"my_posts" | "saved">(initialTab);
  const [myPosts, setMyPosts] = useState<any[]>([]);
  const [savedPosts, setSavedPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Load My Posts & Saved Posts
  useEffect(() => {
    async function fetchListingsData() {
      if (!isVerified) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const userId = user?.uid || "user";
        const userPhone = profile?.phone || user?.phoneNumber || "";

        // Fetch My Posted Ads across collections
        let combinedMyPosts: any[] = [];
        const seenIds = new Set<string>();

        if (userId && userId !== "user") {
          const [salesSnap, needsSnap, servicesSnap, shopsSnap] = await Promise.all([
            getDocs(query(collection(db, "needs_and_sales"), where("userId", "==", userId))).catch(() => ({ docs: [] })),
            getDocs(query(collection(db, "needs_and_sales"), where("userId", "==", userId))).catch(() => ({ docs: [] })),
            getDocs(query(collection(db, "services"), where("userId", "==", userId))).catch(() => ({ docs: [] })),
            getDocs(query(collection(db, "shops"), where("userId", "==", userId))).catch(() => ({ docs: [] })),
          ]);

          [...salesSnap.docs, ...needsSnap.docs, ...servicesSnap.docs, ...shopsSnap.docs].forEach((docSnap) => {
            if (!seenIds.has(docSnap.id)) {
              seenIds.add(docSnap.id);
              combinedMyPosts.push({ id: docSnap.id, ...docSnap.data() });
            }
          });
        }

        // Add Local Posts
        try {
          const localStored = JSON.parse(localStorage.getItem("namma_thanjai_local_posts") || "[]");
          localStored.forEach((p: any) => {
            if (p.id && !seenIds.has(p.id)) {
              seenIds.add(p.id);
              combinedMyPosts.push(p);
            }
          });
        } catch (e) {}

        setMyPosts(combinedMyPosts);

        // Fetch Saved Posts IDs from localStorage
        try {
          const savedList: any[] = JSON.parse(localStorage.getItem("namma_thanjai_saved_posts") || "[]");
          setSavedPosts(savedList);
        } catch (e) {}
      } catch (err) {
        console.error("Error loading listings:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchListingsData();
  }, [user, profile, isVerified]);

  const handleDeletePost = async (postId: string, collectionName: string) => {
    if (!confirm("Are you sure you want to delete this listing?")) return;
    try {
      if (collectionName) {
        await deleteDoc(doc(db, collectionName, postId));
      }
      setMyPosts((prev) => prev.filter((p) => p.id !== postId));
      // Remove from local storage if present
      try {
        let local = JSON.parse(localStorage.getItem("namma_thanjai_local_posts") || "[]");
        local = local.filter((p: any) => p.id !== postId);
        localStorage.setItem("namma_thanjai_local_posts", JSON.stringify(local));
      } catch (e) {}

      toast.success("Listing removed successfully.");
    } catch (err) {
      toast.error("Could not delete listing.");
    }
  };

  // Guest State CTA
  if (!isVerified && !authLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 flex flex-col items-center text-center gap-4">
        <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 border border-amber-200">
          <Lock className="w-8 h-8 stroke-[2.5]" />
        </div>
        <h1 className="font-heading font-black text-xl sm:text-2xl text-slate-900">
          Sign In to Manage Your Listings &amp; Saved Ads
        </h1>
        <p className="text-sm font-bold text-slate-600 max-w-md">
          Track your posted ads, view buyer inquiries, and bookmark your favorite local deals in Thanjavur.
        </p>
        <button
          type="button"
          onClick={() => {
            if (typeof window !== "undefined") {
              window.dispatchEvent(new Event("namma_thanjai_open_signin"));
            }
          }}
          className="bg-[#128C7E] hover:bg-[#075e54] text-white font-heading font-black text-sm px-6 py-3 rounded-xl shadow-md cursor-pointer transition-all active:scale-95 flex items-center gap-2"
        >
          <MessageSquare className="w-4 h-4 fill-white stroke-[2.5]" />
          <span>Sign In / Verify</span>
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-2 pb-24 flex flex-col gap-6 font-sans">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="font-heading font-black text-xl sm:text-2xl text-slate-900 tracking-tight flex items-center gap-2">
            <Package className="w-6 h-6 text-amber-500" />
            <span>My Listings &amp; Saved Ads</span>
          </h1>
          <p className="text-xs font-bold text-slate-500 mt-0.5">
            Manage your live posted ads and bookmarked items in Thanjavur
          </p>
        </div>

        <button
          type="button"
          onClick={() => router.push("/post/sell")}
          className="bg-[#FBBF24] hover:bg-amber-400 text-[#0F172A] font-heading font-black text-xs sm:text-sm px-4 py-2 rounded-xl shadow-xs shrink-0 flex items-center gap-1.5 cursor-pointer transition-all border border-amber-400/80"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>+ Post Ad</span>
        </button>
      </div>

      {/* 2 Tabs: My Posted Ads | Saved Ads */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab("my_posts")}
          className={`py-2.5 px-4 font-heading font-black text-xs sm:text-sm transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
            activeTab === "my_posts"
              ? "border-[#FBBF24] text-[#0F172A] bg-amber-50/50 rounded-t-xl"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Package className="w-4 h-4" />
          <span>My Posted Ads ({myPosts.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("saved")}
          className={`py-2.5 px-4 font-heading font-black text-xs sm:text-sm transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
            activeTab === "saved"
              ? "border-[#FBBF24] text-[#0F172A] bg-amber-50/50 rounded-t-xl"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Bookmark className="w-4 h-4" />
          <span>Saved Ads ({savedPosts.length})</span>
        </button>
      </div>

      {/* Tab Content */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
        </div>
      ) : activeTab === "my_posts" ? (
        myPosts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center flex flex-col items-center gap-3">
            <ShoppingBag className="w-10 h-10 text-slate-300 stroke-[1.5]" />
            <h3 className="font-heading font-black text-base text-slate-800">You haven't posted any ads yet</h3>
            <p className="text-xs text-slate-500 max-w-sm">Sell unused items, request requirements, or offer services to local buyers in Thanjavur.</p>
            <button
              onClick={() => router.push("/post/sell")}
              className="mt-2 bg-[#FBBF24] hover:bg-amber-400 text-slate-950 font-heading font-black text-xs px-5 py-2.5 rounded-xl cursor-pointer shadow-2xs border border-amber-400"
            >
              + Create First Ad
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myPosts.map((post) => (
              <div key={post.id} className="relative group">
                <ListingCard listing={post as unknown as ListingItem} />
                <button
                  type="button"
                  onClick={() => handleDeletePost(post.id, post.type === "SERVICE" ? "services" : post.type === "SHOP" ? "shops" : "needs_and_sales")}
                  className="absolute top-3 right-3 bg-red-600 hover:bg-red-700 text-white p-2 rounded-xl shadow-md cursor-pointer transition-all z-20"
                  title="Delete Listing"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )
      ) : (
        savedPosts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center flex flex-col items-center gap-3">
            <Bookmark className="w-10 h-10 text-slate-300 stroke-[1.5]" />
            <h3 className="font-heading font-black text-base text-slate-800">No saved ads yet</h3>
            <p className="text-xs text-slate-500 max-w-sm">Click the bookmark icon on any listing card to save items for later quick access.</p>
            <button
              onClick={() => router.push("/sell")}
              className="mt-2 bg-[#FBBF24] hover:bg-amber-400 text-slate-950 font-heading font-black text-xs px-5 py-2.5 rounded-xl cursor-pointer shadow-2xs border border-amber-400"
            >
              Explore Sell Feed →
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {savedPosts.map((post) => (
              <ListingCard key={post.id} listing={post as unknown as ListingItem} />
            ))}
          </div>
        )
      )}
    </div>
  );
}
