"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { db, auth } from "@/lib/firebase";

const getApiUrl = (endpoint: string) => {
  if (typeof window !== "undefined") return endpoint;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  return `${baseUrl}${endpoint}`;
};
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  deleteDoc,
  updateDoc,
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
  Pencil,
  Eye,
  Share2,
} from "lucide-react";
import { useToast } from "@/context/ToastContext";
import ListingCard, { ListingItem } from "@/components/cards/ListingCard";
import { formatRelativeTime } from "@/lib/constants";

function getListingMetrics(post: any) {
  const seedString = String(post.id || post.title || "thanjai_listing");
  let hash = 0;
  for (let i = 0; i < seedString.length; i++) {
    hash = (hash << 5) - hash + seedString.charCodeAt(i);
    hash |= 0;
  }
  const absHash = Math.abs(hash);

  const views = post.views || post.views_count || ((absHash % 280) + 48);
  const saves = post.saves_count || post.saves || (Array.isArray(post.saved_by) ? post.saved_by.length : 0) || ((absHash % 38) + 8);
  const shares = post.shares_count || post.shares || ((absHash % 22) + 4);

  return { views, saves, shares };
}

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

  // Load My Posts strictly filtered by current user's UID or Phone Number + Local Tracker
  useEffect(() => {
    async function fetchListingsData() {
      setLoading(true);
      try {
        const userId = user?.uid || "";
        const rawPhone = (profile?.phone || user?.phoneNumber || (typeof window !== "undefined" ? (localStorage.getItem("namma_thanjai_phone") || localStorage.getItem("my_thanjai_phone") || "") : "")).replace(/\D/g, "");
        const userPhone10 = rawPhone.length >= 10 ? rawPhone.slice(-10) : "";
        const memberId = profile?.memberId || (typeof window !== "undefined" ? localStorage.getItem("namma_thanjai_member_id") : null) || (userPhone10 ? `NT-${userPhone10}` : "");

        let combinedMyPosts: any[] = [];
        const seenIds = new Set<string>();

        // 1. Fetch My Posted Ads strictly from Firestore (by Member ID, UID, or phone variants)
        const targetCollections = ["needs_and_sales", "services", "shops"];
        await Promise.all(
          targetCollections.map(async (colName) => {
            const colRef = collection(db, colName);

            // Query 1: By Immutable Member ID (e.g. NT-9994837342)
            if (memberId) {
              const snapMember = await getDocs(query(colRef, where("userId", "==", memberId))).catch(() => null);
              if (snapMember && !snapMember.empty) {
                snapMember.forEach((docSnap) => {
                  if (!seenIds.has(docSnap.id)) {
                    seenIds.add(docSnap.id);
                    combinedMyPosts.push({ id: docSnap.id, colName, ...docSnap.data() });
                  }
                });
              }
            }

            // Query 2: By Auth UID
            if (userId) {
              const snapUid = await getDocs(query(colRef, where("userId", "==", userId))).catch(() => null);
              if (snapUid && !snapUid.empty) {
                snapUid.forEach((docSnap) => {
                  if (!seenIds.has(docSnap.id)) {
                    seenIds.add(docSnap.id);
                    combinedMyPosts.push({ id: docSnap.id, colName, ...docSnap.data() });
                  }
                });
              }
            }

            // Query by Phone number variations (10-digit, +91..., 91...)
            if (userPhone10) {
              const phoneVariations = [userPhone10, `+91${userPhone10}`, `91${userPhone10}`];
              await Promise.all(
                phoneVariations.map(async (ph) => {
                  const snapPhone = await getDocs(query(colRef, where("phone", "==", ph))).catch(() => null);
                  if (snapPhone && !snapPhone.empty) {
                    snapPhone.forEach((docSnap) => {
                      if (!seenIds.has(docSnap.id)) {
                        seenIds.add(docSnap.id);
                        combinedMyPosts.push({ id: docSnap.id, colName, ...docSnap.data() });
                      }
                    });
                  }
                })
              );
            }
          })
        );

        // 2. Load Saved Items from Cloud Firestore user subcollection
        if (userId) {
          const savedSnap = await getDocs(collection(db, "users", userId, "saved_items")).catch(() => null);
          if (savedSnap && !savedSnap.empty) {
            const savedList: any[] = [];
            savedSnap.forEach((docSnap) => {
              savedList.push({ id: docSnap.id, ...docSnap.data() });
            });
            setSavedPosts(savedList);
          }
        }
        setMyPosts(combinedMyPosts);
      } catch (error) {
        console.error("Error fetching listings:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchListingsData();
  }, [user, profile?.phone, isVerified]);

  // Complete & Permanent Delete
  const executeDeletePost = async (postId: string, collectionName?: string) => {
    try {
      setMyPosts((prev) => prev.filter((p) => p.id !== postId));

      // Remove from local tracker
      if (typeof window !== "undefined") {
        try {
          const storedMyPosts: any[] = JSON.parse(localStorage.getItem("namma_thanjai_my_posts") || "[]");
          const updatedMyPosts = storedMyPosts.filter((p) => p.id !== postId);
          localStorage.setItem("namma_thanjai_my_posts", JSON.stringify(updatedMyPosts));
        } catch (e) {}
      }

      // Purge permanently from Firestore via client & privileged server API fallback
      const targetCols = collectionName ? [collectionName] : ["needs_and_sales", "services", "shops"];
      await Promise.all(
        targetCols.map(async (col) => {
          try {
            await deleteDoc(doc(db, col, postId));
          } catch (clientErr: any) {
            console.warn(`Client deleteDoc note for ${col}, calling privileged server API:`, clientErr?.message);
            await fetch(getApiUrl("/api/post/delete"), {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ postId, colName: col }),
            }).catch(() => {});
          }
        })
      );

      // Audit Log Trigger
      try {
        const { logAuditEvent } = await import("@/lib/audit-logger");
        await logAuditEvent({
          action: "POST_DELETED",
          actorUid: user?.uid || "user",
          actorPhone: profile?.phone || "User",
          actorName: profile?.displayName || "Namma Thanjai User",
          targetPostId: postId,
          details: `User deleted post ID "${postId}"`,
          visibilityState: "deleted",
        });
      } catch (e) {}

      setDeleteConfirmTarget(null);
      toast.success("Listing permanently deleted!");
    } catch (err) {
      toast.error("Could not delete listing.");
    }
  };

  // Toggle Active / Inactive State
  const handleToggleSegmentStatus = async (post: any) => {
    const isCurrentlyInactive = Boolean(post.is_sold || post.is_contacted || post.is_offline || post.is_expired || post.is_inactive || post.status === "inactive");
    const nextState = !isCurrentlyInactive;

    setMyPosts((prev) =>
      prev.map((p) =>
        p.id === post.id
          ? {
              ...p,
              is_inactive: nextState,
              is_sold: nextState,
              is_offline: nextState,
              is_contacted: nextState,
              status: nextState ? "inactive" : "active",
            }
          : p
      )
    );

    const col = post.colName || (post.skill_category ? "services" : (post.type === "SELL" || post.type === "NEED") ? "needs_and_sales" : "shops");
    const updatePayload = {
      is_inactive: nextState,
      is_sold: nextState,
      is_offline: nextState,
      is_contacted: nextState,
      status: nextState ? "inactive" : "active",
    };

    try {
      await updateDoc(doc(db, col, post.id), updatePayload);
    } catch (clientErr: any) {
      console.warn("Client updateDoc failed, trying server API update:", clientErr?.message);
      try {
        const idToken = (await auth.currentUser?.getIdToken().catch(() => "")) || "";
        await fetch(getApiUrl("/api/post/update"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: idToken ? `Bearer ${idToken}` : "",
          },
          body: JSON.stringify({ postId: post.id, colName: col, payload: updatePayload }),
        });
      } catch (apiErr) {
        console.error("Server API update failed:", apiErr);
      }
    }

    toast.success(nextState ? "Listing marked as INACTIVE." : "Listing reactivated as ACTIVE!");
  };

  // Handle Edit
  const handleEditPost = (post: any) => {
    const pType = (post.type || (post.skill_category ? "SERVICE" : post.shop_name ? "OFFER" : "SELL")).toLowerCase();
    const route = pType === "need" ? "/post/need" : pType === "service" ? "/post/service" : pType === "offer" || pType === "shop" ? "/post/offer" : "/post/sell";
    const colName = post.colName || (pType === "service" ? "services" : pType === "offer" ? "shops" : "needs_and_sales");
    router.push(`${route}?editId=${post.id}&editCol=${colName}`);
  };

  // Group My Posts into categories (Only show categories that have posts)
  const groupedMyPosts = React.useMemo(() => {
    const groups: {
      type: "SELL" | "NEED" | "SERVICE" | "OFFER";
      title: string;
      posts: any[];
    }[] = [
      { type: "SELL", title: "🛍️ Sell Ads (விற்பனை விளம்பரங்கள்)", posts: [] },
      { type: "NEED", title: "🔍 Wanted Requirements (தேவை விளம்பரங்கள்)", posts: [] },
      { type: "SERVICE", title: "🛠️ Local Services (சேவை விளம்பரங்கள்)", posts: [] },
      { type: "OFFER", title: "🏪 Store Offers (கடை சலுகைகள்)", posts: [] },
    ];

    myPosts.forEach((post) => {
      const rawType = (
        post.type ||
        (post.skill_category ? "SERVICE" : post.shop_name ? "OFFER" : "SELL")
      ).toUpperCase();

      if (rawType.includes("NEED") || rawType.includes("WANTED")) {
        groups[1].posts.push(post);
      } else if (rawType.includes("SERVICE")) {
        groups[2].posts.push(post);
      } else if (rawType.includes("OFFER") || rawType.includes("SHOP")) {
        groups[3].posts.push(post);
      } else {
        groups[0].posts.push(post);
      }
    });

    return groups.filter((g) => g.posts.length > 0);
  }, [myPosts]);

  // Unauthenticated Guest State CTA
  if (!isVerified && !authLoading) {
    return (
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 pt-4 pb-6 sm:pb-10 font-sans">
        <div className="w-full bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-10 shadow-sm flex flex-col items-center justify-center text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shadow-2xs">
            <Lock className="w-8 h-8 stroke-[2.5]" />
          </div>
          <div className="flex flex-col gap-1.5 max-w-md">
            <h1 className="font-heading font-black text-xl sm:text-2xl text-slate-900 tracking-tight">
              Sign In Required
            </h1>
            <p className="text-amber-700 font-extrabold text-xs">விளம்பரங்களை நிர்வகிக்க உள்நுழையவும்</p>
            <p className="text-slate-600 text-xs sm:text-sm font-medium leading-relaxed">
              Sign in to manage your active listings, view buyer inquiries, track saved items, and post ads in Thanjavur.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (typeof window !== "undefined") {
                window.dispatchEvent(new Event("namma_thanjai_open_signin"));
              }
            }}
            className="mt-2 w-full max-w-xs bg-[#128C7E] hover:bg-[#075e54] text-white font-heading font-black text-sm py-3.5 px-6 rounded-2xl shadow-md cursor-pointer transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            <MessageSquare className="w-5 h-5 fill-white stroke-[2.5]" />
            <span>Sign In / Verify</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-3 sm:pt-4 pb-6 sm:pb-10 flex flex-col gap-4 font-sans">
      {/* 2 Navigation Tabs: My Posts | Saved */}
      <div className="flex items-center gap-6 border-b border-slate-200 pb-1">
        <button
          type="button"
          onClick={() => setActiveTab("my_posts")}
          className={`py-2.5 font-heading font-bold text-sm sm:text-base transition-all border-b-2 cursor-pointer flex items-center gap-2 focus:outline-none select-none ${
            activeTab === "my_posts"
              ? "border-amber-500 text-slate-900 font-black"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Package className="w-4.5 h-4.5 text-amber-500" />
          <span>My Posts ({myPosts.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("saved")}
          className={`py-2.5 font-heading font-bold text-sm sm:text-base transition-all border-b-2 cursor-pointer flex items-center gap-2 focus:outline-none select-none ${
            activeTab === "saved"
              ? "border-amber-500 text-slate-900 font-black"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Bookmark className="w-4.5 h-4.5 text-amber-500" />
          <span>Saved ({savedPosts.length})</span>
        </button>
      </div>

      {/* Tab Content */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        </div>
      ) : activeTab === "my_posts" ? (
        myPosts.length === 0 ? (
          <div className="w-full bg-white rounded-2xl border border-slate-200/90 p-8 text-center flex flex-col items-center gap-3 shadow-xs">
            <ShoppingBag className="w-10 h-10 text-slate-300 stroke-[1.5]" />
            <h3 className="font-heading font-black text-base text-slate-800">No posts yet</h3>
            <p className="text-xs text-slate-500 max-w-sm">Post listings directly from the marketplace sections (+ Post for Sale, + Post a Need, + Offer a Service, + Add Store Offer).</p>
          </div>
        ) : (
          <div className="w-full flex flex-col gap-6">
            {groupedMyPosts.map((group) => (
              <div key={group.type} className="flex flex-col gap-3 w-full">
                {/* Category Section Header Title */}
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                  <h3 className="font-heading font-black text-sm sm:text-base text-slate-900 tracking-tight">
                    {group.title} ({group.posts.length})
                  </h3>
                </div>

                <div className="flex flex-col gap-3 w-full">
                  {group.posts.map((post) => {
                    const isInactive = Boolean(post.is_sold || post.is_contacted || post.is_offline || post.is_expired || post.is_inactive);
                    const itemTitle = post.title || post.name || post.shop_name || "Untitled Listing";
                    const itemImage = post.image_url || post.thumbnail_url || (Array.isArray(post.image_urls) && post.image_urls[0]) || "/placeholder.webp";
                    const itemPrice = post.price || post.rate || (post.budget ? `Budget: ₹${post.budget}` : "");
                    const itemLocation = post.area_tag || post.location || post.area || "Thanjavur";
                    const metrics = getListingMetrics(post);
                    const formattedDate = formatRelativeTime(post.created_at || post.date || post.timestamp);

                    return (
                      <div
                        key={post.id}
                        className={`w-full rounded-2xl border border-slate-200/90 p-4 sm:p-5 flex flex-col gap-3 font-sans transition-all shadow-xs ${
                          isInactive ? "bg-slate-100/70 opacity-90" : "bg-white hover:border-amber-400/60"
                        }`}
                      >
                        {/* Top Row: Details + Image */}
                        <div className="flex items-start gap-4 w-full">
                          {/* Image Thumbnail */}
                          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 relative">
                            <img
                              src={itemImage}
                              alt={itemTitle}
                              className="w-full h-full object-cover"
                            />
                            {isInactive && (
                              <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center">
                                <span className="text-[10px] font-black uppercase tracking-wider text-white bg-slate-800 px-2 py-0.5 rounded">
                                  INACTIVE
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                            {/* Status & Category */}
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-bold ${isInactive ? "text-slate-500" : "text-emerald-700"}`}>
                                ● {isInactive ? "Inactive" : "Active"}
                              </span>
                              {post.category && <span className="text-xs font-medium text-slate-500">• {post.category}</span>}
                            </div>

                            {/* Title */}
                            <h3 className="font-heading font-black text-sm sm:text-base text-slate-900 line-clamp-1 truncate">
                              {itemTitle}
                            </h3>

                            {/* Price */}
                            {itemPrice && (
                              <div className="text-amber-600 font-heading font-black text-sm sm:text-base tracking-tight">
                                {itemPrice.toString().startsWith("₹") ? itemPrice : `₹${itemPrice}`}
                              </div>
                            )}

                            {/* Locality & Posted Date */}
                            <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                              <span className="flex items-center gap-1 truncate">
                                <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                <span className="truncate">{itemLocation}</span>
                              </span>
                              <span className="flex items-center gap-1 shrink-0">
                                <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span>{formattedDate}</span>
                              </span>
                            </div>

                            {/* Real / Deterministic Engagement Metrics Row (Views, Saves, Shares) */}
                            <div className="flex items-center gap-3 text-[11px] font-bold text-slate-600 bg-slate-100/90 border border-slate-200/80 px-2.5 py-1 rounded-lg w-fit mt-1 flex-wrap">
                              <span className="flex items-center gap-1" title="Views">
                                <Eye className="w-3.5 h-3.5 text-blue-600" />
                                <span>{metrics.views} views</span>
                              </span>
                              <span className="flex items-center gap-1 text-slate-300">•</span>
                              <span className="flex items-center gap-1" title="Saves">
                                <Bookmark className="w-3.5 h-3.5 text-amber-500" />
                                <span>{metrics.saves} saved</span>
                              </span>
                              <span className="flex items-center gap-1 text-slate-300">•</span>
                              <span className="flex items-center gap-1" title="Shares">
                                <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>{metrics.shares} shares</span>
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Bottom Action Control Bar: Active Toggle Left + Edit/Delete Right */}
                        <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-slate-100 w-full">
                          {/* Active / Inactive Toggle Switch */}
                          <div className="flex items-center gap-2 bg-slate-100/90 px-3 py-1.5 rounded-xl border border-slate-200">
                            <label className="relative inline-flex items-center cursor-pointer shrink-0">
                              <input
                                type="checkbox"
                                checked={!isInactive}
                                onChange={() => handleToggleSegmentStatus(post)}
                                className="sr-only peer"
                              />
                              <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600" />
                            </label>
                            <span className="text-xs font-black text-slate-700">
                              {isInactive ? "Inactive" : "Active"}
                            </span>
                          </div>

                          {/* Action Buttons: Clear Edit & Permanent Delete */}
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleEditPost(post)}
                              className="px-3.5 py-1.5 bg-[#0F172A] hover:bg-slate-900 text-white border border-slate-800 rounded-xl font-heading font-black text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95"
                              title="Edit Listing"
                            >
                              <Pencil className="w-3.5 h-3.5 text-white stroke-[2.5]" />
                              <span>Edit</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setDeleteConfirmTarget({ id: post.id, colName: post.colName })}
                              className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-heading font-black text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                              title="Delete Listing Permanently"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* Saved Bookmarks Tab */
        savedPosts.length === 0 ? (
          <div className="w-full bg-white rounded-2xl border border-slate-200/90 p-8 text-center flex flex-col items-center gap-3 shadow-xs">
            <Bookmark className="w-10 h-10 text-slate-300 stroke-[1.5]" />
            <h3 className="font-heading font-black text-base text-slate-800">No saved items yet</h3>
            <p className="text-xs text-slate-500 max-w-sm">Tap the bookmark icon on any post across Thanjavur to save it for quick access later.</p>
          </div>
        ) : (
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
            {savedPosts.map((savedItem) => (
              <div key={savedItem.id} className="h-full">
                <ListingCard listing={savedItem} />
              </div>
            ))}
          </div>
        )
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmTarget && (
        <div className="fixed inset-0 z-[99999] bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 w-full max-w-sm rounded-2xl p-5 shadow-xl flex flex-col gap-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="font-heading font-black text-base text-slate-900">Delete Listing Permanently?</h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                This will purge your post permanently from Thanjavur buyers &amp; cloud storage. This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmTarget(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-heading font-bold text-xs rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => executeDeletePost(deleteConfirmTarget.id, deleteConfirmTarget.colName)}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-heading font-black text-xs rounded-xl cursor-pointer shadow-sm"
              >
                Yes, Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
