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
    <div className="fixed bottom-20 md:bottom-8 right-5 z-[10000] animate-in slide-in-from-bottom-5 fade-in-50 duration-200 pointer-events-auto">
      <button
        type="button"
        onClick={() => router.push(postRoute)}
        className="btn-primary px-4 py-2.5 sm:px-5 sm:py-3 rounded-full text-xs sm:text-sm font-black shadow-2xl border-2 border-amber-600 flex items-center gap-2 cursor-pointer active:scale-95 group backdrop-blur-md"
        title={`Click to ${label}`}
      >
        <Plus className="w-4 h-4 stroke-[3] text-slate-950 group-hover:rotate-90 transition-transform duration-200" />
        <span>+ {label}</span>
      </button>
    </div>
  );
}
