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

        {/* ── 1. Hero Banner (Universal Home Banner - Prominent & Standout) ── */}
        <div className="relative w-full min-h-[160px] sm:min-h-[200px] rounded-xl overflow-hidden bg-slate-950 text-white flex items-center px-6 sm:px-8 py-6 sm:py-8 shadow-md mt-1">
          <img src="/thanjavur_temple_illustration.png" alt="Namma Thanjai" className="absolute right-0 top-0 h-full w-3/5 object-cover opacity-35 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-transparent" />
          <div className="relative z-10 flex flex-col gap-2 max-w-xl">
            <span className="bg-[#FBBF24] text-[#0F172A] font-bold text-xs px-3 py-1 rounded-md tracking-wider w-fit shadow-2xs">
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
                  <span>Register to Post →</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── 4 Segment Category Cards (2x2 Mobile WebApp, 4x1 Desktop Website) ── */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 my-1">
          {/* Card 1: SELL */}
          <div className="bg-white rounded-xl border-2 border-[#1d4ed8]/30 hover:border-[#1d4ed8] p-3 sm:p-4 flex flex-col justify-between gap-2 sm:gap-3 text-left transition-all shadow-xs">
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-blue-50 text-[#1d4ed8] flex items-center justify-center shrink-0">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-heading font-bold text-[#1d4ed8] text-sm sm:text-base leading-tight">
                    Sell
                  </h2>
                  <span className="block text-xs font-bold text-[#1d4ed8]/85 leading-tight">
                    விற்பனை
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-600 font-normal leading-snug">
                Buy &amp; Sell items directly with Tanjore owners with 0 brokerage
              </p>

              <div className="pt-2 border-t border-slate-100 hidden sm:flex items-center gap-1 sm:gap-1.5 flex-nowrap overflow-hidden">
                {["Plots", "Bikes"].map((cat, i) => (
                  <span
                    key={i}
                    onClick={() => router.push(`/sell?category=${encodeURIComponent(cat)}`)}
                    className="text-[11px] text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 hover:border-[#1d4ed8] hover:text-[#1d4ed8] cursor-pointer transition-colors whitespace-nowrap shrink-0"
                  >
                    {cat}
                  </span>
                ))}
                <span
                  onClick={() => router.push("/sell")}
                  className="text-[11px] font-bold text-[#1d4ed8] bg-blue-50 px-2 py-0.5 rounded border border-blue-200 hover:bg-[#1d4ed8] hover:text-white cursor-pointer transition-colors whitespace-nowrap shrink-0"
                >
                  +12 More
                </span>
              </div>
            </div>

            <button
              onClick={() => router.push("/sell")}
              className="w-full mt-1 bg-white border border-[#1d4ed8] hover:bg-blue-50/60 text-[#1d4ed8] text-xs font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-2xs text-center"
            >
              <span>Explore Sell</span>
              <ChevronRight className="w-4 h-4 shrink-0 text-[#1d4ed8]" />
            </button>
          </div>

          {/* Card 2: NEED */}
          <div className="bg-white rounded-xl border-2 border-[#1d4ed8]/30 hover:border-[#1d4ed8] p-3 sm:p-4 flex flex-col justify-between gap-2 sm:gap-3 text-left transition-all shadow-xs">
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-blue-50 text-[#1d4ed8] flex items-center justify-center shrink-0">
                  <Search className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-heading font-bold text-[#1d4ed8] text-sm sm:text-base leading-tight">
                    Need
                  </h2>
                  <span className="block text-xs font-bold text-[#1d4ed8]/85 leading-tight">
                    தேவைகள்
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-600 font-normal leading-snug">
                Post your requirements or find buyers in Thanjavur
              </p>

              <div className="pt-2 border-t border-slate-100 hidden sm:flex items-center gap-1 sm:gap-1.5 flex-nowrap overflow-hidden">
                {["Cars", "Rentals"].map((cat, i) => (
                  <span
                    key={i}
                    onClick={() => router.push(`/need?category=${encodeURIComponent(cat)}`)}
                    className="text-[11px] text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 hover:border-[#1d4ed8] hover:text-[#1d4ed8] cursor-pointer transition-colors whitespace-nowrap shrink-0"
                  >
                    {cat}
                  </span>
                ))}
                <span
                  onClick={() => router.push("/need")}
                  className="text-[11px] font-bold text-[#1d4ed8] bg-blue-50 px-2 py-0.5 rounded border border-blue-200 hover:bg-[#1d4ed8] hover:text-white cursor-pointer transition-colors whitespace-nowrap shrink-0"
                >
                  +10 More
                </span>
              </div>
            </div>

            <button
              onClick={() => router.push("/need")}
              className="w-full mt-1 bg-white border border-[#1d4ed8] hover:bg-blue-50/60 text-[#1d4ed8] text-xs font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-2xs text-center"
            >
              <span>Explore Need</span>
              <ChevronRight className="w-4 h-4 shrink-0 text-[#1d4ed8]" />
            </button>
          </div>

          {/* Card 3: SERVICES */}
          <div className="bg-white rounded-xl border-2 border-[#1d4ed8]/30 hover:border-[#1d4ed8] p-3 sm:p-4 flex flex-col justify-between gap-2 sm:gap-3 text-left transition-all shadow-xs">
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-blue-50 text-[#1d4ed8] flex items-center justify-center shrink-0">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-heading font-bold text-[#1d4ed8] text-sm sm:text-base leading-tight">
                    Service
                  </h2>
                  <span className="block text-xs font-bold text-[#1d4ed8]/85 leading-tight">
                    சேவைகள்
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-600 font-normal leading-snug">
                Hire verified doorstep technicians &amp; skilled workers
              </p>

              <div className="pt-2 border-t border-slate-100 hidden sm:flex items-center gap-1 sm:gap-1.5 flex-nowrap overflow-hidden">
                {["Electrician", "Plumber"].map((cat, i) => (
                  <span
                    key={i}
                    onClick={() => router.push(`/services?category=${encodeURIComponent(cat)}`)}
                    className="text-[11px] text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 hover:border-[#1d4ed8] hover:text-[#1d4ed8] cursor-pointer transition-colors whitespace-nowrap shrink-0"
                  >
                    {cat}
                  </span>
                ))}
                <span
                  onClick={() => router.push("/services")}
                  className="text-[11px] font-bold text-[#1d4ed8] bg-blue-50 px-2 py-0.5 rounded border border-blue-200 hover:bg-[#1d4ed8] hover:text-white cursor-pointer transition-colors whitespace-nowrap shrink-0"
                >
                  +15 More
                </span>
              </div>
            </div>

            <button
              onClick={() => router.push("/services")}
              className="w-full mt-1 bg-white border border-[#1d4ed8] hover:bg-blue-50/60 text-[#1d4ed8] text-xs font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-2xs text-center"
            >
              <span>Explore Services</span>
              <ChevronRight className="w-4 h-4 shrink-0 text-[#1d4ed8]" />
            </button>
          </div>

          {/* Card 4: OFFERS */}
          <div className="bg-white rounded-xl border-2 border-[#1d4ed8]/30 hover:border-[#1d4ed8] p-3 sm:p-4 flex flex-col justify-between gap-2 sm:gap-3 text-left transition-all shadow-xs">
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-blue-50 text-[#1d4ed8] flex items-center justify-center shrink-0">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-heading font-bold text-[#1d4ed8] text-sm sm:text-base leading-tight">
                    Offer
                  </h2>
                  <span className="block text-xs font-bold text-[#1d4ed8]/85 leading-tight">
                    சலுகைகள்
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-600 font-normal leading-snug">
                Discover exclusive store discounts &amp; deals from Tanjore shops
              </p>

              <div className="pt-2 border-t border-slate-100 hidden sm:flex items-center gap-1 sm:gap-1.5 flex-nowrap overflow-hidden">
                {["Discounts", "Cafes"].map((cat, i) => (
                  <span
                    key={i}
                    onClick={() => router.push(`/shops?category=${encodeURIComponent(cat)}`)}
                    className="text-[11px] text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 hover:border-[#1d4ed8] hover:text-[#1d4ed8] cursor-pointer transition-colors whitespace-nowrap shrink-0"
                  >
                    {cat}
                  </span>
                ))}
                <span
                  onClick={() => router.push("/shops")}
                  className="text-[11px] font-bold text-[#1d4ed8] bg-blue-50 px-2 py-0.5 rounded border border-blue-200 hover:bg-[#1d4ed8] hover:text-white cursor-pointer transition-colors whitespace-nowrap shrink-0"
                >
                  +10 More
                </span>
              </div>
            </div>

            <button
              onClick={() => router.push("/shops")}
              className="w-full mt-1 bg-white border border-[#1d4ed8] hover:bg-blue-50/60 text-[#1d4ed8] text-xs font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-2xs text-center"
            >
              <span>Explore Offers</span>
              <ChevronRight className="w-4 h-4 shrink-0 text-[#1d4ed8]" />
            </button>
          </div>
        </section>

        {/* ── Static APK Download Banner Card for Web App Visitors ── */}
        <StaticApkCard variant="dark" />

        {/* ── SELL Preview ───────────────────────── */}
        <PreviewSection
          title="Items for Sale (விற்பனை)"
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
          title="Items Looking For (தேவைகள்)"
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
          title="Local Service (சேவைகள்)"
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
          title="Local Offer (சலுகைகள்)"
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
