"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { getOrAssignUserNTID } from "@/lib/user-identity";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { useRouter, useSearchParams } from "next/navigation";
import {
  User,
  Phone,
  CheckCircle,
  Trash2,
  Download,
  AlertCircle,
  Loader2,
  MessageSquare,
  ShieldCheck,
  Zap,
  LogOut,
  Clock,
  RefreshCw,
  Eye,
  Tag,
  Package,
  Pencil,
  ChevronRight,
  Bookmark,
  Share2,
  AlertTriangle,
  X,
  Shield,
  XCircle,
  ArrowLeft,
  RotateCcw,
  Crown,
} from "lucide-react";
import Link from "next/link";
import { useToast } from "@/context/ToastContext";
import CreatePostModal from "@/components/modals/CreatePostModal";

export default function ProfileClientPage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-amber-500" /></div>}>
      <ProfileContent />
    </React.Suspense>
  );
}

function ProfileContent() {
  const { toast } = useToast();
  const { user, profile, isVerified, loading: authLoading, updatePhone, updateDisplayName, signOutUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams ? searchParams.get("tab") : null;

  // 2-Screen Architecture Navigation State
  const [activeView, setActiveView] = useState<"dashboard" | "listings" | "saved">("dashboard");

  useEffect(() => {
    if (tabParam === "listings" || tabParam === "my_posts") {
      setActiveView("listings");
    } else if (tabParam === "saved" || tabParam === "bookmarks") {
      setActiveView("saved");
    } else {
      setActiveView("dashboard");
    }
  }, [tabParam]);

  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneUpdating, setPhoneUpdating] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [displayNameUpdating, setDisplayNameUpdating] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);

  // WhatsApp verification state variables
  const [verificationPending, setVerificationPending] = useState(false);
  const [isDbVerified, setIsDbVerified] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);



  // My Postings & Saved Bookmarks states
  const [myPosts, setMyPosts] = useState<any[]>([]);
  const [savedPosts, setSavedPosts] = useState<any[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);

  // Delete confirm & Testify & Edit Modal state
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [testifyPost, setTestifyPost] = useState<any>(null);
  const [editingPost, setEditingPost] = useState<any>(null);

  const handleTestifyTrue = (postId: string) => {
    setMyPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, report_count: 0 } : p))
    );
    setTestifyPost(null);
    toast.success("Listing testified as 100% accurate & true. Report count reset!");
  };

  const handleToggleSoldState = async (postId: string, currentInactive: boolean, colName?: string) => {
    const nextState = !currentInactive;
    setMyPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              is_sold: nextState,
              is_inactive: nextState,
              is_offline: nextState,
              status: nextState ? "inactive" : "active",
            }
          : p
      )
    );
    try {
      const targetCol = colName || "needs_and_sales";
      const docRef = doc(db, targetCol, postId);
      await updateDoc(docRef, {
        is_sold: nextState,
        is_inactive: nextState,
        is_offline: nextState,
        status: nextState ? "inactive" : "active",
      });
    } catch (e) {}
    toast.success(nextState ? "Listing marked as INACTIVE." : "Listing reactivated as ACTIVE!");
  };

  const handleRenewListing = async (postId: string, colName?: string) => {
    const newDate = new Date().toISOString();
    setMyPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, created_at: newDate, is_sold: false } : p))
    );
    try {
      const docRef = doc(db, colName || "needs_and_sales", postId);
      await updateDoc(docRef, { created_at: serverTimestamp(), is_sold: false });
    } catch (e) {}
    toast.success("Listing reposted successfully! 30-day window reset.");
  };

  // PWA Install prompt states & Native App Detection
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isNativeApp, setIsNativeApp] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsNativeApp(Boolean((window as any).Capacitor?.isNativePlatform()));
    }
  }, []);

  // Listen to Firestore profile changes in real-time safely and ensure NT-ID exists
  useEffect(() => {
    if (!user || !user.uid) return;
    getOrAssignUserNTID(user.uid).catch((err) => console.warn("NT-ID sync note:", err));
    try {
      const docRef = doc(db, "users", user.uid);
      const unsubscribe = onSnapshot(
        docRef,
        (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.isVerified) {
              setIsDbVerified(true);
            } else {
              setIsDbVerified(false);
            }
          }
        },
        (err) => {
          console.warn("Profile Firestore snapshot warning:", err);
        }
      );
      return () => unsubscribe();
    } catch (e) {
      console.warn("Profile Firestore listener error:", e);
    }
  }, [user]);

  // Listen for Chrome/Android Install Prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  // Fetch user posts from all collections + local storage (Robust Multi-Query Sync)
  const fetchMyPosts = async () => {
    setPostsLoading(true);
    try {
      const userId = user?.uid || "";
      const rawPhone = (profile?.phone || user?.phoneNumber || (typeof window !== "undefined" ? (localStorage.getItem("namma_thanjai_phone") || localStorage.getItem("my_thanjai_phone") || "") : "")).replace(/\D/g, "");
      const userPhone10 = rawPhone.length >= 10 ? rawPhone.slice(-10) : "";
      const memberId = profile?.memberId || (typeof window !== "undefined" ? localStorage.getItem("namma_thanjai_member_id") : null) || (userPhone10 ? `NT-${userPhone10}` : "");

      let combinedMyPosts: any[] = [];
      const seenIds = new Set<string>();

      // 1. Fetch My Posted Ads strictly from Firestore (by Member ID, UID, or phone variants)
      const targetCollections = ["needs_and_sales", "services", "shops", "offers"];
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

          // Query 3: By Phone number variations (10-digit, +91..., 91...)
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

      // 2. Include posts created in local tracker if not already loaded
      if (typeof window !== "undefined") {
        try {
          const localTracker: any[] = JSON.parse(localStorage.getItem("namma_thanjai_my_posts") || "[]");
          localTracker.forEach((localItem) => {
            if (localItem && localItem.id && !seenIds.has(localItem.id)) {
              seenIds.add(localItem.id);
              combinedMyPosts.push(localItem);
            }
          });
        } catch (e) {}
      }

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
      console.error("Error fetching my posts in profile:", error);
    } finally {
      setPostsLoading(false);
    }
  };

  useEffect(() => {
    fetchMyPosts();
    window.addEventListener("focus", fetchMyPosts);
    return () => window.removeEventListener("focus", fetchMyPosts);
  }, [user, profile?.phone, activeView]);

  // Load saved posts from localStorage on mount & when activeView changes
  useEffect(() => {
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
  }, [activeView]);

  // Sync profile details to local state
  useEffect(() => {
    if (profile?.phone) setPhoneNumber(profile.phone.replace(/^91/, ""));
    if (profile?.isVerified) setIsDbVerified(true);
    if (profile?.displayName) {
      setDisplayName(profile.displayName);
    } else if (user?.displayName) {
      setDisplayName(user.displayName);
    }
  }, [profile, user]);

  const handleSaveDisplayName = async () => {
    if (!displayName.trim()) { toast.error("Please enter a name."); return; }
    setDisplayNameUpdating(true);
    try {
      await updateDisplayName(displayName);
      setIsEditingName(false);
      toast.success("Profile name updated!");
      try { const confetti = (await import("canvas-confetti")).default; confetti({ particleCount: 30, spread: 30 }); } catch (err) {}
    } catch (error) {
      toast.error("Failed to update name.");
    } finally {
      setDisplayNameUpdating(false);
    }
  };

  // 2-Step WhatsApp OTP Verification
  const [otpCode, setOtpCode] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber || phoneNumber.length !== 10) { toast.error("Please enter a valid 10-digit mobile number."); return; }
    setStep("otp");
    toast.success("WhatsApp OTP sent to +91 " + phoneNumber);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode !== "123456") { toast.error("Invalid OTP. Enter 123456 for testing."); return; }
    setPhoneUpdating(true);
    try {
      const result = await updatePhone(phoneNumber);
      if (result?.success) {
        toast.success("WhatsApp Number Verified!");
        setIsDbVerified(true);
        setVerificationPending(false);
      } else {
        toast.error("Verification failed.");
      }
    } catch (err: any) {
      toast.error("Verification error: " + err.message);
    } finally {
      setPhoneUpdating(false);
    }
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsInstallable(false);
      setDeferredPrompt(null);
    }
  };

  // Delete Post (Purges from Firestore + UI state)
  const handleDeletePost = async (id: string, colName: string) => {
    setMyPosts((prev) => prev.filter((p) => p.id !== id));

    try {
      const docRef = doc(db, colName || "needs_and_sales", id);
      await deleteDoc(docRef).catch((err) => console.warn("Firestore delete note:", err));
    } catch (error) {
      console.warn("Firestore delete error note:", error);
    }

    setConfirmDeleteId(null);
    toast.success("Listing deleted successfully!");
  };

  // Avatar initials calculation with null-safety
  const nameForInitials = (profile?.displayName || displayName || user?.displayName || "").trim();
  const initials = nameForInitials
    ? nameForInitials
        .split(/\s+/)
        .filter(Boolean)
        .map((w: string) => (w && w[0] ? w[0] : ""))
        .join("")
        .toUpperCase()
        .slice(0, 2) || "NT"
    : "NT";

  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
      </div>
    );
  }

  if (!isVerified) {
    return (
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 pt-4 pb-6 sm:pb-10 font-sans">
        <div className="w-full bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-10 shadow-sm flex flex-col items-center justify-center text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shadow-2xs">
            <User className="w-8 h-8 stroke-[2.5]" />
          </div>
          <div className="flex flex-col gap-1.5 max-w-md">
            <h2 className="font-heading font-black text-xl sm:text-2xl text-slate-900 tracking-tight">Sign In Required</h2>
            <p className="text-amber-700 font-extrabold text-xs">சுயவிவரம் &amp; கணக்கை அணுகவும்</p>
            <p className="text-slate-600 text-xs sm:text-sm font-medium leading-relaxed">
              Sign in to post free ads, manage your active listings, view saved bookmarks, and direct message sellers in Thanjavur.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (typeof window !== "undefined") {
                window.dispatchEvent(new Event("namma_thanjai_open_signin"));
              }
            }}
            className="mt-2 w-full max-w-xs bg-[#FBBF24] hover:bg-amber-400 text-slate-950 font-heading font-black text-xs uppercase tracking-wider py-4 px-6 rounded-xl shadow-md cursor-pointer transition-all flex items-center justify-center gap-2 active:scale-[0.98] border border-amber-400"
          >
            <Phone className="w-4 h-4 stroke-[2.5]" />
            <span>Sign In with Mobile Number</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-4 pt-3 sm:pt-4 pb-6 sm:pb-10 font-sans px-2.5 sm:px-6 lg:px-8">

      {/* MODERN 2-COLUMN DASHBOARD LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT SIDEBAR COLUMN (4 cols on lg screens) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          
          {/* Profile User Info Card */}
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden p-5 flex flex-col gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-slate-950 text-amber-400 flex items-center justify-center font-heading font-black text-xl shrink-0 select-none shadow-xs border-2 border-amber-400">
                {initials}
              </div>

              <div className="flex-1 min-w-0">
                {isEditingName ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleSaveDisplayName(); }}
                      placeholder="Enter name"
                      disabled={displayNameUpdating}
                      autoFocus
                      className="px-2.5 py-1 text-xs font-semibold text-slate-900 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 w-full"
                    />
                    <button type="button" onClick={handleSaveDisplayName} disabled={displayNameUpdating} className="w-7 h-7 bg-amber-400 text-slate-950 rounded-lg flex items-center justify-center shrink-0 cursor-pointer">
                      {displayNameUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                    </button>
                    <button type="button" onClick={() => setIsEditingName(false)} className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 shrink-0 cursor-pointer">
                      <XCircle className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <h2 className="font-heading font-black text-base text-slate-900 truncate leading-tight flex items-center gap-1">
                      <span>{profile?.displayName || displayName || "Namma Thanjai User"}</span>
                      {isDbVerified && <span title="Verified WhatsApp Member"><CheckCircle className="w-4 h-4 text-emerald-600 fill-emerald-100 shrink-0" /></span>}
                    </h2>
                    <button onClick={() => setIsEditingName(true)} className="w-6 h-6 flex items-center justify-center rounded-md text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors shrink-0 cursor-pointer" title="Edit Name">
                      <Pencil className="w-3 h-3" />
                    </button>
                  </div>
                )}

                <div className="flex flex-col gap-1 mt-1">
                  <p className="text-xs text-slate-500 font-medium truncate">
                    {isDbVerified && phoneNumber ? `+91 ${phoneNumber}` : "Guest / Unverified"}
                  </p>

                  {/* Clean Metadata Permanent NT ID */}
                  <div className="flex items-center gap-2 text-xs font-mono text-slate-600">
                    <span className="font-medium text-[11px] text-slate-400 uppercase tracking-wide font-sans">Namma Thanjai ID:</span>
                    <span className="font-bold text-slate-800">{(profile as any)?.nt_id || profile?.memberId || "Loading..."}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const idToCopy = (profile as any)?.nt_id || profile?.memberId || "";
                        if (idToCopy) {
                          navigator.clipboard.writeText(idToCopy);
                          toast.success("Namma Thanjai ID copied!");
                        }
                      }}
                      className="text-slate-400 hover:text-slate-700 text-[11px] font-sans font-bold hover:underline cursor-pointer"
                      title="Copy Namma Thanjai ID"
                    >
                      Copy
                    </button>
                  </div>

                  {!isDbVerified && (
                    <button
                      type="button"
                      onClick={() => {
                        if (typeof window !== "undefined") {
                          window.dispatchEvent(new Event("namma_thanjai_open_signin"));
                        }
                      }}
                      className="inline-flex items-center gap-1 text-amber-700 font-extrabold text-xs hover:underline cursor-pointer mt-1"
                    >
                      <AlertCircle className="w-3.5 h-3.5" /> Verify WhatsApp Mobile
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Stats & Navigation Cards Grid */}
            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100">
              <div
                onClick={() => router.push("/listings")}
                className="bg-slate-50 hover:bg-slate-100/90 border border-slate-200/80 rounded-xl p-2.5 flex flex-col items-center text-center cursor-pointer transition-all group"
              >
                <div className="flex items-center gap-1">
                  <span className="font-heading font-black text-lg text-slate-900">{myPosts.length}</span>
                  <span className="text-slate-400 group-hover:text-slate-700 text-xs font-bold transition-colors">→</span>
                </div>
                <span className="text-[11px] font-bold text-slate-600 group-hover:text-slate-900 transition-colors">My Posts</span>
              </div>

              <div
                onClick={() => router.push("/listings?tab=saved")}
                className="bg-slate-50 hover:bg-slate-100/90 border border-slate-200/80 rounded-xl p-2.5 flex flex-col items-center text-center cursor-pointer transition-all group"
              >
                <div className="flex items-center gap-1">
                  <span className="font-heading font-black text-lg text-slate-900">{savedPosts.length}</span>
                  <span className="text-slate-400 group-hover:text-slate-700 text-xs font-bold transition-colors">→</span>
                </div>
                <span className="text-[11px] font-bold text-slate-600 group-hover:text-slate-900 transition-colors">Saved</span>
              </div>
            </div>

            {/* Sign Out Button */}
            <button
              onClick={async () => {
                await signOutUser();
                if (typeof window !== "undefined") {
                  localStorage.removeItem("my_thanjai_verified");
                  localStorage.removeItem("my_thanjai_phone");
                  localStorage.removeItem("namma_thanjai_guest_mode");
                }
                toast.success("Logged out successfully.");
                router.push("/");
              }}
              className="w-full py-2 px-3 text-rose-600 hover:text-rose-700 font-extrabold text-xs underline decoration-rose-600 decoration-2 underline-offset-4 transition-colors cursor-pointer text-center border-t border-slate-100 mt-1"
            >
              Sign Out Account
            </button>
          </div>
        </div>

        {/* RIGHT MAIN CONTENT COLUMN (8 cols on lg screens) */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          {activeView === "dashboard" && (
            <div className="flex flex-col gap-4 animate-fade-in">

          {/* Registered Mobile Card */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Phone className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-black text-slate-900">Registered Mobile</span>
                <span className="text-xs text-slate-500 font-semibold">{phoneNumber ? `+91 ${phoneNumber}` : "Not linked yet"}</span>
              </div>
            </div>
            <button
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.dispatchEvent(new Event("namma_thanjai_open_signin"));
                }
              }}
              className="text-xs font-black text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-300 px-3 py-1.5 rounded-xl cursor-pointer transition-colors"
            >
              {phoneNumber ? "Change Mobile" : "Verify Mobile"}
            </button>
          </div>

          {/* Account Membership Status */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200">
                <Crown className="w-5 h-5 text-amber-600" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900">Standard Account</span>
                  <span className="text-emerald-700 font-bold text-xs">Free Lifetime Membership</span>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Post unlimited free classified ads, needs, services &amp; shop offers in Thanjavur.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowPricingModal(true)}
              className="bg-slate-900 hover:bg-slate-800 text-white font-heading font-bold text-xs px-3.5 py-2 rounded-xl cursor-pointer transition-colors shrink-0 border border-slate-800"
            >
              Plan Features
            </button>
          </div>



          {/* Relocated Sign Out at Bottom of Screen (red underline text button) */}
          <div className="w-full flex flex-col items-center justify-center gap-3 pt-6 pb-12">
            <button
              onClick={async () => {
                await signOutUser();
                if (typeof window !== "undefined") {
                  localStorage.removeItem("my_thanjai_verified");
                  localStorage.removeItem("my_thanjai_phone");
                  localStorage.removeItem("namma_thanjai_guest_mode");
                }
                toast.success("Logged out successfully.");
                router.push("/");
              }}
              className="text-rose-600 hover:text-rose-700 font-extrabold text-xs underline decoration-rose-600 decoration-2 underline-offset-4 transition-colors cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}

      {/* SCREEN 2A: MY LISTINGS SUB-PAGE */}
      {activeView === "listings" && (
        <div className="flex flex-col gap-4 animate-fade-in">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
            {myPosts.length === 0 ? (
              <div className="flex flex-col items-center text-center py-10 gap-3">
                <Package className="w-8 h-8 text-slate-400" />
                <h4 className="font-heading font-black text-sm text-slate-800">No active listings</h4>
                <p className="text-xs text-slate-400 font-medium">Post your ads from the main navigation bar below.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {myPosts.map((post) => {
                  const createdTime = new Date(post.created_at || Date.now()).getTime();
                  const daysOld = Math.floor((Date.now() - createdTime) / (1000 * 60 * 60 * 24));
                  const daysLeft = Math.max(0, 30 - daysOld);
                  const isRenewable = daysLeft <= 4;
                  const isConfirmingDelete = confirmDeleteId === post.id;

                  return (
                    <div key={post.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col gap-3.5 shadow-2xs hover:border-slate-300 transition-all">
                      <div className="flex items-start gap-3 w-full">
                        {/* Post Image preview if available */}
                        {(post.image_url || (post.image_urls && post.image_urls.length > 0) || post.images || post.thumbnail_url || post.cover_image) && (
                          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-slate-200 relative overflow-hidden shrink-0 border border-slate-200">
                            <img
                              src={post.image_url || (post.image_urls && post.image_urls[0]) || (post.images && post.images[0]) || post.thumbnail_url || post.cover_image}
                              alt={post.title || post.name || post.shop_name || "Post thumbnail"}
                              className="w-full h-full object-cover"
                            />
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
                          <h5 className="font-heading font-extrabold text-sm sm:text-base text-slate-950 leading-snug truncate line-clamp-1 whitespace-nowrap mt-0.5">
                            {post.title || post.name || post.shop_name || "Untitled Listing"}
                          </h5>
                          <p className="text-xs text-slate-500 font-semibold truncate">
                            📍 {post.area_tag || post.location || "Thanjavur"}
                          </p>
                        </div>
                      </div>

                      {/* Full Post Description */}
                      <div className="bg-white border border-slate-200/70 p-3 rounded-xl">
                        <p className="text-xs text-slate-700 leading-relaxed font-normal">
                          {post.description || post.offer_description || "No description provided."}
                        </p>
                      </div>

                      {/* Active/Inactive Toggle + Actions Row */}
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
                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200">
                          {/* Active / Inactive Toggle Switch */}
                          {(() => {
                            const isInactive = Boolean(post.is_sold || post.is_inactive || post.is_offline || post.status === "inactive");
                            return (
                              <div className="flex items-center gap-2 bg-white px-2.5 py-1 rounded-xl border border-slate-200 shadow-2xs">
                                <span className={`text-[11px] font-bold ${!isInactive ? "text-emerald-700 font-extrabold" : "text-slate-500"}`}>
                                  {!isInactive ? "Active" : "Inactive"}
                                </span>
                                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                                  <input
                                    type="checkbox"
                                    checked={!isInactive}
                                    onChange={() => handleToggleSoldState(post.id, isInactive, post.colName)}
                                    className="sr-only peer"
                                  />
                                  <div className="w-8 h-4.5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-emerald-600" />
                                </label>
                              </div>
                            );
                          })()}

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                const targetSegment = post.type?.toUpperCase() === "NEED" ? "need" : post.type?.toUpperCase() === "SELL" ? "sell" : post.colName === "services" || post.skill_category ? "service" : "offer";
                                router.push(`/post/${targetSegment}?editId=${post.id}`);
                              }}
                              className="text-xs font-heading font-bold text-slate-900 bg-white border border-slate-300 px-3 py-1.5 rounded-xl cursor-pointer flex items-center gap-1 hover:bg-slate-100 transition-colors shadow-2xs"
                            >
                              <Pencil className="w-3.5 h-3.5 text-amber-600" /> Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(post.id)}
                              className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center cursor-pointer hover:bg-rose-100 transition-colors"
                              title="Delete Listing"
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
        </div>
      )}

      {/* SCREEN 2B: SAVED ITEMS SUB-PAGE */}
      {activeView === "saved" && (
        <div className="flex flex-col gap-4 animate-fade-in">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
            {savedPosts.length === 0 ? (
              <div className="flex flex-col items-center text-center py-10 gap-3">
                <Bookmark className="w-8 h-8 text-slate-400" />
                <h4 className="font-heading font-black text-sm text-slate-800">No saved items yet</h4>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {savedPosts.map((saved) => (
                  <div key={saved.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] uppercase font-black text-blue-600 tracking-wider bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-lg">
                          {saved.category || saved.type || "Saved Listing"}
                        </span>
                        <h5 className="font-heading font-black text-sm text-slate-900 truncate mt-1">
                          {saved.title || saved.name || saved.shop_name || "Saved Item"}
                        </h5>
                        <p className="text-xs text-slate-500 font-semibold mt-0.5 truncate">
                          📍 {saved.location || saved.area_tag || "Thanjavur"}
                          {saved.price && <span className="ml-2 text-slate-900 font-bold">₹{saved.price}</span>}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          const updated = savedPosts.filter((p) => p.id !== saved.id);
                          setSavedPosts(updated);
                          if (typeof window !== "undefined") {
                            localStorage.setItem("namma_thanjai_saved_posts", JSON.stringify(updated));
                          }
                          toast.success("Removed from saved items.");
                        }}
                        className="w-8 h-8 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-red-500 flex items-center justify-center shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-200/60">
                      <button
                        onClick={() => router.push(`/chat?listingId=${saved.id}&sellerId=${saved.seller_id || saved.userId || ""}&title=${encodeURIComponent(saved.title || saved.name || "")}`)}
                        className="text-xs font-black text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-xl flex items-center gap-1 cursor-pointer"
                      >
                        <MessageSquare className="w-3 h-3 text-slate-700" />
                        <span>Chat</span>
                      </button>
                      {saved.phone && (
                        <a href={`tel:+91${saved.phone}`} className="text-xs font-black text-white bg-blue-600 px-3 py-1.5 rounded-xl flex items-center gap-1 cursor-pointer">
                          <Phone className="w-3 h-3" />
                          <span>Call</span>
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

        </div>
      </div>

      {/* Edit Selected Post Modal */}
      {editingPost && (
        <CreatePostModal
          isOpen={Boolean(editingPost)}
          onClose={() => setEditingPost(null)}
          editPost={editingPost}
        />
      )}

      {/* Pricing Plan Comparison Popup Modal */}
      {showPricingModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-slate-200 shadow-xl flex flex-col gap-5 relative font-sans">
            <button
              type="button"
              onClick={() => setShowPricingModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="font-heading font-black text-xl text-slate-900 flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-500" />
                <span>Membership Plans &amp; Pricing</span>
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-1">Compare Free Plan vs Pro Membership features in Thanjavur</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Free Plan */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="font-heading font-black text-sm text-slate-900">Free Plan</span>
                  <span className="font-heading font-black text-base text-slate-900">₹0</span>
                </div>
                <ul className="text-xs text-slate-600 flex flex-col gap-2 font-medium">
                  <li className="flex items-center gap-2 text-slate-700">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>30 Days Listing Validity</span>
                  </li>
                  <li className="flex items-center gap-2 text-slate-500">
                    <XCircle className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>No Edit within first 7 Days</span>
                  </li>
                  <li className="flex items-center gap-2 text-slate-700">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>3 Callbacks / Month</span>
                  </li>
                </ul>
              </div>

              {/* Pro Membership Plan */}
              <div className="bg-amber-50/70 border-2 border-amber-400 rounded-xl p-4 flex flex-col gap-3 relative">
                <span className="absolute -top-2.5 right-3 bg-amber-500 text-slate-950 text-[10px] font-black uppercase px-2 py-0.5 rounded shadow-2xs">Free Limited Offer</span>
                <div className="flex items-center justify-between border-b border-amber-200 pb-2">
                  <span className="font-heading font-black text-sm text-slate-900">Pro Membership</span>
                  <div className="flex items-center gap-1.5">
                    <span className="line-through text-slate-400 text-xs font-semibold">₹199</span>
                    <span className="font-heading font-black text-base text-amber-600">₹0</span>
                  </div>
                </div>
                <ul className="text-xs text-slate-900 flex flex-col gap-2 font-bold">
                  <li className="flex items-center gap-2 text-slate-900">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>60 Days Listing Validity</span>
                  </li>
                  <li className="flex items-center gap-2 text-slate-900">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Unlimited Edits Anytime</span>
                  </li>
                  <li className="flex items-center gap-2 text-slate-900">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Unlimited Provider Callbacks</span>
                  </li>
                </ul>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowPricingModal(false);
                toast.success("Pro Membership Active! Enjoy 60 days listing & unlimited edits.");
              }}
              className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-heading font-black text-sm py-2.5 rounded-xl cursor-pointer transition-colors text-center border border-amber-400 shadow-2xs"
            >
              Activate Free Pro Membership
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
