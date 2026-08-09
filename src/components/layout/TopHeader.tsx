"use client";

import React from "react";
import { MapPin, Plus, User, ShieldCheck, ArrowLeft, Check } from "lucide-react";
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
  const showSegmentTabs = isAuthVerified && pathname !== "/";

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
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200/90 shadow-xs">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3">
        
        {/* Left: Website Branding Logo across all pages */}
        <div className="flex items-center gap-3">
          <div 
            onClick={() => router.push("/")}
            className="flex items-center gap-2 cursor-pointer select-none shrink-0"
          >
            <img src="/namma_thanjai_logo.png" alt="namma thanjai logo" className="w-9 h-9 sm:w-10 sm:h-10 object-contain shrink-0 rounded-xl border-0 shadow-none" />
            <div className="flex items-center gap-0.5">
              <span className="font-heading font-black tracking-tight text-slate-900 text-xs sm:text-sm uppercase">
                namma thanjai
              </span>
              <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 ml-0.5" />
            </div>
          </div>
        </div>

        {/* Center: 5 Channel Navigation Tabs (Home, Sell, Need, Local Service, Local Offer) */}
        <div className="hidden sm:flex items-center gap-1 bg-slate-100/80 p-1 rounded-2xl border border-slate-200/60">
          <button
            type="button"
            onClick={() => router.push("/")}
            className={`px-2.5 sm:px-3 py-1 rounded-xl text-[11px] sm:text-xs font-black transition-all cursor-pointer ${
              pathname === "/"
                ? "bg-white text-slate-900 shadow-xs border border-slate-250"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Home
          </button>
          <button
            type="button"
            onClick={() => router.push("/sell")}
            className={`px-2.5 sm:px-3 py-1 rounded-xl text-[11px] sm:text-xs font-black transition-all cursor-pointer ${
              pathname === "/sell"
                ? "bg-white text-slate-900 shadow-xs border border-slate-250"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Sell
          </button>
          <button
            type="button"
            onClick={() => router.push("/need")}
            className={`px-2.5 sm:px-3 py-1 rounded-xl text-[11px] sm:text-xs font-black transition-all cursor-pointer ${
              pathname === "/need"
                ? "bg-white text-slate-900 shadow-xs border border-slate-250"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Need
          </button>
          <button
            type="button"
            onClick={() => router.push("/services")}
            className={`px-2.5 sm:px-3 py-1 rounded-xl text-[11px] sm:text-xs font-black transition-all cursor-pointer ${
              pathname === "/services"
                ? "bg-white text-slate-900 shadow-xs border border-slate-250"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Local Service
          </button>
          <button
            type="button"
            onClick={() => router.push("/shops")}
            className={`px-2.5 sm:px-3 py-1 rounded-xl text-[11px] sm:text-xs font-black transition-all cursor-pointer ${
              pathname === "/shops"
                ? "bg-white text-slate-900 shadow-xs border border-slate-250"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Local Offer
          </button>
        </div>

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
