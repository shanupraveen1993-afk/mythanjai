"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { MapPin, ChevronRight, ShoppingBag, Search, Wrench, Store, ArrowRight, Lock, UserCheck } from "lucide-react";
import RobotHero from "@/components/ui/robot-hero";
import CategoryBridgeFeed from "@/components/home/CategoryBridgeFeed";

import StaticApkCard from "@/components/ui/StaticApkCard";

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
          <p className="text-xs text-slate-500 font-bold mt-0.5">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push(seeAllPath)}
            className="flex items-center gap-1 text-xs font-black text-amber-600 hover:text-amber-700 transition-colors cursor-pointer"
          >
            See All <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
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
              className={`shrink-0 w-[260px] sm:w-[290px] md:w-auto snap-start v2-card overflow-hidden transition-all cursor-pointer relative group ${
                isLocked ? "select-none" : "hover:-translate-y-0.5 active:scale-[0.98]"
              }`}
            >
              {/* Blur overlay for 2nd card onwards in Guest Mode */}
              {isLocked && (
                <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-md flex flex-col items-center justify-center p-3 text-center text-white z-20 transition-all group-hover:bg-slate-950/80">
                  <div className="w-8 h-8 rounded-full bg-yellow-500 text-slate-950 flex items-center justify-center mb-1.5 shadow-md animate-pulse">
                    <Lock className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <span className="font-heading font-black text-xs text-yellow-400">Unlock All Offers</span>
                  <span className="text-xs text-slate-300 mt-0.5 font-bold">Verify WhatsApp to view listing</span>
                </div>
              )}

              <div className={`w-full h-28 overflow-hidden bg-slate-900 text-white relative flex flex-col justify-between p-3 ${isLocked ? "filter blur-xs" : ""}`}>
                {card.img ? (
                  <img
                    src={card.img}
                    alt={card.title}
                    className="absolute inset-0 w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 flex flex-col items-center justify-center p-2 text-center">
                    <span className="text-amber-400 font-heading font-black text-xs uppercase tracking-wider">{card.sub}</span>
                  </div>
                )}
                <span className="relative z-10 text-[10px] font-black bg-white/95 text-slate-800 border border-slate-200 px-2 py-0.5 rounded-md shadow-xs self-start">
                  {card.sub}
                </span>
              </div>
              <div className={`p-3 flex flex-col gap-1 ${isLocked ? "filter blur-xs" : ""}`}>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-heading font-extrabold text-xs text-slate-900 leading-snug truncate line-clamp-1 whitespace-nowrap flex-1">
                    {card.title}
                  </h3>
                  <span className="text-xs font-black text-slate-800 shrink-0">{card.price}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
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

import UniversalSearchBar from "@/components/layout/UniversalSearchBar";

