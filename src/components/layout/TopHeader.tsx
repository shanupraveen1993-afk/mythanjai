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

  // Hamburger Menu Drawer state for Web App
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  // "Get App" header persistence & 1-time click dismissal rule
  const [hasClickedGetApp, setHasClickedGetApp] = useState<boolean>(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const clicked = localStorage.getItem("namma_thanjai_get_app_clicked");
      setHasClickedGetApp(Boolean(clicked));
    }
  }, []);

  const handleGetAppClick = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("namma_thanjai_get_app_clicked", "true");
      setHasClickedGetApp(true);
    }
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
                <span className="text-slate-900">நம்ம</span> <span className="text-amber-500 font-black">Thanjai</span>
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

          const activeStyle = "bg-amber-500 text-slate-950 font-black shadow-xs rounded-lg border border-amber-600/30";
          const inactiveStyle = "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 font-bold transition-all duration-200";

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

        {/* Right Side: Get App + Profile Icon (+ Post Ad button on 4 Segment pages) */}
        <div className="flex items-center gap-2 shrink-0">
          {/* 1. Get App Button (Shown on Homepage '/' & segment pages) */}
          <a
            href="/namma_thanjai_release.apk"
            download="namma_thanjai_release.apk"
            onClick={handleGetAppClick}
            className="bg-[#1d4ed8] text-white border border-[#1d4ed8] text-xs px-3.5 py-1.5 rounded-full font-extrabold shrink-0 flex items-center gap-1.5 shadow-2xs cursor-pointer select-none"
            title="Download Namma Thanjai Android App"
          >
            <Download className="w-3.5 h-3.5 shrink-0 text-white" />
            <span>Get App</span>
          </a>

          {/* 2. Action Post Button (Shown ONLY on 4 segment pages /sell, /need, /services, /shops) */}
          {!isHomePage && (
            <button
              type="button"
              onClick={onPostClick}
              className="btn-primary text-xs px-3.5 py-1.5 shrink-0 flex items-center gap-1 font-black shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5] shrink-0 text-slate-950" />
              <span>Post Ad</span>
            </button>
          )}

          {/* 3. Profile Icon */}
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
            className="flex items-center justify-center w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-all cursor-pointer active:scale-95 border border-slate-200"
            title={isAuthVerified ? `Profile (${phoneDisplay})` : "Login / Profile"}
          >
            <User className="w-4 h-4 text-slate-600" />
          </button>
        </div>
      </div>
    </header>
  );
}
