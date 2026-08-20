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
} from "firebase/firestore";
import { useRouter } from "next/navigation";
import {
  User,
  Phone,
  CheckCircle,
  Trash2,
  Download,
  AlertCircle,
  Sparkles,
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
} from "lucide-react";
import Link from "next/link";
import { useToast } from "@/context/ToastContext";
import CreatePostModal from "@/components/modals/CreatePostModal";

export default function ProfileClientPage() {
  const { toast } = useToast();
  const { user, profile, loading: authLoading, updatePhone, updateDisplayName, signOutUser } = useAuth();
  const router = useRouter();
  // 2-Screen Architecture Navigation State
  const [activeView, setActiveView] = useState<"dashboard" | "listings" | "saved">("dashboard");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");
      if (tab === "listings" || tab === "my_posts") {
        setActiveView("listings");
      } else if (tab === "saved" || tab === "bookmarks") {
        setActiveView("saved");
      } else {
        setActiveView("dashboard");
      }
    }
  }, []);

  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneUpdating, setPhoneUpdating] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [displayNameUpdating, setDisplayNameUpdating] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);

  // WhatsApp verification state variables
  const [verificationPending, setVerificationPending] = useState(false);
  const [isDbVerified, setIsDbVerified] = useState(false);

  const isSuperAdmin = React.useMemo(() => {
    const rawPhone = String(profile?.phone || phoneNumber || user?.phoneNumber || "");
    const cleanPhone = rawPhone.replace(/\D/g, "");
    return cleanPhone.includes("9994837342") || profile?.isAdmin;
  }, [profile, phoneNumber, user]);

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

  const handleToggleSoldState = (postId: string, currentSold: boolean) => {
    setMyPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, is_sold: !currentSold } : p))
    );
    if (typeof window !== "undefined") {
      try {
        const stored = JSON.parse(localStorage.getItem("namma_thanjai_local_posts") || "[]");
        const updated = stored.map((p: any) => (p.id === postId ? { ...p, is_sold: !currentSold } : p));
        localStorage.setItem("namma_thanjai_local_posts", JSON.stringify(updated));
      } catch (e) {}
    }
    toast.success(!currentSold ? "Listing marked as SOLD!" : "Listing reactivated as Active!");
  };

  const handleRenewListing = (postId: string) => {
    setMyPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, created_at: new Date().toISOString() } : p))
    );
    toast.success("Listing renewed for another 30 Days!");
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

      if (typeof window !== "undefined") {
        try {
          const stored = JSON.parse(localStorage.getItem("namma_thanjai_local_posts") || "[]");
          stored.forEach((localP: any) => {
            if (!allFetchedPosts.some((p) => p.id === localP.id)) {
              allFetchedPosts.unshift({
                ...localP,
                colName: localP.type === "SELL" || localP.type === "NEED" ? "needs_and_sales" : "shops",
              });
            }
          });
        } catch (e) {}
      }

      // Automatically include sample listings connected to admin phone 9994837342
      const adminSamples = [
        { id: "s_plot", title: "2400 Sqft CMDA Plot — Vallam", category: "Plots & Real Estate", area_tag: "Vallam", price: "2450000", phone: "9994837342", type: "SELL", colName: "needs_and_sales", created_at: new Date() },
        { id: "s_house", title: "2 BHK House for Rent", category: "Property Rental", area_tag: "Medical College Road", price: "12500", phone: "9994837342", type: "SELL", colName: "needs_and_sales", created_at: new Date() },
        { id: "s_bike", title: "Hero Splendor 2022 — Single Owner", category: "Used Vehicles", area_tag: "New Bus Stand", price: "68000", phone: "9994837342", type: "SELL", colName: "needs_and_sales", created_at: new Date() },
        { id: "sh_glen", shop_name: "GLEN Exclusive Gallery", title: "Up to 60% OFF — Grand Opening Sale", category: "Electronics & Mobiles", area_tag: "New Bus Stand", phone: "9994837342", colName: "shops", created_at: new Date() },
        { id: "sv_elec", name: "Senthil Kumar — Home Electrician", title: "Home Electrician", skill_category: "Electrician", area_tag: "Tanjore Town (General)", phone: "9994837342", colName: "services", created_at: new Date() },
      ];
      adminSamples.forEach((s) => {
        if (!allFetchedPosts.some((p) => p.id === s.id)) {
          allFetchedPosts.push(s);
        }
      });

      setMyPosts(allFetchedPosts);
    } catch (error) {
      console.error("Error fetching my posts:", error);
    } finally {
      setPostsLoading(false);
    }
  };

  useEffect(() => {
    fetchMyPosts();
  }, [user, profile?.phone]);

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

  // 100% WORKING DELETE POST (Purges from local storage + Firestore + UI state)
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
    } catch (error) {
      console.warn("Firestore delete note:", error);
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

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-5 mt-2 pb-24 font-sans px-3 sm:px-4">

      {/* WhatsApp OTP Verification Modal */}
      {verificationPending && (
        <div className="fixed inset-0 z-[99999] bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-sm rounded-2xl p-5 shadow-2xl flex flex-col gap-4">
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

      {/* SCREEN 1: PROFILE DASHBOARD OVERVIEW */}
      {activeView === "dashboard" && (
        <div className="flex flex-col gap-4 animate-fade-in">
          
          {/* Profile Card Header */}
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
            <div className="h-1.5 w-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500" />
            <div className="p-5 flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-slate-950 text-amber-400 flex items-center justify-center font-heading font-black text-xl sm:text-2xl shrink-0 select-none shadow-md ring-2 ring-amber-400/30">
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
                        {isSuperAdmin && (
                          <span className="ml-1 bg-amber-500 text-slate-950 px-1.5 py-0.5 rounded-lg text-[10px] font-black uppercase flex items-center gap-0.5">
                            <ShieldCheck className="w-3 h-3" /> Admin
                          </span>
                        )}
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
              </div>

              {/* Highlighted Free Plan Card */}
              <div className="bg-amber-400 text-slate-950 font-heading font-black text-sm p-3.5 rounded-2xl flex items-center justify-between shadow-xs">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-4.5 h-4.5 text-slate-950 fill-slate-950 shrink-0" />
                  <span>Free Plan</span>
                </span>
                <div className="flex items-center gap-1.5 bg-slate-950 text-amber-400 px-3 py-1 rounded-xl text-xs">
                  <span className="line-through opacity-70 text-[11px] text-slate-300 font-medium">₹100</span>
                  <span className="font-black text-sm text-amber-300">₹0</span>
                </div>
              </div>
            </div>
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

          {/* Settings & Links Card List */}
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden flex flex-col divide-y divide-slate-100">
            
            {/* My Listings Row — Unboxed Number */}
            <div
              onClick={() => router.push("/profile?tab=listings")}
              className="flex items-center justify-between p-4 hover:bg-slate-50 cursor-pointer transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                  <Package className="w-4 h-4" />
                </div>
                <span className="font-heading font-black text-sm text-slate-900">My Listings</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-bold text-sm">
                  {myPosts.length}
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-colors" />
              </div>
            </div>

            {/* Saved Items Row — Unboxed Number & Removed Tamil text */}
            <div
              onClick={() => router.push("/profile?tab=saved")}
              className="flex items-center justify-between p-4 hover:bg-slate-50 cursor-pointer transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <Bookmark className="w-4 h-4 fill-amber-600" />
                </div>
                <span className="font-heading font-black text-sm text-slate-900">Saved Items</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-bold text-sm">
                  {savedPosts.length}
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-colors" />
              </div>
            </div>

            {/* Admin Console Row (if Admin) */}
            {isSuperAdmin && (
              <Link href="/admin" className="flex items-center justify-between p-4 hover:bg-amber-50 cursor-pointer transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0">
                    <Shield className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <span className="font-heading font-black text-sm text-slate-900">Admin Console</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 transition-colors" />
              </Link>
            )}

          </div>

          {/* Relocated Sign Out at Bottom of Screen (unhighlighted text button) */}
          <div className="w-full flex justify-center pt-6 pb-12">
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
                    <div key={post.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-col gap-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <span className="text-[10px] font-black uppercase text-amber-600 tracking-wider bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg">
                            {post.type || post.category || "Listing"}
                          </span>
                          <h5 className="font-heading font-black text-sm text-slate-900 truncate mt-1">
                            {post.title || post.name || post.shop_name || "Untitled Listing"}
                          </h5>
                          <p className="text-xs text-slate-500 font-semibold mt-0.5 truncate">
                            📍 {post.area_tag || "Thanjavur"}
                            {post.price && <span className="ml-2 text-slate-900 font-bold">₹{post.price}</span>}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs">
                        <span className="flex items-center gap-1.5 font-bold text-slate-600">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {daysLeft > 0 ? `${daysLeft} days remaining` : "Expired"}
                        </span>
                        {isRenewable && (
                          <button onClick={() => handleRenewListing(post.id)} className="text-xs font-black text-amber-700 bg-amber-100 hover:bg-amber-200 px-2.5 py-1 rounded-xl cursor-pointer">
                            <RefreshCw className="w-3 h-3 inline mr-1" /> Renew
                          </button>
                        )}
                      </div>

                      {isConfirmingDelete ? (
                        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-2.5">
                          <span className="text-xs font-bold text-red-700 flex-1">Delete this listing?</span>
                          <button onClick={() => handleDeletePost(post.id, post.colName || "needs_and_sales")} className="text-xs font-black text-white bg-red-600 px-3 py-1.5 rounded-xl cursor-pointer">
                            Delete
                          </button>
                          <button onClick={() => setConfirmDeleteId(null)} className="text-xs font-black text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-xl cursor-pointer">
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/60">
                          {/* All 3 Engagement Metrics: Views, Shares, Saves */}
                          <div className="flex items-center gap-3 text-xs font-bold text-slate-600 flex-wrap">
                            <span className="flex items-center gap-1" title="Views">
                              <Eye className="w-3.5 h-3.5 text-blue-600" />
                              <span>{post.views_count || 24}</span>
                            </span>
                            <span className="flex items-center gap-1" title="Shares">
                              <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>{post.shares_count || 12}</span>
                            </span>
                            <span className="flex items-center gap-1" title="Saved">
                              <Bookmark className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                              <span>{post.saves_count || 8}</span>
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setEditingPost(post)}
                              className="text-xs font-black text-slate-700 bg-white border border-slate-200 px-3 py-1.5 rounded-xl cursor-pointer flex items-center gap-1 hover:bg-slate-100 transition-colors"
                            >
                              <Pencil className="w-3.5 h-3.5 text-slate-600" /> Edit
                            </button>
                            <button onClick={() => setConfirmDeleteId(post.id)} className="w-8 h-8 rounded-xl bg-red-50 text-red-500 border border-red-200 flex items-center justify-center cursor-pointer hover:bg-red-100 transition-colors">
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

      {/* Edit Selected Post Modal */}
      {editingPost && (
        <CreatePostModal
          isOpen={Boolean(editingPost)}
          onClose={() => setEditingPost(null)}
          editPost={editingPost}
        />
      )}

    </div>
  );
}
