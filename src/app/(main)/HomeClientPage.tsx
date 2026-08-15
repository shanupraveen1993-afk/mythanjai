"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { MapPin, ChevronRight, ShoppingBag, Search, Wrench, Store, ArrowRight, Lock } from "lucide-react";
import RobotHero from "@/components/ui/robot-hero";
import CategoryBridgeFeed from "@/components/home/CategoryBridgeFeed";

// ── Shared Preview Card ───────────────────────────────────────────────────────

export interface PreviewCard {
  title: string;
  sub: string;
  price: string;
  area: string;
  img: string;
}

export function PreviewSection({
  title,
  subtitle,
  seeAllPath,
  accentColor,
  cards,
  onCardClick,
  isGuest = false,
  onAuthRequired,
}: {
  title: string;
  subtitle: string;
  seeAllPath: string;
  accentColor: string;
  cards: PreviewCard[];
  onCardClick: () => void;
  isGuest?: boolean;
  onAuthRequired?: () => void;
}) {
  const router = useRouter();
  return (
    <div className="flex flex-col gap-3">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`font-heading font-black text-base md:text-lg text-slate-900 flex items-center gap-2`}>
            <span className={`inline-block w-2.5 h-2.5 rounded-full ${accentColor}`} />
            {title}
          </h2>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5">{subtitle}</p>
        </div>
        <button
          onClick={() => {
            if (isGuest && onAuthRequired) {
              onAuthRequired();
            } else {
              router.push(seeAllPath);
            }
          }}
          className="flex items-center gap-1 text-xs font-black text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
        >
          See All <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Cards row with edge-to-edge bleed scroll on mobile */}
      <div className="-mx-4 px-4 flex overflow-x-auto snap-x snap-mandatory scrollbar-none gap-3 pb-2 md:grid md:grid-cols-3 md:overflow-visible md:mx-0 md:px-0">
        {cards.map((card, i) => {
          const isLocked = isGuest && i > 0;
          return (
            <div
              key={i}
              onClick={() => {
                if (isLocked && onAuthRequired) {
                  onAuthRequired();
                } else {
                  onCardClick();
                }
              }}
              className={`shrink-0 w-[260px] sm:w-[290px] md:w-auto snap-start bg-white rounded-2xl overflow-hidden shadow-[0_2px_10px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-all cursor-pointer border-0 relative group ${
                isLocked ? "select-none" : "hover:-translate-y-0.5 active:scale-[0.98]"
              }`}
            >
              {/* Blur overlay for 2nd card onwards in Guest Mode */}
              {isLocked && (
                <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-md flex flex-col items-center justify-center p-3 text-center text-white z-20 transition-all group-hover:bg-slate-950/80">
                  <div className="w-8 h-8 rounded-full bg-yellow-500 text-slate-955 flex items-center justify-center mb-1.5 shadow-md animate-pulse">
                    <Lock className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <span className="font-heading font-black text-xs text-yellow-400">Unlock All Offers</span>
                  <span className="text-[9px] text-slate-300 mt-0.5 font-bold">Verify WhatsApp to view listing</span>
                </div>
              )}

              <div className={`w-full h-28 overflow-hidden bg-slate-100 relative ${isLocked ? "filter blur-xs" : ""}`}>
                <img
                  src={card.img}
                  alt={card.title}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute top-2 left-2 text-[9px] font-black bg-white/95 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-md shadow-sm">
                  {card.sub}
                </span>
              </div>
              <div className={`p-3 flex flex-col gap-1 ${isLocked ? "filter blur-xs" : ""}`}>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-heading font-extrabold text-xs text-slate-900 leading-snug line-clamp-2 flex-1">
                    {card.title}
                  </h3>
                  <span className="text-xs font-black text-slate-800 shrink-0">{card.price}</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                  <MapPin className="w-3 h-3 shrink-0" />
                  <span>{card.area}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function HomeClientPage() {
  const router = useRouter();
  const { user, profile } = useAuth();

  // Alert ticker for robot hero
  const [activeAlertIdx, setActiveAlertIdx] = React.useState(0);
  const alerts = [
    "New plot listed in Vallam — 2400 Sqft CMDA approved",
    "Senthil Electrician: 4.9★ rating, available in Tanjore Town",
    "GLEN Gallery: Up to 60% OFF — Grand Opening Sale",
    "New 2 BHK rental listed near Medical College Road",
    "12 new members joined Namma Thanjavur today!",
  ];

  React.useEffect(() => {
    const interval = setInterval(() => {
      setActiveAlertIdx((prev) => (prev + 1) % alerts.length);
    }, 3200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full flex flex-col bg-[#f4f5f8] text-slate-800 min-h-screen font-sans">
      {/* ── UNIVERSAL MARKETPLACE FEED ──────────────────────────────── */}
      <div className="w-full mt-4 pb-24 flex flex-col gap-8">

        {/* Hero Banner */}
        <div className="relative w-full min-h-[180px] sm:min-h-[220px] rounded-3xl overflow-hidden bg-slate-950 text-white flex items-center px-6 sm:px-10 py-8 shadow-lg">
          <img
            src="/thanjavur_temple_illustration.png"
            alt="Namma Thanjavur"
            className="absolute right-0 top-0 h-full w-1/2 object-cover opacity-25 pointer-events-none"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent" />
          <div className="relative z-10 flex flex-col gap-3 max-w-xl">
            <span className="text-[10px] font-black uppercase tracking-widest text-yellow-400 bg-yellow-400/10 border border-yellow-400/30 px-3 py-1 rounded-full w-fit">
              THANJAVUR DIRECT DIRECTORY &amp; MARKETPLACE
            </span>
            <h1 className="font-heading font-black text-2xl sm:text-3xl md:text-4xl text-white leading-tight">
              Thanjavur's Direct Local Community Directory
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Connect directly with Tanjore residents to buy, sell, hire verified tradesmen, and claim exclusive local store offers.
            </p>
          </div>
        </div>

        {/* ── Category Matchmaker Bridge ────────────────── */}
        <CategoryBridgeFeed />

        {/* ── SELL Preview ───────────────────────── */}
        <PreviewSection
          title="Sell"
          subtitle="Items for sale by local residents"
          seeAllPath="/sell"
          accentColor="bg-yellow-500"
          isGuest={false}
          onCardClick={() => router.push("/sell")}
          cards={[
            { title: "2400 Sqft CMDA Plot", sub: "Plots & Real Estate", price: "₹24,50,000", area: "Vallam", img: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&auto=format&fit=crop" },
            { title: "Hero Splendor 2022 — Single Owner", sub: "Used Vehicles", price: "₹68,000", area: "New Bus Stand", img: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&auto=format&fit=crop" },
            { title: "iPhone 13 128GB Blue", sub: "Electronics & Mobiles", price: "₹42,000", area: "Old Bus Stand", img: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&auto=format&fit=crop" },
          ]}
        />

        {/* ── NEED Preview ───────────────────────── */}
        <PreviewSection
          title="Need"
          subtitle="Requirements from local buyers"
          seeAllPath="/need"
          accentColor="bg-yellow-500"
          isGuest={false}
          onCardClick={() => router.push("/need")}
          cards={[
            { title: "Need 1-2 Acres Commercial Land", sub: "Plots & Real Estate", price: "Budget ₹50L+", area: "Vallam", img: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&auto=format&fit=crop" },
            { title: "Need 2 BHK near Medical College", sub: "Property Rental", price: "₹10,000/mo", area: "Medical College Rd", img: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&auto=format&fit=crop" },
            { title: "Need Used Laptop under ₹25,000", sub: "Electronics & Mobiles", price: "₹25,000", area: "Tanjore Town", img: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&auto=format&fit=crop" },
          ]}
        />

        {/* ── SERVICES Preview ───────────────────── */}
        <PreviewSection
          title="Services"
          subtitle="Verified skilled tradespeople near you"
          seeAllPath="/services"
          accentColor="bg-yellow-500"
          isGuest={false}
          onCardClick={() => router.push("/services")}
          cards={[
            { title: "Senthil Kumar — Electrician", sub: "Electrician", price: "14 Contacted", area: "Tanjore Town", img: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&auto=format&fit=crop" },
            { title: "Rajesh K — Expert Plumber", sub: "Plumber", price: "18 Contacted", area: "Medical College Rd", img: "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=400&auto=format&fit=crop" },
            { title: "Venu Gopal — Wood Architect", sub: "Carpenter", price: "22 Contacted", area: "South Rampart", img: "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=400&auto=format&fit=crop" },
          ]}
        />

        {/* ── OFFERS Preview ─────────────────────── */}
        <PreviewSection
          title="Local Offers"
          subtitle="Store discounts & deals from Thanjavur shops"
          seeAllPath="/shops"
          accentColor="bg-yellow-500"
          isGuest={!user}
          onAuthRequired={() => {
            if (typeof window !== "undefined") {
              localStorage.setItem("namma_thanjai_target_post_route", "/shops");
              window.dispatchEvent(new Event("namma_thanjai_open_signin"));
            }
          }}
          onCardClick={() => router.push("/shops")}
          cards={[
            { title: "GLEN Gallery — Up to 60% OFF", sub: "Electronics & Mobiles", price: "Grand Sale", area: "New Bus Stand", img: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=400&auto=format&fit=crop" },
            { title: "Silk Handloom — 25% OFF Zari", sub: "Textiles & Readymades", price: "Wedding Offer", area: "Karanthai", img: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&auto=format&fit=crop" },
            { title: "Degree Coffee + Free Halwa", sub: "Cafe & Restaurant", price: "Today Only", area: "South Rampart", img: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&auto=format&fit=crop" },
          ]}
        />

      </div>
    </div>
  );
}
