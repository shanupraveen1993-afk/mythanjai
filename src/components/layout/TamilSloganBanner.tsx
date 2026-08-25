"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Sparkles, Megaphone, ShoppingBag, Search, Wrench, Store } from "lucide-react";

export default function TamilSloganBanner() {
  const pathname = usePathname() || "";

  // Segment-Specific Tamil Slogan Configuration
  const getBannerContent = () => {
    if (pathname.includes("/need")) {
      return {
        icon: <Search className="w-4 h-4 text-amber-700 shrink-0 stroke-[2.5]" />,
        badge: "🔍 தேர்வுகள் & தேவைகள்",
        text: "உங்களுக்கு தேவையான பொருள்கள் அல்லது சேவைகளை இலவசமாக பதிவிட்டு உடனடியாக பெறுங்கள்!",
        gradient: "bg-gradient-to-r from-amber-500/15 via-orange-400/20 to-amber-500/15 border-amber-300/80 text-amber-950",
      };
    }
    if (pathname.includes("/service")) {
      return {
        icon: <Wrench className="w-4 h-4 text-emerald-700 shrink-0 stroke-[2.5]" />,
        badge: "🔧 உள்ளூர் சேவைகள்",
        text: "தஞ்சாவூர் சிறந்த கைவினைஞர்கள் & சேவை நிபுணர்களை கட்டணமின்றி நேரடியாக தொடர்பு கொள்ளுங்கள்!",
        gradient: "bg-gradient-to-r from-emerald-500/15 via-emerald-400/20 to-emerald-500/15 border-emerald-300/80 text-emerald-950",
      };
    }
    if (pathname.includes("/shops") || pathname.includes("/offer")) {
      return {
        icon: <Store className="w-4 h-4 text-purple-700 shrink-0 stroke-[2.5]" />,
        badge: "🏷️ கடைகள் & தள்ளுபடிகள்",
        text: "தஞ்சாவூர் உள்ளூர் கடைகளின் பிரத்யேக தள்ளுபடிகள் & ரீல் வீடியோ ஆஃபர்களை பாருங்கள்!",
        gradient: "bg-gradient-to-r from-purple-500/15 via-amber-400/20 to-purple-500/15 border-purple-300/80 text-purple-950",
      };
    }
    // Default: Sell Marketplace (/sell, /, /home)
    return {
      icon: <ShoppingBag className="w-4 h-4 text-amber-700 shrink-0 stroke-[2.5]" />,
      badge: "🛍️ விற்பனை சந்தை",
      text: "உங்கள் பொருள்களை இலவசமாக பதிவிட்டு தஞ்சாவூர் வாங்குபவர்களை உடனடியாக தொடர்பு கொள்ளுங்கள்!",
      gradient: "bg-gradient-to-r from-amber-500/15 via-amber-400/25 to-amber-500/15 border-amber-300/90 text-amber-950",
    };
  };

  const content = getBannerContent();

  return (
    <div className={`w-full border-b py-2 px-3 sm:px-6 flex items-center justify-center text-center font-sans shadow-2xs select-none ${content.gradient}`}>
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-slate-900">
        <span className="hidden sm:inline-block">{content.icon}</span>
        <span className="font-heading font-extrabold text-xs sm:text-sm tracking-tight leading-snug">
          <span className="font-black underline decoration-amber-500/50 mr-1.5">{content.badge}</span>
          <span className="text-slate-800 font-bold">• {content.text}</span>
        </span>
        <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0 hidden sm:inline-block" />
      </div>
    </div>
  );
}
