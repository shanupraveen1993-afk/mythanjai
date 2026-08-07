"use client";

import React from "react";
import { MapPin, Plus, User, ShieldCheck, ArrowLeft, Check } from "lucide-react";
import { TANJORE_LOCALITIES, TanjoreLocality } from "@/lib/constants";
import { AppTab } from "./BottomTabBar";
import { usePathname } from "next/navigation";
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
  const pathname = usePathname();
  const { profile } = useAuth();
  
  const isAuthVerified = Boolean(profile?.isVerified);
  const showSegmentTabs = isAuthVerified && pathname !== "/";

  const phoneDisplay = profile?.phone ? `+${profile.phone}` : "+919994837342";

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200/90 shadow-xs">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3">
        
        {/* Left: Branding Logo / Home */}
        <div 
          onClick={() => onTabChange?.("home")}
          className="flex items-center gap-2 cursor-pointer select-none shrink-0"
        >
          <img src="/namma_thanjai_logo.png" alt="namma thanjai logo" className="w-8 h-8 object-contain shrink-0 rounded-xl border border-slate-100 shadow-2xs" />
          <div className="flex items-center gap-0.5">
            <span className="font-heading font-black tracking-tight text-slate-900 text-xs sm:text-sm uppercase">
              namma thanjavur
            </span>
            <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 ml-0.5" />
          </div>
        </div>

        {/* Center: 5 Channel Navigation Tabs (Home, Sell, Need, Local Service, Local Offer) */}
        {isAuthVerified && (
          <div className="hidden sm:flex items-center gap-1 bg-slate-100/80 p-1 rounded-2xl border border-slate-200/60">
            <button
              onClick={() => onTabChange?.("home")}
              className={`px-2.5 sm:px-3 py-1 rounded-xl text-[11px] sm:text-xs font-black transition-all cursor-pointer ${
                activeTab === "home"
                  ? "bg-white text-slate-900 shadow-xs border border-slate-250"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Home
            </button>
            <button
              onClick={() => onTabChange?.("classifieds")}
              className={`px-2.5 sm:px-3 py-1 rounded-xl text-[11px] sm:text-xs font-black transition-all cursor-pointer ${
                activeTab === "classifieds"
                  ? "bg-white text-slate-900 shadow-xs border border-slate-250"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Sell
            </button>
            <button
              onClick={() => onTabChange?.("classifieds")}
              className={`px-2.5 sm:px-3 py-1 rounded-xl text-[11px] sm:text-xs font-black transition-all cursor-pointer ${
                activeTab === "classifieds"
                  ? "bg-white text-slate-900 shadow-xs border border-slate-250"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Need
            </button>
            <button
              onClick={() => onTabChange?.("services")}
              className={`px-2.5 sm:px-3 py-1 rounded-xl text-[11px] sm:text-xs font-black transition-all cursor-pointer ${
                activeTab === "services"
                  ? "bg-white text-slate-900 shadow-xs border border-slate-250"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Local Service
            </button>
            <button
              onClick={() => onTabChange?.("shops")}
              className={`px-2.5 sm:px-3 py-1 rounded-xl text-[11px] sm:text-xs font-black transition-all cursor-pointer ${
                activeTab === "shops"
                  ? "bg-white text-slate-900 shadow-xs border border-slate-250"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Local Offer
            </button>
          </div>
        )}

        {/* Right: Verified Profile Icon Button / Verify Mobile */}
        <div className="flex items-center gap-2 shrink-0">
          {isAuthVerified ? (
            <button
              onClick={() => onTabChange?.("profile")}
              className="relative flex items-center gap-2 bg-slate-100/90 hover:bg-slate-200/80 border border-slate-250/80 text-slate-800 font-extrabold px-3 py-1.5 rounded-xl text-xs transition-all shadow-2xs cursor-pointer group"
              title={`Verified Profile (${phoneDisplay})`}
            >
              <div className="relative">
                <User className="w-4 h-4 text-slate-700 group-hover:text-slate-900" />
                <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[8px] font-black shadow-xs border border-white">
                  ✓
                </span>
              </div>
              <span className="hidden md:inline text-xs font-black text-slate-700">Profile</span>
            </button>
          ) : (
            <button
              onClick={onSignInClick}
              className="flex items-center gap-1.5 bg-yellow-500 hover:bg-yellow-600 text-slate-955 font-black px-3.5 py-1.5 rounded-xl text-xs transition-all cursor-pointer border border-yellow-400 shadow-2xs"
            >
              <User className="w-3.5 h-3.5 text-slate-955" />
              <span>Verify Mobile</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
