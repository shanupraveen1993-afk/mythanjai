"use client";

import React, { useState, useEffect } from "react";
import { ShoppingBag, Wrench, Store, ArrowRight, X, Sparkles } from "lucide-react";

interface WalkthroughModalProps {
  isOpen: boolean;
  onComplete: () => void;
}

export default function WalkthroughModal({ isOpen, onComplete }: WalkthroughModalProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  if (!isOpen) return null;

  const slides = [
    {
      title: "Buy & Sell Locally",
      titleTa: "தஞ்சையில் வாங்க & விற்கலாம்",
      desc: "Connect directly with trusted Thanjavur buyers and sellers with zero middleman fees.",
      icon: ShoppingBag,
      color: "from-amber-400 to-amber-600",
      bgColor: "bg-amber-50 border-amber-200 text-amber-900",
    },
    {
      title: "Verified Local Services",
      titleTa: "உள்ளூர் தொழில் சேவைகள்",
      desc: "Hire verified plumbers, electricians, mechanics, and technicians near you in Thanjavur.",
      icon: Wrench,
      color: "from-blue-500 to-indigo-600",
      bgColor: "bg-blue-50 border-blue-200 text-blue-900",
    },
    {
      title: "Exclusive Shop Offers",
      titleTa: "கடை சலுகைகள் & டிஸ்கவுண்ட்",
      desc: "Discover real-time discounts, festive offers, and deals from Tanjore local stores.",
      icon: Store,
      color: "from-emerald-500 to-teal-600",
      bgColor: "bg-emerald-50 border-emerald-200 text-emerald-900",
    },
  ];

  const current = slides[currentSlide];
  const Icon = current.icon;

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-slate-200 flex flex-col justify-between p-6 sm:p-8 relative min-h-[460px]">
        {/* Skip Button */}
        <button
          type="button"
          onClick={onComplete}
          className="absolute top-4 right-4 text-xs font-black text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-full transition-all cursor-pointer"
        >
          Skip
        </button>

        {/* Brand Logo Header */}
        <div className="flex items-center gap-2">
          <img src="/namma_thanjai_logo.png" alt="Namma Thanjai Logo" className="w-8 h-8 object-contain" />
          <span className="font-heading font-black text-base text-slate-900 tracking-tight">
            <span className="text-[#1d4ed8]">நம்ம</span> <span className="text-[#f59e0b]">thanjai</span>
          </span>
        </div>

        {/* Slide Visual Box */}
        <div className="my-auto flex flex-col items-center text-center gap-4 py-4">
          <div className={`w-20 h-20 rounded-3xl bg-gradient-to-tr ${current.color} flex items-center justify-center text-white shadow-xl shadow-amber-500/20 transform hover:scale-105 transition-transform duration-300`}>
            <Icon className="w-10 h-10 stroke-[2.2]" />
          </div>

          <div className="flex flex-col gap-1 max-w-xs">
            <h2 className="font-heading font-black text-xl text-slate-900 tracking-tight">
              {current.title}
            </h2>
            <p className="text-amber-700 font-extrabold text-xs">
              {current.titleTa}
            </p>
            <p className="text-slate-600 text-xs mt-2 leading-relaxed font-medium">
              {current.desc}
            </p>
          </div>
        </div>

        {/* Pagination Dots & Navigation Action */}
        <div className="flex flex-col gap-4 w-full">
          {/* Pagination Indicators */}
          <div className="flex justify-center gap-2">
            {slides.map((_, idx) => (
              <span
                key={idx}
                className={`h-2 rounded-full transition-all duration-300 ${
                  idx === currentSlide ? "w-6 bg-[#FBBF24]" : "w-2 bg-slate-200"
                }`}
              />
            ))}
          </div>

          {/* Primary Action Button */}
          <button
            type="button"
            onClick={handleNext}
            className="w-full bg-[#FBBF24] hover:bg-amber-400 text-[#0F172A] font-heading font-black text-sm py-3.5 rounded-2xl shadow-md cursor-pointer transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <span>{currentSlide === slides.length - 1 ? "Get Started" : "Continue"}</span>
            <ArrowRight className="w-4 h-4 stroke-[3]" />
          </button>
        </div>
      </div>
    </div>
  );
}
