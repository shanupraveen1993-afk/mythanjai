"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { MapPin, ChevronRight, ShoppingBag, Search, Wrench, Store, ArrowRight, Lock } from "lucide-react";
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
        <button
          onClick={() => router.push(seeAllPath)}
          className="flex items-center gap-1 text-xs font-black text-amber-600 hover:text-amber-700 transition-colors cursor-pointer"
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

              <div className={`w-full h-28 overflow-hidden bg-slate-100 relative ${isLocked ? "filter blur-xs" : ""}`}>
                <img
                  src={card.img}
                  alt={card.title}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute top-2 left-2 text-xs font-black bg-white/95 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-md shadow-sm">
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

export default function HomeClientPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const isAuthVerified = Boolean(profile?.isVerified);

  return (
    <div className="w-full flex flex-col gap-8 text-slate-800 font-sans mt-3">

        {/* ── 1. Hero Banner (Universal Home Banner) ── */}
        <div className="relative w-full min-h-[90px] rounded-2xl overflow-hidden bg-slate-950 text-white flex items-center px-4 sm:px-6 py-4 shadow-2xs mt-1">
          <img src="/thanjavur_temple_illustration.png" alt="Namma Thanjai" className="absolute right-0 top-0 h-full w-1/2 object-cover opacity-20 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-transparent" />
          <div className="relative z-10 flex flex-col gap-1 max-w-xl">
            <span className="bg-[#FBBF24] text-[#0F172A] font-bold text-xs px-2.5 py-0.5 rounded-md tracking-wider w-fit">
              Namma Thanjai • நம்ம தஞ்சை
            </span>
            <h1 className="font-heading font-black text-lg sm:text-xl text-white tracking-tight">
              Everything you need in our city, all in one place. <span className="text-amber-400 block text-xs sm:text-sm font-extrabold mt-0.5">நம்ம ஊரின் அனைத்து தேவைகளுக்கும் ஒரே இடம்.</span>
            </h1>
            <p className="text-xs text-slate-300 font-semibold leading-relaxed">
              Buy and sell with neighbors, hire reliable services, and explore local shopping offers—built exclusively for our community.
            </p>
          </div>
        </div>

        {/* ── 2x2 Primary Category Entry Hub (Pro UX Interactive Cards) ── */}
        <div className="grid grid-cols-2 gap-3 my-1">
          <button
            onClick={() => router.push("/sell")}
            className="p-4 bg-white border border-slate-200/90 rounded-2xl flex flex-col justify-between shadow-2xs hover:border-[#1d4ed8]/50 hover:shadow-md transition-all active:scale-[0.98] text-left min-h-[110px] cursor-pointer group"
          >
            <div className="flex items-center justify-between gap-1 w-full">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-[#1d4ed8] group-hover:text-white transition-colors">
                <ShoppingBag className="w-5 h-5 shrink-0" />
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#1d4ed8] group-hover:translate-x-0.5 transition-all" />
            </div>
            <div className="mt-3">
              <div className="font-bold text-sm sm:text-base tracking-tight text-slate-900 group-hover:text-[#1d4ed8] transition-colors">Sell</div>
              <div className="text-[11px] text-slate-500 font-medium">விற்க வேண்டுமா?</div>
            </div>
          </button>

          <button
            onClick={() => router.push("/need")}
            className="p-4 bg-white border border-slate-200/90 rounded-2xl flex flex-col justify-between shadow-2xs hover:border-[#1d4ed8]/50 hover:shadow-md transition-all active:scale-[0.98] text-left min-h-[110px] cursor-pointer group"
          >
            <div className="flex items-center justify-between gap-1 w-full">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1d4ed8] flex items-center justify-center group-hover:bg-[#1d4ed8] group-hover:text-white transition-colors">
                <Search className="w-5 h-5 shrink-0" />
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#1d4ed8] group-hover:translate-x-0.5 transition-all" />
            </div>
            <div className="mt-3">
              <div className="font-bold text-sm sm:text-base tracking-tight text-slate-900 group-hover:text-[#1d4ed8] transition-colors">Need</div>
              <div className="text-[11px] text-slate-500 font-medium">தேவைப்படுகிறதா?</div>
            </div>
          </button>

          <button
            onClick={() => router.push("/services")}
            className="p-4 bg-white border border-slate-200/90 rounded-2xl flex flex-col justify-between shadow-2xs hover:border-[#1d4ed8]/50 hover:shadow-md transition-all active:scale-[0.98] text-left min-h-[110px] cursor-pointer group"
          >
            <div className="flex items-center justify-between gap-1 w-full">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-[#1d4ed8] group-hover:text-white transition-colors">
                <Wrench className="w-5 h-5 shrink-0" />
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#1d4ed8] group-hover:translate-x-0.5 transition-all" />
            </div>
            <div className="mt-3">
              <div className="font-bold text-sm sm:text-base tracking-tight text-slate-900 group-hover:text-[#1d4ed8] transition-colors">Local Services</div>
              <div className="text-[11px] text-slate-500 font-medium">தொழில் வல்லுநர்கள்</div>
            </div>
          </button>

          <button
            onClick={() => router.push("/shops")}
            className="p-4 bg-white border border-slate-200/90 rounded-2xl flex flex-col justify-between shadow-2xs hover:border-[#1d4ed8]/50 hover:shadow-md transition-all active:scale-[0.98] text-left min-h-[110px] cursor-pointer group"
          >
            <div className="flex items-center justify-between gap-1 w-full">
              <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:bg-[#1d4ed8] group-hover:text-white transition-colors">
                <Store className="w-5 h-5 shrink-0" />
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#1d4ed8] group-hover:translate-x-0.5 transition-all" />
            </div>
            <div className="mt-3">
              <div className="font-bold text-sm sm:text-base tracking-tight text-slate-900 group-hover:text-[#1d4ed8] transition-colors">Local Offer</div>
              <div className="text-[11px] text-slate-500 font-medium">சிறப்பு சலுகைகள்</div>
            </div>
          </button>
        </div>

        {/* ── Static APK Download Banner Card for Web App Visitors ── */}
        <StaticApkCard variant="dark" />

        {/* ── SELL Preview ───────────────────────── */}
        <PreviewSection
          title="Sell (சமீபத்திய விற்பனை)"
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
          title="Need (தேவைகள்)"
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
          title="Local Services (உள்ளூர் சேவைகள்)"
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
          title="Local Offer (சிறப்பு சலுகைகள்)"
          subtitle="Store discounts & deals from Thanjavur shops"
          seeAllPath="/shops"
          accentColor="bg-yellow-500"
          isGuest={!isAuthVerified}
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
  );
}
