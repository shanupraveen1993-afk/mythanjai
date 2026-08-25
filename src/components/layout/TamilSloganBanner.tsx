"use client";

import React from "react";
import { Sparkles, Megaphone } from "lucide-react";

export default function TamilSloganBanner() {
  return (
    <div className="w-full bg-gradient-to-r from-amber-500/10 via-amber-400/20 to-amber-500/10 border-b border-amber-200/80 py-2 px-3 sm:px-6 flex items-center justify-center text-center font-sans shadow-2xs select-none">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-slate-900">
        <Megaphone className="w-4 h-4 text-amber-600 shrink-0 stroke-[2.5] animate-pulse hidden sm:inline-block" />
        <span className="font-heading font-extrabold text-xs sm:text-sm tracking-tight leading-snug text-slate-900">
          🏛️ <span className="text-amber-800 font-black">நம்ம தஞ்சாவூர் உள்ளூர் சந்தை</span> • இலவசமாக விளம்பரம் செய்யுங்கள் &amp; நேரடியாக தொடர்புகொள்ளுங்கள்!
        </span>
        <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0 hidden sm:inline-block" />
      </div>
    </div>
  );
}