export default function HomeClientPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const isAuthVerified = Boolean(profile?.isVerified);
  const [activeSegment, setActiveSegment] = React.useState<"all" | "sell" | "need" | "service" | "offer">("all");

  return (
    <div className="w-full flex flex-col gap-6 text-slate-800 font-sans mt-2">
      {/* ── Prominent Home Universal Search Bar ── */}
      <div className="w-full flex flex-col gap-3">
        <UniversalSearchBar />

        {/* ── 4 Segment Quick Filter Pills (Direct Home Feed Filtering) ── */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {[
            { id: "all", label: "All Feeds", icon: "🌐", route: "/" },
            { id: "sell", label: "Sell (விற்பனை)", icon: "📦", route: "/sell" },
            { id: "need", label: "Need (தேவை)", icon: "🔍", route: "/need" },
            { id: "service", label: "Service (சேவை)", icon: "🛠️", route: "/services" },
            { id: "offer", label: "Offer (சலுகை)", icon: "🏪", route: "/shops" },
          ].map((seg) => {
            const isActive = activeSegment === seg.id;
            return (
              <button
                key={seg.id}
                type="button"
                onClick={() => {
                  setActiveSegment(seg.id as any);
                  if (typeof window !== "undefined") {
                    localStorage.setItem("namma_thanjai_active_segment", seg.id);
                  }
                  if (seg.id !== "all") {
                    router.push(seg.route);
                  }
                }}
                className={`py-2 px-3.5 rounded-xl font-heading font-black text-xs transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
                  isActive
                    ? "bg-amber-400 text-slate-950 shadow-xs border border-amber-500 scale-102"
                    : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                <span>{seg.icon}</span>
                <span>{seg.label}</span>
              </button>
            );
          })}
        </div>
      </div>

        {/* ── 1. Hero Banner (Universal Home Banner - Prominent & Standout) ── */}
        <div className="relative w-full min-h-[160px] sm:min-h-[200px] rounded-xl overflow-hidden bg-slate-950 text-white flex items-center px-6 sm:px-8 py-6 sm:py-8 shadow-md mt-1">
          <img src="/thanjavur_temple_illustration.png" alt="Namma Thanjai" className="absolute right-0 top-0 h-full w-3/5 object-cover opacity-35 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-transparent" />
          <div className="relative z-10 flex flex-col gap-2 max-w-xl">
            <span className="text-white font-extrabold text-xs sm:text-sm tracking-wider w-fit underline decoration-[#FBBF24] decoration-2 underline-offset-4 pb-0.5">
              Namma Thanjai • நம்ம தஞ்சை
            </span>
            <h1 className="font-heading font-black text-xl sm:text-2xl text-white tracking-tight leading-snug">
              Everything you need in our city, all in one place. <span className="text-amber-400 block text-xs sm:text-base font-extrabold mt-1">நம்ம ஊரின் அனைத்து தேவைகளுக்கும் ஒரே இடம்.</span>
            </h1>

            {/* Register to Post Button (Input field removed. Hidden when verified to fill space) */}
            {!isAuthVerified && (
              <div className="mt-2.5 flex items-center justify-start w-fit">
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== "undefined") {
                      window.dispatchEvent(new Event("namma_thanjai_open_signin"));
                    }
                  }}
                  className="shrink-0 bg-[#FBBF24] hover:bg-amber-400 text-[#0F172A] font-heading font-black text-xs sm:text-sm px-5 py-2.5 rounded-lg shadow-md cursor-pointer transition-all flex items-center justify-center gap-1.5 select-none"
                >
                  <span>Register to Post Ad</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Static APK Download Banner Card for Web App Visitors ── */}
        <StaticApkCard variant="dark" />

        {/* ── SELL Preview ───────────────────────── */}
        <PreviewSection
          title="Items for Sale (விற்பனை)"
          subtitle="Items for sale by local residents"
          seeAllPath="/sell"
          accentColor="bg-[#1d4ed8]"
          isGuest={false}
          onCardClick={() => router.push("/sell")}
          cards={[
            { title: "2400 Sqft CMDA Plot", sub: "Plots & Real Estate", price: "₹24,50,000", area: "Vallam", img: "" },
            { title: "Hero Splendor 2022 — Single Owner", sub: "Used Vehicles", price: "₹68,000", area: "New Bus Stand", img: "" },
            { title: "iPhone 13 128GB Blue", sub: "Electronics & Mobiles", price: "₹42,000", area: "Old Bus Stand", img: "" },
          ]}
        />

        {/* ── NEED Preview ───────────────────────── */}
        <PreviewSection
          title="Items Looking For (தேவைகள்)"
          subtitle="Requirements from local buyers"
          seeAllPath="/need"
          accentColor="bg-[#1d4ed8]"
          isGuest={false}
          onCardClick={() => router.push("/need")}
          cards={[
            { title: "Need 1-2 Acres Commercial Land", sub: "Plots & Real Estate", price: "Budget ₹50L+", area: "Vallam", img: "" },
            { title: "Need 2 BHK near Medical College", sub: "Property Rental", price: "₹10,000/mo", area: "Medical College Rd", img: "" },
            { title: "Need Used Laptop under ₹25,000", sub: "Electronics & Mobiles", price: "₹25,000", area: "Tanjore Town", img: "" },
          ]}
        />

        {/* ── SERVICES Preview ───────────────────── */}
        <PreviewSection
          title="Local Service (சேவைகள்)"
          subtitle="Verified skilled tradespeople near you"
          seeAllPath="/services"
          accentColor="bg-[#1d4ed8]"
          isGuest={false}
          onCardClick={() => router.push("/services")}
          cards={[
            { title: "Senthil Kumar — Electrician", sub: "Electrician", price: "14 Contacted", area: "Tanjore Town", img: "" },
            { title: "Rajesh K — Expert Plumber", sub: "Plumber", price: "18 Contacted", area: "Medical College Rd", img: "" },
            { title: "Venu Gopal — Wood Architect", sub: "Carpenter", price: "22 Contacted", area: "South Rampart", img: "" },
          ]}
        />

        {/* ── OFFERS Preview ─────────────────────── */}
        <PreviewSection
          title="Local Offer (சலுகைகள்)"
          subtitle="Store discounts & deals from Thanjavur shops"
          seeAllPath="/shops"
          accentColor="bg-[#1d4ed8]"
          isGuest={!isAuthVerified}
          onAuthRequired={() => {
            if (typeof window !== "undefined") {
              localStorage.setItem("namma_thanjai_target_post_route", "/shops");
              window.dispatchEvent(new Event("namma_thanjai_open_signin"));
            }
          }}
          onCardClick={() => router.push("/shops")}
          cards={[
            { title: "GLEN Gallery — Up to 60% OFF", sub: "Electronics & Mobiles", price: "Grand Sale", area: "New Bus Stand", img: "" },
            { title: "Silk Handloom — 25% OFF Zari", sub: "Textiles & Readymades", price: "Wedding Offer", area: "Karanthai", img: "" },
            { title: "Degree Coffee + Free Halwa", sub: "Cafe & Restaurant", price: "Today Only", area: "South Rampart", img: "" },
          ]}
        />

      </div>
  );
}
