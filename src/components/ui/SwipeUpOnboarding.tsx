"use client";

import React, { useState, useRef } from "react";
import { ChevronUp, ArrowRight, ShoppingBag, Wrench, Store, ShieldCheck, MapPin, Sparkles } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export interface WalkthroughSlide {
  id: number;
  badgeEn: string;
  badgeTa: string;
  titleEn: string;
  titleTa: string;
  subtitleEn: string;
  subtitleTa: string;
  icon: any;
  accentColor: string;
  badgeColor: string;
  img: string;
  highlightsEn: string[];
  highlightsTa: string[];
}

const WALKTHROUGH_SLIDES: WalkthroughSlide[] = [
  {
    id: 1,
    badgeEn: "1 OF 3 • MARKETPLACE & RENTALS",
    badgeTa: "1 / 3 • விற்பனை & தேவை",
    titleEn: "Buy, Sell & Post Buyer Requirements",
    titleTa: "விற்பனை மற்றும் கொள்முதல் தேவைகள்",
    subtitleEn: "Direct CMDA plots, houses, cars, bikes, and electronics from Tanjore residents with zero broker fees.",
    subtitleTa: "தஞ்சாவூர் மக்களிடமிருந்து நேரடி நிலம், வீடு, வாகனங்கள் & பொருட்கள் புரோக்கர் கட்டணம் இன்றி.",
    icon: ShoppingBag,
    accentColor: "from-amber-500 to-yellow-400",
    badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/40",
    img: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&auto=format&fit=crop",
    highlightsEn: ["CMDA Plots & House Rentals", "Used Vehicles & Electronics", "Direct Owner Contacts"],
    highlightsTa: ["CMDA மனைகள் & வாடகை வீடு", "பயன்படுத்தப்பட்ட வாகனங்கள்", "நேரடி உரிமையாளர் தொடர்பு"],
  },
  {
    id: 2,
    badgeEn: "2 OF 3 • VERIFIED TRADESPEOPLE",
    badgeTa: "2 / 3 • உள்ளூர் சேவைகள்",
    titleEn: "Hire Verified Skilled Local Services",
    titleTa: "நம்பகமான உள்ளூர் சர்வீஸ் வல்லுநர்கள்",
    subtitleEn: "Electricians, plumbers, carpenters, computer mechanics, and painters available within 30 mins in Thanjavur.",
    subtitleTa: "எலக்ட்ரீஷியன், பிளம்பர், கார்பெண்டர், லேப்டாப் சர்வீஸ் - 30 நிமிடங்களில் உங்கள் வீடு தேடி.",
    icon: Wrench,
    accentColor: "from-emerald-500 to-teal-400",
    badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
    img: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&auto=format&fit=crop",
    highlightsEn: ["4.9★ Rated Local Electricians & Plumbers", "30-Min Rapid Doorstep Arrival", "Direct WhatsApp Calling"],
    highlightsTa: ["4.9★ மதிப்பீடு பெற்ற வல்லுநர்கள்", "30 நிமிடங்களில் உடனடி சேவை", "நேரடி வாட்ஸ்அப் தொடர்பு"],
  },
  {
    id: 3,
    badgeEn: "3 OF 3 • LOCAL STORE DEALS",
    badgeTa: "3 / 3 • கடை ஆஃபர்கள் & சலுகைகள்",
    titleEn: "Exclusive Tanjore Store Offers & Discounts",
    titleTa: "தஞ்சாவூர் கடைகளின் சிறப்பு தள்ளுபடிகள்",
    subtitleEn: "Discover daily discounts on silk handlooms, electronics galleries, restaurants, and organic farm produce.",
    subtitleTa: "பட்டுப் புடவைகள், எலக்ட்ரானிக்ஸ், உணவகங்கள் மற்றும் இயற்கை பொருட்களுக்கு சிறப்பு சலுகைகள்.",
    icon: Store,
    accentColor: "from-purple-500 to-indigo-400",
    badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/40",
    img: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800&auto=format&fit=crop",
    highlightsEn: ["Up to 60% Store Grand Opening Discounts", "Visiting Card & Location Maps", "Direct Store Offer Navigation"],
    highlightsTa: ["60% வரை சிறப்பு தள்ளுபடிகள்", "விசிட்டிங் கார்டு & மேப் வழிகாட்டி", "நேரடி ஆஃபர் பெறலாம்"],
  },
];

