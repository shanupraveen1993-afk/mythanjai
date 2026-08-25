"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Sparkles, ShoppingBag, Search, Wrench, Store } from "lucide-react";

export default function TamilSloganBanner() {
  const pathname = usePathname() || "";

  // English Titles + Tamil Subtitles
  const getBannerContent = () => {
    if (pathname.includes("/need")) {
      return {
        icon: <Search className="w-3.5 h-3.5 text-amber-600 shrink-0 stroke-[2.5]" />,
        badge: "🔍 Requirements & Needs",
        text: "உங்களுக்கு தேவையான பொருள் அல்லது சேவையை பதிவிட்டு எளிதாக பெற்றுக்கொள்ளுங்கள்!",
      };
    }
    if (pathname.includes("/service")) {
      return {
        icon: <Wrench className="w-3.5 h-3.5 text-amber-600 shrink-0 stroke-[2.5]" />,
        badge: "🔧 Local Services",
        text: "தஞ்சாவூரில் உங்களுக்கு தேவையான சிறந்த சேவையை எளிதாக கண்டுபிடியுங்கள்!",
      };
    }
    if (pathname.includes("/shops") || pathname.includes("/offer")) {
      return {
        icon: <Store className="w-3.5 h-3.5 text-amber-600 shrink-0 stroke-[2.5]" />,
        badge: "🏷️ Shops & Offers",
        text: "தஞ்சாவூர் உள்ளூர் கடைகளின் புதிய ஆஃபர்கள் மற்றும் ரீல்ஸ் சலுகைகளை கண்டறியுங்கள்!",
      };
    }
    // Default: Sell Marketplace (/sell)
    return {
      icon: <ShoppingBag className="w-3.5 h-3.5 text-amber-600 shrink-0 stroke-[2.5]" />,
      badge: "🛍️ Classified Marketplace",
      text: "உங்கள் பொருட்களை இலவசமாக பதிவிட்டு தஞ்சாவூர் வாங்குபவர்களை எளிதாக சென்றடையுங்கள்!",
    };
  };

  const content = getBannerContent();

  return (
    <div className="w-full bg-[#FFFBEB] border-b border-amber-200/90 py-2 px-3 sm:px-6 flex items-center justify-center text-center font-sans shadow-2xs select-none transition-all duration-150">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 py-0.5">
        <span className="hidden sm:inline-flex items-center">{content.icon}</span>
        <p className="font-heading text-xs sm:text-[13px] tracking-normal leading-relaxed flex items-center flex-wrap justify-center gap-1.5 sm:gap-2">
          <span className="font-black text-slate-900 bg-amber-400/30 px-2 py-0.5 rounded-md border border-amber-400/50 shadow-2xs shrink-0 font-heading">
            {content.badge}
          </span>
          <span className="text-slate-800 font-bold font-tamil">
            {content.text}
          </span>
        </p>
        <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0 hidden sm:inline-block opacity-80" />
      </div>
    </div>
  );
}
