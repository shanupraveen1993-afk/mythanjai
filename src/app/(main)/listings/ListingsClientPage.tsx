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

function formatRelativeTime(dateStr?: string) {
  if (!dateStr) return "Recently";
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 24) return `${diffHours || 1}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
  } catch {
    return "Recently";
  }
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

  // Load My Posts strictly filtered by current user's UID or Phone Number
  useEffect(() => {
    async function fetchListingsData() {
      setLoading(true);
      try {
        const userId = user?.uid || "";
        const rawPhone = (profile?.phone || user?.phoneNumber || (typeof window !== "undefined" ? (localStorage.getItem("namma_thanjai_phone") || localStorage.getItem("my_thanjai_phone") || "") : "")).replace(/\D/g, "");
        const userPhone10 = rawPhone.length >= 10 ? rawPhone.slice(-10) : "";

        let combinedMyPosts: any[] = [];
        const seenIds = new Set<string>();

        // 1. Load local posts created by this user on this device from localStorage
        if (typeof window !== "undefined") {
          try {
            const stored = JSON.parse(localStorage.getItem("namma_thanjai_local_posts") || "[]");
            stored.forEach((localP: any) => {
              const pPhone = String(localP.phone || "").replace(/\D/g, "");
              const pPhone10 = pPhone.length >= 10 ? pPhone.slice(-10) : "";
              const matchesUid = Boolean(userId && localP.userId === userId);
              const matchesPhone = Boolean(userPhone10 && pPhone10 && pPhone10 === userPhone10);
              const isAuthor = !userPhone10 || matchesUid || matchesPhone;

              if (isAuthor && !seenIds.has(localP.id)) {
                seenIds.add(localP.id);
                const determinedCol = localP.skill_category
                  ? "services"
                  : localP.type === "SELL" || localP.type === "NEED"
                  ? "needs_and_sales"
                  : "shops";
                combinedMyPosts.push({ ...localP, colName: determinedCol });
              }
            });
          } catch (e) {}
        }

        // 2. Fetch from Firestore for this user (by userId or phone number)
        const targetCollections = ["needs_and_sales", "services", "shops"];
        await Promise.all(
          targetCollections.map(async (colName) => {
            const colRef = collection(db, colName);
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

            if (userPhone10) {
              const snapPhone = await getDocs(query(colRef, where("phone", "==", userPhone10))).catch(() => null);
              if (snapPhone && !snapPhone.empty) {
                snapPhone.forEach((docSnap) => {
                  if (!seenIds.has(docSnap.id)) {
                    seenIds.add(docSnap.id);
                    combinedMyPosts.push({ id: docSnap.id, colName, ...docSnap.data() });
                  }
                });
              }
            }
          })
        );

        setMyPosts(combinedMyPosts);

        // Load Saved Bookmarks
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

      if (typeof window !== "undefined") {
        try {
          let local = JSON.parse(localStorage.getItem("namma_thanjai_local_posts") || "[]");
          local = local.filter((p: any) => p.id !== postId);
          localStorage.setItem("namma_thanjai_local_posts", JSON.stringify(local));
        } catch (e) {}
      }

      // Purge permanently from all possible collections in Firestore
      const targetCols = collectionName ? [collectionName] : ["needs_and_sales", "services", "shops"];
      await Promise.all(
        targetCols.map((col) => deleteDoc(doc(db, col, postId)).catch(() => {}))
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
    const isCurrentlyInactive = Boolean(post.is_sold || post.is_contacted || post.is_offline || post.is_expired || post.is_inactive);
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
            }
          : p
      )
    );

    if (typeof window !== "undefined") {
      try {
        const stored = JSON.parse(localStorage.getItem("namma_thanjai_local_posts") || "[]");
        const updated = stored.map((p: any) =>
          p.id === post.id
            ? {
                ...p,
                is_inactive: nextState,
                is_sold: nextState,
                is_offline: nextState,
                is_contacted: nextState,
              }
            : p
        );
        localStorage.setItem("namma_thanjai_local_posts", JSON.stringify(updated));
      } catch (e) {}
    }

    const col = post.colName || (post.skill_category ? "services" : (post.type === "SELL" || post.type === "NEED") ? "needs_and_sales" : "shops");
    try {
      await updateDoc(doc(db, col, post.id), {
        is_inactive: nextState,
        is_sold: nextState,
        is_offline: nextState,
        is_contacted: nextState,
      });
    } catch (e) {}

    toast.success(nextState ? "Listing marked as INACTIVE." : "Listing reactivated as ACTIVE!");
  };

  // Handle Edit
  const handleEditPost = (post: any) => {
    const pType = (post.type || (post.skill_category ? "SERVICE" : post.shop_name ? "OFFER" : "SELL")).toLowerCase();
    const route = pType === "need" ? "/post/need" : pType === "service" ? "/post/service" : pType === "offer" || pType === "shop" ? "/post/offer" : "/post/sell";
    const colName = post.colName || (pType === "service" ? "services" : pType === "offer" ? "shops" : "needs_and_sales");
    router.push(`${route}?editId=${post.id}&editCol=${colName}`);
  };

  // Unauthenticated Guest State CTA
  if (!isVerified && !authLoading) {
    return (
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 pt-6 pb-24 font-sans">
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
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-8 pb-24 flex flex-col gap-4 font-sans">
      {/* 2 Navigation Tabs: My Posted Ads | Saved Items */}
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
          <span>My Posted Ads ({myPosts.length})</span>
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
          <span>Saved Items ({savedPosts.length})</span>
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
            <h3 className="font-heading font-black text-base text-slate-800">You haven't posted any ads yet</h3>
            <p className="text-xs text-slate-500 max-w-sm">Sell unused items, request requirements, or offer services to local buyers in Thanjavur.</p>
            <button
              onClick={() => router.push("/post/sell")}
              className="mt-2 bg-[#FBBF24] hover:bg-amber-400 text-slate-950 font-heading font-black text-xs px-5 py-3 rounded-xl cursor-pointer shadow-sm border border-amber-400"
            >
              + Create First Free Ad
            </button>
          </div>
        ) : (
          <div className="w-full flex flex-col gap-3">
            {myPosts.map((post) => {
              const isInactive = Boolean(post.is_sold || post.is_contacted || post.is_offline || post.is_expired || post.is_inactive);
              const pType = (post.type || (post.skill_category ? "SERVICE" : post.shop_name ? "OFFER" : "SELL")).toUpperCase();
              let statusLabel = isInactive ? "INACTIVE" : "ACTIVE";

              const itemTitle = post.title || post.name || post.shop_name || "Untitled Listing";
              const itemImage = post.image_url || post.thumbnail_url || (Array.isArray(post.image_urls) && post.image_urls[0]) || "/placeholder.webp";
              const itemPrice = post.price || post.rate || (post.budget ? `Budget: ₹${post.budget}` : "");
              const itemLocation = post.area_tag || post.location || post.area || "Thanjavur";

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
                    <div className="flex flex-col gap-1 flex-1 min-w-0">
                      {/* Status Badge & Type */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[11px] font-black ${isInactive ? "text-slate-500" : "text-emerald-700"}`}>
                            ● {isInactive ? "INACTIVE" : "ACTIVE"}
                          </span>
                          {post.category && <span className="text-xs font-semibold text-slate-500 truncate">• {post.category}</span>}
                        </div>
                        <span className="text-[10px] font-black text-slate-600 uppercase bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">{pType}</span>
                      </div>

                      {/* Title */}
                      <h3 className="font-heading font-black text-sm sm:text-base text-slate-900 line-clamp-1 truncate">
                        {itemTitle}
                      </h3>

                      {/* Golden Amber Price */}
                      {itemPrice && (
                        <div className="text-amber-600 font-heading font-black text-sm sm:text-base tracking-tight">
                          {itemPrice.toString().startsWith("₹") ? itemPrice : `₹${itemPrice}`}
                        </div>
                      )}

                      {/* Locality & Posted Date */}
                      <div className="flex items-center gap-3 text-xs text-slate-500 font-medium mt-0.5">
                        <span className="flex items-center gap-1 truncate">
                          <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span className="truncate">{itemLocation}</span>
                        </span>
                        <span className="flex items-center gap-1 shrink-0">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{formatRelativeTime(post.created_at || new Date().toISOString())}</span>
                        </span>
                      </div>

                      {/* Live Views Counter & Retention Badge */}
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mt-1 pt-1.5 border-t border-slate-100">
                        <span className="flex items-center gap-1.5 text-emerald-800 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/80">
                          <Eye className="w-3.5 h-3.5 text-emerald-600" />
                          <span>👁️ {post.views_count || 14} buyers in Thanjavur viewed this</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const siteUrl = typeof window !== "undefined" ? window.location.origin : "https://mythanjai.vercel.app";
                            const caption = `நம்ம தஞ்சாவூர் ஃபீடில் என் விளம்பரம்: "${itemTitle}" (${itemLocation}). பாருங்கள் ➔ ${siteUrl}`;
                            window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(caption)}`, "_blank");
                          }}
                          className="text-[11px] font-black text-emerald-700 hover:text-emerald-800 bg-emerald-100/80 hover:bg-emerald-200/80 px-2.5 py-1 rounded-lg border border-emerald-300/60 flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Share2 className="w-3 h-3 text-emerald-700" />
                          <span>WhatsApp Share</span>
                        </button>
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
                        className="px-3.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl font-heading font-black text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                        title="Edit Listing"
                      >
                        <Pencil className="w-3.5 h-3.5 text-amber-700" />
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
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {savedPosts.map((savedItem) => (
              <ListingCard key={savedItem.id} listing={savedItem} />
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
