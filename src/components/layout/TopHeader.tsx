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

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200/90 shadow-xs relative">

      {/* ==========================================
          DESKTOP LAYOUT (>= md)
          ========================================== */}
      <div className="hidden md:flex items-center justify-between w-full max-w-7xl mx-auto px-6 py-4">
        {/* Branding Logo - Left */}
        <div className="flex items-center gap-3">
          <div 
            onClick={() => onTabChange?.("home")}
            className="flex items-center gap-2.5 cursor-pointer select-none"
          >
            <img src="/namma_thanjai_logo.png" alt="namma thanjai logo" className="w-9 h-9 object-contain shrink-0 rounded-xl shadow-2xs border border-slate-100" />
            <div className="flex items-center gap-0.5">
              <span className="font-heading font-black tracking-tight text-slate-900 text-base uppercase">
                namma thanjavur
              </span>
              <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 ml-0.5" />
            </div>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* User auth state */}
          {profile?.isVerified ? (
            <button
              onClick={() => onTabChange?.("profile")}
              className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-bold px-3 py-1.5 rounded-xl text-xs transition-colors cursor-pointer animate-fade-in"
            >
              <Check className="w-3 h-3 text-emerald-600 shrink-0" />
              <span>Verified Profile</span>
            </button>
          ) : (
            <button
              onClick={onSignInClick}
              className="flex items-center gap-1.5 bg-yellow-500 hover:bg-yellow-600 border border-yellow-400/30 text-slate-955 font-black px-4 py-2 rounded-xl text-xs transition-colors cursor-pointer shadow-sm shadow-yellow-500/10"
            >
              <User className="w-3.5 h-3.5 text-slate-955" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>

      {/* ==========================================
          MOBILE LAYOUT (< md)
          ========================================== */}
      <div className="flex flex-col gap-2.5 p-3.5 md:hidden">
        <div className="flex items-center justify-between">
          {/* Logo link with Back Button if subpage */}
          <div className="flex items-center gap-2">
            {activeTab && activeTab !== "home" && (
              <button
                onClick={() => onTabChange?.("home")}
                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center justify-center cursor-pointer border-0 mr-1"
              >
                <ArrowLeft className="w-4 h-4 text-slate-800" />
              </button>
            )}
            <div 
              onClick={() => onTabChange?.("home")}
              className="flex items-center gap-2 cursor-pointer select-none"
            >
              <img src="/namma_thanjai_logo.png" alt="namma thanjai logo" className="w-7 h-7 object-contain shrink-0 rounded-lg shadow-xs" />
              <div className="flex items-center gap-0.5">
                <span className="font-sans font-black tracking-tight text-slate-900 text-xs uppercase">
                  namma thanjavur
                </span>
                <div className="w-1 h-1 rounded-full bg-yellow-500" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* User auth state mobile */}
            {profile?.isVerified ? (
              <button
                onClick={() => onTabChange?.("profile")}
                className="flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-bold px-2.5 py-1 rounded-xl text-[10px] transition-colors animate-fade-in"
              >
                <Check className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                <span>Verified</span>
              </button>
            ) : (
              <button
                onClick={onSignInClick}
                className="flex items-center gap-1 bg-yellow-500 hover:bg-yellow-600 border border-yellow-400/30 text-slate-955 font-black px-3 py-1.5 rounded-xl text-[10px] transition-colors shadow-sm shadow-yellow-500/10"
              >
                <User className="w-3 h-3 text-slate-955" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
