"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import {
  ChevronRight,
  MapPin,
  ShoppingBag,
  Search,
  Zap,
  Sparkles,
} from "lucide-react";

export default function LandingClientPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const isAuthVerified = Boolean(profile?.isVerified || user);

  const handleSignInClick = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("namma_thanjai_open_signin"));
    }
  };

  const handleProfileClick = () => {
    if (!isAuthVerified) {
      handleSignInClick();
    } else {
      router.push("/profile");
    }
  };

  return (
    <div className="w-full flex flex-col gap-8 text-slate-800 font-sans pb-24 bg-[#faf9f6] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full flex flex-col gap-9 pt-4">
        {/* ── Genuine Premium Hero Section: What We Do in Thanjavur ── */}
        <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-amber-950 text-white rounded-3xl p-6 sm:p-10 shadow-lg border border-slate-700/80 relative overflow-hidden my-2">
          {/* Subtle Background Glow Accent */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col gap-6 max-w-4xl">
            {/* Top Pill Badge */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider bg-amber-500/20 text-amber-300 px-3 py-1 rounded-full border border-amber-500/30">
                WHAT WE DO • நம்ம தஞ்சாவூர்
              </span>
              <span className="text-xs text-slate-300 font-semibold hidden sm:inline-block">
                0% Brokerage • Direct 1:1 Contact
              </span>
            </div>

            {/* Main Headline & Intro */}
            <div className="flex flex-col gap-2.5">
              <h1 className="font-heading font-black text-2xl sm:text-4xl text-white tracking-tight leading-tight">
                Thanjavur&apos;s Direct Local Directory &amp; Community Marketplace
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed max-w-2xl">
                Namma Thanjai connects residents, buyers, local owners, verified skilled workers, and neighborhood shops directly across Tanjore — with zero brokerage, zero commission, and zero middleman fees.
              </p>
            </div>

            {/* What We Do - 4 Pillars Quick Overview Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-2">
              {/* Pillar 1: Sell */}
              <div
                onClick={() => router.push("/sell")}
                className="bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 p-3.5 rounded-xl transition-all cursor-pointer flex flex-col gap-1.5 group"
              >
                <div className="flex items-center gap-2 text-amber-400 font-heading font-bold text-xs">
                  <ShoppingBag className="w-4 h-4 shrink-0" />
                  <span>1. Direct Selling</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-snug">
                  Buy &amp; sell plots, bikes, mobiles &amp; cars directly with local owners.
                </p>
                <span className="text-[10px] font-bold text-amber-400 group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-0.5 mt-1">
                  Browse Sell &rarr;
                </span>
              </div>

              {/* Pillar 2: Need */}
              <div
                onClick={() => router.push("/need")}
                className="bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 p-3.5 rounded-xl transition-all cursor-pointer flex flex-col gap-1.5 group"
              >
                <div className="flex items-center gap-2 text-amber-400 font-heading font-bold text-xs">
                  <Search className="w-4 h-4 shrink-0" />
                  <span>2. Buyer Requests</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-snug">
                  Post rental house, land, or car requirements to get direct calls.
                </p>
                <span className="text-[10px] font-bold text-amber-400 group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-0.5 mt-1">
                  Post Requirement &rarr;
                </span>
              </div>

              {/* Pillar 3: Services */}
              <div
                onClick={() => router.push("/services")}
                className="bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 p-3.5 rounded-xl transition-all cursor-pointer flex flex-col gap-1.5 group"
              >
                <div className="flex items-center gap-2 text-amber-400 font-heading font-bold text-xs">
                  <Zap className="w-4 h-4 shrink-0" />
                  <span>3. Doorstep Services</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-snug">
                  Hire verified electricians, plumbers, carpenters &amp; technicians.
                </p>
                <span className="text-[10px] font-bold text-amber-400 group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-0.5 mt-1">
                  Find Technicians &rarr;
                </span>
              </div>

              {/* Pillar 4: Offers */}
              <div
                onClick={() => router.push("/shops")}
                className="bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 p-3.5 rounded-xl transition-all cursor-pointer flex flex-col gap-1.5 group"
              >
                <div className="flex items-center gap-2 text-amber-400 font-heading font-bold text-xs">
                  <Sparkles className="w-4 h-4 shrink-0" />
                  <span>4. Store Offers</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-snug">
                  Explore verified sales, cafe discounts &amp; retail deals in Tanjore.
                </p>
                <span className="text-[10px] font-bold text-amber-400 group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-0.5 mt-1">
                  Explore Offers &rarr;
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ── 1. SELL Segment Carousel (6 Sample Items) ── */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
            <div>
              <h2 className="font-heading font-extrabold text-base text-slate-900">
                Sell (சமீபத்திய விற்பனை)
              </h2>
              <p className="text-xs text-slate-500">Direct items for sale by local owners</p>
            </div>
            <button
              onClick={() => router.push("/sell")}
              className="text-xs font-bold text-slate-700 hover:text-slate-900 flex items-center gap-1 hover:underline cursor-pointer"
            >
              View all <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
            </button>
          </div>

          <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-2 scrollbar-none">
            {[
              { title: "2400 Sqft CMDA Plot — Vallam", sub: "Plots & Real Estate", price: "₹24,50,000", area: "Vallam", img: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&auto=format&fit=crop" },
              { title: "Hero Splendor 2022 — Single Owner", sub: "Used Vehicles", price: "₹68,000", area: "New Bus Stand", img: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&auto=format&fit=crop" },
              { title: "iPhone 13 128GB Blue", sub: "Electronics & Mobiles", price: "₹42,000", area: "Old Bus Stand", img: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&auto=format&fit=crop" },
              { title: "Teakwood 5-Seater Sofa Set", sub: "Household Goods", price: "₹18,500", area: "Karanthai", img: "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=400&auto=format&fit=crop" },
              { title: "Commercial Land 1.5 Acre — Ring Road", sub: "Plots & Real Estate", price: "₹85,00,000", area: "Pudukkottai Ring Rd", img: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&auto=format&fit=crop" },
              { title: "Honda City 2020 V Petrol — Mint Condition", sub: "Used Vehicles", price: "₹7,20,000", area: "Medical College Rd", img: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=400&auto=format&fit=crop" },
            ].map((item, idx) => (
              <div
                key={idx}
                onClick={() => router.push("/sell")}
                className="w-[260px] sm:w-[280px] shrink-0 snap-start bg-white rounded-xl border border-slate-200/90 overflow-hidden shadow-2xs hover:border-slate-300 transition-all cursor-pointer flex flex-col justify-between"
              >
                <div className="relative h-36 bg-slate-100 overflow-hidden">
                  <img src={item.img} alt={item.title} className="w-full h-full object-cover" />
                  <span className="absolute top-2 left-2 bg-slate-900/90 text-white font-black text-xs px-2.5 py-0.5 rounded-md">
                    {item.price}
                  </span>
                </div>
                <div className="p-3.5 flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md w-fit">
                    {item.sub}
                  </span>
                  <h3 className="font-heading font-bold text-xs text-slate-900 line-clamp-1">{item.title}</h3>
                  <div className="flex items-center text-slate-500 text-[11px] gap-1 pt-1">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>{item.area}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── 2. NEED Segment Carousel (6 Sample Items) ── */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
            <div>
              <h2 className="font-heading font-extrabold text-base text-slate-900">
                Need (தேவைகள்)
              </h2>
              <p className="text-xs text-slate-500">Buyer requirements posted by locals</p>
            </div>
            <button
              onClick={() => router.push("/need")}
              className="text-xs font-bold text-slate-700 hover:text-slate-900 flex items-center gap-1 hover:underline cursor-pointer"
            >
              View all <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
            </button>
          </div>

          <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-2 scrollbar-none">
            {[
              { title: "Need 1-2 Acres Commercial Land", badge: "Buy", sub: "Plots & Real Estate", price: "Budget ₹50L+", area: "Vallam" },
              { title: "Need 2 BHK near Medical College", badge: "Rent", sub: "Property Rental", price: "₹10,000/mo", area: "Medical College Rd" },
              { title: "Need Used Laptop under ₹25,000", badge: "Buy", sub: "Electronics & Mobiles", price: "₹25,000", area: "Tanjore Town" },
              { title: "Need Brahmin Marriage Caterer", badge: "Service", sub: "General Requirement", price: "Flexible", area: "South Rampart" },
              { title: "Need Used Scooty Activa / Jupiter", badge: "Buy", sub: "Used Vehicles", price: "Budget ₹40,000", area: "New Bus Stand" },
              { title: "Need Shop Space for Rent (Main Rd)", badge: "Rent", sub: "Commercial Space", price: "Budget ₹15,000/mo", area: "Old Bus Stand" },
            ].map((item, idx) => (
              <div
                key={idx}
                onClick={() => router.push("/need")}
                className="w-[260px] sm:w-[280px] shrink-0 snap-start bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs hover:border-slate-300 transition-all cursor-pointer flex flex-col justify-between"
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                      {item.badge}
                    </span>
                    <span className="text-[10px] text-slate-400">Just now</span>
                  </div>
                  <h3 className="font-heading font-bold text-xs text-slate-900 line-clamp-2">{item.title}</h3>
                  <div className="flex items-center text-slate-500 text-[11px] gap-1">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>{item.area}</span>
                  </div>
                </div>
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900">{item.price}</span>
                  <span className="text-slate-600 font-bold hover:underline">Contact →</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── 3. LOCAL SERVICES Segment Carousel (6 Sample Items) ── */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
            <div>
              <h2 className="font-heading font-extrabold text-base text-slate-900">
                Services (சேவைகள்)
              </h2>
              <p className="text-xs text-slate-500">Skilled trade professionals in Thanjavur</p>
            </div>
            <button
              onClick={() => router.push("/services")}
              className="text-xs font-bold text-slate-700 hover:text-slate-900 flex items-center gap-1 hover:underline cursor-pointer"
            >
              View all <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
            </button>
          </div>

          <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-2 scrollbar-none">
            {[
              { name: "Senthil Kumar — Electrician", trade: "Electrician", area: "Tanjore Town", img: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&auto=format&fit=crop" },
              { name: "Rajesh K — Expert Plumber", trade: "Plumber", area: "Medical College Rd", img: "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=400&auto=format&fit=crop" },
              { name: "Venu Gopal — Wood Architect", trade: "Carpenter", area: "South Rampart", img: "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=400&auto=format&fit=crop" },
              { name: "Muthu Cool Tech — AC Repair", trade: "AC Technician", area: "Old Bus Stand", img: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&auto=format&fit=crop" },
              { name: "Ganesan Painters — Interior Paint", trade: "Painter", area: "Vallam", img: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=400&auto=format&fit=crop" },
              { name: "Kumar Housekeeping Services", trade: "Cleaning", area: "Medical College Rd", img: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&auto=format&fit=crop" },
            ].map((item, idx) => (
              <div
                key={idx}
                onClick={() => router.push("/services")}
                className="w-[260px] sm:w-[280px] shrink-0 snap-start bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs hover:border-slate-300 transition-all cursor-pointer flex flex-col justify-between"
              >
                <div className="flex items-center gap-3 mb-2">
                  <img src={item.img} alt={item.name} className="w-11 h-11 rounded-full object-cover border border-slate-200 shrink-0" />
                  <div className="min-w-0">
                    <h3 className="font-heading font-bold text-xs text-slate-900 truncate">{item.name}</h3>
                    <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-semibold rounded border border-slate-200">
                      {item.trade}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[10px] pt-2.5 border-t border-slate-100">
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Available Now
                  </span>
                  <span className="text-slate-500 font-medium">{item.area}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── 4. OFFERS Segment Carousel (6 Sample Items) ── */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
            <div>
              <h2 className="font-heading font-extrabold text-base text-slate-900">
                Offers (சிறப்பு சலுகைகள்)
              </h2>
              <p className="text-xs text-slate-500">Promotions &amp; deals from local stores</p>
            </div>
            <button
              onClick={() => router.push("/shops")}
              className="text-xs font-bold text-slate-700 hover:text-slate-900 flex items-center gap-1 hover:underline cursor-pointer"
            >
              View all <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
            </button>
          </div>

          <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-2 scrollbar-none">
            {[
              { store: "GLEN Gallery", title: "Up to 60% OFF — Grand Sale", badge: "Valid Today", area: "New Bus Stand", img: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=400&auto=format&fit=crop" },
              { store: "Tanjore Degree Coffee", title: "Free Filter Coffee with Halwa", badge: "Limited Time", area: "South Rampart", img: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&auto=format&fit=crop" },
              { store: "Silk Handloom House", title: "25% OFF Pure Zari Silks", badge: "Special Offer", area: "Karanthai", img: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&auto=format&fit=crop" },
              { store: "Gold Palace", title: "Zero Making Charge — Gold", badge: "Festive Offer", area: "Gandhiji Road", img: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&auto=format&fit=crop" },
              { store: "Tanjore Optical Hub", title: "Buy 1 Get 1 Free Branded Frames", badge: "Weekend Deal", area: "Old Bus Stand", img: "https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=400&auto=format&fit=crop" },
              { store: "Annapoorna Restaurant", title: "15% OFF Special Thali Lunch", badge: "Daily Offer", area: "Medical College Rd", img: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&auto=format&fit=crop" },
            ].map((item, idx) => (
              <div
                key={idx}
                onClick={() => router.push("/shops")}
                className="w-[260px] sm:w-[280px] shrink-0 snap-start bg-white rounded-xl border border-slate-200/90 overflow-hidden shadow-2xs hover:border-slate-300 transition-all cursor-pointer flex flex-col justify-between"
              >
                <div className="relative h-32 bg-slate-900 overflow-hidden">
                  <img src={item.img} alt={item.store} className="w-full h-full object-cover opacity-90" />
                  <span className="absolute top-2 left-2 bg-slate-900/90 text-white font-bold text-[10px] px-2.5 py-0.5 rounded-md">
                    {item.badge}
                  </span>
                </div>
                <div className="p-3.5 flex flex-col gap-1">
                  <h3 className="font-heading font-extrabold text-xs text-slate-900 line-clamp-1">{item.store}</h3>
                  <p className="text-[11px] text-slate-600 font-bold line-clamp-1">{item.title}</p>
                  <div className="flex items-center text-slate-500 text-[10px] gap-1 mt-1">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>{item.area}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Gentle "Steps to Use Namma Thanjai" Section ── */}
        <section className="bg-slate-900 text-white rounded-2xl p-6 sm:p-10 flex flex-col gap-6 shadow-xs border border-slate-800 my-4">
          <div className="flex flex-col gap-1.5 max-w-xl">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 bg-slate-800 px-2.5 py-1 rounded-md w-fit border border-slate-700">
              COMMUNITY PLATFORM
            </span>
            <h2 className="font-heading font-black text-lg sm:text-2xl text-white tracking-tight">
              Steps to Use Namma Thanjai
            </h2>
            <p className="text-xs text-slate-400 font-medium">
              Connecting Tanjore residents directly with 0 brokerage, 0 commission, and direct local communication.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-1">
            {/* Step 1 */}
            <div className="bg-slate-800/80 border border-slate-700/80 p-5 rounded-xl flex flex-col gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-slate-700 text-amber-400 font-heading font-black text-sm flex items-center justify-center">
                1
              </div>
              <h3 className="font-heading font-bold text-xs text-white">Browse or Post Listings</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Post your items for sale, buyer requirements, skilled tradesperson profile, or local store discounts for free.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-slate-800/80 border border-slate-700/80 p-5 rounded-xl flex flex-col gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-slate-700 text-amber-400 font-heading font-black text-sm flex items-center justify-center">
                2
              </div>
              <h3 className="font-heading font-bold text-xs text-white">Direct 1:1 Contact</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Connect directly with posters via verified phone calls, direct WhatsApp handoff, or built-in in-app chat.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-slate-800/80 border border-slate-700/80 p-5 rounded-xl flex flex-col gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-slate-700 text-amber-400 font-heading font-black text-sm flex items-center justify-center">
                3
              </div>
              <h3 className="font-heading font-bold text-xs text-white">Deal Directly with Locals</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Transact 1:1 with local Thanjavur residents with zero middleman commission or brokerage fees.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
