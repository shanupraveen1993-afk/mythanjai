"use client";

import React, { useState, useEffect } from "react";
import { MapPin, Plus, User, ShieldCheck, Check, MessageSquare, Globe } from "lucide-react";
import { TANJORE_LOCALITIES, TanjoreLocality } from "@/lib/constants";
import SearchableAreaDropdown from "./SearchableAreaDropdown";
import { AppTab } from "./BottomTabBar";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/context/ToastContext";

import { useLanguage } from "@/context/LanguageContext";

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
  const { profile } = useAuth();
  const { lang, toggleLanguage, t } = useLanguage();
  
  const isAuthVerified = Boolean(profile?.isVerified);
  const isLandingMode = pathname === "/";
  const showCenterNav = !isLandingMode;

  const phoneDisplay = profile?.phone ? `+${profile.phone}` : "+919994837342";

  const searchParams = useSearchParams();
  const currentCategory = searchParams.get("category");

  const getSectionTitle = () => {
    if (currentCategory) return currentCategory;
    if (pathname === "/sell") return "Sell";
    if (pathname === "/need") return "Requirements";
    if (pathname === "/services") return "Services";
    if (pathname === "/shops") return "Local Offers";
    if (pathname === "/classifieds") return "Classifieds";
    if (pathname === "/profile") return "My Profile";
    return null;
  };

  const sectionTitle = getSectionTitle();

  const handleBackClick = () => {
    if (currentCategory) {
      const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
      params.delete("category");
      const queryString = params.toString();
      router.push(queryString ? `${pathname}?${queryString}` : pathname);
    } else {
      router.push("/");
    }
  };

  return (
    <header 
      className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm flex flex-col justify-end"
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
    >
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-3">
        
        {/* Left: Website Branding Logo across all pages */}
        <div className="flex items-center gap-2">
          <div 
            onClick={() => {
              if (!isAuthVerified) {
                if (typeof window !== "undefined") {
                  localStorage.removeItem("namma_thanjai_guest_mode");
                }
                router.push("/");
              } else {
                router.push("/home");
              }
            }}
            className="flex items-center gap-2 cursor-pointer select-none shrink-0 group"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 shrink-0 group-hover:scale-[1.05] transition-transform flex items-center justify-center">
              <img src="/namma_thanjai_logo.png" alt="namma thanjai logo" className="w-full h-full object-contain mix-blend-multiply" />
            </div>
            <div className="flex items-center gap-0.5">
              <span className="font-heading font-black tracking-tight text-slate-900 text-sm sm:text-base md:text-lg leading-none">
                namma thanjai
              </span>
              <div className="w-2 h-2 rounded-full bg-yellow-500 ml-0.5 shrink-0" />
            </div>
          </div>
        </div>

        {/* Center: 5 Category Navigation Tabs (Hidden on Landing Page) */}
        {showCenterNav && (() => {
          const isHomeActive = pathname === "/home" || pathname === "/";
          const isSellActive = pathname === "/sell" || pathname.includes("/sell");
          const isNeedActive = pathname === "/need" || pathname.includes("/need");
          const isServiceActive = pathname === "/services" || pathname.includes("/services") || pathname.includes("/post/service");
          const isOfferActive = pathname === "/shops" || pathname === "/offers" || pathname.includes("/shops") || pathname.includes("/offers");

          return (
            <div className="hidden sm:flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 font-heading">
              <button
                type="button"
                onClick={() => router.push("/home")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  isHomeActive
                    ? "bg-yellow-500 text-slate-955 border border-yellow-400 shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 font-bold"
                }`}
              >
                Home
              </button>
              <button
                type="button"
                onClick={() => router.push("/sell")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  isSellActive
                    ? "bg-yellow-500 text-slate-955 border border-yellow-400 shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 font-bold"
                }`}
              >
                Sell
              </button>
              <button
                type="button"
                onClick={() => router.push("/need")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  isNeedActive
                    ? "bg-yellow-500 text-slate-955 border border-yellow-400 shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 font-bold"
                }`}
              >
                Need
              </button>
              <button
                type="button"
                onClick={() => router.push("/services")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  isServiceActive
                    ? "bg-yellow-500 text-slate-955 border border-yellow-400 shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 font-bold"
                }`}
              >
                Local Service
              </button>
              <button
                type="button"
                onClick={() => router.push("/shops")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  isOfferActive
                    ? "bg-yellow-500 text-slate-955 border border-yellow-400 shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 font-bold"
                }`}
              >
                Local Offer
              </button>
            </div>
          );
        })()}

        {/* Right: Landing Page Login Button vs Logged-In Chat & Profile Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {isAuthVerified ? (
            <>
              {/* Chat Icon & Profile Button for Logged In Verified Users */}
              <button
                onClick={() => router.push("/chat")}
                className="relative flex items-center justify-center w-9 h-9 sm:w-auto sm:px-3.5 bg-slate-100/90 hover:bg-slate-200 border border-slate-200/80 text-slate-800 rounded-full text-xs font-bold transition-all shadow-[0_2px_8px_-3px_rgba(0,0,0,0.1)] cursor-pointer group"
                title="In-App Safety Chat"
              >
                <MessageSquare className="w-4 h-4 text-slate-600 group-hover:text-emerald-600 shrink-0" />
                <span className="hidden sm:inline text-xs font-bold text-slate-700 ml-1.5">Chat</span>
                <span className="absolute top-0 right-0 sm:right-2 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-white animate-pulse" />
              </button>

              <button
                onClick={() => onTabChange?.("profile")}
                className="relative flex items-center justify-center w-9 h-9 sm:w-auto sm:px-3.5 bg-slate-100/90 hover:bg-slate-200 border border-slate-200/80 text-slate-800 font-bold rounded-full text-xs transition-all shadow-[0_2px_8px_-3px_rgba(0,0,0,0.1)] cursor-pointer group"
                title={`Verified Profile (${phoneDisplay})`}
              >
                <User className="w-4 h-4 text-slate-600 group-hover:text-slate-900 shrink-0" />
                <span className="hidden md:inline text-xs font-bold text-slate-700 ml-1.5">Profile</span>
              </button>
            </>
          ) : isLandingMode ? (
            /* ONLY Primary Yellow Login Button on Landing Page for Unauthenticated Visitors */
            <button
              type="button"
              onClick={onSignInClick}
              className="flex items-center justify-center gap-1.5 bg-yellow-500 hover:bg-yellow-400 text-slate-955 font-heading font-black text-xs px-4 py-2 rounded-xl shadow-md border border-yellow-400 cursor-pointer active:scale-95 transition-all"
            >
              <User className="w-4 h-4 text-slate-955" />
              <span>Login</span>
            </button>
          ) : (
            <>
              {/* Primary Yellow Login Button & Profile Button for Guests on App Pages */}
              <button
                type="button"
                onClick={onSignInClick}
                className="flex items-center justify-center gap-1.5 bg-yellow-500 hover:bg-yellow-400 text-slate-955 font-heading font-black text-xs px-3.5 py-1.5 rounded-xl shadow-md border border-yellow-400 cursor-pointer active:scale-95 transition-all"
              >
                <User className="w-4 h-4 text-slate-955" />
                <span>Login</span>
              </button>

              <button
                onClick={() => onTabChange?.("profile")}
                className="flex items-center justify-center w-9 h-9 bg-slate-100/90 hover:bg-slate-200 border border-slate-200/80 text-slate-800 font-bold text-xs transition-all shadow-2xs cursor-pointer rounded-full group"
                title="Profile"
              >
                <User className="w-4 h-4 text-slate-600 group-hover:text-slate-900 shrink-0" />
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
