"use client";

import React, { useState, useEffect } from "react";
import { MapPin, Plus, User, ShieldCheck, Check, MessageSquare, Globe, Download, Menu, X } from "lucide-react";
import { TANJORE_LOCALITIES, TanjoreLocality } from "@/lib/constants";
import SearchableAreaDropdown from "./SearchableAreaDropdown";
import { AppTab } from "./BottomTabBar";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
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
  const pathname = usePathname();
  const { user, profile } = useAuth();
  const { lang, toggleLanguage, t } = useLanguage();

  // Web App Back Button Navigation Handler
  useBackNavigation();

  const isAuthVerified = Boolean(profile?.isVerified || user);
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
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-3">

        {/* Left Side: Permanent Website Branding Logo & App Name */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div
            onClick={() => router.push("/")}
            className="flex items-center gap-2 cursor-pointer select-none shrink-0 group"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 shrink-0 group-hover:scale-[1.08] transition-transform duration-300 flex items-center justify-center">
              <img src="/namma_thanjai_logo.png" alt="Namma Thanjai Logo" className="w-full h-full object-contain" />
            </div>
            <div className="flex items-center gap-1">
              <span className="font-heading font-black tracking-tight text-sm sm:text-base md:text-lg leading-none">
                <span className="text-[#1d4ed8] font-black">நம்ம</span> <span className="text-[#f59e0b] font-black">thanjai</span>
              </span>
            </div>
          </div>
        </div>

        {/* Center: 5 Category Navigation Tabs */}
        {showCenterNav && (() => {
          const isHomeActive = pathname === "/home" || pathname === "/" || activeTab === "home";
          const isSellActive = (pathname.includes("/sell") && !pathname.includes("/post/service")) || activeTab === "sell";
          const isNeedActive = pathname.includes("/need") || activeTab === "need";
          const isServiceActive = pathname.includes("/services") || pathname.includes("/post/service") || activeTab === "services";
          const isOfferActive = pathname.includes("/shops") || pathname.includes("/offers") || activeTab === "shops";

          const activeStyle = "bg-[#FBBF24] text-[#0F172A] font-extrabold shadow-2xs rounded-lg";
          const inactiveStyle = "text-slate-600 hover:text-slate-900 font-bold transition-colors";

          return (
            <div className="hidden md:flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200/80 font-heading backdrop-blur-sm">
              <button
                type="button"
                onClick={() => router.push("/")}
                className={`px-3.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${isHomeActive ? activeStyle : inactiveStyle}`}
              >
                Home
              </button>
              <button
                type="button"
                onClick={() => router.push("/sell")}
                className={`px-3.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${isSellActive ? activeStyle : inactiveStyle}`}
              >
                Sell
              </button>
              <button
                type="button"
                onClick={() => router.push("/need")}
                className={`px-3.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${isNeedActive ? activeStyle : inactiveStyle}`}
              >
                Need
              </button>
              <button
                type="button"
                onClick={() => router.push("/services")}
                className={`px-3.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${isServiceActive ? activeStyle : inactiveStyle}`}
              >
                Services
              </button>
              <button
                type="button"
                onClick={() => router.push("/shops")}
                className={`px-3.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${isOfferActive ? activeStyle : inactiveStyle}`}
              >
                Offers
              </button>
            </div>
          );
        })()}

        {/* Right Side: Chat Icon -> Profile Icon -> Primary Yellow Button (Get App / + Post as absolute last button) */}
        <div className="flex items-center justify-end gap-2 shrink-0 ml-auto">
          {/* 1. Universal Chat Button (Highlighted when active on /chat) */}
          {isAuthVerified && (
            <button
              type="button"
              onClick={() => router.push("/chat")}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer border shrink-0 ${
                pathname === "/chat"
                  ? "bg-[#1d4ed8] text-white border-[#1d4ed8] shadow-sm"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
              }`}
              title="In-App Direct Chat"
              aria-label="View messages"
            >
              <MessageSquare className={`w-4 h-4 ${pathname === "/chat" ? "text-white fill-white/20" : "text-slate-600"}`} />
            </button>
          )}

          {/* 2. Profile / Sign In Button (Highlighted when active on /profile) */}
          <button
            type="button"
            onClick={() => {
              if (isAuthVerified) {
                onTabChange?.("profile");
                router.push("/profile");
              } else {
                onSignInClick?.();
              }
            }}
            className={`flex items-center justify-center w-9 h-9 rounded-full transition-all cursor-pointer border shrink-0 ${
              pathname === "/profile"
                ? "bg-[#1d4ed8] text-white border-[#1d4ed8] shadow-sm"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
            }`}
            title={isAuthVerified ? `Profile (${phoneDisplay})` : "Sign In / Profile"}
            aria-label={isAuthVerified ? "View profile" : "Sign in or register"}
          >
            <User className={`w-4 h-4 ${pathname === "/profile" ? "text-white" : "text-slate-600"}`} />
          </button>

          {/* 3. Primary Yellow Button — Get App (Homepage) OR + Post CTA (Other Pages) — EXTREME LAST BUTTON IN HEADER */}
          {isHomePage && !isNativeApp ? (
            <a
              href="/namma_thanjai_release.apk"
              download="namma_thanjai_release.apk"
              onClick={handleGetAppClick}
              className="relative group overflow-hidden bg-[#FBBF24] hover:bg-amber-400 text-[#0F172A] text-xs px-3.5 py-1.5 rounded-lg font-heading font-black shrink-0 flex items-center gap-1.5 shadow-xs cursor-pointer select-none border border-amber-400/50 transition-all duration-300"
              title="Download Namma Thanjai Android App"
              aria-label="Download Namma Thanjai Android App"
            >
              {/* Soft Light Sweep Gold Shine Effect */}
              <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-amber-100/70 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />
              <Download className="w-3.5 h-3.5 shrink-0 text-[#0F172A] stroke-[2.5] relative z-10" />
              <span className="relative z-10">Get App</span>
            </a>
          ) : !isHomePage ? (
            <button
              type="button"
              onClick={handleDynamicPostClick}
              className="bg-[#FBBF24] hover:bg-amber-400 text-[#0F172A] text-xs px-3.5 py-1.5 rounded-lg font-heading font-black shrink-0 flex items-center gap-1.5 shadow-2xs cursor-pointer select-none"
              title={postInfo.label}
            >
              <Plus className="w-3.5 h-3.5 stroke-[3] text-[#0F172A]" />
              <span>{postInfo.label}</span>
            </button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
