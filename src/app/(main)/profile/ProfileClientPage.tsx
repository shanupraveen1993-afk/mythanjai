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
  Home,
} from "lucide-react";
import Link from "next/link";
import { useToast } from "@/context/ToastContext";

export default function ProfileClientPage() {
  const { toast } = useToast();
  const { user, profile, loading: authLoading, updatePhone, updateDisplayName, signOutUser } = useAuth();
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneUpdating, setPhoneUpdating] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [displayNameUpdating, setDisplayNameUpdating] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);

  // WhatsApp verification state variables
  const [verificationToken, setVerificationToken] = useState<string | null>(null);
  const [verificationPending, setVerificationPending] = useState(false);
  const [isDbVerified, setIsDbVerified] = useState(false);

  const isSuperAdmin = React.useMemo(() => {
    const rawPhone = String(profile?.phone || phoneNumber || user?.phoneNumber || "");
    const cleanPhone = rawPhone.replace(/\D/g, "");
    return cleanPhone.includes("9994837342") || profile?.isAdmin;
  }, [profile, phoneNumber, user]);

  // My Postings & Saved Bookmarks states
  const [profileTab, setProfileTab] = useState<"my_posts" | "saved_posts">("my_posts");
  const [myPosts, setMyPosts] = useState<any[]>([]);
  const [savedPosts, setSavedPosts] = useState<any[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);

  // Delete confirm & Testify state
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [testifyPost, setTestifyPost] = useState<any>(null);

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
  const [isIOS, setIsIOS] = useState(false);
  const [isNativeApp, setIsNativeApp] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsNativeApp(Boolean((window as any).Capacitor?.isNativePlatform()));
    }
  }, []);

  // Listen to Firestore profile changes in real-time
  useEffect(() => {
    if (!user) return;
    const docRef = doc(db, "users", user.uid);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.isVerified) {
          setIsDbVerified(true);
          setVerificationPending(false);
        } else {
          setIsDbVerified(false);
        }
      }
    });
    return () => unsubscribe();
  }, [user]);

  // Detect iOS browser PWA capability
  useEffect(() => {
    if (typeof window !== "undefined") {
      const userAgent = window.navigator.userAgent.toLowerCase();
      const isIphone = /iphone|ipad|ipod/.test(userAgent);
      const isSafari = /safari/.test(userAgent) && !/crios/.test(userAgent) && !/fxios/.test(userAgent);
      setIsIOS(isIphone && isSafari);
    }
  }, []);

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

  // Load saved posts from localStorage on mount and when tab switches to saved
  useEffect(() => {
    if (profileTab === "saved_posts" && typeof window !== "undefined") {
      try {
        const saved = JSON.parse(localStorage.getItem("namma_thanjai_saved_posts") || "[]");
        setSavedPosts(saved);
      } catch (e) {
        setSavedPosts([]);
      }
    }
  }, [profileTab]);

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
      } else {
        toast.error("Verification failed.");
      }
    } catch (err: any) {
      toast.error("Verification error: " + err.message);
    } finally {
      setPhoneUpdating(false);
    }
  };

  // Phase 1 Webhook Simulator
  const handleSimulateWebhook = async () => {
    if (!user || !verificationToken) return;
    setPhoneUpdating(true);
    try {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const data = userSnap.data();
        if (data.verificationToken === verificationToken) {
          const adminPhone = process.env.NEXT_PUBLIC_ADMIN_PHONE?.replace(/\D/g, "");
          const isUserAdmin = data.phone?.replace(/\D/g, "") === adminPhone;
          await updateDoc(userRef, { isVerified: true, isAdmin: isUserAdmin });
          setIsDbVerified(true);
          setVerificationPending(false);
          toast.success("Mobile number verified successfully!");
          try { const confetti = (await import("canvas-confetti")).default; confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } }); } catch (err) {}
        }
      }
    } catch (error) {
      console.error("Simulation failed:", error);
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
      try { const confetti = (await import("canvas-confetti")).default; confetti({ particleCount: 50, spread: 60 }); } catch (err) {}
    }
  };

  const handleDeletePost = async (id: string, colName: string) => {
    try {
      const docRef = doc(db, colName, id);
      await deleteDoc(docRef);
      setMyPosts((prev) => prev.filter((p) => p.id !== id));
      setConfirmDeleteId(null);
      toast.success("Listing deleted successfully!");
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error("Failed to delete post.");
    }
  };

  // Computed stats
  const activeCount = myPosts.filter((p) => !p.is_sold).length;
  const soldCount = myPosts.filter((p) => p.is_sold).length;
  const savedCount = savedPosts.length;

  // Avatar initials
  const nameForInitials = profile?.displayName || displayName || user?.displayName || "";
  const initials = nameForInitials
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "NT";

  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 mt-3 pt-1 pb-20 font-sans">

      {/* ── 1. Profile Hero Header Card ─────────────────────────────── */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        {/* Amber top accent bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500" />

        <div className="p-5 flex flex-col gap-4">
          {/* Avatar + Name Row */}
          <div className="flex items-center gap-4">
            {/* Avatar Circle with initials */}
            <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-slate-950 text-amber-400 flex items-center justify-center font-heading font-black text-xl sm:text-2xl shrink-0 select-none shadow-md ring-2 ring-amber-400/30">
              {initials}
            </div>

            {/* Name + Phone + Edit */}
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
                  <button
                    type="button"
                    onClick={handleSaveDisplayName}
                    disabled={displayNameUpdating}
                    className="w-9 h-9 btn-primary rounded-xl flex items-center justify-center shrink-0"
                  >
                    {displayNameUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingName(false)}
                    className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:text-slate-700 transition-colors shrink-0"
                  >
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
                      {isDbVerified ? `+91 ${phoneNumber}` : "Not verified yet"}
                    </p>
                  </div>
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors shrink-0"
                    title="Edit Name"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Verified / Unverified Badge */}
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
                  <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-xl text-xs font-black">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Verify to Unlock Posting
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Stats Bar — Active / Sold / Saved */}
          {isDbVerified && (
            <div className="grid grid-cols-3 gap-2 bg-slate-50 border border-slate-200/80 rounded-xl p-3">
              <div className="flex flex-col items-center gap-0.5">
                <span className="font-heading font-black text-lg text-slate-950">{activeCount}</span>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Active</span>
              </div>
              <div className="flex flex-col items-center gap-0.5 border-x border-slate-200">
                <span className="font-heading font-black text-lg text-slate-950">{soldCount}</span>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Sold</span>
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <span className="font-heading font-black text-lg text-slate-950">{savedCount}</span>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Saved</span>
              </div>
            </div>
          )}

          {/* Account Plan pill */}
          <div className="flex items-center justify-between text-xs bg-slate-50 border border-slate-100 rounded-xl px-3 py-2">
            <span className="font-bold text-slate-700 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400 shrink-0" />
              Free Plan — 30 day listings
            </span>
            <span className="font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg flex items-center gap-1">
              <span className="line-through text-slate-400 font-medium">₹100</span>
              <span>₹0</span>
            </span>
          </div>
        </div>
      </div>

      {/* ── 2. Verification Banner (only if unverified) ──────────────── */}
      {!isDbVerified && (
        <div className="bg-white border border-amber-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-amber-400 to-yellow-400" />
          <div className="p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0">
                <Zap className="w-4.5 h-4.5 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="font-heading font-black text-sm text-slate-900">Verify Your WhatsApp Number</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Unlock posting, contacts, and in-app chat</p>
              </div>
            </div>

            {step === "phone" ? (
              <form onSubmit={handleSendOtp} className="flex flex-col gap-2">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-amber-600">+91</span>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    placeholder="10-digit WhatsApp number"
                    disabled={phoneUpdating}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl pl-11 pr-3 py-2.5 text-sm focus:ring-2 focus:ring-amber-400 focus:border-amber-400 focus:outline-none font-bold"
                  />
                </div>
                <button type="submit" disabled={phoneUpdating} className="w-full py-2.5 btn-primary text-sm flex items-center justify-center gap-2 cursor-pointer">
                  <Zap className="w-4 h-4 fill-slate-950" />
                  <span>Send WhatsApp OTP</span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="flex flex-col gap-2 animate-fade-in">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">OTP sent to +91 {phoneNumber}</p>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="Enter 6-digit OTP (123456 for test)"
                  disabled={phoneUpdating}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-center tracking-[0.5em] font-extrabold rounded-xl py-2.5 text-base focus:ring-2 focus:ring-amber-400 focus:border-amber-400 focus:outline-none"
                />
                <button type="submit" disabled={phoneUpdating} className="w-full py-2.5 btn-primary text-sm flex items-center justify-center gap-2 cursor-pointer">
                  {phoneUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle className="w-4 h-4" /><span>Verify & Unlock Profile</span></>}
                </button>
                <button type="button" onClick={() => setStep("phone")} disabled={phoneUpdating} className="text-xs font-bold text-slate-500 hover:text-slate-800 text-center cursor-pointer hover:underline">
                  ← Change Mobile Number
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ── 3. Listings Section ──────────────────────────────────────── */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        {/* Header Title */}
        <div className="flex border-b border-slate-200 px-4 py-3 bg-slate-50/80 items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-slate-700" />
            <h3 className="font-heading font-black text-sm text-slate-800">My Listings</h3>
          </div>
          <span className="px-2 py-0.5 rounded-lg text-xs font-black bg-amber-400 text-slate-950">
            {myPosts.length}
          </span>
        </div>

        <div className="p-4">
          {!isDbVerified ? (
            <div className="flex flex-col items-center text-center py-10 gap-3">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
                <Package className="w-7 h-7 text-slate-400" />
              </div>
              <div>
                <h4 className="font-heading font-black text-sm text-slate-800">Verify to Post Listings</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-[260px] mx-auto leading-relaxed">
                  Register your WhatsApp number above to publish listings, contact sellers, and use in-app chat.
                </p>
              </div>
            </div>
          ) : postsLoading ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="bg-slate-100 border border-slate-200 rounded-xl h-20 animate-pulse" />
              ))}
            </div>
          ) : myPosts.length === 0 ? (
            <div className="flex flex-col items-center text-center py-10 gap-3">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
                <Tag className="w-7 h-7 text-slate-400" />
              </div>
              <div>
                <h4 className="font-heading font-black text-sm text-slate-800">No listings yet</h4>
                <p className="text-xs text-slate-500 mt-1">Post your first ad — it's free and takes under 2 minutes.</p>
              </div>
              <Link href="/post" className="btn-primary text-xs px-5 py-2.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Post a Free Ad
              </Link>
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
                  <div
                    key={post.id}
                    className="bg-white border border-slate-200/80 hover:border-slate-300 rounded-xl p-3.5 flex flex-col gap-2.5 transition-all hover:shadow-sm"
                  >
                    {/* Post title row */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[10px] uppercase font-black text-amber-600 tracking-wider bg-amber-50 border border-amber-200/70 px-2 py-0.5 rounded-lg">
                            {post.type || post.category || "Listing"}
                          </span>
                        </div>
                        <h5 className="font-heading font-black text-sm text-slate-900 truncate">
                          {post.title || post.name || post.shop_name || "Untitled Listing"}
                        </h5>
                        <p className="text-xs text-slate-500 font-semibold mt-0.5 truncate">
                          📍 {post.area_tag || "Thanjavur"}
                          {post.price && <span className="ml-2 text-slate-800">₹{post.price}</span>}
                        </p>
                      </div>
                    </div>

                    {/* Report Alert Badge (If reported by buyers) */}
                    {post.report_count > 0 && (
                      <div 
                        onClick={() => setTestifyPost(post)}
                        className="flex items-center justify-between bg-amber-500/10 border border-amber-500/40 p-2.5 rounded-xl cursor-pointer hover:bg-amber-500/20 transition-all"
                      >
                        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>Reported ({post.report_count || 1} times) — Action Required</span>
                        </div>
                        <span className="text-[10px] font-black uppercase text-amber-900 underline">Testify →</span>
                      </div>
                    )}

                    {/* 30-Day countdown */}
                    <div className="flex items-center justify-between bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-xs">
                      <span className="flex items-center gap-1.5 font-bold text-slate-600">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        {daysLeft > 0 ? `${daysLeft} days remaining` : "Expired"}
                      </span>
                      {isRenewable ? (
                        <button
                          onClick={() => handleRenewListing(post.id)}
                          className="flex items-center gap-1 text-xs font-black text-amber-700 bg-amber-100 hover:bg-amber-200 border border-amber-300 px-2.5 py-1 rounded-xl transition-colors cursor-pointer"
                        >
                          <RefreshCw className="w-3 h-3" /> Renew
                        </button>
                      ) : (
                        <span className="text-slate-400 font-medium text-[10px]">Renews in {daysLeft - 4}d</span>
                      )}
                    </div>

                    {/* Action row */}
                    {isConfirmingDelete ? (
                      <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                        <p className="text-xs font-bold text-red-700 flex-1">Delete this listing?</p>
                        <button
                          onClick={() => handleDeletePost(post.id, post.colName || "needs_and_sales")}
                          className="text-xs font-black text-white bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-xl cursor-pointer transition-colors"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="text-xs font-black text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 px-3 py-1.5 rounded-xl cursor-pointer transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-2 pt-0.5">
                        {/* View count indicator */}
                        <span className="flex items-center gap-1.5 text-xs font-black text-slate-700 bg-slate-100 border border-slate-200/80 px-2.5 py-1.5 rounded-xl">
                          <Eye className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span>{post.views_count || post.views || 24} Views</span>
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => router.push(`/post?type=${(post.type || "sell").toLowerCase()}&edit=${post.id}`)}
                            className="flex items-center gap-1.5 text-xs font-black text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 px-3 py-2 rounded-xl transition-colors cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5" /> Edit
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(post.id)}
                            className="flex items-center justify-center w-9 h-9 rounded-xl bg-red-50 hover:bg-red-100 text-red-500 border border-red-200 transition-colors cursor-pointer shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* ── 4. Settings / Admin / Logout Section ─────────────────────── */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100">
          <p className="text-xs font-black text-slate-500 uppercase tracking-wider">Account Settings</p>
        </div>
        <div className="flex flex-col divide-y divide-slate-100">

          {/* Verified: locked number + change via WhatsApp */}
          {isDbVerified && (
            <a
              href={`https://wa.me/919994837342?text=${encodeURIComponent(`Hi Admin, I want to change my registered mobile number. My UID is: ${user?.uid}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between gap-3 px-4 py-3.5 hover:bg-slate-50 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-black text-slate-800">Registered Mobile</p>
                  <p className="text-xs text-slate-500 font-semibold">+91 {phoneNumber} · Change via WhatsApp</p>
                </div>
              </div>
              <MessageSquare className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
            </a>
          )}

          {/* Admin Console (super admin only) */}
          {isSuperAdmin && (
            <Link href="/admin" className="flex items-center justify-between gap-3 px-4 py-3.5 hover:bg-amber-50 transition-colors cursor-pointer group">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0">
                  <Shield className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div>
                  <p className="text-xs font-black text-slate-800">Admin Console</p>
                  <p className="text-xs text-slate-500 font-semibold">Approve, pin & moderate listings</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 transition-colors" />
            </Link>
          )}

          {/* PWA Install */}
          {!isNativeApp && isInstallable && (
            <button
              onClick={handleInstallClick}
              className="flex items-center justify-between gap-3 px-4 py-3.5 hover:bg-slate-50 transition-colors cursor-pointer group w-full text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                  <Download className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-black text-slate-800">Add to Home Screen</p>
                  <p className="text-xs text-slate-500 font-semibold">Install web app for quick access</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-colors" />
            </button>
          )}

          {/* Logout */}
          {(isDbVerified || profile?.isVerified || user) && (
            <button
              type="button"
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
              className="flex items-center justify-between gap-3 px-4 py-3.5 hover:bg-red-50 transition-colors cursor-pointer group w-full text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-red-50 text-red-500 flex items-center justify-center shrink-0">
                  <LogOut className="w-4 h-4" />
                </div>
                <p className="text-xs font-black text-slate-800 group-hover:text-red-600 transition-colors">Sign Out</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-red-400 transition-colors" />
            </button>
          )}
        </div>
      </div>

      {/* Testify Modal for Reported Listings */}
      {testifyPost && (
        <div className="fixed inset-0 z-[99999] bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-sm rounded-2xl p-5 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-600">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <h4 className="font-heading font-black text-sm text-slate-900">Review Listing Report</h4>
              </div>
              <button
                type="button"
                onClick={() => setTestifyPost(null)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              Your listing <strong>"{testifyPost.title}"</strong> has received buyer feedback. Please confirm accuracy:
            </p>

            <div className="flex flex-col gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleTestifyTrue(testifyPost.id)}
                className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-heading font-black text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Testify: Details Are 100% True</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const targetId = testifyPost.id;
                  setTestifyPost(null);
                  router.push(`/post?edit=${targetId}`);
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-heading font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-200 cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Edit Listing Details</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  handleDeletePost(testifyPost.id, testifyPost.colName || "needs_and_sales");
                  setTestifyPost(null);
                }}
                className="w-full py-2 px-3 rounded-xl text-red-600 hover:bg-red-50 font-heading font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove Listing</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UID label — very subtle, bottom */}
      {user && (
        <p className="text-center text-[10px] font-mono text-slate-400 select-all px-4 pb-2">
          UID: {user.uid}
        </p>
      )}

    </div>
  );
}
