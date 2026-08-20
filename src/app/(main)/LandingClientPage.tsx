"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import {
  ChevronRight,
  MapPin,
  ShoppingBag,
  Search,
  Wrench,
  Store,
  Zap,
  Sparkles,
  BarChart3,
  Eye,
  MessageSquare,
  Phone,
  Share2,
  Bookmark,
} from "lucide-react";

export default function LandingClientPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const isAuthVerified = Boolean(profile?.isVerified || user);
  const [activeSellOrNeedPost, setActiveSellOrNeedPost] = React.useState<any>(null);
  const [activeServiceOrOfferPost, setActiveServiceOrOfferPost] = React.useState<any>(null);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = JSON.parse(localStorage.getItem("namma_thanjai_local_posts") || "[]");
        const activeSellNeed = stored.find((p: any) => !p.is_sold && (p.type === "SELL" || p.type === "NEED" || p.category === "SELL" || p.category === "NEED"));
        const activeServiceOffer = stored.find((p: any) => !p.is_sold && (p.type === "SERVICE" || p.type === "OFFER" || p.type === "SHOP" || p.category === "SERVICE" || p.category === "OFFER"));
        setActiveSellOrNeedPost(activeSellNeed || null);
        setActiveServiceOrOfferPost(activeServiceOffer || null);
      } catch (e) {}
    }
  }, []);

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

  // 4 Simple Segment Feature Cards (4*1 Layout)
  const pillarCards = [
    {
      id: "p1",
      title: "SELL (விற்பனை)",
      desc: "Buy & Sell items directly with Tanjore owners with 0 brokerage",
      icon: ShoppingBag,
      path: "/sell",
      categories: ["Plots & Real Estate", "Bikes & Scooters", "Smartphones", "Cars & Autos"],
      btnText: "Explore Sell",
    },
    {
      id: "p2",
      title: "NEED (தேவைகள்)",
      desc: "Post your requirements or find buyers in Thanjavur",
      icon: Search,
      path: "/need",
      categories: ["Car Wanted", "House Rental Wanted", "Land Wanted", "Laptop Wanted"],
      btnText: "Explore Need",
    },
    {
      id: "p3",
      title: "SERVICES (சேவைகள்)",
      desc: "Hire verified doorstep technicians & skilled workers",
      icon: Zap,
      path: "/services",
      categories: ["Electrician", "Plumber", "Carpenter", "Painter & AC Repair"],
      btnText: "Explore Services",
    },
    {
      id: "p4",
      title: "OFFERS (சலுகைகள்)",
      desc: "Discover exclusive store discounts & deals from Tanjore shops",
      icon: Sparkles,
      path: "/shops",
      categories: ["Store Discounts", "Cafes & Dining", "Textiles & Sarees", "Jewelry & Gold"],
      btnText: "Explore Offers",
    },
  ];

  return (
    <div className="w-full flex flex-col gap-8 text-slate-800 font-sans pb-24 bg-[#f8fafc] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col gap-8 pt-4">
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
                  className="bg-[#FBBF24] hover:bg-amber-400 text-slate-950 font-heading font-black text-xs uppercase tracking-wider py-2 px-5 rounded-xl transition-all shadow-sm border border-amber-400/80 cursor-pointer active:scale-95 flex items-center gap-1.5"
                >
                  <span>Verify Phone to Post</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-950 stroke-[3]" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Dynamic Category / Insights / Matchmaker Section ── */}
        {activeServiceOrOfferPost ? (
          /* Provider Performance Insights Card (Rendered when Service or Offer active) */
          <div className="bg-[#0F172A] border border-amber-500/30 rounded-2xl p-5 text-white shadow-xl flex flex-col gap-4 my-1 font-sans">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold">
                  <BarChart3 className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="font-heading font-black text-sm text-white">Provider Performance Insights</h3>
                  <p className="text-xs text-slate-400 font-semibold">{activeServiceOrOfferPost.title || activeServiceOrOfferPost.name || activeServiceOrOfferPost.shop_name}</p>
                </div>
              </div>
              <span className="text-[10px] uppercase font-black tracking-widest text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/30">Live Analytics</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl flex flex-col gap-0.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1"><Eye className="w-3 h-3 text-blue-400" /> Seen</span>
                <span className="font-heading font-black text-lg text-white">{activeServiceOrOfferPost.views_count || 48}</span>
              </div>
              <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl flex flex-col gap-0.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1"><MessageSquare className="w-3 h-3 text-emerald-400" /> Interacted</span>
                <span className="font-heading font-black text-lg text-white">{activeServiceOrOfferPost.chats_count || 12}</span>
              </div>
              <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl flex flex-col gap-0.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1"><Phone className="w-3 h-3 text-amber-400" /> Calls / Requests</span>
                <span className="font-heading font-black text-lg text-white">{activeServiceOrOfferPost.calls_count || 8}</span>
              </div>
              <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl flex flex-col gap-0.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1"><Share2 className="w-3 h-3 text-indigo-400" /> Shared</span>
                <span className="font-heading font-black text-lg text-white">{activeServiceOrOfferPost.shares_count || 15}</span>
              </div>
              <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl flex flex-col gap-0.5 col-span-2 sm:col-span-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1"><Bookmark className="w-3 h-3 text-rose-400" /> Saved</span>
                <span className="font-heading font-black text-lg text-white">{activeServiceOrOfferPost.saved_count || 6}</span>
              </div>
            </div>
          </div>
        ) : activeSellOrNeedPost ? (
          /* Smart 2x2 Matchmaker Grid (Rendered when Sell or Need active) */
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col gap-3 my-1">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500 fill-amber-400" />
                <h3 className="font-heading font-black text-sm text-slate-900">Smart Tanjore Matchmaker</h3>
              </div>
              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                Matching "{activeSellOrNeedPost.title}"
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {[
                { title: "Matching Buyer in Vallam", area: "Vallam", price: "₹22,000", contact: "+91 9994837342" },
                { title: "Verified Tanjore Dealer", area: "Medical College Rd", price: "₹24,50,000", contact: "+91 9994837342" },
                { title: "Direct Owner Requirement", area: "Old Bus Stand", price: "₹18,000", contact: "+91 9994837342" },
                { title: "Instant Cash Buyer", area: "Karanthai", price: "₹65,000", contact: "+91 9994837342" },
              ].map((m, i) => (
                <div key={i} className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col justify-between gap-2">
                  <div>
                    <span className="text-[9px] uppercase font-black bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded">Match</span>
                    <h5 className="font-heading font-black text-xs text-slate-900 truncate mt-1">{m.title}</h5>
                    <p className="text-[11px] text-slate-500 font-semibold mt-0.5">📍 {m.area}</p>
                  </div>
                  <button
                    onClick={() => router.push(`/chat?title=${encodeURIComponent(m.title)}`)}
                    className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-heading font-black text-[11px] rounded-lg cursor-pointer transition-colors"
                  >
                    Contact Match →
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Default State: 4 Segment Category Cards with Pure Bold Black Titles */
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 my-1">
            {/* Card 1: SELL */}
            <div className="bg-white rounded-xl border-2 border-slate-200 hover:border-slate-400 p-3 sm:p-4 flex flex-col justify-between gap-2 sm:gap-3 text-left transition-all shadow-xs">
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-900 flex items-center justify-center shrink-0">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-heading font-black text-slate-950 text-sm sm:text-base leading-tight">
                      Sell
                    </h2>
                    <span className="block text-[11px] font-bold text-slate-500 leading-tight mt-0.5">
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
                      className="text-[11px] text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 hover:border-slate-400 hover:text-slate-900 cursor-pointer transition-colors whitespace-nowrap shrink-0"
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
            <div className="bg-white rounded-xl border-2 border-slate-200 hover:border-slate-400 p-3 sm:p-4 flex flex-col justify-between gap-2 sm:gap-3 text-left transition-all shadow-xs">
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-900 flex items-center justify-center shrink-0">
                    <Search className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-heading font-black text-slate-950 text-sm sm:text-base leading-tight">
                      Need
                    </h2>
                    <span className="block text-[11px] font-bold text-slate-500 leading-tight mt-0.5">
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
            <div className="bg-white rounded-xl border-2 border-slate-200 hover:border-slate-400 p-3 sm:p-4 flex flex-col justify-between gap-2 sm:gap-3 text-left transition-all shadow-xs">
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-900 flex items-center justify-center shrink-0">
                    <Wrench className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-heading font-black text-slate-950 text-sm sm:text-base leading-tight">
                      Service
                    </h2>
                    <span className="block text-[11px] font-bold text-slate-500 leading-tight mt-0.5">
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
            <div className="bg-white rounded-xl border-2 border-slate-200 hover:border-slate-400 p-3 sm:p-4 flex flex-col justify-between gap-2 sm:gap-3 text-left transition-all shadow-xs">
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-900 flex items-center justify-center shrink-0">
                    <Store className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-heading font-black text-slate-950 text-sm sm:text-base leading-tight">
                      Offer
                    </h2>
                    <span className="block text-[11px] font-bold text-slate-500 leading-tight mt-0.5">
                      சலுகைகள்
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 font-normal leading-snug">
                  Discover live discounts &amp; local store promotions
                </p>

                <div className="pt-2 border-t border-slate-100 hidden sm:flex items-center gap-1 sm:gap-1.5 flex-nowrap overflow-hidden">
                  {["Textiles", "Electronics"].map((cat, i) => (
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
                    +20 More
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
        )}

        {/* ── SELL Preview ───────────────────────── */}
        <section className="flex flex-col gap-3 my-2">
          <div className="flex items-center justify-between">
            <h2 className="font-heading font-black text-base sm:text-lg text-slate-900 tracking-tight">
              Items for Sale (விற்பனை)
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push("/sell")}
                className="text-xs font-bold text-[#1d4ed8] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>View all</span> <ChevronRight className="w-3.5 h-3.5 text-[#1d4ed8]" />
              </button>
            </div>
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
                  <div className="flex items-center text-slate-600 text-[11px] gap-1 pt-1">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>{item.area}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── NEED Preview ───────────────────────── */}
        <section className="flex flex-col gap-3 my-2">
          <div className="flex items-center justify-between">
            <h2 className="font-heading font-black text-base sm:text-lg text-slate-900 tracking-tight">
              Items Looking For (தேவைகள்)
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push("/need")}
                className="text-xs font-bold text-[#1d4ed8] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>View all</span> <ChevronRight className="w-3.5 h-3.5 text-[#1d4ed8]" />
              </button>
            </div>
          </div>

          <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-2 scrollbar-none">
            {[
              { title: "Urgent Requirement: 2 BHK House for Rent", sub: "Rental Wanted", budget: "Budget: ₹12,000/mo", area: "Medical College Road", img: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=400&auto=format&fit=crop" },
              { title: "Looking to Buy Used Scooter (Activa / Jupiter)", sub: "Vehicle Wanted", budget: "Budget: ₹45,000", area: "Old Bus Stand", img: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&auto=format&fit=crop" },
              { title: "Require 1200 Sqft Residential Plot for Immediate Purchase", sub: "Real Estate Wanted", budget: "Budget: ₹25 Lakhs", area: "Vilar Road", img: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&auto=format&fit=crop" },
              { title: "Need i5 Laptop for College Student", sub: "Electronics Wanted", budget: "Budget: ₹28,000", area: "Vallam", img: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&auto=format&fit=crop" },
              { title: "Urgent: Commercial Shop for Lease on Main Road", sub: "Commercial Wanted", budget: "Lease: ₹5 Lakhs", area: "South Street", img: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&auto=format&fit=crop" },
              { title: "Looking for Used Washing Machine — Front Load", sub: "Appliance Wanted", budget: "Budget: ₹12,000", area: "Srinivasapuram", img: "https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=400&auto=format&fit=crop" },
            ].map((item, idx) => (
              <div
                key={idx}
                onClick={() => router.push("/need")}
                className="w-[260px] sm:w-[280px] shrink-0 snap-start bg-white rounded-xl border border-slate-200/90 overflow-hidden shadow-2xs hover:border-slate-300 transition-all cursor-pointer flex flex-col justify-between"
              >
                <div className="relative h-36 bg-slate-100 overflow-hidden">
                  <img src={item.img} alt={item.title} className="w-full h-full object-cover" />
                  <span className="absolute top-2 left-2 bg-slate-900/90 text-white font-black text-xs px-2.5 py-0.5 rounded-md">
                    {item.budget}
                  </span>
                </div>
                <div className="p-3.5 flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md w-fit">
                    {item.sub}
                  </span>
                  <h3 className="font-heading font-bold text-xs text-slate-900 line-clamp-1">{item.title}</h3>
                  <div className="flex items-center text-slate-600 text-[11px] gap-1 pt-1">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>{item.area}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── SERVICES Preview ───────────────────── */}
        <section className="flex flex-col gap-3 my-2">
          <div className="flex items-center justify-between">
            <h2 className="font-heading font-black text-base sm:text-lg text-slate-900 tracking-tight">
              Local Service (சேவைகள்)
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push("/services")}
                className="text-xs font-bold text-[#1d4ed8] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>View all</span> <ChevronRight className="w-3.5 h-3.5 text-[#1d4ed8]" />
              </button>
            </div>
          </div>

          <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-2 scrollbar-none">
            {[
              { name: "Karthik — Master Electrician", sub: "Electrician", exp: "12 Yrs Exp", area: "Thanjavur City", img: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&auto=format&fit=crop" },
              { name: "Suresh Plumbing Works", sub: "Plumber", exp: "8 Yrs Exp", area: "Medical College Rd", img: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=400&auto=format&fit=crop" },
              { name: "Selvam Home Painting", sub: "Painter", exp: "15 Yrs Exp", area: "New Bus Stand", img: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=400&auto=format&fit=crop" },
              { name: "Ramesh AC Repair & Service", sub: "AC Service", exp: "6 Yrs Exp", area: "Vallam", img: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&auto=format&fit=crop" },
              { name: "Venkatesh Teak Carpentry", sub: "Carpenter", exp: "20 Yrs Exp", area: "Karanthai", img: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=400&auto=format&fit=crop" },
              { name: "Murugan House Cleaning & Water Tank", sub: "Cleaning", exp: "5 Yrs Exp", area: "South Street", img: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&auto=format&fit=crop" },
            ].map((item, idx) => (
              <div
                key={idx}
                onClick={() => router.push("/services")}
                className="w-[260px] sm:w-[280px] shrink-0 snap-start bg-white rounded-xl border border-slate-200/90 overflow-hidden shadow-2xs hover:border-slate-300 transition-all cursor-pointer flex flex-col justify-between"
              >
                <div className="relative h-36 bg-slate-100 overflow-hidden">
                  <img src={item.img} alt={item.name} className="w-full h-full object-cover" />
                </div>
                <div className="p-3.5 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/70">
                      {item.sub}
                    </span>
                    <span className="text-[10px] font-bold text-slate-600">{item.exp}</span>
                  </div>
                  <h3 className="font-heading font-bold text-xs text-slate-900 line-clamp-1">{item.name}</h3>
                  <div className="flex items-center text-slate-600 text-[11px] gap-1 pt-1">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>{item.area}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── OFFERS Preview ─────────────────────── */}
        <section className="flex flex-col gap-3 my-2">
          <div className="flex items-center justify-between">
            <h2 className="font-heading font-black text-base sm:text-lg text-slate-900 tracking-tight">
              Local Offer (சலுகைகள்)
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push("/shops")}
                className="text-xs font-bold text-[#1d4ed8] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>View all</span> <ChevronRight className="w-3.5 h-3.5 text-[#1d4ed8]" />
              </button>
            </div>
          </div>

          <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-2 scrollbar-none">
            {[
              { store: "GLEN Gallery", title: "Up to 60% OFF — Grand Sale", badge: "Valid till Aug 31", area: "New Bus Stand", img: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=400&auto=format&fit=crop" },
              { store: "Tanjore Degree Coffee", title: "Free Filter Coffee with Halwa", badge: "Valid till Aug 28", area: "South Rampart", img: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&auto=format&fit=crop" },
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
                  <div className="flex items-center text-slate-600 text-[10px] gap-1 mt-1">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>{item.area}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── High-Engagement Visual "Steps to Use Namma Thanjai" Section (Structured Human-Centric Geometry) ── */}
        <section className="bg-[#f59e0b] border border-[#d97706] text-slate-950 rounded-xl p-5 sm:p-8 flex flex-col gap-5 shadow-md my-4 font-sans">
          <div className="flex flex-col gap-1 max-w-xl">
            <span className="text-[10px] font-black uppercase tracking-wider text-white bg-slate-950 px-2.5 py-0.5 rounded-md w-fit border border-slate-900">
              3 EASY STEPS • 3 எளிய படிகள்
            </span>
            <h2 className="font-heading font-black text-lg sm:text-2xl text-slate-950 tracking-tight mt-1">
              How Namma Thanjai Works
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
            {/* Step 1 */}
            <div className="bg-white/95 border border-amber-300 p-4 sm:p-5 rounded-xl flex flex-col justify-between gap-3 group hover:border-slate-900 transition-all shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="w-8 h-8 rounded-lg bg-slate-950 text-white font-heading font-black text-sm flex items-center justify-center shadow-2xs">
                  01
                </span>
                <span className="text-[10px] font-extrabold text-amber-900 bg-amber-100/90 px-2 py-0.5 rounded-md border border-amber-300/80">
                  STEP 1
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="font-heading font-black text-sm text-slate-950">
                  Pick Segment <span className="text-amber-800 font-extrabold text-xs block mt-0.5">பிரிவைத் தேர்ந்தெடு</span>
                </h3>
                <p className="text-[11px] text-slate-700 font-medium">
                  Choose Sell, Need, Services, or Store Offers.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-white/95 border border-amber-300 p-4 sm:p-5 rounded-xl flex flex-col justify-between gap-3 group hover:border-slate-900 transition-all shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="w-8 h-8 rounded-lg bg-slate-950 text-white font-heading font-black text-sm flex items-center justify-center shadow-2xs">
                  02
                </span>
                <span className="text-[10px] font-extrabold text-amber-900 bg-amber-100/90 px-2 py-0.5 rounded-md border border-amber-300/80">
                  STEP 2
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="font-heading font-black text-sm text-slate-950">
                  Post or Browse <span className="text-amber-800 font-extrabold text-xs block mt-0.5">பதிவிடு / தேடு</span>
                </h3>
                <p className="text-[11px] text-slate-700 font-medium">
                  Post in 30s or browse verified local Tanjore listings.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-white/95 border border-amber-300 p-4 sm:p-5 rounded-xl flex flex-col justify-between gap-3 group hover:border-slate-900 transition-all shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="w-8 h-8 rounded-lg bg-slate-950 text-white font-heading font-black text-sm flex items-center justify-center shadow-2xs">
                  03
                </span>
                <span className="text-[10px] font-extrabold text-amber-900 bg-amber-100/90 px-2 py-0.5 rounded-md border border-amber-300/80">
                  STEP 3
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="font-heading font-black text-sm text-slate-950">
                  Direct Connect <span className="text-amber-800 font-extrabold text-xs block mt-0.5">நேரடி தொடர்பு</span>
                </h3>
                <p className="text-[11px] text-slate-700 font-medium">
                  Call or chat directly with Tanjore locals (0% brokerage).
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
