"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChevronUp, Sparkles, MapPin, CheckCircle2, ShieldCheck, Tag, ArrowUp } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export interface OnboardingCardItem {
  id: number;
  badge: string;
  badgeColor: string;
  titleEn: string;
  titleTa: string;
  price: string;
  location: string;
  img: string;
  taglineEn: string;
  taglineTa: string;
}

const ONBOARDING_CARDS: OnboardingCardItem[] = [
  {
    id: 1,
    badge: "Plots & Real Estate",
    badgeColor: "bg-amber-500 text-slate-950",
    titleEn: "2400 Sqft CMDA Approved Plot in Vallam",
    titleTa: "வல்லத்தில் 2400 சதுர அடி மனைகள் விற்பனைக்கு",
    price: "₹24,50,000",
    location: "Vallam, Thanjavur",
    img: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&auto=format&fit=crop",
    taglineEn: "Direct Land Owner • No Broker Fee",
    taglineTa: "நேரடி நில உரிமையாளர் • புரோக்கர் கட்டணம் இல்லை",
  },
  {
    id: 2,
    badge: "Used Vehicles",
    badgeColor: "bg-blue-500 text-white",
    titleEn: "Hero Splendor Plus 2022 — Single Owner",
    titleTa: "ஹீரோ ஸ்பிளெண்டர் பிளஸ் 2022 — ஒற்றை உரிமையாளர்",
    price: "₹68,000",
    location: "New Bus Stand, Thanjavur",
    img: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&auto=format&fit=crop",
    taglineEn: "Clear RC Papers • Good Condition",
    taglineTa: "தெளிவான RC சான்றிதழ் • நல்ல கண்டிஷன்",
  },
  {
    id: 3,
    badge: "Need / Wanted",
    badgeColor: "bg-emerald-500 text-white",
    titleEn: "Sony Alpha 7III Camera Needed for Wedding Rent",
    titleTa: "திருமணத்திற்கு சோனி ஆல்பா 7III கேமரா வாடகைக்கு தேவை",
    price: "Budget ₹2,500/day",
    location: "South Rampart, Thanjavur",
    img: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&auto=format&fit=crop",
    taglineEn: "Requirement from Local Photographer",
    taglineTa: "உள்ளூர் போட்டோகிராபரின் அவசர தேவை",
  },
  {
    id: 4,
    badge: "Services & Trades",
    badgeColor: "bg-purple-500 text-white",
    titleEn: "Senthil Kumar — Expert Electrician & Rewinding",
    titleTa: "செந்தில் குமார் — மின்சார வல்லுநர் & வயரிங்",
    price: "⭐ 4.9★ (42 Ratings)",
    location: "Tanjore Town & Nearby",
    img: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&auto=format&fit=crop",
    taglineEn: "Available within 30 Mins",
    taglineTa: "30 நிமிடங்களில் வீட்டை வந்தடைவார்",
  },
  {
    id: 5,
    badge: "House Rental",
    badgeColor: "bg-rose-500 text-white",
    titleEn: "2 BHK Independent House for Rent",
    titleTa: "2 BHK தனி வீடு வாடகைக்கு",
    price: "₹10,50,0/mo",
    location: "Medical College Road",
    img: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&auto=format&fit=crop",
    taglineEn: "Family Preferred • 24/7 Water Facility",
    taglineTa: "குடும்பங்களுக்கு முன்னுரிமை • 24 மணிநேர தண்ணீர்",
  },
  {
    id: 6,
    badge: "Textiles & Offers",
    badgeColor: "bg-amber-400 text-slate-950",
    titleEn: "Silk Handloom Sarees — 25% Wedding Discount",
    titleTa: "பட்டு புடவைகள் — 25% திருமண தள்ளுபடி",
    price: "Grand Sale",
    location: "Karanthai, Thanjavur",
    img: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&auto=format&fit=crop",
    taglineEn: "Authentic Tanjore Zari Handloom",
    taglineTa: "உண்மையான தஞ்சாவூர் பட்டு நெசவு",
  },
  {
    id: 7,
    badge: "Electronics & Mobiles",
    badgeColor: "bg-indigo-500 text-white",
    titleEn: "iPhone 13 128GB Blue — Mint Condition",
    titleTa: "ஐபோன் 13 128GB ப்ளூ — புதுமை போன்ற நிலை",
    price: "₹42,000",
    location: "Old Bus Stand, Thanjavur",
    img: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&auto=format&fit=crop",
    taglineEn: "Original Bill & Box Available",
    taglineTa: "ஒரிஜினல் பில் மற்றும் பாக்ஸ் உண்டு",
  },
  {
    id: 8,
    badge: "Computer Service",
    badgeColor: "bg-teal-500 text-white",
    titleEn: "Quick Laptop Repair & OS Formatting",
    titleTa: "லேப்டாப் சர்வீஸ் & OS பார்மேட்டிங்",
    price: "From ₹350",
    location: "South Rampart",
    img: "https://images.unsplash.com/photo-1588702547923-7093a6c3ba33?w=600&auto=format&fit=crop",
    taglineEn: "Same Day Delivery Guaranteed",
    taglineTa: "ஒரே நாளில் சர்வீஸ் முடித்து தரப்படும்",
  },
  {
    id: 9,
    badge: "Farm & Agriculture",
    badgeColor: "bg-green-600 text-white",
    titleEn: "Pure Tanjore Deluxe Ponni Rice Direct from Farm",
    titleTa: "தூய தஞ்சாவூர் பொன்னி அரிசி நேரடி விற்பனை",
    price: "₹1,450 / 25kg",
    location: "Punnainallur Mariamman Kovil",
    img: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop",
    taglineEn: "100% Organic • Free Door Delivery",
    taglineTa: "100% இயற்கை அரிசி • இலவச டோர் டெலிவரி",
  },
  {
    id: 10,
    badge: "Taxis & Travels",
    badgeColor: "bg-amber-600 text-white",
    titleEn: "Innova Taxi for Trichy Airport & Temple Tours",
    titleTa: "இன்னோவா கார் — திருச்சி ஏர்போர்ட் & கோவில் பயணம்",
    price: "₹14/km",
    location: "Thanjavur Junction",
    img: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=600&auto=format&fit=crop",
    taglineEn: "Clean AC Cars • Experienced Tanjore Driver",
    taglineTa: "சுத்தமான AC கார் • அனுபவமிக்க டிரைவர்",
  },
];

