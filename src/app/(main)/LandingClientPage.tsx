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
        {/* ── Genuine Premium Hero Banner: What We Do in Thanjavur ── */}
        <section className="relative rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 shadow-md my-2">
          {/* Visual Hero Image Overlay */}
          <div className="absolute inset-0 z-0">
            <img
              src="https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=1200&auto=format&fit=crop"
              alt="Thanjavur Community Hub"
              className="w-full h-full object-cover opacity-25"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-amber-950/40" />
          </div>

          <div className="relative z-10 p-6 sm:p-10 flex flex-col gap-3.5 max-w-3xl">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wide bg-slate-900 text-amber-400 border border-slate-800 px-3 py-1 rounded-full shadow-2xs">
                WHAT WE DO • நம்ம தஞ்சாவூர்
              </span>
              <span className="text-xs text-amber-300 font-bold hidden sm:inline-block">
                0% Brokerage • Direct 1:1 Contact
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <h1 className="font-heading font-black text-2xl sm:text-4xl text-white tracking-tight leading-tight">
                Thanjavur&apos;s Direct Local Directory &amp; Marketplace
              </h1>
              <p className="font-heading font-extrabold text-sm sm:text-base text-amber-400 mt-0.5">
                தஞ்சாவூர் மக்களுக்கான நேரடி 4-இன்-1 தகவல் தளம்
              </p>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
              Connect directly with local owners, buyers, service experts, and shop offers across Tanjore with zero brokerage.
            </p>
          </div>
        </section>

        {/* ── 4 Segment Feature Cards (Compact 2x2 Grid on Mobile Web App & APK / 4x1 Single Row on Desktop) ── */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          {pillarCards.map((card) => {
            const IconComponent = card.icon;
            return (
              <div
                key={card.id}
                onClick={() => router.push(card.path)}
                className="bg-white rounded-xl sm:rounded-2xl border border-slate-200/90 p-3 sm:p-4 shadow-2xs hover:shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between gap-2.5 group cursor-pointer"
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-blue-50 border border-blue-200/80 flex items-center justify-center text-[#1d4ed8] group-hover:bg-[#1d4ed8] group-hover:text-white group-hover:border-[#1d4ed8] transition-colors shrink-0 shadow-2xs">
                      <IconComponent className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2]" />
                    </div>
                    <h2 className="font-heading font-black text-slate-900 text-xs sm:text-sm leading-tight line-clamp-1">
                      {card.title}
                    </h2>
                  </div>

                  <p className="text-[11px] sm:text-xs text-slate-600 font-medium leading-snug line-clamp-2">
                    {card.desc}
                  </p>

                  <div className="flex flex-wrap gap-1">
                    {card.categories.slice(0, 2).map((cat, i) => (
                      <span
                        key={i}
                        className="text-[10px] sm:text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/60 line-clamp-1"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(card.path);
                  }}
                  className="w-full btn-secondary text-[11px] sm:text-xs py-1.5 sm:py-2 rounded-lg flex items-center justify-center gap-1"
                >
                  <span>{card.btnText}</span>
                  <ChevronRight className="w-3.5 h-3.5 shrink-0 text-[#1d4ed8]" />
                </button>
              </div>
            );
          })}
        </section>

        {/* ── 1. SELL Segment Carousel (New Listings) ── */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
            <div className="flex items-center gap-2">
              <h2 className="font-heading font-extrabold text-base text-slate-900">
                Sell (விற்பனை)
              </h2>
              <span className="text-[10px] font-black uppercase tracking-wider bg-slate-900 text-white border border-slate-800 px-2.5 py-0.5 rounded-full shadow-2xs">
                New Listing
              </span>
            </div>
            <button
              onClick={() => router.push("/sell")}
              className="text-xs font-bold text-slate-700 hover:text-slate-900 flex items-center gap-1 hover:underline cursor-pointer"
            >
              View all <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
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
                  <div className="flex items-center text-slate-600 text-[11px] gap-1 pt-1">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>{item.area}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── 2. NEED Segment Carousel (New Listings) ── */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
            <div className="flex items-center gap-2">
              <h2 className="font-heading font-extrabold text-base text-slate-900">
                Need (தேவைகள்)
              </h2>
              <span className="text-[10px] font-black uppercase tracking-wider bg-slate-900 text-white border border-slate-800 px-2.5 py-0.5 rounded-full shadow-2xs">
                New Listing
              </span>
            </div>
            <button
              onClick={() => router.push("/need")}
              className="text-xs font-bold text-slate-700 hover:text-slate-900 flex items-center gap-1 hover:underline cursor-pointer"
            >
              View all <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            </button>
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

        {/* ── 3. SERVICES Segment Carousel (New Listings) ── */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
            <div className="flex items-center gap-2">
              <h2 className="font-heading font-extrabold text-base text-slate-900">
                Services (சேவைகள்)
              </h2>
              <span className="text-[10px] font-black uppercase tracking-wider bg-slate-900 text-white border border-slate-800 px-2.5 py-0.5 rounded-full shadow-2xs">
                New Listing
              </span>
            </div>
            <button
              onClick={() => router.push("/services")}
              className="text-xs font-bold text-slate-700 hover:text-slate-900 flex items-center gap-1 hover:underline cursor-pointer"
            >
              View all <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            </button>
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

        {/* ── 4. OFFERS Segment Carousel (New Listings) ── */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
            <div className="flex items-center gap-2">
              <h2 className="font-heading font-extrabold text-base text-slate-900">
                Offers (சலுகைகள்)
              </h2>
              <span className="text-[10px] font-black uppercase tracking-wider bg-slate-900 text-white border border-slate-800 px-2.5 py-0.5 rounded-full shadow-2xs">
                New Listing
              </span>
            </div>
            <button
              onClick={() => router.push("/shops")}
              className="text-xs font-bold text-slate-700 hover:text-slate-900 flex items-center gap-1 hover:underline cursor-pointer"
            >
              View all <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
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
                  <div className="flex items-center text-slate-600 text-[10px] gap-1 mt-1">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>{item.area}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── High-Engagement Visual "Steps to Use Namma Thanjai" Section (Redesigned Light Surface) ── */}
        <section className="bg-white border border-slate-200/90 text-slate-900 rounded-2xl p-5 sm:p-8 flex flex-col gap-5 shadow-xs my-4 font-sans">
          <div className="flex flex-col gap-1 max-w-xl">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#1d4ed8] bg-blue-50 px-2.5 py-0.5 rounded-md w-fit border border-blue-200">
              3 EASY STEPS • 3 எளிய படிகள்
            </span>
            <h2 className="font-heading font-black text-lg sm:text-2xl text-slate-900 tracking-tight mt-1">
              How Namma Thanjai Works
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
            {/* Step 1 */}
            <div className="bg-slate-50 border border-slate-200/80 p-4 sm:p-5 rounded-xl flex flex-col justify-between gap-3 group hover:border-[#1d4ed8]/50 transition-all">
              <div className="flex items-center justify-between">
                <span className="w-8 h-8 rounded-lg bg-[#1d4ed8] text-white font-heading font-black text-sm flex items-center justify-center shadow-2xs">
                  01
                </span>
                <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                  STEP 1
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="font-heading font-black text-sm text-slate-900">
                  Pick Segment <span className="text-[#1d4ed8] font-extrabold text-xs block mt-0.5">பிரிவைத் தேர்ந்தெடு</span>
                </h3>
                <p className="text-[11px] text-slate-600 font-medium">
                  Choose Sell, Need, Services, or Store Offers.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-slate-50 border border-slate-200/80 p-4 sm:p-5 rounded-xl flex flex-col justify-between gap-3 group hover:border-[#1d4ed8]/50 transition-all">
              <div className="flex items-center justify-between">
                <span className="w-8 h-8 rounded-lg bg-[#1d4ed8] text-white font-heading font-black text-sm flex items-center justify-center shadow-2xs">
                  02
                </span>
                <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                  STEP 2
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="font-heading font-black text-sm text-slate-900">
                  Post or Browse <span className="text-[#1d4ed8] font-extrabold text-xs block mt-0.5">பதிவிடு / தேடு</span>
                </h3>
                <p className="text-[11px] text-slate-600 font-medium">
                  Post in 30s or browse verified local Tanjore listings.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-slate-50 border border-slate-200/80 p-4 sm:p-5 rounded-xl flex flex-col justify-between gap-3 group hover:border-[#1d4ed8]/50 transition-all">
              <div className="flex items-center justify-between">
                <span className="w-8 h-8 rounded-lg bg-[#1d4ed8] text-white font-heading font-black text-sm flex items-center justify-center shadow-2xs">
                  03
                </span>
                <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                  STEP 3
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="font-heading font-black text-sm text-slate-900">
                  Direct Connect <span className="text-[#1d4ed8] font-extrabold text-xs block mt-0.5">நேரடி தொடர்பு</span>
                </h3>
                <p className="text-[11px] text-slate-600 font-medium">
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
