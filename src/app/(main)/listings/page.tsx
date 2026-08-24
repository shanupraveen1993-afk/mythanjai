"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { useRouter, useSearchParams } from "next/navigation";
import { Package, Bookmark, Clock, Eye, Share2, Pencil, Trash2, RotateCcw, Loader2 } from "lucide-react";
import { useToast } from "@/context/ToastContext";

export default function ListingsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-amber-500" /></div>}>
      <ListingsContent />
    </Suspense>
  );
}

function ListingsContent() {
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams ? searchParams.get("tab") : null;

  const [activeTab, setActiveTab] = useState<"listings" | "saved">("listings");
  const [myPosts, setMyPosts] = useState<any[]>([]);
  const [savedPosts, setSavedPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (tabParam === "saved" || tabParam === "bookmarks") {
      setActiveTab("saved");
    } else {
      setActiveTab("listings");
    }
  }, [tabParam]);

  const fetchMyPosts = async () => {
    setLoading(true);
    const collectionsToQuery = ["needs_and_sales", "services", "shops", "offers"];
    const allFetchedPosts: any[] = [];
    const userPhone = profile?.phone || user?.phoneNumber?.replace("+", "") || "";
    const userUid = user?.uid || "";

    try {
      if (userUid || userPhone) {
        for (const colName of collectionsToQuery) {
          const colRef = collection(db, colName);
          const fieldKeys = ["userId", "seller_id", "sellerId", "user_id"];
          for (const key of fieldKeys) {
            if (userUid) {
              try {
                const q = query(colRef, where(key, "==", userUid));
                const snap = await getDocs(q);
                snap.forEach((docSnap) => {
                  if (!allFetchedPosts.some((p) => p.id === docSnap.id)) {
                    allFetchedPosts.push({ id: docSnap.id, colName, ...docSnap.data() });
                  }
                });
              } catch (e) {}
            }
          }

          if (userPhone) {
            try {
              const qPhone = query(colRef, where("phone", "==", userPhone));
              const snapPhone = await getDocs(qPhone);
              snapPhone.forEach((docSnap) => {
                if (!allFetchedPosts.some((p) => p.id === docSnap.id)) {
                  allFetchedPosts.push({ id: docSnap.id, colName, ...docSnap.data() });
                }
              });
            } catch (e) {}
          }
        }
      }

      if (typeof window !== "undefined") {
        try {
          const stored = JSON.parse(localStorage.getItem("namma_thanjai_local_posts") || "[]");
          stored.forEach((localP: any) => {
            if (!allFetchedPosts.some((p) => p.id === localP.id)) {
              const determinedCol = localP.skill_category ? "services" : (localP.type === "SELL" || localP.type === "NEED") ? "needs_and_sales" : "shops";
              allFetchedPosts.unshift({ ...localP, colName: determinedCol });
            }
          });
        } catch (e) {}
      }

      setMyPosts(allFetchedPosts);
    } catch (error) {
      console.error("Error fetching my posts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyPosts();
    if (typeof window !== "undefined") {
      try {
        const saved1 = JSON.parse(localStorage.getItem("namma_thanjai_saved_posts") || "[]");
        const saved2 = JSON.parse(localStorage.getItem("my_thanjai_saved_posts") || "[]");
        const combined = [...saved1, ...saved2];
        const uniqueSaved = Array.from(new Map(combined.map((item: any) => [item.id, item])).values());
        setSavedPosts(uniqueSaved);
      } catch (e) {
        setSavedPosts([]);
      }
    }
  }, [activeTab]);

  const handleDeletePost = async (id: string, colName: string) => {
    setMyPosts((prev) => prev.filter((p) => p.id !== id));
    if (typeof window !== "undefined") {
      try {
        const stored = JSON.parse(localStorage.getItem("namma_thanjai_local_posts") || "[]");
        const updated = stored.filter((p: any) => p.id !== id);
        localStorage.setItem("namma_thanjai_local_posts", JSON.stringify(updated));
      } catch (e) {}
    }
    try {
      const docRef = doc(db, colName || "needs_and_sales", id);
      await deleteDoc(docRef);
    } catch (e) {}
    setConfirmDeleteId(null);
    toast.success("Listing deleted permanently.");
  };

  const handleRenewListing = async (postId: string, colName?: string) => {
    const newDate = new Date().toISOString();
    setMyPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, created_at: newDate, is_sold: false } : p)));
    try {
      const docRef = doc(db, colName || "needs_and_sales", postId);
      await updateDoc(docRef, { created_at: serverTimestamp(), is_sold: false });
    } catch (e) {}
    toast.success("Listing reposted successfully! 30-day window reset.");
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-5 mt-2 pb-24 font-sans px-3 sm:px-4">
      {/* 2-Tab Switcher: My Listings vs Saved Items */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-200/80 rounded-2xl w-full shadow-2xs">
        <button
          type="button"
          onClick={() => setActiveTab("listings")}
          className={`flex-1 py-2.5 px-3 rounded-xl font-heading font-black text-xs sm:text-sm transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 ${
            activeTab === "listings" ? "bg-white text-slate-950 shadow-xs border border-slate-200" : "text-slate-600 hover:text-slate-950"
          }`}
        >
          <Package className="w-4 h-4 text-amber-600" />
          <span>My Listings</span>
          <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded-full text-[10px] font-extrabold border border-slate-200">
            {myPosts.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("saved")}
          className={`flex-1 py-2.5 px-3 rounded-xl font-heading font-black text-xs sm:text-sm transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 ${
            activeTab === "saved" ? "bg-white text-slate-950 shadow-xs border border-slate-200" : "text-slate-600 hover:text-slate-950"
          }`}
        >
          <Bookmark className="w-4 h-4 text-amber-600 fill-amber-500" />
          <span>Saved Items</span>
          <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded-full text-[10px] font-extrabold border border-slate-200">
            {savedPosts.length}
          </span>
        </button>
      </div>

      {/* MY LISTINGS CONTENT */}
      {activeTab === "listings" && (
        <div className="flex flex-col gap-4 animate-fade-in">
          {loading ? (
            <div className="py-16 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-amber-500" /></div>
          ) : myPosts.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center flex flex-col items-center gap-3">
              <Package className="w-10 h-10 text-slate-400" />
              <h4 className="font-heading font-black text-sm text-slate-800">No active listings yet</h4>
              <p className="text-xs text-slate-500 font-medium">Post your ads using the ➕ POST AD button below.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {myPosts.map((post) => {
                const createdTime = new Date(post.created_at || Date.now()).getTime();
                const daysOld = Math.floor((Date.now() - createdTime) / (1000 * 60 * 60 * 24));
                const daysLeft = Math.max(0, 30 - daysOld);
                const isConfirmingDelete = confirmDeleteId === post.id;

                return (
                  <div key={post.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col gap-3 shadow-2xs hover:border-slate-300 transition-all">
                    <div className="flex items-start gap-3 w-full">
                      {(post.image_url || (post.image_urls && post.image_urls.length > 0) || post.images || post.thumbnail_url || post.cover_image) ? (
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-slate-200 relative overflow-hidden shrink-0 border border-slate-200">
                          <img
                            src={post.image_url || (post.image_urls && post.image_urls[0]) || (post.images && post.images[0]) || post.thumbnail_url || post.cover_image}
                            alt={post.title || post.name || post.shop_name || "Post thumbnail"}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-slate-900 text-amber-400 relative overflow-hidden shrink-0 border border-slate-200 flex flex-col items-center justify-center p-2 text-center select-none">
                          <span className="text-[10px] font-black uppercase tracking-wider text-amber-300">Request Photo</span>
                        </div>
                      )}

                      <div className="flex-1 min-w-0 flex flex-col gap-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-black uppercase text-blue-700 tracking-wider bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-lg">
                            {post.type || post.category || "Listing"}
                          </span>
                          {post.price && (
                            <span className="text-slate-950 font-heading font-black text-sm sm:text-base">
                              ₹{typeof post.price === "number" ? post.price.toLocaleString("en-IN") : post.price}
                            </span>
                          )}
                        </div>
                        <h5 className="font-heading font-extrabold text-sm sm:text-base text-slate-950 leading-snug truncate line-clamp-1 mt-0.5">
                          {post.title || post.name || post.shop_name || "Untitled Listing"}
                        </h5>
                        <p className="text-xs text-slate-500 font-semibold truncate">📍 {post.area_tag || post.location || "Thanjavur"}</p>
                      </div>
                    </div>

                    <div className="bg-white border border-slate-200/70 p-3 rounded-xl">
                      <p className="text-xs text-slate-700 leading-relaxed font-normal">{post.description || post.offer_description || "No description provided."}</p>
                    </div>

                    <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs">
                      <span className="flex items-center gap-1.5 font-bold text-slate-700">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        <span>{daysLeft > 0 ? `${daysLeft} days active remaining` : "Expired"}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRenewListing(post.id, post.colName)}
                        className="text-xs font-heading font-black text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-xl cursor-pointer flex items-center gap-1.5 shadow-2xs transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-white" />
                        <span>Repost (Reset 30 Days)</span>
                      </button>
                    </div>

                    {isConfirmingDelete ? (
                      <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-2.5">
                        <span className="text-xs font-bold text-red-700 flex-1">Delete this listing permanently?</span>
                        <button onClick={() => handleDeletePost(post.id, post.colName || "needs_and_sales")} className="text-xs font-black text-white bg-red-600 px-3 py-1.5 rounded-xl cursor-pointer">
                          Delete
                        </button>
                        <button onClick={() => setConfirmDeleteId(null)} className="text-xs font-black text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-xl cursor-pointer">
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/60">
                        <div className="flex items-center gap-3 text-xs font-bold text-slate-600">
                          <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5 text-blue-600" /><span>{post.views_count || 24}</span></span>
                          <span className="flex items-center gap-1"><Share2 className="w-3.5 h-3.5 text-emerald-600" /><span>{post.shares_count || 12}</span></span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const targetSegment = post.type?.toUpperCase() === "NEED" ? "need" : post.type?.toUpperCase() === "SELL" ? "sell" : post.colName === "services" || post.skill_category ? "service" : "offer";
                              router.push(`/post/${targetSegment}?edit=${post.id}&col=${post.colName || (targetSegment === "service" ? "services" : targetSegment === "offer" ? "shops" : "needs_and_sales")}`);
                            }}
                            className="text-xs font-heading font-black text-slate-900 bg-white border border-slate-300 px-3 py-1.5 rounded-xl cursor-pointer flex items-center gap-1 hover:bg-slate-100 transition-colors shadow-2xs"
                          >
                            <Pencil className="w-3.5 h-3.5 text-slate-700" /> Edit Listing
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(post.id)}
                            className="w-8 h-8 rounded-xl bg-red-50 text-red-600 border border-red-200 flex items-center justify-center cursor-pointer hover:bg-red-100 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SAVED ITEMS CONTENT */}
      {activeTab === "saved" && (
        <div className="flex flex-col gap-4 animate-fade-in">
          {savedPosts.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center flex flex-col items-center gap-3">
              <Bookmark className="w-10 h-10 text-slate-400" />
              <h4 className="font-heading font-black text-sm text-slate-800">No saved items yet</h4>
              <p className="text-xs text-slate-500 font-medium">Tap the bookmark icon on any post card to save it for later.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {savedPosts.map((savedItem) => (
                <div key={savedItem.id} className="bg-white border border-slate-200 rounded-xl p-3.5 flex flex-col justify-between gap-2 shadow-2xs">
                  <div className="flex items-start justify-between gap-2">
                    <h5 className="font-heading font-extrabold text-sm text-slate-900 truncate">{savedItem.title || savedItem.shop_name}</h5>
                    {savedItem.price && <span className="text-xs font-black text-emerald-700">₹{savedItem.price}</span>}
                  </div>
                  <p className="text-xs text-slate-500">📍 {savedItem.area_tag || "Thanjavur"}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
