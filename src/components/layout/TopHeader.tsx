"use client";

import React from "react";
import { MapPin, Plus, User, ShieldCheck, Check, MessageSquare } from "lucide-react";
import { TANJORE_LOCALITIES, TanjoreLocality } from "@/lib/constants";
import { AppTab } from "./BottomTabBar";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";

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
  
  const isAuthVerified = Boolean(profile?.isVerified);
  const showCenterNav = isAuthVerified || pathname !== "/";

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
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/85 backdrop-blur-md border-b border-slate-200 shadow-sm h-14 flex items-center">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3">
        
        {/* Left: Website Branding Logo across all pages */}
        <div className="flex items-center gap-2">
          <div 
            onClick={() => router.push("/")}
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

        {/* Center: 6 Channel Navigation Tabs (Visible post-login & on internal pages) */}
        {showCenterNav && (
          <div className="hidden sm:flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60 font-heading">
            <button
              type="button"
              onClick={() => router.push("/")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                pathname === "/"
                  ? "bg-white text-slate-900 shadow-2xs border border-slate-200"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Home
            </button>
            <button
              type="button"
              onClick={() => router.push("/sell")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                pathname === "/sell" || pathname.startsWith("/post/sell")
                  ? "bg-white text-slate-900 shadow-2xs border border-slate-200"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Sell
            </button>
            <button
              type="button"
              onClick={() => router.push("/need")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                pathname === "/need" || pathname.startsWith("/post/need")
                  ? "bg-white text-slate-900 shadow-2xs border border-slate-200"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Need
            </button>
            <button
              type="button"
              onClick={() => router.push("/services")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                pathname === "/services" || pathname.startsWith("/post/service")
                  ? "bg-white text-slate-900 shadow-2xs border border-slate-200"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Local Service
            </button>
            <button
              type="button"
              onClick={() => router.push("/shops")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                pathname === "/shops" || pathname === "/offers" || pathname.startsWith("/post/offer")
                  ? "bg-white text-slate-900 shadow-2xs border border-slate-200"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Local Offer
            </button>
          </div>
        )}

        {/* Right: Chat Notification Icon & Profile Button */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => router.push("/chat")}
            className="relative flex items-center justify-center w-9 h-9 sm:w-auto sm:px-3.5 bg-slate-100/90 hover:bg-slate-200 border border-slate-200/80 text-slate-800 rounded-full text-xs font-bold transition-all shadow-[0_2px_8px_-3px_rgba(0,0,0,0.1)] cursor-pointer group"
            title="In-App Safety Chat"
          >
            <MessageSquare className="w-4 h-4 text-slate-600 group-hover:text-emerald-600 shrink-0" />
            <span className="hidden sm:inline text-xs font-bold text-slate-700 ml-1.5">Chat</span>
            <span className="absolute top-0 right-0 sm:right-2 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-white animate-pulse" />
          </button>

          {isAuthVerified ? (
            <button
              onClick={() => onTabChange?.("profile")}
              className="relative flex items-center justify-center w-9 h-9 sm:w-auto sm:px-3.5 bg-slate-100/90 hover:bg-slate-200 border border-slate-200/80 text-slate-800 font-bold rounded-full text-xs transition-all shadow-[0_2px_8px_-3px_rgba(0,0,0,0.1)] cursor-pointer group"
              title={`Verified Profile (${phoneDisplay})`}
            >
              <User className="w-4 h-4 text-slate-600 group-hover:text-slate-900 shrink-0" />
              <span className="hidden md:inline text-xs font-bold text-slate-700 ml-1.5">Profile</span>
            </button>
          ) : (
            <button
              onClick={onSignInClick}
              className="flex items-center justify-center w-9 h-9 sm:w-auto sm:px-3.5 bg-slate-100/90 hover:bg-slate-200 border border-slate-200/80 text-slate-800 font-bold text-xs transition-all shadow-[0_2px_8px_-3px_rgba(0,0,0,0.1)] cursor-pointer rounded-full group"
            >
              <User className="w-4 h-4 text-slate-600 group-hover:text-slate-900 shrink-0" />
              <span className="hidden sm:inline text-xs font-bold text-slate-700 ml-1.5">Profile</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
