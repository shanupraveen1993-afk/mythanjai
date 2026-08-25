"use client";

import React, { useEffect, useState } from "react";

interface SplashScreenProps {
  onFinished: () => void;
}

export default function SplashScreen({ onFinished }: SplashScreenProps) {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFadeOut(true);
      const finishTimer = setTimeout(() => {
        onFinished();
      }, 500);
      return () => clearTimeout(finishTimer);
    }, 2000);

    return () => clearTimeout(timer);
  }, [onFinished]);

  return (
    <div
      className={`fixed inset-0 z-[999999] bg-slate-950 flex flex-col items-center justify-center p-6 text-white transition-opacity duration-500 select-none ${
        fadeOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <div className="flex flex-col items-center gap-4 animate-in zoom-in-95 duration-700">
        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-white p-3 shadow-lg border border-slate-800 flex items-center justify-center animate-pulse">
          <img src="/namma_thanjai_logo.png" alt="Namma Thanjai Logo" className="w-full h-full object-contain" />
        </div>

        <div className="flex flex-col items-center text-center gap-1">
          <h1 className="font-heading font-black text-2xl sm:text-3xl tracking-tight text-white">
            <span className="text-[#3b82f6]">நம்ம</span> <span className="text-[#f59e0b]">thanjai</span>
          </h1>
          <p className="text-amber-400 font-extrabold text-xs sm:text-sm tracking-wider uppercase">
            Namma Thanjai • Tanjore City App
          </p>
        </div>
      </div>

      <div className="absolute bottom-8 flex flex-col items-center gap-2">
        <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
        <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">
          Loading Thanjavur Marketplace...
        </span>
      </div>
    </div>
  );
}
