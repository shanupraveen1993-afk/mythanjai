"use client";

import React, { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";

interface WebAppScrollFABProps {
  postRoute: string;
  label?: string;
}

export default function WebAppScrollFAB({ postRoute, label = "Post Ad" }: WebAppScrollFABProps) {
  const router = useRouter();
  const [showFAB, setShowFAB] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show FAB after scrolling past 120px
      if (window.scrollY > 120) {
        setShowFAB(true);
      } else {
        setShowFAB(false);
      }
    };

    handleScroll(); // Initial check
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!showFAB) return null;

  return (
    <div className="md:hidden fixed bottom-[4.25rem] left-4 right-4 z-[10000] max-w-sm mx-auto animate-in slide-in-from-bottom-5 fade-in-50 duration-200 pointer-events-auto">
      <button
        type="button"
        onClick={() => router.push(postRoute)}
        className="w-full bg-[#FBBF24] hover:bg-amber-400 text-[#0F172A] font-heading font-black text-xs sm:text-sm py-3 px-4 rounded-xl shadow-xl flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] transition-all border border-amber-400/50 select-none"
        title={`Click to ${label}`}
      >
        <Plus className="w-4 h-4 stroke-[3] text-[#0F172A]" />
        <span>+ {label}</span>
      </button>
    </div>
  );
}
