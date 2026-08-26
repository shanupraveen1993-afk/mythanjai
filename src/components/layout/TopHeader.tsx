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

  const [profileTab, setProfileTab] = useState<string | null>(null);

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

  // Dynamic Post CTA info based on active page route or tab
  const postInfo = React.useMemo(() => {
    if (pathname.includes("/sell") || activeTab === "sell") {
      return { label: "Post Item", route: "/post/sell" };
    }
    if (pathname.includes("/need") || activeTab === "need") {
      return { label: "Post Requirement", route: "/post/need" };
    }
    if (pathname.includes("/services") || activeTab === "services") {
      return { label: "Post Service", route: "/post/service" };
    }
    if (pathname.includes("/shops") || pathname.includes("/offers") || activeTab === "shops") {
      return { label: "Post Offer", route: "/post/offer" };
    }
    return { label: "Post Ad", route: "/post/sell" };
  }, [pathname, activeTab]);

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

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 bg-white/96 backdrop-blur-xl border-b border-slate-200/80 shadow-[0_1px_12px_rgba(0,0,0,0.06)] flex-col justify-end ${
        pathname?.startsWith("/chat") ? "hidden md:flex" : "flex"
      }`}
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
    >
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 py-2 flex items-center justify-between gap-3 relative">

        {/* Left Side: Full Fit Namma Thanjai Logo + Brand Name across all screens */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 z-20">
          <div
            onClick={() => router.push("/")}
            className="flex items-center gap-2 cursor-pointer shrink-0 group select-none"
          >
            <div className="h-8 sm:h-9 w-auto flex items-center justify-center shrink-0">
              <img src="/namma_thanjai_logo.png" alt="Namma Thanjai Logo" className="h-full w-auto object-contain max-h-9" />
            </div>
            <span className="inline-block font-heading font-black tracking-tight text-sm sm:text-lg md:text-xl leading-none">
              <span className="text-[#1d4ed8] font-black">நம்ம</span> <span className="text-[#f59e0b] font-black">thanjai</span>
            </span>
          </div>
        </div>

        {/* Center: Sub-Screen Title or 4 Category Tabs with Vector Icons */}
        {pathname.includes("/profile") || pathname.includes("/post") || pathname.includes("/chat") ? (
          <div className="absolute left-1/2 -translate-x-1/2 font-heading font-black text-sm sm:text-base text-slate-900 truncate max-w-[180px] sm:max-w-xs text-center z-10">
            {pathname.includes("/profile")
              ? (profileTab === "listings" ? "My Listings" : profileTab === "saved" ? "Saved Items" : "My Profile")
              : pathname.includes("/post") ? "Post a Free Ad"
              : pathname.includes("/chat") ? "Direct Messages"
              : "Namma Thanjai"}
          </div>
        ) : (
          showCenterNav ? (
            <div className="absolute left-1/2 -translate-x-1/2 hidden md:flex items-center gap-1.5 bg-slate-100/90 p-1.5 rounded-xl border border-slate-200/80 font-heading backdrop-blur-sm z-10">
              <button
                type="button"
                onClick={() => router.push("/")}
                className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-1.5 ${
                  pathname === "/" || pathname === "/home" || pathname.includes("/sell")
                    ? "bg-[#FBBF24] text-slate-950 font-bold border border-amber-400/90 shadow-2xs"
                    : "text-slate-700 hover:text-slate-950 font-semibold transition-colors"
                }`}
              >
                <Tag className="w-3.5 h-3.5 text-slate-900" />
                <span>For Sale</span>
              </button>
              <button
                type="button"
                onClick={() => router.push("/need")}
                className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-1.5 ${
                  pathname.includes("/need")
                    ? "bg-[#FBBF24] text-slate-950 font-bold border border-amber-400/90 shadow-2xs"
                    : "text-slate-700 hover:text-slate-950 font-semibold transition-colors"
                }`}
              >
                <Search className="w-3.5 h-3.5 text-slate-900" />
                <span>Looking For</span>
              </button>
              <button
                type="button"
                onClick={() => router.push("/services")}
                className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-1.5 ${
                  pathname.includes("/services")
                    ? "bg-[#FBBF24] text-slate-950 font-bold border border-amber-400/90 shadow-2xs"
                    : "text-slate-700 hover:text-slate-950 font-semibold transition-colors"
                }`}
              >
                <Wrench className="w-3.5 h-3.5 text-slate-900" />
                <span>Services</span>
              </button>
              <button
                type="button"
                onClick={() => router.push("/shops")}
                className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-1.5 ${
                  pathname.includes("/shops") || pathname.includes("/offers")
                    ? "bg-[#FBBF24] text-slate-950 font-bold border border-amber-400/90 shadow-2xs"
                    : "text-slate-700 hover:text-slate-950 font-semibold transition-colors"
                }`}
              >
                <Store className="w-3.5 h-3.5 text-slate-900" />
                <span>Offers</span>
              </button>
            </div>
          ) : null
        )}

        {/* Right Side Action Cluster: WebApp Get App button (Mobile WebApp only), APK +Post button (APK only), Desktop Chat/Profile/Listings icons (Desktop only) */}
        <div className="flex items-center justify-end gap-2 shrink-0 ml-auto z-20">
          {/* Mobile WebApp Only: 🔵 Get App Button */}
          {!isNativeApp && (
            <a
              href="/api/apk-download"
              download="NammaThanjai-v16.apk"
              className="flex md:hidden bg-[#1d4ed8] hover:bg-blue-800 text-white font-heading font-bold text-xs px-3 py-1.5 rounded-lg shadow-2xs transition-all items-center gap-1.5 shrink-0 active:scale-95 border border-blue-600 cursor-pointer whitespace-nowrap"
              title="Download Namma Thanjai Official Android App"
            >
              <Download className="w-3.5 h-3.5 text-white stroke-[2.5]" />
              <span>Get App</span>
            </a>
          )}



          {/* Desktop Website Only: Chat, My Listings & Profile Buttons */}
          <div className="hidden md:flex items-center gap-2">

            {/* 1. Chat Button (First) */}
            {!pathname.includes("/post") && (
              <div className="relative group flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => router.push("/chat")}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer border shrink-0 ${
                    pathname === "/chat"
                      ? "bg-[#FBBF24] text-[#0F172A] border-amber-400 shadow-xs"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
                  }`}
                  title="Chat"
                  aria-label="View messages"
                >
                  <MessageSquare className={`w-4 h-4 ${pathname === "/chat" ? "text-[#0F172A] stroke-[2.5]" : "text-slate-600"}`} />
                </button>
                <div className="absolute top-full mt-1.5 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 bg-slate-900 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-md shadow-md whitespace-nowrap z-50">
                  Chat
                </div>
              </div>
            )}

            {/* 2. My Listings Button (Second) */}
            {!pathname.includes("/post") && (
              <div className="relative group flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => router.push("/listings")}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer border shrink-0 ${
                    pathname.startsWith("/listings")
                      ? "bg-[#FBBF24] text-[#0F172A] border-amber-400 shadow-xs"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
                  }`}
                  title="My Listings"
                  aria-label="View my listings"
                >
                  <Package className={`w-4 h-4 ${pathname.startsWith("/listings") ? "text-[#0F172A] stroke-[2.5]" : "text-slate-600"}`} />
                </button>
                <div className="absolute top-full mt-1.5 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 bg-slate-900 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-md shadow-md whitespace-nowrap z-50">
                  My Listings
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
                      ? "bg-[#FBBF24] text-[#0F172A] border-amber-400 shadow-xs"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
                  }`}
                  title="Profile"
                  aria-label="View profile"
                >
                  <User className={`w-4 h-4 ${pathname === "/profile" && !pathname.includes("tab=") ? "text-[#0F172A] stroke-[2.5]" : "text-slate-600"}`} />
                </button>
                <div className="absolute top-full mt-1.5 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 bg-slate-900 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-md shadow-md whitespace-nowrap z-50">
                  Profile
                </div>
              </div>
            )}
          </div>

          {/* Header Golden Yellow Post Ad Button (Single unified button for Web & APK) */}
          {!pathname.includes("/chat") && !pathname.includes("/profile") && !pathname.includes("/listings") && !pathname.includes("/post") && (
            <button
              type="button"
              onClick={handleDynamicPostClick}
              className="bg-[#FBBF24] hover:bg-amber-400 text-[#0F172A] text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-heading font-black shrink-0 flex items-center gap-1.5 shadow-2xs cursor-pointer select-none touch-manipulation active:scale-[0.97] transition-all border border-amber-400 ml-1"
              title={postInfo.label}
            >
              <Plus className="w-4 h-4 stroke-[3] text-[#0F172A]" />
              <span>{postInfo.label}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
