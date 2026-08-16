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
  const showCenterNav = pathname !== "/onboarding" && pathname !== "/chat" && !isLandingMode;

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
      router.push("/home");
    }
  };

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 bg-white/96 backdrop-blur-xl border-b border-slate-200/80 shadow-[0_1px_12px_rgba(0,0,0,0.06)] flex flex-col justify-end"
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
    >
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-3">

        {/* Left: Website Branding Logo across all pages */}
        <div className="flex items-center gap-2">
          <div
            onClick={() => router.push("/home")}
            className="flex items-center gap-2 cursor-pointer select-none shrink-0 group"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 shrink-0 group-hover:scale-[1.08] transition-transform duration-300 flex items-center justify-center">
              <img src="/namma_thanjai_logo.png" alt="namma thanjai logo" className="w-full h-full object-contain mix-blend-multiply" />
            </div>
            <div className="flex items-center gap-0.5">
              <span className="font-heading font-black tracking-tight text-slate-900 text-sm sm:text-base md:text-lg leading-none">
                namma thanjai
              </span>
              <div className="w-2 h-2 rounded-full bg-amber-500 ml-0.5 shrink-0 animate-glow-pulse" />
            </div>
          </div>
        </div>

        {/* Center: 5 Category Navigation Tabs (Hidden on Landing Page) */}
        {showCenterNav && (() => {
          const isHomeActive = pathname === "/home" || pathname === "/" || activeTab === "home";
          const isSellActive = (pathname.includes("/sell") && !pathname.includes("/post/service")) || activeTab === "sell";
          const isNeedActive = pathname.includes("/need") || activeTab === "need";
          const isServiceActive = pathname.includes("/services") || pathname.includes("/post/service") || activeTab === "services";
          const isOfferActive = pathname.includes("/shops") || pathname.includes("/offers") || activeTab === "shops";

          const activeStyle = "bg-white text-amber-600 border border-amber-400/70 shadow-sm font-black tab-active-dot";
          const inactiveStyle = "text-slate-500 hover:text-amber-700 hover:bg-amber-50/60 font-bold transition-all duration-200";

          return (
            <div className="hidden sm:flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200/80 font-heading backdrop-blur-sm">
              <button
                type="button"
                onClick={() => router.push("/home")}
                className={`px-3.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${isHomeActive ? activeStyle : inactiveStyle
                  }`}
              >
                Home
              </button>
              <button
                type="button"
                onClick={() => router.push("/sell")}
                className={`px-3.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${isSellActive ? activeStyle : inactiveStyle
                  }`}
              >
                Sell
              </button>
              <button
                type="button"
                onClick={() => router.push("/need")}
                className={`px-3.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${isNeedActive ? activeStyle : inactiveStyle
                  }`}
              >
                Need
              </button>
              <button
                type="button"
                onClick={() => router.push("/services")}
                className={`px-3.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${isServiceActive ? activeStyle : inactiveStyle
                  }`}
              >
                Local Service
              </button>
              <button
                type="button"
                onClick={() => router.push("/shops")}
                className={`px-3.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${isOfferActive ? activeStyle : inactiveStyle
                  }`}
              >
                Local Offer
              </button>
            </div>
          );
        })()}

        {/* Right: Landing Page Login Button vs Logged-In Chat & Profile Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {(() => {
            const isChatActive = pathname.includes("/chat");
            const isProfileActive = pathname.includes("/profile") || activeTab === "profile";

            return isAuthVerified ? (
              <>
                {/* Chat Icon & Profile Button for Logged In Verified Users */}
                <button
                  type="button"
                  onClick={() => router.push("/chat")}
                  className={`relative flex items-center justify-center w-9 h-9 sm:w-auto sm:px-3.5 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer group active:scale-95 ${isChatActive
                      ? "bg-amber-500/10 text-amber-600 border border-amber-400/80 font-black shadow-2xs"
                      : "bg-slate-100/90 hover:bg-slate-200/80 border border-slate-200/80 text-slate-700 hover:text-amber-600"
                    }`}
                  title="In-App Safety Chat"
                >
                  <MessageSquare className={`w-4 h-4 shrink-0 ${isChatActive ? "text-amber-600 fill-amber-500/20" : "text-slate-500 group-hover:text-amber-600"}`} />
                  <span className="hidden sm:inline text-xs ml-1.5 font-black">Chat Now</span>
                  <span className="absolute top-0 right-0 sm:right-2 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-white animate-pulse" />
                </button>

                <button
                  type="button"
                  onClick={() => onTabChange?.("profile")}
                  className={`relative flex items-center justify-center w-9 h-9 sm:w-auto sm:px-3.5 rounded-full text-xs transition-all duration-200 cursor-pointer group active:scale-95 ${isProfileActive
                      ? "bg-amber-500/10 text-amber-600 border border-amber-400/80 font-black shadow-2xs"
                      : "bg-slate-100/90 hover:bg-slate-200/80 border border-slate-200/80 text-slate-700 hover:text-amber-600 font-bold"
                    }`}
                  title={`Verified Profile (${phoneDisplay})`}
                >
                  <User className={`w-4 h-4 shrink-0 ${isProfileActive ? "text-amber-600" : "text-slate-500 group-hover:text-amber-600"}`} />
                  <span className="hidden md:inline text-xs ml-1.5 font-black">Profile</span>
                </button>
              </>
            ) : (
              /* Login button for all non-authenticated visitors (Secondary Slate-to-Amber Hover Style) */
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== "undefined") {
                    sessionStorage.removeItem("namma_thanjai_target_post_route");
                    localStorage.removeItem("namma_thanjai_target_post_route");
                    sessionStorage.setItem("namma_thanjai_header_login_active", "true");
                  }
                  onSignInClick?.();
                }}
                className="flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-amber-50 hover:border-amber-400/80 text-slate-700 hover:text-amber-900 font-heading font-bold text-xs px-4 py-2 rounded-xl border border-slate-200/90 shadow-sm cursor-pointer active:scale-95 transition-all duration-200 btn-shimmer"
              >
                <User className="w-4 h-4 text-slate-600" />
                <span>Login</span>
              </button>
            );
          })()}
        </div>
      </div>
    </header>
  );
}
