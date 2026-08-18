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
      // Show FAB after scrolling past 350px (2nd screen viewport)
      if (window.scrollY > 350) {
        setShowFAB(true);
      } else {
        setShowFAB(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!showFAB) return null;

  return (
    <div className="fixed bottom-6 right-6 z-40 animate-in slide-in-from-bottom-5 fade-in-50 duration-200">
      <button
        type="button"
        onClick={() => router.push(postRoute)}
        className="btn-primary px-5 py-3 rounded-full text-xs sm:text-sm font-black shadow-xl border-2 border-amber-600 flex items-center gap-2 cursor-pointer active:scale-95 group"
        title={`Click to ${label}`}
      >
        <Plus className="w-4 h-4 stroke-[3] text-slate-950 group-hover:rotate-90 transition-transform duration-200" />
        <span>+ {label}</span>
      </button>
    </div>
  );
}
