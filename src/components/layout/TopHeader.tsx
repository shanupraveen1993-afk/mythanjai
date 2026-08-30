"use client";

import React, { useState, useEffect } from "react";
import { MapPin, Plus, User, ShieldCheck, Check, MessageSquare, Globe, Download, Menu, X, ArrowLeft, Package, Tag, Search, Wrench, Store } from "lucide-react";
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
        sessionStorage.setItem("namma_thanjai_target_post_route", postInfo.route);
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
      className={`relative w-full z-50 bg-[#1F244A]/[0.03] backdrop-blur-xl text-slate-900 flex-col justify-end border-b border-slate-200/90 shadow-2xs rounded-b-2xl sm:rounded-b-3xl md:rounded-b-none overflow-hidden ${
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
          {/* Desktop Search Bar (Left Aligned Next to Logo) */}
          <div className="hidden md:block w-48 lg:w-60 shrink-0">
            <UniversalSearchBar />
          </div>
        </div>

        {/* Desktop Header Center: 4 Category Tabs (Horizontal Pill Nav Bar) */}
        <div className="hidden md:flex items-center justify-center z-20 flex-1 min-w-0 mx-2">
          <div className="flex items-center gap-1.5 bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/90 font-heading shadow-2xs">
            {/* Buy Tab */}
            {(() => {
              const isActive = pathname === "/" || pathname === "/home" || pathname.includes("/sell");
              return (
                <button
                  type="button"
                  onClick={() => router.push("/")}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 select-none ${
                    isActive
                      ? "bg-[#FBBF24] text-slate-950 border border-amber-400 shadow-2xs scale-102"
                      : "bg-[#1F244A] text-white hover:bg-[#151936]"
                  }`}
                >
                  <Tag className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Buy</span>
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
                  className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 select-none ${
                    isActive
                      ? "bg-[#FBBF24] text-slate-950 border border-amber-400 shadow-2xs scale-102"
                      : "bg-[#1F244A] text-white hover:bg-[#151936]"
                  }`}
                >
                  <Search className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Wanted</span>
                </button>
              );
            })()}

            {/* Services Tab */}
            {(() => {
              const isActive = pathname.includes("/services");
              return (
                <button
                  type="button"
                  onClick={() => router.push("/services")}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 select-none ${
                    isActive
                      ? "bg-[#FBBF24] text-slate-950 border border-amber-400 shadow-2xs scale-102"
                      : "bg-[#1F244A] text-white hover:bg-[#151936]"
                  }`}
                >
                  <Wrench className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Services</span>
                </button>
              );
            })()}

            {/* Offers Tab */}
            {(() => {
              const isActive = pathname.includes("/shops") || pathname.includes("/offers");
              return (
                <button
                  type="button"
                  onClick={() => router.push("/shops")}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 select-none ${
                    isActive
                      ? "bg-[#FBBF24] text-slate-950 border border-amber-400 shadow-2xs scale-102"
                      : "bg-[#1F244A] text-white hover:bg-[#151936]"
                  }`}
                >
                  <Store className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Offers</span>
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
            <div className="absolute top-full mt-1.5 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 bg-slate-900 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-md shadow-md whitespace-nowrap z-50">
              Notifications
            </div>
          </div>

          {/* Desktop Website Only: Chat, My Ads & Profile Icon-Only Buttons */}
          <div className="hidden md:flex items-center gap-2">

            {/* 1. Chat Button (First) */}
            {!pathname.includes("/post") && (
              <div className="relative group flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => router.push("/chat")}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer border shrink-0 ${
                    pathname === "/chat"
                      ? "bg-[#FBBF24] text-slate-950 border-amber-400 shadow-xs"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
                  }`}
                  title="Chat"
                  aria-label="View messages"
                >
                  <MessageSquare className={`w-4 h-4 ${pathname === "/chat" ? "text-slate-950 stroke-[2.5]" : "text-slate-700 stroke-[2]"}`} />
                </button>
                <div className="absolute top-full mt-1.5 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 bg-slate-900 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-md shadow-md whitespace-nowrap z-50">
                  Chat
                </div>
              </div>
            )}

            {/* 2. My Ads Button (Second - Icon Only) */}
            {!pathname.includes("/post") && (
              <div className="relative group flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => router.push("/listings")}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer border shrink-0 ${
                    pathname.startsWith("/listings")
                      ? "bg-[#FBBF24] text-slate-950 border-amber-400 shadow-xs"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
                  }`}
                  title="My Ads"
                  aria-label="View my ads"
                >
                  <Package className={`w-4 h-4 ${pathname.startsWith("/listings") ? "text-slate-950 stroke-[2.5]" : "text-slate-700 stroke-[2]"}`} />
                </button>
                <div className="absolute top-full mt-1.5 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 bg-slate-900 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-md shadow-md whitespace-nowrap z-50">
                  My Ads
                </div>
              </div>
            )}

            {/* 3. Profile Button (Third) */}
            {!pathname.includes("/post") && (
              <div className="relative group flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => {
                    onTabChange?.("profile");
                    router.push("/profile");
                  }}
                  className={`flex items-center justify-center w-9 h-9 rounded-full transition-all cursor-pointer border shrink-0 ${
                    pathname === "/profile" && !pathname.includes("tab=")
                      ? "bg-[#FBBF24] text-slate-950 border-amber-400 shadow-xs"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
                  }`}
                  title="Profile"
                  aria-label="View profile"
                >
                  <User className={`w-4 h-4 ${pathname === "/profile" && !pathname.includes("tab=") ? "text-slate-950 stroke-[2.5]" : "text-slate-700 stroke-[2]"}`} />
                </button>
                <div className="absolute top-full mt-1.5 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 bg-slate-900 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-md shadow-md whitespace-nowrap z-50">
                  Profile
                </div>
              </div>
            )}
          </div>

          {/* Desktop Website Only: Golden Yellow Post Ad Button */}
          {!pathname.includes("/chat") && !pathname.includes("/profile") && !pathname.includes("/listings") && !pathname.includes("/post") && (
            <button
              type="button"
              onClick={handleDynamicPostClick}
              className="hidden md:flex bg-amber-400 hover:bg-amber-500 text-slate-950 text-xs sm:text-sm px-4 sm:px-5 py-1.5 sm:py-2 rounded-full font-heading font-black shrink-0 items-center gap-1.5 shadow-2xs cursor-pointer select-none touch-manipulation active:scale-[0.97] transition-all border border-amber-400 ml-1"
              title={postInfo.desktopLabel}
            >
              <Plus className="w-4 h-4 stroke-[3] text-slate-950" />
              <span>{postInfo.desktopLabel}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
