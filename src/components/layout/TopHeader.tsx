"use client";

import React from "react";
import { MapPin, Plus, User, ShieldCheck, ArrowLeft, Check } from "lucide-react";
import { TANJORE_LOCALITIES, TanjoreLocality } from "@/lib/constants";
import { AppTab } from "./BottomTabBar";
import { useAuth } from "@/hooks/use-auth";

interface TopHeaderProps {
  selectedArea: TanjoreLocality | "All Areas";
  onAreaChange: (area: TanjoreLocality | "All Areas") => void;
  onPostClick: () => void;
  onSignInClick: () => void;
  activeTab?: AppTab;
  onTabChange?: (tab: AppTab) => void;
}

const DESKTOP_TABS = [
  { id: "classifieds" as AppTab, label: "Buy & Sell" },
  { id: "services" as AppTab, label: "Services" },
  { id: "shops" as AppTab, label: "Recent Offer" },
  { id: "profile" as AppTab, label: "Profile" },
];

export default function TopHeader({
  selectedArea,
  onAreaChange,
  onPostClick,
  onSignInClick,
  activeTab,
  onTabChange,
}: TopHeaderProps) {
  const { profile } = useAuth();
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

        {/* Center: 3 Segment Direct Navigation Tabs */}
        <div className="hidden sm:flex items-center gap-1 bg-slate-100/80 p-1 rounded-2xl border border-slate-200/60">
          <button
            onClick={() => onTabChange?.("classifieds")}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === "classifieds"
                ? "bg-white text-slate-900 shadow-xs border border-slate-250"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Buy & Sell
          </button>
          <button
            onClick={() => onTabChange?.("services")}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === "services"
                ? "bg-white text-slate-900 shadow-xs border border-slate-250"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Helper Trades
          </button>
          <button
            onClick={() => onTabChange?.("shops")}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === "shops"
                ? "bg-white text-slate-900 shadow-xs border border-slate-250"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Store Offers
          </button>
        </div>

        {/* Right: Verified WhatsApp Phone Badge */}
        <div className="flex items-center gap-2 shrink-0">
          {profile?.isVerified ? (
            <button
              onClick={() => onTabChange?.("profile")}
              className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-extrabold px-3 py-1.5 rounded-xl text-xs transition-all shadow-2xs cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="hidden xs:inline">{phoneDisplay}</span>
              <span className="bg-emerald-600 text-white text-[9px] font-black uppercase px-1.5 py-0.2 rounded-md">Verified</span>
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
