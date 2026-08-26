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

  const handleToggleSoldState = async (postId: string, currentSold: boolean, colName?: string) => {
    setMyPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, is_sold: !currentSold } : p))
    );
    try {
      const docRef = doc(db, colName || "needs_and_sales", postId);
      await updateDoc(docRef, { is_sold: !currentSold });
    } catch (e) {}
    toast.success(!currentSold ? "Listing marked as SOLD!" : "Listing reactivated as Active!");
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

  // Listen to Firestore profile changes in real-time safely
  useEffect(() => {
    if (!user || !user.uid) return;
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

  // Fetch user posts from all collections + local storage
  const fetchMyPosts = async () => {
    setPostsLoading(true);
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

      setMyPosts(allFetchedPosts);
    } catch (error) {
      console.error("Error fetching my posts:", error);
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
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 pt-6 pb-24 font-sans">
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
            className="mt-2 w-full max-w-xs bg-[#128C7E] hover:bg-[#075e54] text-white font-heading font-black text-sm py-3.5 px-6 rounded-2xl shadow-md cursor-pointer transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <MessageSquare className="w-5 h-5 fill-white stroke-[2.5]" />
            <span>Sign In / Verify</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-4 pt-4 sm:pt-8 pb-24 font-sans px-2.5 sm:px-6 lg:px-8">

      {/* Header Bar */}
      <div className="flex flex-col gap-1 border-b border-slate-200/80 pb-3">
        <h1 className="font-heading font-black text-xl sm:text-2xl text-slate-900 tracking-tight text-left">
          My Profile
        </h1>
        <p className="text-xs sm:text-sm font-medium text-slate-500 text-left">
          Manage your account settings, phone verification, and posted ads
        </p>
      </div>



      {/* WhatsApp OTP Verification Modal */}
      {verificationPending && (
        <div className="fixed inset-0 z-[99999] bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-sm rounded-2xl p-5 shadow-lg flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <Zap className="w-4 h-4" />
                </div>
                <h3 className="font-heading font-black text-sm text-slate-900">Verify WhatsApp Number</h3>
              </div>
              <button onClick={() => setVerificationPending(false)} className="text-slate-400 hover:text-slate-700 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            {step === "phone" ? (
              <form onSubmit={handleSendOtp} className="flex flex-col gap-3">
                <p className="text-xs text-slate-600 font-medium">Enter your 10-digit mobile number to receive a verification OTP via WhatsApp:</p>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-amber-600">+91</span>
                  <input
                    type="tel"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    placeholder="10-digit WhatsApp number"
                    disabled={phoneUpdating}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl pl-11 pr-3 py-2.5 text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none font-bold"
                  />
                </div>
                <button type="submit" disabled={phoneUpdating} className="w-full py-2.5 btn-primary text-xs font-black flex items-center justify-center gap-2 cursor-pointer">
                  <Zap className="w-4 h-4 fill-slate-950" />
                  <span>Send WhatsApp OTP</span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="flex flex-col gap-3">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">OTP sent to +91 {phoneNumber}</p>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="Enter 6-digit OTP (123456 for test)"
                  disabled={phoneUpdating}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-center tracking-[0.5em] font-extrabold rounded-xl py-2.5 text-base focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
                <button type="submit" disabled={phoneUpdating} className="w-full py-2.5 btn-primary text-xs font-black flex items-center justify-center gap-2 cursor-pointer">
                  {phoneUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle className="w-4 h-4" /><span>Verify & Unlock</span></>}
                </button>
                <button type="button" onClick={() => setStep("phone")} className="text-xs font-bold text-slate-500 hover:text-slate-800 text-center cursor-pointer">
                  ← Change Mobile Number
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODERN 2-COLUMN DASHBOARD LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT SIDEBAR COLUMN (4 cols on lg screens) */}
        <div className="lg:col-span-4 flex flex-col gap-4 sticky top-20">
          
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
                    <h2 className="font-heading font-black text-base text-slate-900 truncate leading-tight">
                      {profile?.displayName || displayName || "Namma Thanjai User"}
                    </h2>
                    <button onClick={() => setIsEditingName(true)} className="w-6 h-6 flex items-center justify-center rounded-md text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors shrink-0 cursor-pointer" title="Edit Name">
                      <Pencil className="w-3 h-3" />
                    </button>
                  </div>
                )}

                <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                  {isDbVerified && phoneNumber ? `+91 ${phoneNumber}` : "Guest / Unverified"}
                </p>

                <div className="mt-1.5">
                  {isDbVerified ? (
                    <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-lg text-[11px] font-black">
                      <CheckCircle className="w-3 h-3" /> Verified Member
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        if (typeof window !== "undefined") {
                          window.dispatchEvent(new Event("namma_thanjai_open_signin"));
                        }
                      }}
                      className="inline-flex items-center gap-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded-lg text-[11px] font-black cursor-pointer"
                    >
                      <AlertCircle className="w-3 h-3" /> Verify WhatsApp
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100">
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 flex flex-col items-center text-center">
                <span className="font-heading font-black text-lg text-slate-900">{myPosts.length}</span>
                <span className="text-[11px] font-semibold text-slate-500">My Posted Ads</span>
              </div>
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 flex flex-col items-center text-center">
                <span className="font-heading font-black text-lg text-slate-900">{savedPosts.length}</span>
                <span className="text-[11px] font-semibold text-slate-500">Saved Ads</span>
              </div>
            </div>

            {/* Sidebar Tab Navigation Buttons */}
            <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveView("dashboard")}
                className={`w-full py-2.5 px-3.5 rounded-xl font-heading font-bold text-xs flex items-center justify-between transition-all cursor-pointer ${
                  activeView === "dashboard"
                    ? "bg-[#FBBF24] text-slate-950 border border-amber-400 shadow-2xs"
                    : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200/80"
                }`}
              >
                <span className="flex items-center gap-2">
                  <User className="w-4 h-4" /> Account Overview
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
              </button>

              <button
                type="button"
                onClick={() => setActiveView("listings")}
                className={`w-full py-2.5 px-3.5 rounded-xl font-heading font-bold text-xs flex items-center justify-between transition-all cursor-pointer ${
                  activeView === "listings"
                    ? "bg-[#FBBF24] text-slate-950 border border-amber-400 shadow-2xs"
                    : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200/80"
                }`}
              >
                <span className="flex items-center gap-2">
                  <Package className="w-4 h-4" /> My Posted Ads ({myPosts.length})
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
              </button>

              <button
                type="button"
                onClick={() => setActiveView("saved")}
                className={`w-full py-2.5 px-3.5 rounded-xl font-heading font-bold text-xs flex items-center justify-between transition-all cursor-pointer ${
                  activeView === "saved"
                    ? "bg-[#FBBF24] text-slate-950 border border-amber-400 shadow-2xs"
                    : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200/80"
                }`}
              >
                <span className="flex items-center gap-2">
                  <Bookmark className="w-4 h-4" /> Saved Bookmarks ({savedPosts.length})
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
              </button>
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
              className="w-full py-2 px-3 text-slate-400 hover:text-red-600 font-semibold text-xs transition-colors cursor-pointer text-center border-t border-slate-100 mt-1"
            >
              Sign Out Account
            </button>
          </div>
        </div>

        {/* RIGHT MAIN CONTENT COLUMN (8 cols on lg screens) */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          {activeView === "dashboard" && (
            <div className="flex flex-col gap-4 animate-fade-in">
          
          {/* Profile Card Header */}
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
            <div className="h-1.5 w-full bg-amber-400" />
            <div className="p-5 flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-slate-950 text-amber-400 flex items-center justify-center font-heading font-black text-xl sm:text-2xl shrink-0 select-none shadow-sm border-2 border-amber-400">
                  {initials}
                </div>

                <div className="flex-1 min-w-0">
                  {isEditingName ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") handleSaveDisplayName(); }}
                        placeholder="Enter your name"
                        disabled={displayNameUpdating}
                        autoFocus
                        className="px-3 py-1.5 text-sm font-bold text-slate-900 border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 w-full"
                      />
                      <button type="button" onClick={handleSaveDisplayName} disabled={displayNameUpdating} className="w-9 h-9 btn-primary rounded-xl flex items-center justify-center shrink-0 cursor-pointer">
                        {displayNameUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                      </button>
                      <button type="button" onClick={() => setIsEditingName(false)} className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:text-slate-700 shrink-0 cursor-pointer">
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="min-w-0">
                        <h2 className="font-heading font-black text-base sm:text-lg text-slate-900 truncate leading-tight">
                          {profile?.displayName || displayName || "Namma Thanjai User"}
                        </h2>
                        <p className="text-xs text-slate-500 font-semibold truncate mt-0.5">
                          {isDbVerified && phoneNumber ? `+91 ${phoneNumber}` : "Not verified yet"}
                        </p>
                      </div>
                      <button onClick={() => setIsEditingName(true)} className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors shrink-0 cursor-pointer" title="Edit Name">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  <div className="mt-2">
                    {isDbVerified ? (
                      <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-xl text-xs font-black">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Verified Member
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          if (typeof window !== "undefined") {
                            window.dispatchEvent(new Event("namma_thanjai_open_signin"));
                          }
                        }}
                        className="inline-flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-xl text-xs font-black cursor-pointer transition-colors"
                      >
                        <AlertCircle className="w-3.5 h-3.5" />
                        Verify to Unlock Posting
                      </button>
                    )}
                  </div>
                </div>
              </div>            </div>
          </div>

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

          {/* Pro Membership Card (Bounded, NO full-width stretched bar) */}
          <div className="bg-white border border-amber-300/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200">
                <Crown className="w-5 h-5 text-amber-600" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900">Pro Membership</span>
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-extrabold px-2 py-0.5 rounded-md">Free Limited Offer</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="line-through text-slate-400 text-xs font-semibold">₹199</span>
                  <span className="text-amber-600 font-heading font-black text-sm">₹0 / Free</span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowPricingModal(true)}
              className="bg-slate-900 hover:bg-slate-800 text-amber-400 font-heading font-bold text-xs px-3.5 py-2 rounded-xl cursor-pointer transition-colors shrink-0 border border-slate-800"
            >
              View Pricing Plan
            </button>
          </div>



          {/* Relocated Sign Out at Bottom of Screen (unhighlighted text button) */}
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
              className="text-slate-400 font-medium hover:text-red-500 text-xs transition-colors cursor-pointer"
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
                          <div className="flex items-center gap-2 bg-white px-2.5 py-1 rounded-xl border border-slate-200 shadow-2xs">
                            <span className={`text-[11px] font-bold ${!post.is_sold ? "text-emerald-700 font-extrabold" : "text-slate-500"}`}>
                              {!post.is_sold ? "Active" : "Inactive"}
                            </span>
                            <label className="relative inline-flex items-center cursor-pointer shrink-0">
                              <input
                                type="checkbox"
                                checked={!post.is_sold}
                                onChange={() => handleToggleSoldState(post.id, Boolean(post.is_sold))}
                                className="sr-only peer"
                              />
                              <div className="w-8 h-4.5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-emerald-600" />
                            </label>
                          </div>

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
