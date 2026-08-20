"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import { ChevronUp, ArrowRight, ShoppingBag, Wrench, Store, ShieldCheck, CheckCircle2 } from "lucide-react";

export interface WalkthroughSlide {
  id: number;
  badgeEn: string;
  titleEn: string;
  subtitleEn: string;
  icon: any;
  accentColor: string;
  badgeColor: string;
  img: string;
  highlightsEn: string[];
}

const WALKTHROUGH_SLIDES: WalkthroughSlide[] = [
  {
    id: 1,
    badgeEn: "1 OF 3 • MARKETPLACE & RENTALS",
    titleEn: "Buy, Sell & Post Requirements",
    subtitleEn: "Direct CMDA plots, houses, cars, bikes, and electronics from Tanjore residents with zero broker fees.",
    icon: ShoppingBag,
    accentColor: "from-amber-500 to-yellow-400",
    badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/40",
    img: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&auto=format&fit=crop",
    highlightsEn: ["CMDA Plots & House Rentals", "Used Vehicles & Electronics", "Direct Owner Contacts"],
  },
  {
    id: 2,
    badgeEn: "2 OF 3 • VERIFIED TRADESPEOPLE",
    titleEn: "Hire Verified Local Services",
    subtitleEn: "Electricians, plumbers, carpenters, computer mechanics, and painters available within 30 mins in Thanjavur.",
    icon: Wrench,
    accentColor: "from-emerald-500 to-teal-400",
    badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
    img: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&auto=format&fit=crop",
    highlightsEn: ["Verified Local Electricians & Plumbers", "30-Min Rapid Doorstep Arrival", "Direct WhatsApp Calling"],
  },
  {
    id: 3,
    badgeEn: "3 OF 3 • LOCAL STORE DEALS",
    titleEn: "Exclusive Tanjore Store Offers",
    subtitleEn: "Discover daily discounts on silk handlooms, electronics galleries, restaurants, and organic farm produce.",
    icon: Store,
    accentColor: "from-purple-500 to-indigo-400",
    badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/40",
    img: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800&auto=format&fit=crop",
    highlightsEn: ["Store Grand Opening Discounts", "Location Maps & Visiting Cards", "Direct WhatsApp & Call Contact"],
  },
];

