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
    <div className="fixed inset-0 z-[99990] bg-slate-50 text-slate-900 select-none font-sans overflow-hidden">
      
      {/* Fixed Top Header */}
      <div
        className="absolute top-0 left-0 right-0 z-30 px-6 max-w-md mx-auto flex items-center justify-between pointer-events-auto"
        style={{ paddingTop: "max(env(safe-area-inset-top, 0px), 56px)" }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200 flex items-center justify-center p-2 shadow-xs backdrop-blur-md">
            <Image
              src="/namma_thanjai_logo.png"
              alt="Namma Thanjai Logo"
              width={40}
              height={40}
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <h1 className="font-heading font-black text-base text-slate-900 leading-tight">
              Namma Thanjai
            </h1>
            <p className="text-xs text-amber-600 font-bold tracking-wider">
              Thanjavur Direct Network
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onComplete}
          className="text-xs font-black text-slate-700 hover:text-slate-950 bg-white border border-slate-300 px-4 py-2 rounded-xl transition-all cursor-pointer active:scale-95 shadow-2xs backdrop-blur-md"
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
              className="w-full h-full snap-start snap-always shrink-0 flex flex-col justify-between pt-32 pb-8 px-6 max-w-md mx-auto relative"
            >
              {/* Background Ambient Lighting per slide */}
              <div className="absolute top-1/4 right-0 w-80 h-80 bg-amber-400/10 blur-[100px] rounded-full pointer-events-none" />
              <div className="absolute bottom-1/4 left-0 w-80 h-80 bg-yellow-400/10 blur-[100px] rounded-full pointer-events-none" />

              {/* Main Visual Content — Freestyle Layout (No Card Container Boxes) */}
              <div className="flex-1 flex flex-col items-center justify-center z-10 w-full text-center gap-3">
                {/* Step Badge */}
                <span className="text-xs font-black uppercase tracking-widest px-3.5 py-1 rounded-full border shadow-2xs bg-amber-50 text-amber-800 border-amber-200/80">
                  {slide.badgeEn}
                </span>

                {/* Hero Image — Freestyle Rounded Image */}
                <div className="relative w-full max-w-[320px] h-44 rounded-2xl overflow-hidden shadow-md my-1">
                  <img
                    src={slide.img}
                    alt={slide.titleEn}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
                  <div className="absolute top-3 left-3 w-9 h-9 rounded-xl bg-white/90 border border-slate-200 backdrop-blur-md flex items-center justify-center shadow-sm">
                    <IconComp className="w-4 h-4 text-amber-600" />
                  </div>
                </div>

                {/* Title & Subtitle in Freestyle Layout */}
                <h3 className="font-heading font-black text-xl text-slate-900 leading-snug px-2">
                  {slide.titleEn}
                </h3>
                <p className="text-xs text-slate-600 font-medium leading-relaxed max-w-[300px]">
                  {slide.subtitleEn}
                </p>

                {/* Highlights List in Freestyle */}
                <div className="flex flex-col gap-1.5 pt-1 w-full max-w-[280px]">
                  {slide.highlightsEn.map((item, hIdx) => (
                    <div key={hIdx} className="flex items-center justify-center gap-2 text-xs font-bold text-slate-800">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>

                {/* Step Indicator Dots */}
                <div className="flex items-center justify-center gap-2 mt-2">
                  {WALKTHROUGH_SLIDES.map((s, i) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => scrollToSlide(i)}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        i === idx
                          ? "w-8 bg-amber-500"
                          : "w-2 bg-slate-300 hover:bg-slate-400"
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
                  className="w-full bg-[#FBBF24] hover:bg-amber-400 text-slate-950 font-heading font-black text-sm py-3.5 px-6 rounded-2xl shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 group cursor-pointer border border-amber-400/60"
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
                  className="flex flex-col items-center gap-0.5 text-slate-500 text-xs font-bold cursor-pointer animate-bounce mt-1"
                >
                  <ChevronUp className="w-4 h-4 text-amber-600" />
                  <span>Swipe Up to Proceed</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
