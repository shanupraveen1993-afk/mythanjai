"use client";

import React, { useState, useEffect } from "react";
import { MapPin, Plus, User, ShieldCheck, Check, MessageSquare, Globe, Download, Menu, X, ArrowLeft, Package, Bookmark, Tag, Search, Wrench, Store } from "lucide-react";
import { TANJORE_LOCALITIES, TanjoreLocality } from "@/lib/constants";
import SearchableAreaDropdown from "./SearchableAreaDropdown";
import { AppTab } from "./BottomTabBar";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/context/ToastContext";
import { useLanguage } from "@/context/LanguageContext";
import { useBackNavigation } from "@/hooks/use-back-navigation";
import { useScrollDirection } from "@/hooks/use-scroll-direction";
import { Bell } from "lucide-react";
import UniversalSearchBar from "./UniversalSearchBar";

interface TopHeaderProps {
  selectedArea: TanjoreLocality | "All Areas";
  onAreaChange: (area: TanjoreLocality | "All Areas") => void;
  onPostClick: () => void;
  onSignInClick: () => void;
  activeTab?: AppTab;
  onTabChange?: (tab: AppTab) => void;
}

export default function TopHeader({
  selectedArea,
  onAreaChange,
  onPostClick,
  onSignInClick,
  activeTab,
  onTabChange,
}: TopHeaderProps) {
  const router = useRouter();
  const pathname = usePathname() || "";
  const { user, profile, isVerified } = useAuth();
  const { lang, toggleLanguage, t } = useLanguage();
  const { scrollDirection, isAtTop } = useScrollDirection();

  const [profileTab, setProfileTab] = useState<string | null>(null);
  const [showDownloadBtn, setShowDownloadBtn] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isNative = Boolean((window as any).Capacitor?.isNativePlatform() || window.navigator.userAgent.includes("Capacitor"));
      const isDownloaded = Boolean(localStorage.getItem("namma_thanjai_apk_downloaded"));
      if (!isNative && !isDownloaded) {
        setShowDownloadBtn(true);
      }
    }
  }, []);

  const handleDownloadClick = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("namma_thanjai_apk_downloaded", "true");
    }
    setShowDownloadBtn(false);
  };

  const [unreadChatCount, setUnreadChatCount] = useState<number>(0);

  // Dynamic real-time snapshot listener for unread chat messages for logged in user
  useEffect(() => {
    if (!user && !profile?.phone) { setUnreadChatCount(0); return; }
    let unsubscribe: any = null;
    const cleanPhone = (profile?.phone || "").replace(/\D/g, "").slice(-10);
    const memberId = profile?.memberId || "";

    import("firebase/firestore").then(({ collection, onSnapshot }) => {
      import("@/lib/firebase").then(({ db }) => {
        const notifRef = collection(db, "notifications");
        unsubscribe = onSnapshot(notifRef, (snapshot) => {
          let count = 0;
          snapshot.forEach((docSnap) => {
            const d = docSnap.data();
            const recipPhone = (d.recipientPhone || "").replace(/\D/g, "").slice(-10);
            const isRecip = (user?.uid && d.recipientId === user.uid) ||
              (memberId && d.recipientId === memberId) ||
              (cleanPhone && recipPhone === cleanPhone);
            if (isRecip && !d.read) {
              count++;
            }
          });
          setUnreadChatCount(count);
        });
      });
    });

    return () => { if (unsubscribe) unsubscribe(); };
  }, [user, profile?.phone, profile?.memberId]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      setProfileTab(params.get("tab") || params.get("view"));
    }
  }, [pathname]);

  // Web App Back Button Navigation Handler
  useBackNavigation();

  const isAuthVerified = isVerified;
  const showCenterNav = pathname !== "/onboarding" && pathname !== "/chat";

  const phoneDisplay = profile?.phone ? `+${profile.phone}` : "+919994837342";
  const isHomePage = pathname === "/";

  // Contextual Post Ad CTA info for Web App & Desktop
  const postInfo = React.useMemo(() => {
    if (pathname.includes("/need")) {
      return { mobileLabel: "Post Ad", desktopLabel: "Post Wanted Ad", route: "/post/need" };
    }
    if (pathname.includes("/services")) {
      return { mobileLabel: "Post Ad", desktopLabel: "Post Service", route: "/post/service" };
    }
    if (pathname.includes("/shops") || pathname.includes("/offers")) {
      return { mobileLabel: "Post Ad", desktopLabel: "Post Store Offer", route: "/post/offer" };
    }
    return { mobileLabel: "Post Ad", desktopLabel: "Post Sell Ad", route: "/post/sell" };
  }, [pathname]);

  const getSubPageTitle = React.useCallback(() => {
    if (pathname.includes("/profile")) {
      return profileTab === "listings" ? "My Ads" : profileTab === "saved" ? "Saved Items" : "My Profile";
    }
    if (pathname.includes("/post")) return "Post a Free Ad";
    if (pathname.includes("/chat")) return "Direct Messages";
    if (pathname.includes("/listings")) return "My Ads";
    if (pathname.includes("/need")) return "Wanted Ads";
    if (pathname.includes("/services")) return "Services";
    if (pathname.includes("/shops") || pathname.includes("/offers")) return "Store Offers";
    if (pathname.includes("/search")) return "Search Results";
    if (pathname.includes("/classifieds")) return "Classifieds";
    return "Namma Thanjai";
  }, [pathname, profileTab]);

  const handleDynamicPostClick = () => {
    if (!isAuthVerified) {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("namma_thanjai_open_signin"));
      }
      return;
    }
    router.push(postInfo.route);
  };

  // Hamburger Menu Drawer state for Web App
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  // Native APK detection — hide Get App when running inside Capacitor
  const [isNativeApp, setIsNativeApp] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const cap = (window as any).Capacitor;
        if (cap && cap.isNativePlatform && cap.isNativePlatform()) {
          setIsNativeApp(true);
        }
      } catch (e) {}
    }
  }, []);

  const handleGetAppClick = () => {
    // no-op persistence, kept for backward compat
  };

  const isSubPageWithBack = !isHomePage && (pathname.includes("/post") || pathname.includes("/chat") || pathname.includes("/listings") || pathname.includes("/profile") || pathname.includes("/search"));

  return (
    <header
      className={`relative w-full z-50 bg-[#1F244A]/[0.03] backdrop-blur-xl text-slate-900 flex-col justify-end border-b border-slate-200/90 shadow-2xs rounded-b-2xl sm:rounded-b-3xl md:rounded-b-none ${
        pathname?.startsWith("/post") ? "hidden" : pathname?.startsWith("/chat") ? "hidden md:flex" : "flex"
      }`}
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
    >
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 py-2 flex items-center justify-between gap-2.5 sm:gap-4 relative">

        {/* Left Side Cluster: Logo Image + Desktop Search Bar */}
        <div className="flex items-center gap-3 sm:gap-4 shrink-0 z-20">
          <div
            onClick={() => router.push("/")}
            className="flex items-center cursor-pointer shrink-0 group select-none"
          >
            <div className="h-8 sm:h-9 w-auto flex items-center justify-center shrink-0">
              <img src="/namma_thanjai_logo.png" alt="Namma Thanjai Logo" className="h-full w-auto object-contain max-h-8 sm:max-h-9 rounded-xl shadow-2xs border border-slate-200/60" />
            </div>
          </div>
          {/* Desktop Search Bar (Left Aligned Directly Next to Logo) */}
          <div className="hidden md:block w-64 lg:w-80 shrink-0">
            <UniversalSearchBar />
          </div>
        </div>

        {/* Desktop Header Center: 4 Category Tabs (Center Aligned Segmented Filled Pill Nav Bar) */}
        <div className="hidden md:flex items-center justify-center z-20 flex-1 min-w-0 mx-4">
          <div className="flex items-center gap-1.5 font-heading bg-slate-100/80 p-1 rounded-full border border-slate-200/80">
            {/* For Sale Tab */}
            {(() => {
              const isActive = pathname === "/" || pathname === "/home" || pathname.includes("/sell");
              return (
                <button
                  type="button"
                  onClick={() => router.push("/")}
                  className={`px-4 py-1.5 text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center gap-1.5 select-none rounded-full whitespace-nowrap ${
                    isActive
                      ? "bg-[#0F172A] text-white shadow-2xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                  }`}
                >
                  <Tag className={`w-3.5 h-3.5 ${isActive ? "text-amber-400 stroke-[2.5]" : "text-slate-500 stroke-[2]"}`} />
                  <span>For Sale</span>
                </button>
              );
            })()}

            {/* Wanted Tab */}
            {(() => {
              const isActive = pathname.includes("/need");
              return (
                <button
                  type="button"
                  onClick={() => router.push("/need")}
                  className={`px-4 py-1.5 text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center gap-1.5 select-none rounded-full whitespace-nowrap ${
                    isActive
                      ? "bg-[#0F172A] text-white shadow-2xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                  }`}
                >
                  <Search className={`w-3.5 h-3.5 ${isActive ? "text-amber-400 stroke-[2.5]" : "text-slate-500 stroke-[2]"}`} />
                  <span>Wanted</span>
                </button>
              );
            })()}

            {/* Service Tab */}
            {(() => {
              const isActive = pathname.includes("/services");
              return (
                <button
                  type="button"
                  onClick={() => router.push("/services")}
                  className={`px-4 py-1.5 text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center gap-1.5 select-none rounded-full whitespace-nowrap ${
                    isActive
                      ? "bg-[#0F172A] text-white shadow-2xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                  }`}
                >
                  <Wrench className={`w-3.5 h-3.5 ${isActive ? "text-amber-400 stroke-[2.5]" : "text-slate-500 stroke-[2]"}`} />
                  <span>Service</span>
                </button>
              );
            })()}

            {/* Offer Tab */}
            {(() => {
              const isActive = pathname.includes("/shops") || pathname.includes("/offers");
              return (
                <button
                  type="button"
                  onClick={() => router.push("/shops")}
                  className={`px-4 py-1.5 text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center gap-1.5 select-none rounded-full whitespace-nowrap ${
                    isActive
                      ? "bg-[#0F172A] text-white shadow-2xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                  }`}
                >
                  <Store className={`w-3.5 h-3.5 animate-bounce ${isActive ? "text-amber-400 stroke-[2.5]" : "text-amber-600 stroke-[2.5]"}`} />
                  <span>Offer</span>
                </button>
              );
            })()}
          </div>
        </div>

        {/* Mobile Header Center: Universal Search on Home Page OR Dynamic Page Title on Sub-Pages */}
        <div className="flex md:hidden flex-1 min-w-0 mx-1.5 z-20 justify-center text-center">
          {pathname === "/" || pathname.includes("/sell") || pathname.includes("/need") || pathname.includes("/services") || pathname.includes("/shops") || pathname.includes("/offers") || pathname.includes("/classifieds") ? (
            <UniversalSearchBar />
          ) : (
            <span className="font-heading font-black text-sm sm:text-base text-slate-900 truncate tracking-tight text-center w-full">
              {getSubPageTitle()}
            </span>
          )}
        </div>

        {/* Right Side Action Cluster: Notification Bell, Desktop Chat/Profile/Listings icons */}
        <div className="flex items-center justify-end gap-2 shrink-0 ml-auto z-20">

          {/* Notification Hub Bell (🔔) Drawer Trigger */}
          <div className="relative group flex items-center justify-center">
            <button
              type="button"
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.dispatchEvent(new Event("namma_thanjai_open_notifications"));
                }
              }}
              className="w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700 shrink-0 relative"
              title="Notifications"
              aria-label="View notifications"
            >
              <Bell className="w-4 h-4 text-slate-700 stroke-[2.2]" />
            </button>
            <div className="absolute top-full mt-1.5 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 bg-slate-900 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-md shadow-md whitespace-nowrap z-[99999]">
              Notifications
            </div>
          </div>

          {/* Desktop Website Only: Clean Icon Cluster & Profile Menu */}
          <div className="hidden md:flex items-center gap-2">
            {/* Chat Icon */}
            {!pathname.includes("/post") && (
              <div className="relative group flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => router.push("/chat")}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer border shrink-0 relative ${
                    pathname === "/chat"
                      ? "bg-[#FBBF24] text-slate-950 border-amber-400 shadow-xs"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
                  }`}
                  title="Chat"
                  aria-label="View messages"
                >
                  <MessageSquare className={`w-4 h-4 ${pathname === "/chat" ? "text-slate-950 stroke-[2.5]" : "text-slate-700 stroke-[2]"}`} />
                  {unreadChatCount > 0 && !pathname.startsWith("/chat") && !pathname.startsWith("/profile") && !pathname.startsWith("/listings") && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-black rounded-full border border-white flex items-center justify-center animate-pulse">
                      {unreadChatCount}
                    </span>
                  )}
                </button>
                <div className="absolute top-full mt-1.5 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 bg-slate-900 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-md shadow-md whitespace-nowrap z-[99999]">
                  Chat
                </div>
              </div>
            )}

            {/* Profile Dropdown Menu (Contains My Posts & Saved) */}
            {!pathname.includes("/post") && (
              <div className="relative group flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => router.push("/profile")}
                  className={`flex items-center justify-center w-9 h-9 rounded-full transition-all cursor-pointer border shrink-0 ${
                    pathname.includes("/profile") || pathname.includes("/listings")
                      ? "bg-[#FBBF24] text-slate-950 border-amber-400 shadow-xs"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
                  }`}
                  title="Profile & My Posts"
                  aria-label="View profile menu"
                >
                  <User className={`w-4 h-4 ${pathname.includes("/profile") || pathname.includes("/listings") ? "text-slate-950 stroke-[2.5]" : "text-slate-700 stroke-[2]"}`} />
                </button>

                {/* Profile Hover Dropdown Card */}
                <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all duration-150 flex flex-col gap-1 z-[99999]">
                  <button
                    type="button"
                    onClick={() => router.push("/profile")}
                    className="w-full px-3 py-2 text-left text-xs font-bold text-slate-800 hover:bg-slate-100 rounded-xl flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-slate-500" />
                      <span>My Profile</span>
                    </span>
                    <span className="text-slate-400 text-[10px]">→</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => router.push("/listings")}
                    className="w-full px-3 py-2 text-left text-xs font-bold text-slate-800 hover:bg-slate-100 rounded-xl flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <Package className="w-3.5 h-3.5 text-amber-600" />
                      <span>My Posts</span>
                    </span>
                    <span className="text-slate-400 text-[10px]">→</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => router.push("/listings?tab=saved")}
                    className="w-full px-3 py-2 text-left text-xs font-bold text-slate-800 hover:bg-slate-100 rounded-xl flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <Bookmark className="w-3.5 h-3.5 text-amber-600" />
                      <span>Saved</span>
                    </span>
                    <span className="text-slate-400 text-[10px]">→</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Desktop Website Only: Fixed "+ Post" Button (VERY FAR RIGHT LAST ITEM) */}
          {!pathname.includes("/chat") &&
            !pathname.includes("/profile") &&
            !pathname.includes("/listings") &&
            !pathname.includes("/search") &&
            !pathname.includes("/post") && (
              <button
                type="button"
                onClick={handleDynamicPostClick}
                className="hidden md:flex bg-amber-400 hover:bg-amber-500 text-slate-950 text-xs sm:text-sm px-4 py-2 rounded-full font-heading font-black shrink-0 items-center gap-1.5 shadow-xs cursor-pointer select-none active:scale-[0.97] transition-all border border-amber-400 ml-1"
                title="Post a Listing"
              >
                <Plus className="w-4 h-4 stroke-[3] text-slate-950" />
                <span>Post</span>
              </button>
            )}
        </div>
      </div>
    </header>
  );
}