export default function SwipeUpOnboarding({
  onDismiss,
}: {
  onDismiss: () => void;
}) {
  const { lang } = useLanguage();
  const [activeIndex, setActiveIndex] = useState(0);
  const [startY, setStartY] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-rotate 3D cards every 2.4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % ONBOARDING_CARDS.length);
    }, 2400);
    return () => clearInterval(interval);
  }, []);

  // Touch Swipe-Up Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setStartY(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startY === null) return;
    const currentY = e.touches[0].clientY;
    const diff = startY - currentY; // Positive when dragging UP
    if (diff > 0) {
      setDragOffset(diff);
    }
  };

  const handleTouchEnd = () => {
    if (dragOffset > 80) {
      // Threshold passed -> Dismiss onboarding
      onDismiss();
    } else {
      setDragOffset(0);
    }
    setStartY(null);
  };

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        transform: dragOffset > 0 ? `translateY(-${dragOffset}px)` : "none",
        transition: dragOffset === 0 ? "transform 0.3s ease-out" : "none",
      }}
      className="fixed inset-0 z-[9990] bg-slate-950 text-white flex flex-col justify-between overflow-hidden select-none"
    >
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-yellow-500/10 blur-[100px] rounded-full pointer-events-none" />

      {/* Header Bar */}
      <div className="w-full max-w-md mx-auto pt-8 px-6 flex items-center justify-between z-20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
            <span className="font-heading font-black text-amber-400 text-sm">த</span>
          </div>
          <div>
            <h1 className="font-heading font-black text-lg text-white leading-tight">
              {lang === "ta" ? "நம்ம தஞ்சை" : "Namma Thanjai"}
            </h1>
            <p className="text-[10px] text-amber-400 font-medium">
              {lang === "ta" ? "நேரடி உள்ளூர் கம்யூனிட்டி" : "Thanjavur Direct Network"}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDismiss();
          }}
          onTouchEnd={(e) => {
            e.stopPropagation();
            onDismiss();
          }}
          className="text-xs font-extrabold text-slate-300 hover:text-white bg-slate-900 border border-slate-700 px-4 py-2 rounded-full transition-colors cursor-pointer active:scale-95 shadow-md"
        >
          {lang === "ta" ? "தவிர் (Skip)" : "Skip"}
        </button>
      </div>

      {/* Main Rotating Cards Section */}
      <div className="w-full max-w-md mx-auto px-6 flex-1 flex flex-col items-center justify-center my-2 z-10 relative">
        <div className="text-center mb-4">
          <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-400/10 border border-amber-400/30 px-3 py-1 rounded-full">
            {lang === "ta" ? "தஞ்சாவூர் நேரடி வர்த்தகம்" : "100% Direct Tanjore Directory"}
          </span>
          <h2 className="font-heading font-black text-xl sm:text-2xl text-white mt-2 leading-snug">
            {lang === "ta"
              ? "விற்பனை • தேவை • சர்வீஸ் • ஆஃபர்"
              : "Buy, Sell, Services & Store Deals"}
          </h2>
        </div>

        {/* Stack Rotating Carousel (Rock-solid Mobile 2D/3D math) */}
        <div className="relative w-full h-[300px] sm:h-[320px] flex items-center justify-center">
          {ONBOARDING_CARDS.map((card, idx) => {
            const total = ONBOARDING_CARDS.length;
            let offset = (idx - activeIndex + total) % total;
            if (offset > total / 2) offset -= total;

            const isCurrent = offset === 0;

            if (Math.abs(offset) > 2) return null;

            return (
              <div
                key={card.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveIndex(idx);
                }}
                style={{
                  transform: `translateY(${offset * 20}px) scale(${1 - Math.abs(offset) * 0.08})`,
                  opacity: isCurrent ? 1 : Math.abs(offset) === 1 ? 0.65 : 0.3,
                  zIndex: 20 - Math.abs(offset),
                }}
                className="absolute inset-x-0 mx-auto w-full max-w-[310px] sm:max-w-[330px] bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.6)] transition-all duration-500 ease-out cursor-pointer"
              >
                {/* Card Image */}
                <div className="relative w-full h-36 overflow-hidden">
                  <img
                    src={card.img}
                    alt={card.titleEn}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-black/30" />
                  
                  <span
                    className={`absolute top-3 left-3 text-[10px] font-black px-2.5 py-1 rounded-lg shadow-md ${card.badgeColor}`}
                  >
                    {card.badge}
                  </span>

                  <span className="absolute bottom-2 right-3 font-heading font-black text-sm text-amber-400 bg-slate-950/90 border border-amber-500/30 px-2.5 py-0.5 rounded-md">
                    {card.price}
                  </span>
                </div>

                {/* Card Content */}
                <div className="p-4 flex flex-col gap-2">
                  <h3 className="font-heading font-extrabold text-sm text-white leading-snug line-clamp-2">
                    {lang === "ta" ? card.titleTa : card.titleEn}
                  </h3>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-2.5 mt-1">
                    <div className="flex items-center gap-1 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="truncate max-w-[160px]">{card.location}</span>
                    </div>

                    <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> Direct
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Carousel Indicator Dots */}
        <div className="flex items-center justify-center gap-1.5 mt-3">
          {ONBOARDING_CARDS.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActiveIndex(i);
              }}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === activeIndex
                  ? "w-6 bg-amber-400"
                  : "w-1.5 bg-slate-800 hover:bg-slate-700"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Swipe Up CTA Section */}
      <div className="w-full max-w-md mx-auto pb-8 px-6 flex flex-col items-center gap-3 z-20">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDismiss();
          }}
          onTouchEnd={(e) => {
            e.stopPropagation();
            onDismiss();
          }}
          className="w-full bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-heading font-black text-base py-3.5 px-6 rounded-2xl shadow-[0_0_25px_rgba(245,158,11,0.5)] active:scale-95 transition-all flex items-center justify-center gap-2 group cursor-pointer"
        >
          <span>{lang === "ta" ? "தஞ்சாவூர் சேவையை துவங்கு" : "Explore Namma Thanjai"}</span>
          <ArrowUp className="w-5 h-5 group-hover:-translate-y-1 transition-transform" />
        </button>

        {/* Animated Swipe Up Gesture Helper */}
        <div
          onClick={(e) => {
            e.stopPropagation();
            onDismiss();
          }}
          className="flex flex-col items-center gap-1 text-slate-400 text-xs font-semibold cursor-pointer animate-bounce mt-1"
        >
          <ChevronUp className="w-5 h-5 text-amber-400" />
          <span>{lang === "ta" ? "மேலே ஸ்வைப் செய்யவும் (Swipe Up)" : "Swipe Up to Explore"}</span>
        </div>
      </div>
    </div>
  );
}
