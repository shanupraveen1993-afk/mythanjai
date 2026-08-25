"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Sparkles, ShoppingBag, Search, Wrench, Store } from "lucide-react";

export default function TamilSloganBanner() {
  const pathname = usePathname() || "";

  // Exact User-Provided Segment Tamil Slogans & Badges
  const getBannerContent = () => {
    if (pathname.includes("/need")) {
      return {
        icon: <Search className="w-3.5 h-3.5 text-amber-700 shrink-0 stroke-[2.2]" />,
        badge: "🔍 தேவைகள் & தேடல்",
        text: "உங்களுக்கு தேவையான பொருள் அல்லது சேவையை பதிவிட்டு எளிதாக பெற்றுக்கொள்ளுங்கள்!",
        gradient: "bg-[#FFFBEB] border-amber-200/90 text-amber-950",
      };
    }
    if (pathname.includes("/service")) {
      return {
        icon: <Wrench className="w-3.5 h-3.5 text-emerald-700 shrink-0 stroke-[2.2]" />,
        badge: "🔧 உள்ளூர் சேவைகள்",
        text: "தஞ்சாவூரில் உங்களுக்கு தேவையான சிறந்த சேவையை எளிதாக கண்டுபிடியுங்கள்!",
        gradient: "bg-[#ECFDF5] border-emerald-200/90 text-emerald-950",
      };
    }
    if (pathname.includes("/shops") || pathname.includes("/offer")) {
      return {
        icon: <Store className="w-3.5 h-3.5 text-purple-700 shrink-0 stroke-[2.2]" />,
        badge: "🏷️ கடைகள் & ஆஃபர்கள்",
        text: "தஞ்சாவூர் உள்ளூர் கடைகளின் புதிய ஆஃபர்கள் மற்றும் ரீல்ஸ் சலுகைகளை கண்டறியுங்கள்!",
        gradient: "bg-[#FAF5FF] border-purple-200/90 text-purple-950",
      };
    }
    // Default: Sell Marketplace (/sell, /, /home)
    return {
      icon: <ShoppingBag className="w-3.5 h-3.5 text-amber-700 shrink-0 stroke-[2.2]" />,
      badge: "🛍️ விற்பனை சந்தை",
      text: "உங்கள் பொருட்களை இலவசமாக பதிவிட்டு தஞ்சாவூர் வாங்குபவர்களை எளிதாக சென்றடையுங்கள்!",
      gradient: "bg-[#FFFBEB] border-amber-200/90 text-amber-950",
    };
  };

  const content = getBannerContent();

  return (
    <div className={`w-full border-b py-2 px-3 sm:px-6 flex items-center justify-center text-center font-sans shadow-2xs select-none transition-all duration-200 ${content.gradient}`}>
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 py-0.5">
        <span className="hidden sm:inline-flex items-center">{content.icon}</span>
        <p className="font-heading text-xs sm:text-[13px] tracking-normal leading-relaxed flex items-center flex-wrap justify-center gap-1.5 sm:gap-2">
          <span className="font-black text-slate-900 bg-white/70 px-2 py-0.5 rounded-md border border-slate-200/60 shadow-2xs shrink-0">
            {content.badge}
          </span>
          <span className="text-slate-800 font-medium">
            {content.text}
          </span>
        </p>
        <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0 hidden sm:inline-block opacity-80" />
      </div>
    </div>
  );
}
