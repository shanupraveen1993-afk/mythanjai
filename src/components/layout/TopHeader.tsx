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

        {/* Left Side: Hamburger Menu + Website Branding Logo & App Name */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* 1. Hamburger Menu Button on Left Side */}
          <button
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex items-center justify-center w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold transition-all cursor-pointer active:scale-95 border border-slate-200 shrink-0"
            title="Menu Drawer"
          >
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* 2. Logo & App Name */}
          <div
            onClick={() => router.push("/")}
            className="flex items-center gap-2 cursor-pointer select-none shrink-0 group"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 shrink-0 group-hover:scale-[1.08] transition-transform duration-300 flex items-center justify-center">
              <img src="/namma_thanjai_logo.png" alt="Namma Thanjai Logo" className="w-full h-full object-contain" />
            </div>
            <div className="flex items-center gap-0.5">
              <span className="font-heading font-black tracking-tight text-slate-900 text-sm sm:text-base md:text-lg leading-none">
                நம்ம <span className="text-amber-500 font-black">Thanjai</span>
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

        {/* Right Side: Get App (Only on Homepage in Web App) + Profile Icon */}
        <div className="flex items-center gap-2 shrink-0">
          {/* 1. Get App Button (Shown ONLY on Homepage '/' in Web App) */}
          {isHomePage && (
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
          )}

          {/* 2. Action Post Button (Shown ONLY on segment pages /sell, /need, /services, /shops) */}
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

      {/* Hamburger Menu Drawer Overlay */}
      {isMenuOpen && (
        <div className="w-full bg-white border-b border-slate-200/90 p-4 flex flex-col gap-3 shadow-md animate-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">NAVIGATION MENU</span>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-1">
              <button
                type="button"
                onClick={() => { router.push("/"); setIsMenuOpen(false); }}
                className="p-2.5 rounded-xl bg-slate-50 hover:bg-amber-50 text-slate-800 hover:text-amber-800 font-extrabold text-xs text-left border border-slate-200/80"
              >
                Home (முகப்பு)
              </button>
              <button
                type="button"
                onClick={() => { router.push("/sell"); setIsMenuOpen(false); }}
                className="p-2.5 rounded-xl bg-slate-50 hover:bg-amber-50 text-slate-800 hover:text-amber-800 font-extrabold text-xs text-left border border-slate-200/80"
              >
                Sell (விற்பனை)
              </button>
              <button
                type="button"
                onClick={() => { router.push("/need"); setIsMenuOpen(false); }}
                className="p-2.5 rounded-xl bg-slate-50 hover:bg-amber-50 text-slate-800 hover:text-amber-800 font-extrabold text-xs text-left border border-slate-200/80"
              >
                Need (தேவைகள்)
              </button>
              <button
                type="button"
                onClick={() => { router.push("/services"); setIsMenuOpen(false); }}
                className="p-2.5 rounded-xl bg-slate-50 hover:bg-amber-50 text-slate-800 hover:text-amber-800 font-extrabold text-xs text-left border border-slate-200/80"
              >
                Services (சேவைகள்)
              </button>
              <button
                type="button"
                onClick={() => { router.push("/shops"); setIsMenuOpen(false); }}
                className="p-2.5 rounded-xl bg-slate-50 hover:bg-amber-50 text-slate-800 hover:text-amber-800 font-extrabold text-xs text-left border border-slate-200/80"
              >
                Offers (சலுகைகள்)
              </button>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <a
                href="/namma_thanjai_release.apk"
                download="namma_thanjai_release.apk"
                onClick={() => { handleGetAppClick(); setIsMenuOpen(false); }}
                className="bg-[#1d4ed8] text-white text-xs font-extrabold px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-2xs"
              >
                <Download className="w-3.5 h-3.5 text-white" />
                <span>Get App (APK)</span>
              </a>

              {isAuthVerified && (
                <button
                  type="button"
                  onClick={() => { router.push("/chat"); setIsMenuOpen(false); }}
                  className="bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-extrabold px-3.5 py-2 rounded-xl border border-amber-300 flex items-center gap-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-amber-700" />
                  <span>Chat</span>
                </button>
              )}
            </div>

            {!isAuthVerified ? (
              <button
                type="button"
                onClick={() => { onSignInClick(); setIsMenuOpen(false); }}
                className="btn-primary text-xs px-4 py-2 rounded-xl font-black flex items-center gap-1.5"
              >
                <User className="w-3.5 h-3.5 text-slate-950" />
                <span>Sign In / Login</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => { router.push("/profile"); setIsMenuOpen(false); }}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-extrabold px-4 py-2 rounded-xl border border-slate-200 flex items-center gap-1.5"
              >
                <User className="w-3.5 h-3.5 text-slate-600" />
                <span>My Profile</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