export default function SwipeUpOnboarding({
  onComplete,
}: {
  onComplete: () => void;
}) {
  const { lang } = useLanguage();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [startY, setStartY] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState(0);

  const slide = WALKTHROUGH_SLIDES[currentSlide];

  const handleNext = () => {
    if (currentSlide < WALKTHROUGH_SLIDES.length - 1) {
      setCurrentSlide((prev) => prev + 1);
    } else {
      onComplete();
    }
  };

  // Swipe Up Gesture Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setStartY(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startY === null) return;
    const diff = startY - e.touches[0].clientY;
    if (diff > 0) setDragOffset(diff);
  };

  const handleTouchEnd = () => {
    if (dragOffset > 70) {
      handleNext();
    }
    setDragOffset(0);
    setStartY(null);
  };

  const IconComp = slide.icon;

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        transform: dragOffset > 0 ? `translateY(-${dragOffset}px)` : "none",
        transition: dragOffset === 0 ? "transform 0.3s ease-out" : "none",
      }}
      className="fixed inset-0 z-[9990] bg-slate-950 text-white flex flex-col justify-between overflow-hidden select-none font-sans"
    >
      {/* Background Ambient Lighting */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-yellow-500/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Header Bar */}
      <div className="w-full max-w-md mx-auto pt-8 px-6 flex items-center justify-between z-20">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shadow-inner">
            <span className="font-heading font-black text-amber-400 text-base">த</span>
          </div>
          <div>
            <h1 className="font-heading font-black text-base text-white leading-tight">
              {lang === "ta" ? "நம்ம தஞ்சை" : "Namma Thanjai"}
            </h1>
            <p className="text-[10px] text-amber-400 font-bold tracking-wider">
              {lang === "ta" ? "தஞ்சாவூர் நேரடி நெட்வொர்க்" : "Thanjavur Direct Network"}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onComplete}
          className="text-xs font-black text-slate-300 hover:text-white bg-slate-900 border border-slate-700 px-4 py-1.5 rounded-full transition-all cursor-pointer active:scale-95 shadow-md"
        >
          {lang === "ta" ? "தவிர் (Skip)" : "Skip"}
        </button>
      </div>

      {/* Main Slide Card Section */}
      <div className="w-full max-w-md mx-auto px-6 flex-1 flex flex-col items-center justify-center my-4 z-10">
        {/* Step Badge */}
        <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border shadow-sm ${slide.badgeColor}`}>
          {lang === "ta" ? slide.badgeTa : slide.badgeEn}
        </span>

        {/* Visual Showcase Card */}
        <div className="w-full max-w-[340px] bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-[0_15px_40px_rgba(0,0,0,0.7)] mt-4 transition-all duration-500">
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
              {lang === "ta" ? slide.titleTa : slide.titleEn}
            </span>
          </div>

          <div className="p-4 flex flex-col gap-3">
            <p className="text-xs text-slate-300 font-medium leading-relaxed">
              {lang === "ta" ? slide.subtitleTa : slide.subtitleEn}
            </p>

            <div className="flex flex-col gap-1.5 border-t border-slate-800/80 pt-3">
              {(lang === "ta" ? slide.highlightsTa : slide.highlightsEn).map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs font-bold text-slate-200">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Step Indicator Dots */}
        <div className="flex items-center justify-center gap-2 mt-5">
          {WALKTHROUGH_SLIDES.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setCurrentSlide(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === currentSlide
                  ? "w-8 bg-amber-400"
                  : "w-2 bg-slate-800 hover:bg-slate-700"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Action CTA & Swipe Helper */}
      <div className="w-full max-w-md mx-auto pb-8 px-6 flex flex-col items-center gap-3 z-20">
        <button
          type="button"
          onClick={handleNext}
          className={`w-full bg-gradient-to-r ${slide.accentColor} text-slate-950 font-heading font-black text-sm py-3.5 px-6 rounded-2xl shadow-[0_0_25px_rgba(245,158,11,0.4)] active:scale-95 transition-all flex items-center justify-center gap-2 group cursor-pointer`}
        >
          <span>
            {currentSlide < WALKTHROUGH_SLIDES.length - 1
              ? lang === "ta" ? "அடுத்த பக்கம் (Next)" : "Next Step →"
              : lang === "ta" ? "பதிவு செய்து துவங்குக (Register / Login)" : "Register / Login →"}
          </span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>

        {/* Animated Swipe Up Helper */}
        <div
          onClick={handleNext}
          className="flex flex-col items-center gap-1 text-slate-400 text-[11px] font-bold cursor-pointer animate-bounce mt-1"
        >
          <ChevronUp className="w-4 h-4 text-amber-400" />
          <span>{lang === "ta" ? "மேலே ஸ்வைப் செய்யவும் (Swipe Up)" : "Swipe Up to Proceed"}</span>
        </div>
      </div>
    </div>
  );
}
