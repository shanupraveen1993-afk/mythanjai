"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Sparkles, ShoppingBag, Search, Wrench, Store, X } from "lucide-react";

export default function TamilSloganBanner() {
  const pathname = usePathname() || "";
  const [isDismissed, setIsDismissed] = useState<boolean>(true); // default true until client check

  useEffect(() => {
    if (typeof window !== "undefined") {
      const dismissed = localStorage.getItem("namma_thanjai_banner_dismissed") === "true";
      setIsDismissed(dismissed);
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    if (typeof window !== "undefined") {
      localStorage.setItem("namma_thanjai_banner_dismissed", "true");
    }
  };

  if (isDismissed) return null;

  // English Titles + Exact Tamil Text with Underlined Titles
  const getBannerContent = () => {
    if (pathname.includes("/need")) {
      return {
        icon: <Search className="w-4 h-4 text-amber-400 shrink-0 stroke-[2.5]" />,
        title: "Requirements & Needs",
        text: "உங்களுக்கு என்ன தேவை என்று சொல்லுங்கள் — பொருளாக இருந்தாலும், Service ஆக இருந்தாலும் இங்கே தேடலாம்!",
      };
    }
    if (pathname.includes("/service")) {
      return {
        icon: <Wrench className="w-4 h-4 text-amber-400 shrink-0 stroke-[2.5]" />,
        title: "Local Services",
        text: "Plumber முதல் Carpenter வரை, தஞ்சாவூரில் உங்களுக்குத் தேவையான Local Service நபர்களை எளிதாகக் கண்டுபிடிக்கலாம்!",
      };
    }
    if (pathname.includes("/shops") || pathname.includes("/offer")) {
      return {
        icon: <Store className="w-4 h-4 text-amber-400 shrink-0 stroke-[2.5]" />,
        title: "Shops & Offers",
        text: "தஞ்சாவூர் கடைகளில் என்ன புதுசு, என்ன Offer என்று ஒரே இடத்தில் தெரிந்துகொள்ளலாம் — உங்களுக்கு பிடித்ததை வாங்கலாம்!",
      };
    }
    // Default: Sell Marketplace (/sell, /, /home)
    return {
      icon: <ShoppingBag className="w-4 h-4 text-amber-400 shrink-0 stroke-[2.5]" />,
      title: "Classified Marketplace",
      text: "உங்கள் பொருட்களை தஞ்சாவூரில் விற்பனை செய்யுங்கள் — வாங்க விரும்புபவர்கள் உங்களை நேரடியாக Contact செய்யலாம்!",
    };
  };

  const content = getBannerContent();

  return (
    <div 
      className="w-full bg-[#1E244A] text-white border-b border-white/10 py-2 px-4 sm:px-8 flex items-center justify-center text-center font-sans shadow-md select-none relative transition-all mt-0 mb-0"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 py-0.5 relative z-10">
        <span className="inline-flex items-center shrink-0 p-1 bg-amber-400/10 rounded-lg border border-amber-400/20">{content.icon}</span>
        <p className="font-heading text-xs sm:text-[13px] tracking-normal leading-relaxed flex items-center flex-wrap justify-center gap-1.5 sm:gap-2 pr-5 sm:pr-0">
          <span className="font-heading font-black tracking-wider shrink-0 uppercase text-[10px] sm:text-[11px] bg-amber-400/15 text-amber-300 px-2 py-0.5 rounded-md border border-amber-400/30">
            {content.title}
          </span>
          <span className="text-slate-500 font-bold hidden sm:inline">—</span>
          <span className="text-slate-200 font-semibold font-tamil leading-snug">
            {content.text}
          </span>
        </p>
        <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 hidden sm:inline-block opacity-90 animate-pulse" />
      </div>

      {/* Top-Right Dismiss 'X' Close Button */}
      <button
        type="button"
        onClick={handleDismiss}
        className="absolute top-2 right-2.5 sm:right-4 z-20 text-slate-400 hover:text-white p-1 rounded-full bg-slate-800/80 hover:bg-slate-800 transition-colors cursor-pointer border border-slate-700/80 shadow-2xs"
        title="Close Banner for all pages"
      >
        <X className="w-3.5 h-3.5 stroke-[2.5]" />
      </button>
    </div>
  );
}
