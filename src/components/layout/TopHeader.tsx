"use client";

import React, { useState, useEffect } from "react";
import { MapPin, Plus, User, ShieldCheck, Check, MessageSquare, Globe, Download, Menu, X, ArrowLeft } from "lucide-react";
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
      className="fixed top-0 left-0 right-0 z-50 bg-white/96 backdrop-blur-xl border-b border-slate-200/80 shadow-[0_1px_12px_rgba(0,0,0,0.06)] flex flex-col justify-end"
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
    >
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-3 relative">

        {/* Left Side: Native Back Button ONLY for true sub-screens vs Home Logo */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 z-20">
          {pathname.includes("/profile") || pathname.includes("/post") || pathname.includes("/chat") || pathname.includes("/admin") ? (
            <button
              type="button"
              onClick={() => {
                if (typeof window !== "undefined" && window.history.length > 1) {
                  router.back();
                } else {
                  router.push("/");
                }
              }}
              className="flex items-center gap-1.5 text-xs font-black text-slate-800 hover:text-slate-950 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl border border-slate-200 cursor-pointer shrink-0 transition-colors shadow-2xs"
            >
              <ArrowLeft className="w-4 h-4 text-slate-800" />
              <span>Back</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 select-none shrink-0">
              <div
                onClick={() => router.push("/")}
                className="flex items-center gap-1.5 cursor-pointer shrink-0 group"
              >
                <div className="w-8 h-8 sm:w-9 sm:h-9 shrink-0 group-hover:scale-[1.08] transition-transform duration-300 flex items-center justify-center">
                  <img src="/namma_thanjai_logo.png" alt="Namma Thanjai Logo" className="w-full h-full object-contain" />
                </div>
                <span className="font-heading font-black tracking-tight text-sm sm:text-base md:text-lg leading-none">
                  <span className="text-[#1d4ed8] font-black">நம்ம</span> <span className="text-[#f59e0b] font-black">thanjai</span>
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Center: Sub-Screen Title or 5 Category Tabs */}
        {pathname.includes("/profile") || pathname.includes("/post") || pathname.includes("/chat") || pathname.includes("/admin") ? (
          <div className="absolute left-1/2 -translate-x-1/2 font-heading font-black text-sm sm:text-base text-slate-900 truncate max-w-[180px] sm:max-w-xs text-center z-10">
            {pathname.includes("/profile")
              ? (profileTab === "listings" ? "My Listings" : profileTab === "saved" ? "Saved Items" : "My Profile")
              : pathname.includes("/post") ? "Post a Free Ad"
              : pathname.includes("/chat") ? "Direct Messages"
              : pathname.includes("/admin") ? "Admin Dashboard"
              : "Namma Thanjai"}
          </div>
        ) : (
          showCenterNav ? (
            <div className="absolute left-1/2 -translate-x-1/2 hidden md:flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200/80 font-heading backdrop-blur-sm z-10">
              <button
                type="button"
                onClick={() => router.push("/")}
                className={`px-3.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${pathname === "/" || pathname === "/home" ? "bg-[#FBBF24] text-[#0F172A] font-extrabold shadow-2xs rounded-lg" : "text-slate-600 hover:text-slate-900 font-bold transition-colors"}`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => router.push("/sell")}
                className={`px-3.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${pathname.includes("/sell") ? "bg-[#FBBF24] text-[#0F172A] font-extrabold shadow-2xs rounded-lg" : "text-slate-600 hover:text-slate-900 font-bold transition-colors"}`}
              >
                Sell
              </button>
              <button
                type="button"
                onClick={() => router.push("/need")}
                className={`px-3.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${pathname.includes("/need") ? "bg-[#FBBF24] text-[#0F172A] font-extrabold shadow-2xs rounded-lg" : "text-slate-600 hover:text-slate-900 font-bold transition-colors"}`}
              >
                Need
              </button>
              <button
                type="button"
                onClick={() => router.push("/services")}
                className={`px-3.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${pathname.includes("/services") ? "bg-[#FBBF24] text-[#0F172A] font-extrabold shadow-2xs rounded-lg" : "text-slate-600 hover:text-slate-900 font-bold transition-colors"}`}
              >
                Services
              </button>
              <button
                type="button"
                onClick={() => router.push("/shops")}
                className={`px-3.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${pathname.includes("/shops") || pathname.includes("/offers") ? "bg-[#FBBF24] text-[#0F172A] font-extrabold shadow-2xs rounded-lg" : "text-slate-600 hover:text-slate-900 font-bold transition-colors"}`}
              >
                Offers
              </button>
            </div>
          ) : null
        )}

        {/* Right Side: Desktop Chat/Profile & Mobile Right-Side Thanjavur Location Tag */}
        <div className="flex items-center justify-end gap-2 shrink-0 ml-auto z-20">
          {/* Mobile WebApp/APK Right-Side Location Tag */}
          <div className="flex md:hidden items-center gap-1 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg text-xs font-extrabold text-slate-900 shadow-2xs">
            <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="truncate max-w-[90px]">{selectedArea || "Thanjavur"}</span>
          </div>

          {/* Desktop Website Only: Chat & Profile Buttons */}
          <div className="hidden md:flex items-center gap-2">
            {!pathname.includes("/profile") && !pathname.includes("/post") && (
              <button
                type="button"
                onClick={() => router.push("/chat")}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer border shrink-0 ${
                  pathname === "/chat"
                    ? "bg-[#FBBF24] text-[#0F172A] border-amber-400 shadow-xs"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
                }`}
                title="In-App Direct Chat"
                aria-label="View messages"
              >
                <MessageSquare className={`w-4 h-4 ${pathname === "/chat" ? "text-[#0F172A] stroke-[2.5]" : "text-slate-600"}`} />
              </button>
            )}

            {!pathname.includes("/post") && (
              <button
                type="button"
                onClick={() => {
                  onTabChange?.("profile");
                  router.push("/profile");
                }}
                className={`flex items-center justify-center w-9 h-9 rounded-full transition-all cursor-pointer border shrink-0 ${
                  pathname === "/profile"
                    ? "bg-[#FBBF24] text-[#0F172A] border-amber-400 shadow-xs"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
                }`}
                title="Profile & Account"
                aria-label="View profile"
              >
                <User className={`w-4 h-4 ${pathname === "/profile" ? "text-[#0F172A] stroke-[2.5]" : "text-slate-600"}`} />
              </button>
            )}
          </div>

          {/* Primary Action Button (Get App / Dynamic Post) */}
          {!pathname.includes("/profile") && !pathname.includes("/post") && (
            isHomePage && !isNativeApp ? (
              <a
                href="/api/apk-download"
                download="NammaThanjai-v12.apk"
                onClick={handleGetAppClick}
                className="relative group overflow-hidden bg-[#FBBF24] hover:bg-amber-400 text-[#0F172A] text-sm px-4 py-2 rounded-xl font-heading font-black shrink-0 flex items-center gap-2 shadow-xs cursor-pointer select-none border border-amber-400/50 transition-all duration-300"
                title="Download Namma Thanjai Android App"
                aria-label="Download Namma Thanjai Android App"
              >
                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-amber-100/70 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />
                <Download className="w-4 h-4 shrink-0 text-[#0F172A] stroke-[2.5] relative z-10" />
                <span className="relative z-10">Get App</span>
              </a>
            ) : !isHomePage ? (
              <button
                type="button"
                onClick={handleDynamicPostClick}
                className="bg-[#FBBF24] hover:bg-amber-400 text-[#0F172A] text-sm px-3.5 sm:px-4 py-2 rounded-xl font-heading font-black shrink-0 flex items-center gap-1.5 shadow-2xs cursor-pointer select-none touch-manipulation active:scale-[0.97] transition-all"
                title={postInfo.label}
              >
                <Plus className="w-4 h-4 stroke-[3] text-[#0F172A]" />
                <span className="hidden md:inline">{postInfo.label}</span>
                <span className="md:hidden">Post</span>
              </button>
            ) : null
          )}
        </div>
      </div>
    </header>
  );
}