export default function SwipeUpOnboarding({
  onComplete,
}: {
  onComplete: () => void;
}) {
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, clientHeight } = containerRef.current;
    const newIndex = Math.round(scrollTop / clientHeight);
    if (newIndex !== activeSlideIndex && newIndex >= 0 && newIndex < WALKTHROUGH_SLIDES.length) {
      setActiveSlideIndex(newIndex);
    }
  };

  const scrollToSlide = (index: number) => {
    if (index >= WALKTHROUGH_SLIDES.length) {
      onComplete();
      return;
    }
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: index * containerRef.current.clientHeight,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="fixed inset-0 z-[99990] bg-[#0F172A] text-white select-none font-sans overflow-hidden">
      
      {/* Fixed Top Header */}
      <div className="absolute top-0 left-0 right-0 z-30 pt-6 px-6 max-w-md mx-auto flex items-center justify-between pointer-events-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center p-2 shadow-xs backdrop-blur-md">
            <Image
              src="/namma_thanjai_logo.png"
              alt="Namma Thanjai Logo"
              width={40}
              height={40}
              className="w-full h-full object-contain filter drop-shadow-sm"
            />
          </div>
          <div>
            <h1 className="font-heading font-black text-base text-white leading-tight flex items-center gap-1.5">
              <span>Namma Thanjai</span>
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-400/10 border border-amber-400/30 px-1.5 py-0.5 rounded-md">APK</span>
            </h1>
            <p className="text-xs text-amber-400/90 font-bold tracking-wider">
              Thanjavur Direct Network
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onComplete}
          className="text-xs font-black text-slate-300 hover:text-white bg-slate-900/90 border border-slate-700/80 px-4 py-2 rounded-xl transition-all cursor-pointer active:scale-95 shadow-md backdrop-blur-md"
        >
          Skip
        </button>
      </div>

      {/* Instagram Reel Style Vertical Snap Scroll Feed */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="w-full h-full snap-y snap-mandatory overflow-y-scroll scrollbar-none"
        style={{ scrollSnapType: "y mandatory" }}
      >
        {WALKTHROUGH_SLIDES.map((slide, idx) => {
          const IconComp = slide.icon;
          return (
            <div
              key={slide.id}
              className="w-full h-full snap-start snap-always shrink-0 flex flex-col justify-between pt-20 pb-8 px-6 max-w-md mx-auto relative"
            >
              {/* Background Ambient Lighting per slide */}
              <div className="absolute top-1/4 right-0 w-80 h-80 bg-amber-500/10 blur-[100px] rounded-full pointer-events-none" />
              <div className="absolute bottom-1/4 left-0 w-80 h-80 bg-yellow-500/10 blur-[100px] rounded-full pointer-events-none" />

              {/* Main Visual Reel Card */}
              <div className="flex-1 flex flex-col items-center justify-center z-10">
                {/* Step Badge */}
                <span className={`text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full border shadow-sm ${slide.badgeColor}`}>
                  {slide.badgeEn}
                </span>

                {/* Visual Card */}
                <div className="w-full max-w-[340px] bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-[0_15px_40px_rgba(0,0,0,0.8)] mt-4 backdrop-blur-md">
                  <div className="relative w-full h-44 overflow-hidden">
                    <img
                      src={slide.img}
                      alt={slide.titleEn}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
                    
                    <div className="absolute top-3 left-3 w-10 h-10 rounded-xl bg-slate-950/80 border border-white/20 backdrop-blur-md flex items-center justify-center shadow-md">
                      <IconComp className="w-5 h-5 text-amber-400" />
                    </div>

                    <span className="absolute bottom-3 left-4 right-4 font-heading font-black text-lg text-white leading-snug drop-shadow-md">
                      {slide.titleEn}
                    </span>
                  </div>

                  <div className="p-4 flex flex-col gap-3">
                    <p className="text-xs text-slate-300 font-medium leading-relaxed">
                      {slide.subtitleEn}
                    </p>

                    <div className="flex flex-col gap-1.5 border-t border-slate-800/80 pt-3">
                      {slide.highlightsEn.map((item, hIdx) => (
                        <div key={hIdx} className="flex items-center gap-2 text-xs font-bold text-slate-200">
                          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Step Indicator Dots */}
                <div className="flex items-center justify-center gap-2 mt-4">
                  {WALKTHROUGH_SLIDES.map((s, i) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => scrollToSlide(i)}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        i === idx
                          ? "w-8 bg-amber-400"
                          : "w-2 bg-slate-800 hover:bg-slate-700"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Bottom Reel CTA & Swipe Up Helper */}
              <div className="w-full flex flex-col items-center gap-2 z-20">
                <button
                  type="button"
                  onClick={() => {
                    if (idx < WALKTHROUGH_SLIDES.length - 1) {
                      scrollToSlide(idx + 1);
                    } else {
                      if (onComplete) onComplete();
                    }
                  }}
                  className={`w-full bg-gradient-to-r ${slide.accentColor} text-slate-950 font-heading font-black text-sm py-3.5 px-6 rounded-2xl shadow-[0_0_25px_rgba(245,158,11,0.4)] active:scale-95 transition-all flex items-center justify-center gap-2 group cursor-pointer`}
                >
                  <span>
                    {idx < WALKTHROUGH_SLIDES.length - 1
                      ? "Next Step →"
                      : "Proceed to App →"}
                  </span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>

                <div
                  onClick={() => scrollToSlide(idx + 1)}
                  className="flex flex-col items-center gap-0.5 text-slate-400 text-xs font-bold cursor-pointer animate-bounce mt-1"
                >
                  <ChevronUp className="w-4 h-4 text-amber-400" />
                  <span>Swipe Up to Proceed (Instagram Feed Style)</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
