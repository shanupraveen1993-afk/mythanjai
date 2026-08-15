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
  Pencil,
  Shield,
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

  // PWA Install prompt states
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  // Listen to Firestore profile changes in real-time on Profile Page to trigger visual verification cues
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
    return () =>
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  // Fetch user posts from all collections
  const fetchMyPosts = async () => {
    if (!user) return;
    setPostsLoading(true);
    const collectionsToQuery = ["needs_and_sales", "services", "shops", "offers"];
    const allFetchedPosts: any[] = [];

    try {
      for (const colName of collectionsToQuery) {
        const colRef = collection(db, colName);
        const q = query(colRef, where("userId", "==", user.uid));
        const querySnapshot = await getDocs(q);

        querySnapshot.forEach((docSnap) => {
          allFetchedPosts.push({
            id: docSnap.id,
            colName,
            ...docSnap.data(),
          });
        });
      }
      setMyPosts(allFetchedPosts);
    } catch (error) {
      console.error("Error fetching my posts:", error);
    } finally {
      setPostsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchMyPosts();
    }
  }, [user]);

  // Sync profile details to local state
  useEffect(() => {
    if (profile?.phone) {
      setPhoneNumber(profile.phone.replace(/^91/, ""));
    }
    if (profile?.isVerified) {
      setIsDbVerified(true);
    }
    if (profile?.displayName) {
      setDisplayName(profile.displayName);
    } else if (user?.displayName) {
      setDisplayName(user.displayName);
    }
  }, [profile, user]);

  const handleSaveDisplayName = async () => {
    if (!displayName.trim()) {
      toast.error("Please enter a name.");
      return;
    }
    setDisplayNameUpdating(true);
    try {
      await updateDisplayName(displayName);
      setIsEditingName(false);
      toast.success("Profile name updated successfully!");
      try {
        const confetti = (await import("canvas-confetti")).default;
        confetti({ particleCount: 30, spread: 30 });
      } catch (err) {}
    } catch (error) {
      console.error("Error saving name:", error);
      toast.error("Failed to update profile name.");
    } finally {
      setDisplayNameUpdating(false);
    }
  };

  // Phase 1 WhatsApp Verification Token Generator
  const handleInitiateWhatsAppVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber || phoneNumber.length !== 10) {
      toast.error("Please enter a valid 10-digit phone number.");
      return;
    }

    setPhoneUpdating(true);
    try {
      // 1. Generate token TNJ-XXXX
      const token = `TNJ-${Math.floor(1000 + Math.random() * 9000)}`;
      setVerificationToken(token);

      // 2. Save token and pending status to Firestore user profile
      if (user) {
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, {
          verificationToken: token,
          isVerified: false,
          phone: `91${phoneNumber}`,
        });
      }

      setVerificationPending(true);
      
      // 3. Trigger WhatsApp Deep Link
      const adminPhone = process.env.NEXT_PUBLIC_ADMIN_PHONE || "919994837342";
      const waUrl = `https://wa.me/${adminPhone}?text=${encodeURIComponent(
        `Verify My Thanjai App: ${token}`
      )}`;
      
      // Open link in new tab
      window.open(waUrl, "_blank");
    } catch (error) {
      console.error("WhatsApp Verification initialization failed:", error);
    } finally {
      setPhoneUpdating(false);
    }
  };

  // Phase 1 Webhook Simulator (to test token matching and verify user immediately)
  const handleSimulateWebhook = async () => {
    if (!user || !verificationToken) return;
    setPhoneUpdating(true);

    try {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const data = userSnap.data();
        
        // Match the token
        if (data.verificationToken === verificationToken) {
          const adminPhone = process.env.NEXT_PUBLIC_ADMIN_PHONE?.replace(/\D/g, "");
          const isUserAdmin = data.phone?.replace(/\D/g, "") === adminPhone;

          // Update verified state in database (replicates webhook webhook action)
          await updateDoc(userRef, {
            isVerified: true,
            isAdmin: isUserAdmin,
          });

          setIsDbVerified(true);
          setVerificationPending(false);
          toast.success("Mobile number verified successfully!");
          try {
            const confetti = (await import("canvas-confetti")).default;
            confetti({
              particleCount: 150,
              spread: 80,
              origin: { y: 0.6 },
            });
          } catch (err) {}
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
      try {
        const confetti = (await import("canvas-confetti")).default;
        confetti({ particleCount: 50, spread: 60 });
      } catch (err) {}
    }
  };

  const handleDeletePost = async (id: string, colName: string) => {
    if (!confirm("Are you sure you want to delete this listing?")) {
      return;
    }

    try {
      const docRef = doc(db, colName, id);
      await deleteDoc(docRef);
      setMyPosts((prev) => prev.filter((p) => p.id !== id));
      toast.success("Listing deleted successfully!");
      try {
        const confetti = (await import("canvas-confetti")).default;
        confetti({ particleCount: 20, colors: ["#ef4444"] });
      } catch (err) {}
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error("Failed to delete post.");
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 mt-4 pt-2 pb-12">

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* Left Column: Profile settings, installation and instructions (1/3 width) */}
        <div className="md:col-span-1 flex flex-col gap-5">
          {/* Profile / Phone Verification Info */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex flex-col gap-3.5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center border border-amber-500/20 shadow-inner shrink-0">
                <User className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                {isEditingName ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveDisplayName();
                      }}
                      placeholder="Enter your name"
                      disabled={displayNameUpdating}
                      autoFocus
                      className="px-2 py-1 text-xs font-bold text-slate-900 border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-yellow-500 w-full"
                    />
                    <button
                      type="button"
                      onClick={handleSaveDisplayName}
                      disabled={displayNameUpdating}
                      className="w-7 h-7 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-slate-955 flex items-center justify-center transition-all cursor-pointer border border-yellow-400 shrink-0 shadow-2xs"
                      title="Save Name (Press Enter)"
                    >
                      {displayNameUpdating ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4 stroke-[2.5]" />
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-heading font-bold text-sm sm:text-base text-slate-900 line-clamp-1">
                        {profile?.displayName || displayName || "Resident Guest"}
                      </h3>
                      <p className="text-[10px] text-slate-500 truncate max-w-[140px]">UID: {user?.uid}</p>
                    </div>
                    <button
                      onClick={() => setIsEditingName(true)}
                      className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer shrink-0"
                      title="Edit Name"
                    >
                      <Pencil className="w-4 h-4 text-slate-500" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Account Subscription & Listing Policy Card */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 flex flex-col gap-1.5 font-sans">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-yellow-600 fill-yellow-500 shrink-0" />
                  <span>Account Plan</span>
                </span>
                <span className="font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-md text-[11px] flex items-center gap-1">
                  <span className="line-through text-slate-400 font-medium">₹100</span>
                  <span>₹0 Free</span>
                </span>
              </div>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                Active listings remain live for <strong className="text-slate-900 font-semibold">30 days</strong>.
              </p>
            </div>

            {/* Verification Status */}
            {isDbVerified ? (
              <div className="flex flex-col gap-2 border-t border-slate-100 pt-2.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Registered Mobile Number (Locked)
                </label>
                <div className="flex items-center justify-between bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 px-3 py-2.5 rounded-xl text-xs font-semibold">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span className="truncate max-w-[150px] font-bold">+{profile?.phone || phoneNumber}</span>
                  </div>
                  {isSuperAdmin && (
                    <span className="text-[9px] bg-amber-500/20 text-amber-700 border border-amber-500/30 px-2 py-0.5 rounded-md flex items-center gap-1 font-bold uppercase shrink-0">
                      <ShieldCheck className="w-3 h-3" />
                      Admin
                    </span>
                  )}
                </div>
                <a
                  href={`https://wa.me/919994837342?text=${encodeURIComponent(`Hi Admin, I want to change my registered mobile number. My UID is: ${user?.uid}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] font-bold text-amber-700 hover:text-amber-800 text-left cursor-pointer hover:underline pt-0.5 flex items-center gap-1"
                >
                  <MessageSquare className="w-3 h-3" />
                  Request Mobile Number Change via WhatsApp →
                </a>
              </div>
            ) : (
              <div className="flex flex-col gap-3 bg-gradient-to-br from-amber-500/10 via-yellow-500/5 to-amber-500/10 p-4 rounded-2xl border border-amber-500/30 shadow-md font-sans">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-heading font-black text-slate-955 flex items-center gap-1.5 uppercase tracking-wide">
                    <Sparkles className="w-4 h-4 text-amber-500 fill-yellow-400 shrink-0" />
                    <span>Register WhatsApp Mobile</span>
                  </label>
                  <span className="text-[9px] font-extrabold bg-amber-500/20 text-amber-800 border border-amber-500/30 px-2 py-0.5 rounded-md">Free Member</span>
                </div>
                <p className="text-[11px] text-slate-600 font-medium">Verify your WhatsApp number to unlock full marketplace contact details, post listings, & chat.</p>

                {!verificationPending ? (
                  <form onSubmit={handleInitiateWhatsAppVerify} className="flex flex-col gap-2">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-amber-600">+91</span>
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="Enter 10-digit WhatsApp No"
                        disabled={phoneUpdating}
                        className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl pl-11 pr-3 py-2 text-xs focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:outline-none font-bold shadow-2xs"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={phoneUpdating}
                      className="bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-500 hover:brightness-105 active:scale-95 text-slate-955 font-heading font-black w-full py-2.5 rounded-xl text-xs transition-all border border-yellow-400 shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      {phoneUpdating ? (
                        <Loader2 className="w-4 h-4 animate-spin text-slate-955" />
                      ) : (
                        <>
                          <Zap className="w-4 h-4 text-slate-955 fill-slate-955" />
                          <span>Verify WhatsApp & Unlock</span>
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1.5 bg-white p-3.5 rounded-xl border border-amber-300/80 text-center text-xs shadow-sm">
                      <span className="text-amber-600 font-black text-base tracking-widest">{verificationToken}</span>
                      <span className="text-[10px] text-slate-500 font-bold">Click below to send verification code on WhatsApp.</span>
                      <a
                        href={`https://wa.me/${process.env.NEXT_PUBLIC_ADMIN_PHONE || "919994837342"}?text=${encodeURIComponent(`Verify Namma Thanjai App: ${verificationToken}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white py-2.5 rounded-xl text-xs font-black mt-2 shadow-md transition-all active:scale-95"
                      >
                        <MessageSquare className="w-4 h-4 fill-current stroke-none" />
                        <span>Send WhatsApp Code →</span>
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* DEDICATED ADMIN CONSOLE BANNER FOR 9994837342 */}
            {isSuperAdmin && (
              <div className="bg-gradient-to-br from-amber-500/10 via-yellow-500/15 to-amber-600/10 border border-amber-500/30 rounded-2xl p-4 flex flex-col gap-3 shadow-xs font-sans">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-955 flex items-center justify-center font-bold shadow-xs shrink-0">
                    <Shield className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <div>
                    <h4 className="font-heading font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
                      <span>Admin Moderation & Video Console</span>
                      <span className="bg-amber-500 text-slate-955 text-[8px] font-black px-1.5 py-0.5 rounded uppercase">9994837342</span>
                    </h4>
                    <p className="text-[10px] text-slate-600 font-medium leading-tight mt-0.5">
                      Approve listings, pin featured deals & upload promo videos to Firebase.
                    </p>
                  </div>
                </div>

                <Link
                  href="/admin"
                  className="w-full py-2.5 bg-yellow-500 hover:bg-yellow-400 text-slate-955 font-heading font-extrabold text-xs uppercase tracking-wider rounded-xl border border-yellow-400 shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-98"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Open Admin Console →</span>
                </Link>
              </div>
            )}
          </div>

          {/* PWA INSTALL WIDGET CARD */}
          {isInstallable && (
            <div className="bg-gradient-to-tr from-amber-600 to-amber-400 text-slate-950 rounded-2xl p-4 shadow-md flex flex-col gap-3 relative overflow-hidden">
              <div className="absolute top-[-20px] right-[-20px] opacity-10">
                <Download className="w-32 h-32 text-slate-950" />
              </div>
              <div className="relative z-10">
                <h4 className="font-heading font-black text-sm flex items-center gap-1.5 text-slate-955 font-bold">
                  <Sparkles className="w-4 h-4 text-amber-100 animate-pulse fill-current" />
                  No Download Needed!
                </h4>
                <p className="text-[11px] text-slate-900 mt-1 leading-relaxed">
                  Click here to add Namma Thanjai directly to your home screen — instant access, zero storage!
                </p>
              </div>
              <button
                onClick={handleInstallClick}
                className="w-full bg-slate-950 hover:bg-slate-900 text-white font-bold py-2 rounded-xl text-xs transition-colors shadow-md relative z-10 active:scale-[0.98]"
              >
                🚀 Add to Home Screen
              </button>
            </div>
          )}

          {/* iOS Safari PWA Instructions banner */}
          {isIOS && (
            <div className="bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-2xl p-4 shadow-xs flex gap-3 items-start">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold">Install on iPhone / Safari</h4>
                <p className="text-[10px] text-muted-foreground mt-1 leading-normal">
                  Tap the **Share** button in Safari, then select **Add to Home Screen**.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: My Listings & Saved Bookmarks (2/3 width) */}
        <div className="md:col-span-2 flex flex-col gap-4">
          {!isDbVerified ? (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 flex flex-col gap-5 text-center items-center shadow-sm">
              <div className="w-16 h-16 rounded-full bg-yellow-500/10 text-yellow-600 flex items-center justify-center border border-yellow-250/60 shadow-xs animate-bounce-slow shrink-0">
                <Sparkles className="w-8 h-8" />
              </div>
              <div>
                <h3 className="font-heading font-black text-base text-slate-900">
                  Register Your Namma Thanjai Account
                </h3>
                <p className="text-xs text-slate-500 max-w-[320px] mx-auto mt-2 leading-relaxed">
                  Join our local community directory to publish advertisements, post jobs, showcase your trades/skills, and list your business shops live!
                </p>
              </div>
              <div className="bg-yellow-50 border border-yellow-200/60 rounded-2xl p-4 w-full text-xs text-slate-600 text-left flex flex-col gap-1.5">
                <span className="font-bold text-yellow-800">Benefits of registering:</span>
                <span>• Register your business and list items on local directory maps</span>
                <span>• Upload photos of your products, items, and campaign deals</span>
                <span>• Format descriptions and text instantly using Gemini AI</span>
                <span>• Manage, update, and delete active listings from this dashboard</span>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 flex flex-col gap-4 shadow-sm">
              
              {/* Tabs: My Listings vs Saved Posts */}
              <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  onClick={() => setProfileTab("my_posts")}
                  className={`flex-1 py-1.5 text-xs font-black rounded-lg transition-all cursor-pointer ${
                    profileTab === "my_posts" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  My Active Listings ({myPosts.length})
                </button>
                <button
                  onClick={() => setProfileTab("saved_posts")}
                  className={`flex-1 py-1.5 text-xs font-black rounded-lg transition-all cursor-pointer ${
                    profileTab === "saved_posts" ? "bg-yellow-500 text-slate-955 shadow-2xs" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Saved Bookmarks ({savedPosts.length})
                </button>
              </div>

              {profileTab === "my_posts" ? (
                postsLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[1, 2].map((n) => (
                      <div key={n} className="bg-slate-50 border border-slate-100 rounded-xl p-3 h-16 animate-pulse" />
                    ))}
                  </div>
                ) : myPosts.length === 0 ? (
                  <div className="text-center py-10 border border-dashed border-slate-200 rounded-2xl text-xs text-slate-500 bg-slate-50">
                    You haven't posted any directory listings yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {myPosts.map((post) => (
                      <div
                        key={post.id}
                        className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 shadow-xs flex items-center justify-between gap-3 hover:shadow-md transition-shadow animate-fade-in"
                      >
                        <div className="flex-1 min-w-0">
                          <span className="text-[9px] uppercase font-bold text-amber-600 tracking-wider">
                            {post.colName?.replace(/_/g, " ")}
                          </span>
                          <h5 className="font-bold text-xs text-slate-800 truncate mt-0.5">
                            {post.title || post.name || post.shop_name || "Untitled Listing"}
                          </h5>
                          <span className="text-[10px] text-slate-500 block mt-0.5">
                            {post.area_tag}
                          </span>
                        </div>
     
                        {/* Edit & Delete Triggers */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => router.push(`/post/sell?edit=${post.id}&col=${post.colName}`)}
                            className="px-2.5 py-1.5 rounded-xl bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-750 transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold border border-yellow-500/30"
                            title="Edit Listing"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => handleDeletePost(post.id, post.colName)}
                            className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-colors shrink-0 cursor-pointer border border-red-200"
                            title="Delete Listing"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                /* Saved Bookmarks List */
                savedPosts.length === 0 ? (
                  <div className="text-center py-10 border border-dashed border-slate-200 rounded-2xl text-xs text-slate-500 bg-slate-50">
                    No saved posts yet. Click the bookmark icon on any listing card to save it here!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {savedPosts.map((post) => (
                      <div
                        key={post.id}
                        className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 shadow-xs flex items-center justify-between gap-3 hover:shadow-md transition-shadow animate-fade-in"
                      >
                        <div className="flex-1 min-w-0">
                          <span className="text-[9px] uppercase font-bold text-yellow-750 tracking-wider">
                            Saved Item
                          </span>
                          <h5 className="font-bold text-xs text-slate-800 truncate mt-0.5">
                            {post.title || post.name || "Saved Listing"}
                          </h5>
                          <span className="text-[10px] text-slate-500 block mt-0.5">
                            {post.area_tag || post.location || "Thanjavur"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}

            </div>
          )}
        </div>
      </div>

      {/* Centered Small Logout Button at Bottom (Only for Logged-In Users) */}
      {user && (
        <div className="flex justify-center pt-8 pb-4 w-full">
          <button
            type="button"
            onClick={async () => {
              await signOutUser();
              if (typeof window !== "undefined") {
                localStorage.removeItem("namma_thanjai_guest_mode");
                localStorage.removeItem("namma_thanjai_has_seen_walkthrough_v3");
                window.location.href = "/";
              }
            }}
            className="flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-red-50 hover:border-red-200 text-slate-600 hover:text-red-600 border border-slate-200 text-xs font-bold px-5 py-2 rounded-full transition-all shadow-2xs cursor-pointer active:scale-95"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout Account</span>
          </button>
        </div>
      )}
    </div>
  );
}
