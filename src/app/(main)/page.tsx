"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { 
  Building, 
  Wrench, 
  Store, 
  Tag, 
  ArrowRight,
  Sparkles,
  MapPin,
  ChevronRight,
  Flame,
  Award,
  Compass,
  Home,
  Car,
  Tv,
  Zap,
  Droplet,
  Wind,
  Hammer,
  Utensils,
  ShoppingBag,
  Shirt
} from "lucide-react";
import Image from "next/image";
import RobotHero from "@/components/ui/robot-hero";
import { AnimatePresence, motion } from "framer-motion";

export default function HomeLandingPage() {
  const router = useRouter();
  const { profile } = useAuth();
  
  // 3 Segment State on Home Page
  const [activeHomeSegment, setActiveHomeSegment] = React.useState<"classifieds" | "services" | "shops">("classifieds");

  const handleCategoryClick = (targetPath: string) => {
    router.push(targetPath);
  };

  // Live Alert Ticker Carousel State
  const [activeAlertIdx, setActiveAlertIdx] = React.useState(0);
  const alerts = [
    "🔥 Lands & Plots recently listed in West Main St, Thanjavur",
    "🛠️ Murugan Painters got 4.9 star feedback in Tanjore Town",
    "🏷️ Cafe Thanjai updated their special discount offer validity",
    "⚡ Electrician Senthil is active now near Big Temple",
    "📈 12 new local members joined Namma Thanjai today!"
  ];

  React.useEffect(() => {
    const interval = setInterval(() => {
      setActiveAlertIdx((prev) => (prev + 1) % alerts.length);
    }, 3200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full flex flex-col bg-white text-slate-800 min-h-screen font-sans">
      
      {/* ==========================================
          DYNAMIC HOME PAGE SEGMENT EXPLORER
          ========================================== */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6 animate-fade-in">
        
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-yellow-500/10 via-amber-500/10 to-yellow-500/10 border border-yellow-500/30 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-yellow-500 text-slate-955 flex items-center justify-center font-heading font-black text-xl shadow-sm border border-yellow-400">
              {profile?.displayName?.charAt(0).toUpperCase() || "N"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-heading font-black text-xl text-slate-900">
                  {profile?.isVerified ? `Welcome, ${profile.displayName || "Resident"}` : "Namma Thanjavur Directory"}
                </h1>
                {profile?.isVerified ? (
                  <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-700 border border-emerald-500/30 px-2 py-0.5 rounded-md flex items-center gap-1">
                    ✓ Verified
                  </span>
                ) : (
                  <span className="text-[9px] font-black uppercase tracking-wider bg-yellow-500/20 text-yellow-800 border border-yellow-500/30 px-2 py-0.5 rounded-md">
                    Community Portal
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 mt-0.5 font-semibold">
                Explore local requirements, helper trades, and shop offers across Tanjore.
              </p>
            </div>
          </div>

            {/* Quick Post Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  if (!profile?.isVerified) {
                    router.push("/?auth=popup");
                  } else {
                    router.push("/classifieds?create=true");
                  }
                }}
                className="bg-yellow-500 hover:bg-yellow-600 active:scale-95 text-slate-955 font-black px-4 py-2.5 rounded-xl text-xs transition-all shadow-xs cursor-pointer border border-yellow-450"
              >
                + Post Ad
              </button>
              <button
                onClick={() => {
                  if (!profile?.isVerified) {
                    router.push("/?auth=popup");
                  } else {
                    router.push("/services?create=true");
                  }
                }}
                className="bg-slate-900 hover:bg-slate-800 text-white font-black px-4 py-2.5 rounded-xl text-xs transition-all shadow-xs cursor-pointer"
              >
                + Post Service
              </button>
              <button
                onClick={() => {
                  if (!profile?.isVerified) {
                    router.push("/?auth=popup");
                  } else {
                    router.push("/shops?create=true");
                  }
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-4 py-2.5 rounded-xl text-xs transition-all shadow-xs cursor-pointer"
              >
                + Post Offer
              </button>
            </div>
        </div>

        {/* 3 SEGMENT TABS BAR FOR HOME EXPLORATION */}
        <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-2xs">
          <button
            onClick={() => setActiveHomeSegment("classifieds")}
            className={`flex-1 py-3 text-center rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeHomeSegment === "classifieds"
                ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Building className="w-4 h-4 text-yellow-600" />
            <span>1. Buy & Sell</span>
          </button>
          <button
            onClick={() => setActiveHomeSegment("services")}
            className={`flex-1 py-3 text-center rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeHomeSegment === "services"
                ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Wrench className="w-4 h-4 text-yellow-600" />
            <span>2. Helper Trades</span>
          </button>
          <button
            onClick={() => setActiveHomeSegment("shops")}
            className={`flex-1 py-3 text-center rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeHomeSegment === "shops"
                ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Store className="w-4 h-4 text-yellow-600" />
            <span>3. Shop Offers</span>
          </button>
        </div>

        {/* DYNAMIC SEGMENT CONTENT FEED */}
        <div className="w-full flex flex-col gap-5 mt-2">
          {activeHomeSegment === "classifieds" && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-heading font-black text-lg text-slate-900">
                    📢 Buy & Sell Classifieds Channel
                  </h3>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">
                    Real Estate, House Rentals, Used Vehicles & Electronics in Tanjore
                  </p>
                </div>
                <button
                  onClick={() => router.push("/classifieds")}
                  className="bg-yellow-500 hover:bg-yellow-600 text-slate-955 font-black px-4 py-2 rounded-xl text-xs flex items-center gap-1"
                >
                  <span>Explore All Ads</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Sample Cards preview for classifieds */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase text-yellow-750 bg-yellow-500/10 px-2 py-0.5 rounded-md">Real Estate</span>
                    <span className="text-xs font-black text-slate-900">₹45,00,000</span>
                  </div>
                  <h4 className="font-black text-sm text-slate-800">2 Acre Agricultural Plot near Vallam</h4>
                  <p className="text-xs text-slate-500 font-semibold">Clear titles, tar road access, Kaveri water line available.</p>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-200 text-[11px] font-bold text-slate-500">
                    <span>📍 Vallam, Thanjavur</span>
                    <button onClick={() => router.push("/classifieds")} className="text-yellow-600 font-black">Contact Poster →</button>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase text-blue-750 bg-blue-500/10 px-2 py-0.5 rounded-md">House Rental</span>
                    <span className="text-xs font-black text-slate-900">₹12,500/mo</span>
                  </div>
                  <h4 className="font-black text-sm text-slate-800">Spacious 2 BHK Independent House</h4>
                  <p className="text-xs text-slate-500 font-semibold">Modular kitchen, 2 bathrooms, 24/7 water supply, car parking.</p>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-200 text-[11px] font-bold text-slate-500">
                    <span>📍 Medical College Rd, Tanjore</span>
                    <button onClick={() => router.push("/classifieds")} className="text-yellow-600 font-black">Contact Poster →</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeHomeSegment === "services" && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-heading font-black text-lg text-slate-900">
                    🛠️ Helper Trades & Local Services Channel
                  </h3>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">
                    Verified Electricians, Plumbers, Mechanics, Painters in Tanjore
                  </p>
                </div>
                <button
                  onClick={() => router.push("/services")}
                  className="bg-yellow-500 hover:bg-yellow-600 text-slate-955 font-black px-4 py-2 rounded-xl text-xs flex items-center gap-1"
                >
                  <span>Explore All Services</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Sample Cards preview for services */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase text-amber-750 bg-amber-500/10 px-2 py-0.5 rounded-md">Electrician</span>
                    <span className="text-xs font-black text-emerald-600">★ 4.9 Rating</span>
                  </div>
                  <h4 className="font-black text-sm text-slate-800">Senthil Kumar - Home Electrician</h4>
                  <p className="text-xs text-slate-500 font-semibold">8+ Years Experience. House wiring, DB box, inverter assembly & repairs.</p>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-200 text-[11px] font-bold text-slate-500">
                    <span>📍 Tanjore Town</span>
                    <button onClick={() => router.push("/services")} className="text-yellow-600 font-black">Hire Technician →</button>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase text-blue-750 bg-blue-500/10 px-2 py-0.5 rounded-md">Plumber</span>
                    <span className="text-xs font-black text-emerald-600">★ 4.8 Rating</span>
                  </div>
                  <h4 className="font-black text-sm text-slate-800">Rajesh K - Expert Plumber</h4>
                  <p className="text-xs text-slate-500 font-semibold">Pipe fitting, water tank washing, Kaveri water connections & repairs.</p>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-200 text-[11px] font-bold text-slate-500">
                    <span>📍 Medical College Rd</span>
                    <button onClick={() => router.push("/services")} className="text-yellow-600 font-black">Hire Technician →</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeHomeSegment === "shops" && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-heading font-black text-lg text-slate-900">
                    🏪 Shop Directory & Recent Offers Channel
                  </h3>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">
                    Store Promotions, Discount Deals & Video Reels in Tanjore
                  </p>
                </div>
                <button
                  onClick={() => router.push("/shops")}
                  className="bg-yellow-500 hover:bg-yellow-600 text-slate-955 font-black px-4 py-2 rounded-xl text-xs flex items-center gap-1"
                >
                  <span>Explore All Offers</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Sample Cards preview for shops */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase text-yellow-750 bg-yellow-500/10 px-2 py-0.5 rounded-md">Degree Coffee</span>
                    <span className="text-xs font-black text-amber-600">🎬 Reel Offer</span>
                  </div>
                  <h4 className="font-black text-sm text-slate-800">Famous Tanjore Degree Coffee Deal</h4>
                  <p className="text-xs text-slate-500 font-semibold">Buy 1 Ghee Roast & Get 1 Free Degree Coffee between 4 PM to 7 PM.</p>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-200 text-[11px] font-bold text-slate-500">
                    <span>📍 Near Big Temple</span>
                    <button onClick={() => router.push("/shops")} className="text-yellow-600 font-black">View Offer Reel →</button>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase text-purple-750 bg-purple-500/10 px-2 py-0.5 rounded-md">Textile Silk</span>
                    <span className="text-xs font-black text-purple-600">Flat 20% Off</span>
                  </div>
                  <h4 className="font-black text-sm text-slate-800">Tanjore Handloom Silk Saree Sale</h4>
                  <p className="text-xs text-slate-500 font-semibold">20% direct discount on pure Tanjore handloom silk sarees this week.</p>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-200 text-[11px] font-bold text-slate-500">
                    <span>📍 South Rampart Rd</span>
                    <button onClick={() => router.push("/shops")} className="text-yellow-600 font-black">View Offer Reel →</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ==========================================
          PORTAL CONTENT: DIRECTORY SEGMENT LINKS Noticeboard
          ========================================== */}
      <div id="noticeboard-directory" className="flex w-full max-w-7xl mx-auto px-5 md:px-6 py-8 flex-col gap-8 bg-white">

        {/* Section Heading & Branding Emblem */}
        <div className="flex flex-col items-center text-center gap-4 max-w-xl mx-auto">
          <div className="w-16 h-16 rounded-full bg-yellow-50 border border-yellow-250 flex items-center justify-center overflow-hidden shrink-0 shadow-sm animate-pulse-slow">
            <Image 
              src="/thanjavur_temple_illustration.png" 
              alt="namma thanjai logo" 
              width={50}
              height={50}
              className="object-contain" 
            />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-yellow-600 bg-yellow-55 border border-yellow-200/60 px-3.5 py-1 rounded-full">
              Thanjavur noticeboard
            </span>
            <h2 className="font-heading font-black text-2xl md:text-3xl text-slate-900 tracking-tight leading-tight mt-3.5">
              Explore Local noticeboard Channels
            </h2>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed font-semibold">
              Tap any sub-category tile below to enter the channel noticeboard, search active listings, or publish your own ad.
            </p>
          </div>
        </div>

        {/* Categories Noticeboard Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-4">
          
          {/* ==================== BUY & SELL ==================== */}
          <div className="bg-white border border-slate-200/60 rounded-3xl p-6 flex flex-col justify-between gap-6 hover:shadow-md transition-shadow duration-300">
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-3 pb-3.5 border-b border-slate-100">
                <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-150 flex items-center justify-center text-slate-700 shrink-0">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-black text-slate-900 block font-heading">Buy & Sell Ads</span>
                  <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Classifieds</span>
                </div>
              </div>

              {/* 2x2 Grid of Tiles */}
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => handleCategoryClick("/classifieds?category=Plot%20%2f%20Real%20Estate")}
                  className="flex flex-col gap-2 items-start bg-slate-50/70 hover:bg-slate-100/50 border border-slate-200/40 hover:border-slate-300 rounded-2xl p-3.5 transition-all hover:scale-[1.02] duration-200 group text-left cursor-pointer font-bold"
                >
                  <div className="w-7 h-7 rounded-lg bg-white border border-slate-100 shadow-3xs flex items-center justify-center text-slate-500 group-hover:text-slate-900 group-hover:border-slate-200 transition-colors">
                    <Compass className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-slate-800 block">Lands & Plots</span>
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block mt-0.5">Real Estate</span>
                  </div>
                </button>

                <button 
                  onClick={() => handleCategoryClick("/classifieds?category=Property%20Rental")}
                  className="flex flex-col gap-2 items-start bg-slate-50/70 hover:bg-slate-100/50 border border-slate-200/40 hover:border-slate-300 rounded-2xl p-3.5 transition-all hover:scale-[1.02] duration-200 group text-left cursor-pointer font-bold"
                >
                  <div className="w-7 h-7 rounded-lg bg-white border border-slate-100 shadow-3xs flex items-center justify-center text-slate-500 group-hover:text-slate-900 group-hover:border-slate-200 transition-colors">
                    <Home className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-slate-800 block">House Rentals</span>
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block mt-0.5">Rentals</span>
                  </div>
                </button>

                <button 
                  onClick={() => handleCategoryClick("/classifieds?category=Motor%20Vehicle")}
                  className="flex flex-col gap-2 items-start bg-slate-50/70 hover:bg-slate-100/50 border border-slate-200/40 hover:border-slate-300 rounded-2xl p-3.5 transition-all hover:scale-[1.02] duration-200 group text-left cursor-pointer font-bold"
                >
                  <div className="w-7 h-7 rounded-lg bg-white border border-slate-100 shadow-3xs flex items-center justify-center text-slate-500 group-hover:text-slate-900 group-hover:border-slate-200 transition-colors">
                    <Car className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-slate-800 block">Used Motors</span>
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block mt-0.5">Vehicles</span>
                  </div>
                </button>

                <button 
                  onClick={() => handleCategoryClick("/classifieds?category=Electronics")}
                  className="flex flex-col gap-2 items-start bg-slate-50/70 hover:bg-slate-100/50 border border-slate-200/40 hover:border-slate-300 rounded-2xl p-3.5 transition-all hover:scale-[1.02] duration-200 group text-left cursor-pointer font-bold"
                >
                  <div className="w-7 h-7 rounded-lg bg-white border border-slate-100 shadow-3xs flex items-center justify-center text-slate-500 group-hover:text-slate-900 group-hover:border-slate-200 transition-colors">
                    <Tv className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-slate-800 block">Appliances</span>
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block mt-0.5">Electronics</span>
                  </div>
                </button>
              </div>
            </div>
            
            <button
              onClick={() => handleCategoryClick("/classifieds")}
              className="w-full bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl py-3 text-center text-[10px] font-black text-slate-700 hover:text-slate-900 uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] cursor-pointer font-bold"
            >
              <span>View Noticeboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* ==================== SERVICES ==================== */}
          <div className="bg-white border border-slate-200/60 rounded-3xl p-6 flex flex-col justify-between gap-6 hover:shadow-md transition-shadow duration-300">
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-3 pb-3.5 border-b border-slate-100">
                <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-150 flex items-center justify-center text-slate-700 shrink-0">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-black text-slate-900 block font-heading">Helper Trades</span>
                  <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Local Services</span>
                </div>
              </div>

              {/* 2x2 Grid of Tiles */}
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => handleCategoryClick("/services?category=Electrician")}
                  className="flex flex-col gap-2 items-start bg-slate-50/70 hover:bg-slate-100/50 border border-slate-200/40 hover:border-slate-300 rounded-2xl p-3.5 transition-all hover:scale-[1.02] duration-200 group text-left cursor-pointer font-bold"
                >
                  <div className="w-7 h-7 rounded-lg bg-white border border-slate-100 shadow-3xs flex items-center justify-center text-slate-500 group-hover:text-slate-900 group-hover:border-slate-200 transition-colors">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-slate-800 block">Electricians</span>
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block mt-0.5">Wiring</span>
                  </div>
                </button>

                <button 
                  onClick={() => handleCategoryClick("/services?category=Plumber")}
                  className="flex flex-col gap-2 items-start bg-slate-50/70 hover:bg-slate-100/50 border border-slate-200/40 hover:border-slate-300 rounded-2xl p-3.5 transition-all hover:scale-[1.02] duration-200 group text-left cursor-pointer font-bold"
                >
                  <div className="w-7 h-7 rounded-lg bg-white border border-slate-100 shadow-3xs flex items-center justify-center text-slate-500 group-hover:text-slate-900 group-hover:border-slate-200 transition-colors">
                    <Droplet className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-slate-800 block">Plumbers</span>
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block mt-0.5">Pipes</span>
                  </div>
                </button>

                <button 
                  onClick={() => handleCategoryClick("/services?category=AC%20%26%20Refrigeration")}
                  className="flex flex-col gap-2 items-start bg-slate-50/70 hover:bg-slate-100/50 border border-slate-200/40 hover:border-slate-300 rounded-2xl p-3.5 transition-all hover:scale-[1.02] duration-200 group text-left cursor-pointer font-bold"
                >
                  <div className="w-7 h-7 rounded-lg bg-white border border-slate-100 shadow-3xs flex items-center justify-center text-slate-500 group-hover:text-slate-900 group-hover:border-slate-200 transition-colors">
                    <Wind className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-slate-800 block">AC Mechanics</span>
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block mt-0.5">Cooling</span>
                  </div>
                </button>

                <button 
                  onClick={() => handleCategoryClick("/services?category=Carpenter")}
                  className="flex flex-col gap-2 items-start bg-slate-50/70 hover:bg-slate-100/50 border border-slate-200/40 hover:border-slate-300 rounded-2xl p-3.5 transition-all hover:scale-[1.02] duration-200 group text-left cursor-pointer font-bold"
                >
                  <div className="w-7 h-7 rounded-lg bg-white border border-slate-100 shadow-3xs flex items-center justify-center text-slate-500 group-hover:text-slate-900 group-hover:border-slate-200 transition-colors">
                    <Hammer className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-slate-800 block">Carpenters</span>
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block mt-0.5">Woodworks</span>
                  </div>
                </button>
              </div>
            </div>

            <button
              onClick={() => handleCategoryClick("/services")}
              className="w-full bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl py-3 text-center text-[10px] font-black text-slate-700 hover:text-slate-900 uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] cursor-pointer font-bold"
            >
              <span>View Noticeboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* ==================== SHOPS & OFFERS ==================== */}
          <div className="bg-white border border-slate-200/60 rounded-3xl p-6 flex flex-col justify-between gap-6 hover:shadow-md transition-shadow duration-300">
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-3 pb-3.5 border-b border-slate-100">
                <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-150 flex items-center justify-center text-slate-700 shrink-0">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-black text-slate-900 block font-heading">Recent Offer</span>
                  <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Deals & Video Reels</span>
                </div>
              </div>

              {/* 2x2 Grid of Tiles */}
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => handleCategoryClick("/shops?category=Cafe%20%26%20Restaurant")}
                  className="flex flex-col gap-2 items-start bg-slate-50/70 hover:bg-slate-100/50 border border-slate-200/40 hover:border-slate-300 rounded-2xl p-3.5 transition-all hover:scale-[1.02] duration-200 group text-left cursor-pointer font-bold"
                >
                  <div className="w-7 h-7 rounded-lg bg-white border border-slate-100 shadow-3xs flex items-center justify-center text-slate-500 group-hover:text-slate-900 group-hover:border-slate-200 transition-colors">
                    <Utensils className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-slate-800 block">Cafes & Hotels</span>
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block mt-0.5">Dining</span>
                  </div>
                </button>

                <button 
                  onClick={() => handleCategoryClick("/shops?category=Supermarket%20%26%20Grocery")}
                  className="flex flex-col gap-2 items-start bg-slate-50/70 hover:bg-slate-100/50 border border-slate-200/40 hover:border-slate-300 rounded-2xl p-3.5 transition-all hover:scale-[1.02] duration-200 group text-left cursor-pointer font-bold"
                >
                  <div className="w-7 h-7 rounded-lg bg-white border border-slate-100 shadow-3xs flex items-center justify-center text-slate-500 group-hover:text-slate-900 group-hover:border-slate-200 transition-colors">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-slate-800 block">Supermarkets</span>
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block mt-0.5">Groceries</span>
                  </div>
                </button>

                <button 
                  onClick={() => handleCategoryClick("/shops?category=Textiles%20%26%20Clothing")}
                  className="flex flex-col gap-2 items-start bg-slate-50/70 hover:bg-slate-100/50 border border-slate-200/40 hover:border-slate-300 rounded-2xl p-3.5 transition-all hover:scale-[1.02] duration-200 group text-left cursor-pointer font-bold"
                >
                  <div className="w-7 h-7 rounded-lg bg-white border border-slate-100 shadow-3xs flex items-center justify-center text-slate-500 group-hover:text-slate-900 group-hover:border-slate-200 transition-colors">
                    <Shirt className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-slate-800 block">Textiles</span>
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block mt-0.5">Fashion</span>
                  </div>
                </button>

                <button 
                  onClick={() => handleCategoryClick("/shops?category=Jewelry%20Showroom")}
                  className="flex flex-col gap-2 items-start bg-slate-50/70 hover:bg-slate-100/50 border border-slate-200/40 hover:border-slate-300 rounded-2xl p-3.5 transition-all hover:scale-[1.02] duration-200 group text-left cursor-pointer font-bold"
                >
                  <div className="w-7 h-7 rounded-lg bg-white border border-slate-100 shadow-3xs flex items-center justify-center text-slate-500 group-hover:text-slate-900 group-hover:border-slate-200 transition-colors">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-slate-800 block">Gold Jewelry</span>
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block mt-0.5">Showroom</span>
                  </div>
                </button>
              </div>
            </div>

            <button
              onClick={() => handleCategoryClick("/shops")}
              className="w-full bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl py-3 text-center text-[10px] font-black text-slate-700 hover:text-slate-900 uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] cursor-pointer font-bold"
            >
              <span>View Noticeboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

        {/* ==========================================
            HOW IT WORKS SECTION: AI PIPELINE
            ========================================== */}
        <div className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 flex flex-col gap-8 shadow-xl mt-8 text-left relative overflow-hidden select-none">
          <div className="absolute top-0 right-0 w-44 h-44 rounded-full bg-yellow-500/5 blur-3xl pointer-events-none" />
          
          <div className="flex flex-col gap-1 max-w-sm">
            <span className="text-[9px] font-black uppercase tracking-widest text-yellow-500 bg-yellow-500/10 border border-yellow-500/25 px-2.5 py-0.5 rounded-full w-fit">
              ✨ Simple Guide
            </span>
            <h3 className="font-heading font-black text-xl text-white tracking-tight leading-tight mt-2.5">
              How to Post on Namma Thanjai
            </h3>
            <p className="text-[11px] text-slate-400 mt-1 leading-normal font-semibold">
              Publish your ads, listing cards, or trade jobs in under a minute using our built-in AI pipeline.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6.5">
            {/* Step 1 */}
            <div className="flex gap-4 items-start bg-slate-800/40 border border-slate-700/40 rounded-2xl p-4.5">
              <div className="w-10 h-10 rounded-xl bg-yellow-500/15 border border-yellow-500/30 flex items-center justify-center font-black text-yellow-500 text-sm shrink-0">
                1
              </div>
              <div>
                <h4 className="font-black text-xs text-white uppercase tracking-wider">Scan or Type</h4>
                <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                  Take a picture of your business visiting card/signboard to parse details automatically, or fill out the listing form manually.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-4 items-start bg-slate-800/40 border border-slate-700/40 rounded-2xl p-4.5">
              <div className="w-10 h-10 rounded-xl bg-yellow-500/15 border border-yellow-500/30 flex items-center justify-center font-black text-yellow-500 text-sm shrink-0">
                2
              </div>
              <div>
                <h4 className="font-black text-xs text-white uppercase tracking-wider">Refine with AI</h4>
                <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                  Use our integrated Gemini AI formatting tools to immediately polish, structure, and optimize your listings for maximum readability.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-4 items-start bg-slate-800/40 border border-slate-700/40 rounded-2xl p-4.5">
              <div className="w-10 h-10 rounded-xl bg-yellow-500/15 border border-yellow-500/30 flex items-center justify-center font-black text-yellow-500 text-sm shrink-0">
                3
              </div>
              <div>
                <h4 className="font-black text-xs text-white uppercase tracking-wider">Verified Share</h4>
                <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                  Complete a quick, free WhatsApp OTP check to activate your listing permanently. Share deals with clients instantly.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-[10px] text-slate-400 font-bold flex gap-4 pt-4 border-t border-slate-200">
          <span>&copy; {new Date().getFullYear()} namma thanjai</span>
          <button onClick={() => router.push("/profile")} className="hover:text-slate-600 transition-colors">Profile Control</button>
        </footer>
      </div>

    </div>
  );
}
