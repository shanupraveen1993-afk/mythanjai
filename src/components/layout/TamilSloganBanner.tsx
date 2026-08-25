"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Sparkles, ShoppingBag, Search, Wrench, Store } from "lucide-react";

export default function TamilSloganBanner() {
  const pathname = usePathname() || "";

  // English Titles + Exact Requested Tamil Texts
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
    <div className="w-full bg-slate-950 border-b border-amber-500/30 py-2.5 px-3 sm:px-6 flex items-center justify-center text-center font-sans shadow-md select-none relative overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-950/60 via-slate-950 to-slate-900">
      {/* Background Subtle Thanjavur Sketch Accent */}
      <div 
        className="absolute inset-0 opacity-15 pointer-events-none bg-repeat-x bg-center"
        style={{ backgroundImage: "url('/thanjavur_temple_illustration.png')", backgroundSize: "contain" }}
      />

      <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 py-0.5 relative z-10">
        <span className="inline-flex items-center shrink-0">{content.icon}</span>
        <p className="font-heading text-xs sm:text-[13px] tracking-normal leading-relaxed flex items-center flex-wrap justify-center gap-1.5 sm:gap-2">
          <span className="font-heading font-black text-amber-400 tracking-tight shrink-0">
            {content.title} —
          </span>
          <span className="text-slate-100 font-bold font-tamil leading-snug">
            {content.text}
          </span>
        </p>
        <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 hidden sm:inline-block opacity-90 animate-pulse" />
      </div>
    </div>
  );
}
