"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, X, ShoppingBag, ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function FirstSessionWelcomeBanner() {
  const { isVerified } = useAuth();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isDismissed = sessionStorage.getItem("namma_thanjai_first_session_banner_dismissed") === "true";
      // Only show for first-time session unauthenticated guests
      if (!isVerified && !isDismissed) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    }
  }, [isVerified]);

  const handleDismiss = () => {
    setIsVisible(false);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("namma_thanjai_first_session_banner_dismissed", "true");
    }
  };

  if (!isVisible || isVerified) return null;

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 pt-3 pb-1">
      <div className="relative w-full bg-gradient-to-r from-[#1F244A] via-[#1E293B] to-[#0F172A] text-white p-3.5 sm:p-4 rounded-2xl shadow-md border border-slate-700/60 flex items-center justify-between gap-3 overflow-hidden select-none">
        
        {/* Left Content */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-amber-400" />
          </div>
          <div className="flex flex-col gap-0.5 min-w-0">
            <h4 className="font-heading font-black text-xs sm:text-sm text-white tracking-tight flex items-center gap-1.5 truncate">
              <span>வணக்கம்! Welcome to Namma Thanjai</span>
            </h4>
            <p className="text-[11px] sm:text-xs text-slate-300 font-medium truncate">
              Thanjavur's #1 Local Market • Browse Ads, Chat with Sellers & Find Local Offers
            </p>
          </div>
        </div>

        {/* Right Dismiss Button */}
        <button
          type="button"
          onClick={handleDismiss}
          className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0 border-0"
          title="Dismiss Banner"
        >
          <X className="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
}
