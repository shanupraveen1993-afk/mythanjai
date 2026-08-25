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
  Pencil,
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
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<{ id: string; colName: string } | null>(null);

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

  const handleDeletePost = (postId: string, collectionName: string) => {
    setDeleteConfirmTarget({ id: postId, colName: collectionName });
  };

  const executeDeletePost = async (postId: string, collectionName: string) => {
    try {
      if (collectionName) {
        await deleteDoc(doc(db, collectionName, postId));
      }
      setMyPosts((prev) => prev.filter((p) => p.id !== postId));
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

  const handleToggleSegmentStatus = (post: any) => {
    const isCurrentlyInactive = Boolean(post.is_sold || post.is_contacted || post.is_offline || post.is_expired);
    const postType = (post.type || "SELL").toUpperCase();
    
    let keyToToggle = "is_sold";
    let activeMsg = "Listing marked as Active.";
    let inactiveMsg = "Listing marked as Sold.";

    if (postType === "NEED") {
      keyToToggle = "is_contacted";
      activeMsg = "Requirement marked as Active.";
      inactiveMsg = "Requirement marked as Contacted.";
    } else if (postType === "SERVICE" || post.skill_category) {
      keyToToggle = "is_offline";
      activeMsg = "Service marked as Online.";
      inactiveMsg = "Service marked as Offline.";
    } else if (postType === "OFFER" || postType === "SHOP" || post.shop_name) {
      keyToToggle = "is_expired";
      activeMsg = "Offer marked as Active.";
      inactiveMsg = "Offer marked as Expired.";
    }

    const nextState = !isCurrentlyInactive;

    setMyPosts((prev) =>
      prev.map((p) => (p.id === post.id ? { ...p, [keyToToggle]: nextState, is_sold: nextState, is_inactive: nextState } : p))
    );

    if (typeof window !== "undefined") {
      try {
        const stored = JSON.parse(localStorage.getItem("namma_thanjai_local_posts") || "[]");
        const updated = stored.map((p: any) => (p.id === post.id ? { ...p, [keyToToggle]: nextState, is_sold: nextState, is_inactive: nextState } : p));
        localStorage.setItem("namma_thanjai_local_posts", JSON.stringify(updated));
      } catch (e) {}
    }

    toast.success(isCurrentlyInactive ? activeMsg : inactiveMsg);
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {myPosts.map((post) => (
              <div key={post.id} className="flex flex-col bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs hover:shadow-md transition-all">
                <ListingCard listing={post as unknown as ListingItem} />

                {/* Dedicated Listing Management Action Bar */}
                <div className="p-3 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {/* 1. Edit Ad Button */}
                    <button
                      type="button"
                      onClick={() => {
                        const seg = post.type === "SERVICE" ? "service" : post.type === "OFFER" || post.type === "SHOP" ? "offer" : post.type === "NEED" ? "need" : "sell";
                        router.push(`/post/${seg}?editId=${post.id}`);
                      }}
                      className="bg-white hover:bg-slate-100 text-slate-900 border border-slate-300 font-heading font-black text-xs py-2 px-3 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all"
                    >
                      <Pencil className="w-3.5 h-3.5 text-amber-600" />
                      <span>Edit Ad</span>
                    </button>

                    {/* 2. Segment-Specific Inactive Toggle */}
                    {(() => {
                      const isInactive = Boolean(post.is_sold || post.is_contacted || post.is_offline || post.is_expired);
                      const pType = (post.type || "SELL").toUpperCase();
                      let label = isInactive ? "Mark Active" : "Mark Sold";
                      if (pType === "NEED") label = isInactive ? "Mark Active" : "Mark Fulfilled";
                      else if (pType === "SERVICE" || post.skill_category) label = isInactive ? "Mark Online" : "Mark Offline";
                      else if (pType === "OFFER" || pType === "SHOP" || post.shop_name) label = isInactive ? "Mark Active" : "Mark Expired";

                      return (
                        <button
                          type="button"
                          onClick={() => handleToggleSegmentStatus(post)}
                          className={`font-heading font-black text-xs py-2 px-3 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all border ${
                            isInactive
                              ? "bg-slate-200 text-slate-700 border-slate-300"
                              : "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100"
                          }`}
                        >
                          <Tag className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{label}</span>
                        </button>
                      );
                    })()}
                  </div>

                  {/* 3. Delete Action Button */}
                  <button
                    type="button"
                    onClick={() => handleDeletePost(post.id, post.type === "SERVICE" ? "services" : post.type === "SHOP" ? "shops" : "needs_and_sales")}
                    className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-heading font-black text-xs py-2 px-3 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all ml-auto"
                    title="Delete Listing"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    <span>Delete</span>
                  </button>
                </div>
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

      {/* Custom App Delete Confirmation Modal */}
      {deleteConfirmTarget && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 border border-slate-200 shadow-2xl flex flex-col gap-4 text-center">
            <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
              <Trash2 className="w-7 h-7 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-heading font-black text-lg text-slate-900">Delete Listing?</h3>
              <p className="text-xs text-slate-500 font-medium mt-1">This listing will be deleted permanently. This action cannot be undone.</p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmTarget(null)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-heading font-black text-xs rounded-2xl cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const target = deleteConfirmTarget;
                  setDeleteConfirmTarget(null);
                  if (target) executeDeletePost(target.id, target.colName);
                }}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-heading font-black text-xs rounded-2xl cursor-pointer shadow-md transition-all"
              >
                Delete Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
