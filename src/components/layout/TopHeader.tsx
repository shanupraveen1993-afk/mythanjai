"use client";

import React from "react";
import { MapPin, Plus, User, ShieldCheck } from "lucide-react";
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
        <div 
          onClick={() => onTabChange?.("home")}
          className="flex items-center gap-2 cursor-pointer select-none"
        >
          <div className="w-7 h-7 rounded-xl bg-yellow-50 flex items-center justify-center border border-yellow-200 overflow-hidden shrink-0 shadow-xs">
            <img src="/namma_thanjai_logo.png" alt="namma thanjai app logo" className="w-6 h-6 object-contain" />
          </div>
          <div className="flex items-center gap-0.5">
            <span className="font-sans font-black tracking-tight text-slate-900 text-sm">
              namma thanjai
            </span>
            <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="flex items-center gap-6 mr-16">
          {DESKTOP_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange?.(tab.id)}
              className={`text-[10px] font-black uppercase tracking-widest transition-colors relative py-1 ${
                activeTab === tab.id
                  ? "text-yellow-600"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-[-10px] left-0 right-0 h-0.5 bg-yellow-500 rounded-full" />
              )}
            </button>
          ))}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* User auth state */}
          {profile?.isVerified ? (
            <button
              onClick={() => onTabChange?.("profile")}
              className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-bold px-3 py-1.5 rounded-xl text-xs transition-colors cursor-pointer animate-fade-in"
            >
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[7px] font-black shrink-0">
                ✓
              </div>
              <span>Verified Profile</span>
            </button>
          ) : (
            <button
              onClick={onSignInClick}
              className="flex items-center gap-1 bg-white hover:bg-slate-50 border border-slate-250 text-slate-700 font-bold px-3 py-1.5 rounded-xl text-xs transition-colors cursor-pointer"
            >
              <User className="w-3.5 h-3.5 text-slate-500" />
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
          {/* Logo link */}
          <div 
            onClick={() => onTabChange?.("home")}
            className="flex items-center gap-2 cursor-pointer select-none"
          >
            <div className="w-6.5 h-6.5 rounded-xl bg-yellow-50 flex items-center justify-center border border-yellow-200 overflow-hidden shrink-0 shadow-xs">
              <img src="/namma_thanjai_logo.png" alt="namma thanjai app logo" className="w-5.5 h-5.5 object-contain" />
            </div>
            <div className="flex items-center gap-0.5">
              <span className="font-sans font-black tracking-tight text-slate-900 text-xs">
                namma thanjai
              </span>
              <div className="w-1 h-1 rounded-full bg-yellow-500" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* User auth state mobile */}
            {profile?.isVerified ? (
              <button
                onClick={() => onTabChange?.("profile")}
                className="flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-bold px-2.5 py-1 rounded-xl text-[10px] transition-colors animate-fade-in"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[6px] font-black shrink-0">
                  ✓
                </div>
                <span>Verified</span>
              </button>
            ) : (
              <button
                onClick={onSignInClick}
                className="flex items-center gap-0.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold px-2.5 py-1 rounded-xl text-[10px] transition-colors"
              >
                <User className="w-3.5 h-3.5 text-slate-450" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
