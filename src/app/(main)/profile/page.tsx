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
  LogOut
} from "lucide-react";
import confetti from "canvas-confetti";

export default function ProfilePage() {
  const { user, profile, loading: authLoading, updatePhone, signOutUser } = useAuth();
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneUpdating, setPhoneUpdating] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [displayNameUpdating, setDisplayNameUpdating] = useState(false);

  // WhatsApp verification state variables
  const [verificationToken, setVerificationToken] = useState<string | null>(null);
  const [verificationPending, setVerificationPending] = useState(false);
  const [isDbVerified, setIsDbVerified] = useState(false);

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
    if (!user) return;
    if (!displayName.trim()) {
      alert("Please enter a display name.");
      return;
    }
    setDisplayNameUpdating(true);
    try {
      const { doc, setDoc } = await import("firebase/firestore");
      const userRef = doc(db, "users", user.uid);
      await setDoc(userRef, { displayName: displayName.trim() }, { merge: true });
      confetti({ particleCount: 30, spread: 30 });
      alert("Profile name updated successfully!");
    } catch (error) {
      console.error("Error saving name:", error);
      alert("Failed to update profile name.");
    } finally {
      setDisplayNameUpdating(false);
    }
  };

  // Phase 1 WhatsApp Verification Token Generator
  const handleInitiateWhatsAppVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber || phoneNumber.length !== 10) {
      alert("Please enter a valid 10-digit phone number.");
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
          confetti({
            particleCount: 150,
            spread: 80,
            origin: { y: 0.6 },
          });
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
      confetti({ particleCount: 50, spread: 60 });
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
      confetti({ particleCount: 20, colors: ["#ef4444"] });
    } catch (error) {
      console.error("Error deleting post:", error);
      alert("Failed to delete post.");
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
    <div className="flex flex-col gap-6 mt-6 md:mt-8 pt-2 pb-12">
      {/* ==========================================
          HERO BANNER WIDGET: PROFILE
          ========================================== */}
      <div className="relative overflow-hidden bg-gradient-to-br from-yellow-600/10 to-amber-500/10 border border-yellow-500/20 rounded-3xl p-5 shadow-sm flex flex-col gap-1.5 animate-fade-in text-slate-800">
        <div className="absolute top-[-30px] right-[-30px] w-28 h-28 rounded-full bg-yellow-500/10 blur-xl pointer-events-none" />
        <div className="absolute bottom-[-20px] left-[-20px] w-24 h-24 rounded-full bg-amber-500/10 blur-xl pointer-events-none" />

        <div className="relative z-10">
          <span className="text-[9px] font-black uppercase tracking-wider text-yellow-800 bg-yellow-500/10 border border-yellow-250/60 px-2.5 py-1 rounded-full inline-block">
            User Dashboard
          </span>
          <h2 className="font-heading font-black text-lg text-slate-900 mt-2.5 leading-tight">
            Namma Thanjai Account
          </h2>
          <p className="text-[11px] text-slate-600 mt-1 max-w-[280px] leading-relaxed font-semibold">
            Link your WhatsApp account to post ads, manage active directory items, and access admin rights.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* Left Column: Profile settings, installation and instructions (1/3 width) */}
        <div className="md:col-span-1 flex flex-col gap-5">
          {/* 1. Profile / Phone Verification Info */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex flex-col gap-3.5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center border border-amber-500/20 shadow-inner">
                <User className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-heading font-extrabold text-sm text-slate-900">{profile?.displayName || "Resident Guest"}</h3>
                <p className="text-[10px] text-slate-500 truncate max-w-[150px]">UID: {user?.uid}</p>
              </div>
            </div>

            {/* Subscription badge */}
            <div className="bg-yellow-50 border border-yellow-250/60 rounded-xl p-3 flex flex-col gap-1 shadow-2xs">
              <span className="text-[9px] font-black text-yellow-755 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 fill-yellow-500 stroke-none" />
                Subscription: <span className="line-through text-slate-400 font-normal">₹100</span> Free
              </span>
              <p className="text-[9px] text-slate-500 leading-normal font-bold">
                Active listings will be automatically removed after 30 days.
              </p>
            </div>

            {/* Profile Display Name Edit Form */}
            <div className="flex flex-col gap-1.5 border-t border-slate-100 pt-2.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                Profile Display Name
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter your name"
                  disabled={displayNameUpdating}
                  className="flex-1 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-3 py-1.5 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none font-bold"
                />
                <button
                  type="button"
                  onClick={handleSaveDisplayName}
                  disabled={displayNameUpdating}
                  className="bg-yellow-500 hover:bg-yellow-600 active:scale-95 text-slate-955 font-black px-3.5 py-1.5 rounded-xl text-xs transition-all shadow-xs cursor-pointer border border-yellow-450"
                >
                  Save
                </button>
              </div>
            </div>

            {/* Verification Status */}
            {isDbVerified ? (
              <div className="flex flex-col gap-2 border-t border-slate-100 pt-2.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                  Registered Mobile Number (Locked)
                </label>
                <div className="flex items-center justify-between bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 px-3 py-2.5 rounded-xl text-xs font-semibold">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span className="truncate max-w-[150px] font-bold">+{profile?.phone || phoneNumber}</span>
                  </div>
                  {profile?.isAdmin && (
                    <span className="text-[9px] bg-amber-500/20 text-amber-700 border border-amber-500/30 px-2 py-0.5 rounded-md flex items-center gap-1 font-black uppercase shrink-0">
                      <ShieldCheck className="w-3 h-3" />
                      Admin
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => alert("Your request to change your registered mobile number has been submitted to support. Admin will contact you on WhatsApp.")}
                  className="text-[10px] font-bold text-yellow-600 hover:text-yellow-750 text-left cursor-pointer hover:underline pt-0.5"
                >
                  Request Mobile Number Change →
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <label className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-amber-600" />
                  WhatsApp Verification
                </label>
                
                {!verificationPending ? (
                  <form onSubmit={handleInitiateWhatsAppVerify} className="flex flex-col gap-2">
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">+91</span>
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="10-digit number"
                        disabled={phoneUpdating}
                        className="w-full bg-white border border-slate-200 text-slate-900 rounded-lg pl-10 pr-2 py-1.5 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none font-bold"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={phoneUpdating}
                      className="bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-bold w-full py-2 rounded-lg text-xs transition-all shadow-sm"
                    >
                      Verify WhatsApp
                    </button>
                  </form>
                ) : (
                  <div className="flex flex-col gap-3">
                    {/* Pending Verification Widget */}
                    <div className="flex flex-col gap-1.5 bg-white p-3 rounded-lg border border-slate-200 text-center text-xs">
                      <span className="text-amber-600 font-extrabold text-sm">{verificationToken}</span>
                      <span className="text-[10px] text-slate-500">
                        Send token on WhatsApp.
                      </span>
                      
                      {/* WhatsApp Action Button */}
                      <a
                        href={`https://wa.me/${process.env.NEXT_PUBLIC_ADMIN_PHONE || "919994837342"}?text=${encodeURIComponent(`Verify Namma Thanjai App: ${verificationToken}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded-xl text-xs font-bold mt-2 shadow-md"
                      >
                        <MessageSquare className="w-4 h-4 fill-current stroke-none" />
                        <span>Send Text Code</span>
                      </a>
                    </div>
 
                    {/* Meta Webhook Simulation Widget */}
                    <div className="border border-dashed border-slate-300 rounded-xl p-3 flex flex-col gap-2 bg-slate-50 text-center">
                      <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest flex items-center justify-center gap-1">
                        <Zap className="w-3 h-3 fill-current" />
                        AI Webhook Simulator
                      </span>
                      <p className="text-[9px] text-slate-500 leading-normal">
                        Meta Cloud webhook hasn't caught the WhatsApp message? Run the simulation to trigger verification.
                      </p>
                      <button
                        onClick={handleSimulateWebhook}
                        disabled={phoneUpdating}
                        className="w-full bg-slate-200 hover:bg-slate-300 text-slate-700 border border-slate-300 font-bold py-1.5 rounded-lg text-[10px] transition-colors"
                      >
                        {phoneUpdating ? "Verifying..." : "Simulate Verification Hook"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Logout / Switch Mobile Button */}
            <div className="border-t border-slate-100 pt-3 mt-1">
              <button
                type="button"
                onClick={async () => {
                  await signOutUser();
                  router.push("/");
                }}
                className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 font-black px-4 py-2.5 rounded-xl text-xs transition-all shadow-xs cursor-pointer active:scale-95"
              >
                <LogOut className="w-4 h-4 text-red-600" />
                <span>Logout / Switch Mobile Number</span>
              </button>
            </div>
          </div>

          {/* 2. PWA INSTALL WIDGET CARD */}
          {isInstallable && (
            <div className="bg-gradient-to-tr from-amber-600 to-amber-400 text-slate-950 rounded-2xl p-4 shadow-md flex flex-col gap-3 relative overflow-hidden">
              <div className="absolute top-[-20px] right-[-20px] opacity-10">
                <Download className="w-32 h-32 text-slate-950" />
              </div>
              <div className="relative z-10">
                <h4 className="font-heading font-black text-sm flex items-center gap-1.5 text-slate-955 font-bold">
                  <Sparkles className="w-4 h-4 text-amber-100 animate-pulse fill-current" />
                  Install Namma Thanjai App
                </h4>
                <p className="text-[11px] text-slate-900 mt-1 leading-relaxed">
                  Add our hyper-local directory to your mobile home screen. It loads instantly and uses zero storage!
                </p>
              </div>
              <button
                onClick={handleInstallClick}
                className="w-full bg-slate-950 hover:bg-slate-900 text-white font-bold py-2 rounded-xl text-xs transition-colors shadow-md relative z-10 active:scale-[0.98]"
              >
                Install App Widget
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
     
                        {/* Delete Trigger */}
                        <button
                          onClick={() => handleDeletePost(post.id, post.colName)}
                          className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-colors shrink-0 cursor-pointer"
                          title="Delete Listing"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
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
    </div>
  );
}
