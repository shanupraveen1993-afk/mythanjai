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

  const handleAuthModalOpen = () => {
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("auth", "popup");
      router.push(url.pathname + url.search);
    }
  };
  
  // Live Alert Ticker Carousel State
  const [activeAlertIdx, setActiveAlertIdx] = React.useState(0);
  const alerts = [
    "Lands & Plots recently listed in West Main St, Thanjavur",
    "Murugan Painters received 4.9 star feedback in Tanjore Town",
    "Cafe Thanjai updated their special discount offer validity",
    "Electrician Senthil is active now near Big Temple",
    "12 new local members joined Namma Thanjavur today!"
  ];

  React.useEffect(() => {
    const interval = setInterval(() => {
      setActiveAlertIdx((prev) => (prev + 1) % alerts.length);
    }, 3200);
    return () => clearInterval(interval);
  }, []);

  const handleCategoryClick = (targetPath: string) => {
    router.push(targetPath);
  };

  return (
    <div className="w-full flex flex-col bg-white text-slate-800 min-h-screen font-sans">
      
      {/* ==========================================
          LOGGED IN HOME PAGE DASHBOARD (PAGE 1)
          ========================================== */}
      {profile?.isVerified ? (
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 mt-4 md:mt-6 pt-2 pb-12 flex flex-col gap-8 animate-fade-in">
          
          {/* 1. COMBINED FEATURED & POPULAR LISTINGS FEED */}
          
          {/* SECTION A: BUY & SELL POPULAR LISTINGS */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Building className="w-5 h-5 text-yellow-600" />
                <h2 className="font-heading font-black text-base text-slate-900">
                  Popular Buy & Sell Deals
                </h2>
              </div>
              <button
                onClick={() => router.push("/classifieds")}
                className="text-xs font-black text-yellow-600 hover:text-yellow-750 flex items-center gap-1 hover:underline cursor-pointer"
              >
                <span>View All Buy & Sell Ads →</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Card 1 */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-col gap-3 hover:shadow-md transition-shadow">
                <div className="w-full h-36 rounded-xl overflow-hidden bg-slate-100 relative">
                  <Image 
                    src="/thanjavur_temple_illustration.png" 
                    alt="2 Acre Land Plot" 
                    fill 
                    className="object-cover hover:scale-105 transition-transform duration-300"
                  />
                  <span className="absolute top-2 left-2 text-[9px] font-black uppercase text-yellow-950 bg-yellow-400 px-2 py-0.5 rounded-md shadow-xs">
                    Real Estate
                  </span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <h3 className="font-heading font-extrabold text-sm text-slate-800">
                    2 Acre Plot near Vallam
                  </h3>
                  <span className="text-xs font-black text-slate-900">₹45,00,000</span>
                </div>
                <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                  Clear titles, tar road access, Kaveri water line available near Vallam Bus Stand.
                </p>
                <div className="flex justify-between items-center pt-2.5 border-t border-slate-100 text-[11px] font-bold text-slate-500">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>Vallam, Thanjavur</span>
                  </div>
                  <button onClick={handleAuthModalOpen} className="text-yellow-600 font-black hover:underline cursor-pointer">
                    Details →
                  </button>
                </div>
              </div>

              {/* Card 2 */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-col gap-3 hover:shadow-md transition-shadow">
                <div className="w-full h-36 rounded-xl overflow-hidden bg-slate-100 relative">
                  <Image 
                    src="/hero_building_visual.png" 
                    alt="2 BHK Independent House" 
                    fill 
                    className="object-cover hover:scale-105 transition-transform duration-300"
                  />
                  <span className="absolute top-2 left-2 text-[9px] font-black uppercase text-blue-950 bg-blue-400 px-2 py-0.5 rounded-md shadow-xs">
                    House Rental
                  </span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <h3 className="font-heading font-extrabold text-sm text-slate-800">
                    2 BHK Independent House
                  </h3>
                  <span className="text-xs font-black text-slate-900">₹12,500/mo</span>
                </div>
                <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                  Modular kitchen, 2 bathrooms, 24/7 Kaveri water supply, dedicated car parking.
                </p>
                <div className="flex justify-between items-center pt-2.5 border-t border-slate-100 text-[11px] font-bold text-slate-500">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>Medical College Rd</span>
                  </div>
                  <button onClick={handleAuthModalOpen} className="text-yellow-600 font-black hover:underline cursor-pointer">
                    Details →
                  </button>
                </div>
              </div>

              {/* Card 3 */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-col gap-3 hover:shadow-md transition-shadow">
                <div className="w-full h-36 rounded-xl overflow-hidden bg-slate-100 relative">
                  <Image 
                    src="/namma_thanjai_logo.png" 
                    alt="Hero Splendor Motor" 
                    fill 
                    className="object-contain p-4 hover:scale-105 transition-transform duration-300 bg-slate-50"
                  />
                  <span className="absolute top-2 left-2 text-[9px] font-black uppercase text-emerald-950 bg-emerald-400 px-2 py-0.5 rounded-md shadow-xs">
                    Used Motor
                  </span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <h3 className="font-heading font-extrabold text-sm text-slate-800">
                    Hero Splendor (2022 Model)
                  </h3>
                  <span className="text-xs font-black text-slate-900">₹68,000</span>
                </div>
                <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                  Single owner, excellent mileage 65+ kmpl, clean insurance documents.
                </p>
                <div className="flex justify-between items-center pt-2.5 border-t border-slate-100 text-[11px] font-bold text-slate-500">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>New Bus Stand</span>
                  </div>
                  <button onClick={handleAuthModalOpen} className="text-yellow-600 font-black hover:underline cursor-pointer">
                    Details →
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION B: TOP RATED HELPER TECHNICIANS */}
          <div className="flex flex-col gap-4 mt-2">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-yellow-600" />
                <h2 className="font-heading font-black text-base text-slate-900">
                  Top-Rated Helper Technicians
                </h2>
              </div>
              <button
                onClick={handleAuthModalOpen}
                className="text-xs font-black text-yellow-600 hover:text-yellow-750 flex items-center gap-1 hover:underline cursor-pointer"
              >
                <span>View All Services →</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Tech 1 */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-col gap-3 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-black uppercase text-amber-750 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-200">
                    Electrician
                  </span>
                  <span className="text-xs font-black text-emerald-600">Rating: 4.9</span>
                </div>
                <h3 className="font-heading font-extrabold text-sm text-slate-800">
                  Senthil Kumar - Home Electrician
                </h3>
                <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                  8+ Years Experience. House wiring, DB box, inverter assembly & quick repairs.
                </p>
                <div className="flex justify-between items-center pt-2.5 border-t border-slate-100 text-[11px] font-bold text-slate-500">
                  <span>Tanjore Town</span>
                  <button onClick={handleAuthModalOpen} className="text-yellow-600 font-black hover:underline cursor-pointer">
                    Hire Technician →
                  </button>
                </div>
              </div>

              {/* Tech 2 */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-col gap-3 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-black uppercase text-blue-750 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-200">
                    Plumber
                  </span>
                  <span className="text-xs font-black text-emerald-600">Rating: 4.8</span>
                </div>
                <h3 className="font-heading font-extrabold text-sm text-slate-800">
                  Rajesh K - Expert Plumber
                </h3>
                <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                  Pipe fitting, water tank washing, Kaveri line tap connections & leak fixes.
                </p>
                <div className="flex justify-between items-center pt-2.5 border-t border-slate-100 text-[11px] font-bold text-slate-500">
                  <span>Medical College Rd</span>
                  <button onClick={handleAuthModalOpen} className="text-yellow-600 font-black hover:underline cursor-pointer">
                    Hire Technician →
                  </button>
                </div>
              </div>

              {/* Tech 3 */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-col gap-3 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-black uppercase text-purple-750 bg-purple-500/10 px-2 py-0.5 rounded-md border border-purple-200">
                    Carpenter
                  </span>
                  <span className="text-xs font-black text-emerald-600">Rating: 5.0</span>
                </div>
                <h3 className="font-heading font-extrabold text-sm text-slate-800">
                  Venu Gopal - Wood Architect
                </h3>
                <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                  Modular kitchen woodworks, door laminations, locks repairs & bespoke furniture.
                </p>
                <div className="flex justify-between items-center pt-2.5 border-t border-slate-100 text-[11px] font-bold text-slate-500">
                  <span>South Rampart Rd</span>
                  <button onClick={handleAuthModalOpen} className="text-yellow-600 font-black hover:underline cursor-pointer">
                    Hire Technician →
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION C: RECENT SHOP OFFERS & VIDEO REELS */}
          <div className="flex flex-col gap-4 mt-2">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Store className="w-5 h-5 text-yellow-600" />
                <h2 className="font-heading font-black text-base text-slate-900">
                  Recent Shop Offers & Video Reels
                </h2>
              </div>
              <button
                onClick={handleAuthModalOpen}
                className="text-xs font-black text-yellow-600 hover:text-yellow-750 flex items-center gap-1 hover:underline cursor-pointer"
              >
                <span>View All Offers →</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Offer 1 */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-col gap-3 hover:shadow-md transition-shadow">
                <div className="w-full h-36 rounded-xl overflow-hidden bg-slate-100 relative">
                  <Image 
                    src="/thanjavur_temple_illustration.png" 
                    alt="Degree Coffee Deal" 
                    fill 
                    className="object-cover hover:scale-105 transition-transform duration-300"
                  />
                  <span className="absolute top-2 left-2 text-[9px] font-black uppercase text-amber-950 bg-amber-400 px-2 py-0.5 rounded-md shadow-xs">
                    Reel Offer
                  </span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <h3 className="font-heading font-extrabold text-sm text-slate-800">
                    Tanjore Degree Coffee Deal
                  </h3>
                  <span className="text-xs font-black text-amber-600">Buy 1 Get 1</span>
                </div>
                <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                  Buy 1 Ghee Roast & Get 1 Free Degree Coffee between 4 PM to 7 PM.
                </p>
                <div className="flex justify-between items-center pt-2.5 border-t border-slate-100 text-[11px] font-bold text-slate-500">
                  <span>Near Big Temple</span>
                  <button onClick={handleAuthModalOpen} className="text-yellow-600 font-black hover:underline cursor-pointer">
                    View Offer Reel →
                  </button>
                </div>
              </div>

              {/* Offer 2 */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-col gap-3 hover:shadow-md transition-shadow">
                <div className="w-full h-36 rounded-xl overflow-hidden bg-slate-100 relative">
                  <Image 
                    src="/hero_building_visual.png" 
                    alt="Silk Saree Sale" 
                    fill 
                    className="object-cover hover:scale-105 transition-transform duration-300"
                  />
                  <span className="absolute top-2 left-2 text-[9px] font-black uppercase text-purple-950 bg-purple-400 px-2 py-0.5 rounded-md shadow-xs">
                    Flat 20% Off
                  </span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <h3 className="font-heading font-extrabold text-sm text-slate-800">
                    Handloom Silk Saree Sale
                  </h3>
                  <span className="text-xs font-black text-purple-600">20% Off</span>
                </div>
                <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                  20% direct discount on pure Tanjore handloom silk sarees this festival week.
                </p>
                <div className="flex justify-between items-center pt-2.5 border-t border-slate-100 text-[11px] font-bold text-slate-500">
                  <span>South Rampart Rd</span>
                  <button onClick={handleAuthModalOpen} className="text-yellow-600 font-black hover:underline cursor-pointer">
                    View Offer Reel →
                  </button>
                </div>
              </div>

              {/* Offer 3 */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-col gap-3 hover:shadow-md transition-shadow">
                <div className="w-full h-36 rounded-xl overflow-hidden bg-slate-100 relative">
                  <Image 
                    src="/namma_thanjai_logo.png" 
                    alt="Grocery Mart Offer" 
                    fill 
                    className="object-contain p-4 hover:scale-105 transition-transform duration-300 bg-slate-50"
                  />
                  <span className="absolute top-2 left-2 text-[9px] font-black uppercase text-emerald-950 bg-emerald-400 px-2 py-0.5 rounded-md shadow-xs">
                    Flat 10% Off
                  </span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <h3 className="font-heading font-extrabold text-sm text-slate-800">
                    Super Grocery Deal
                  </h3>
                  <span className="text-xs font-black text-emerald-600">10% Off</span>
                </div>
                <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                  10% direct discount on 25KG Ponni Rice bags with free Tanjore home delivery.
                </p>
                <div className="flex justify-between items-center pt-2.5 border-t border-slate-100 text-[11px] font-bold text-slate-500">
                  <span>Srinivasapuram</span>
                  <button onClick={handleAuthModalOpen} className="text-yellow-600 font-black hover:underline cursor-pointer">
                    View Offer Reel →
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>
      ) : (
        /* ==========================================
           GUEST ONBOARDING (MOBILE APP ONBOARDING ON MOBILE, ROBOT HERO ON DESKTOP)
           ========================================== */
        <div className="w-full relative flex flex-col">
          
          {/* MOBILE APP ONBOARDING CONTAINER (Mobile Viewports ONLY) */}
          <div className="block md:hidden w-full px-5 py-8 bg-gradient-to-b from-yellow-500/10 via-white to-white min-h-[85vh] flex flex-col justify-between items-center text-center">
            
            {/* Top Branding Emblem */}
            <div className="flex flex-col items-center gap-3 mt-2">
              <div className="w-20 h-20 rounded-3xl bg-white shadow-md p-2.5 flex items-center justify-center border border-yellow-300 shadow-yellow-500/10">
                <Image 
                  src="/namma_thanjai_logo.png" 
                  alt="Namma Thanjavur Logo" 
                  width={64}
                  height={64}
                  className="object-contain"
                />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-yellow-800 bg-yellow-400/30 border border-yellow-500/30 px-3 py-1 rounded-full">
                Thanjavur Resident Hub
              </span>
              <h1 className="font-heading font-black text-3xl text-slate-900 tracking-tight leading-tight">
                Namma Thanjavur<span className="text-yellow-500">.</span>
              </h1>
              <p className="text-xs text-slate-600 font-semibold max-w-xs leading-relaxed">
                Connect with verified local residents for buying, selling, helper trades, and exclusive shop deals.
              </p>
            </div>

            {/* 3 Native App Feature Bullets */}
            <div className="w-full flex flex-col gap-3 my-6 text-left">
              <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 shadow-2xs flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-yellow-500/10 text-yellow-600 flex items-center justify-center shrink-0 border border-yellow-250/60 font-black">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-black text-xs text-slate-900">1. Buy & Sell Classifieds</h3>
                  <p className="text-[11px] text-slate-500 font-semibold">Lands, House Rentals, Used Vehicles & Appliances</p>
                </div>
              </div>

              <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 shadow-2xs flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-yellow-500/10 text-yellow-600 flex items-center justify-center shrink-0 border border-yellow-250/60 font-black">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-black text-xs text-slate-900">2. Helper Trades & Services</h3>
                  <p className="text-[11px] text-slate-500 font-semibold">Verified Electricians, Plumbers, Painters & Mechanics</p>
                </div>
              </div>

              <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 shadow-2xs flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-yellow-500/10 text-yellow-600 flex items-center justify-center shrink-0 border border-yellow-250/60 font-black">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-black text-xs text-slate-900">3. Shop Directory & Reel Offers</h3>
                  <p className="text-[11px] text-slate-500 font-semibold">Store Discounts, Promotions & Video Reels</p>
                </div>
              </div>
            </div>

            {/* Bottom Onboarding CTA */}
            <div className="w-full flex flex-col gap-3 mb-2">
              <button
                type="button"
                onClick={() => router.push("/?auth=popup")}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-slate-955 font-black text-sm uppercase tracking-wider transition-all shadow-md shadow-yellow-500/20 flex items-center justify-center gap-2 cursor-pointer active:scale-95 border-0"
              >
                <span>Get Started / Register</span>
                <ArrowRight className="w-4 h-4 text-slate-955" />
              </button>
              <p className="text-[10px] text-slate-400 font-bold">
                Quick 10-Second WhatsApp Verification
              </p>
            </div>

          </div>

          {/* DESKTOP 3D ROBOT MASCOT HERO (Desktop Viewports ONLY) */}
          <div className="hidden md:block w-full">
            <RobotHero
              backgroundText="NAMMA THANJAI"
              navItemsLeft={[]}
              ctaText="Register"
              onCtaClick={() => {
                router.push("/?auth=popup");
              }}
              onCategoryClick={(category) => {
                router.push(`/${category}`);
              }}
              color="#eab308"
              pantallaColor="#fbbf24"
              pantallaBrillo={1.6}
              alerts={alerts}
              activeAlertIdx={activeAlertIdx}
            />
          </div>

        </div>
      )}

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
              Simple Guide
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

        {/* 5 FAQ SECTION */}
        <div className="flex flex-col gap-4 bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs">
          <div className="flex flex-col gap-1 border-b border-slate-100 pb-3">
            <span className="text-[9px] font-black uppercase tracking-widest text-yellow-750 bg-yellow-500/10 border border-yellow-250/60 px-2.5 py-0.5 rounded-full w-fit">
              Frequently Asked Questions
            </span>
            <h3 className="font-heading font-black text-lg text-slate-900 mt-1">
              5 Key Questions About Namma Thanjavur
            </h3>
          </div>

          <div className="flex flex-col gap-3">
            {/* Q1 */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 flex flex-col gap-1">
              <h4 className="font-heading font-extrabold text-xs text-slate-900">1. What is Namma Thanjavur?</h4>
              <p className="text-[11px] text-slate-600 font-semibold leading-relaxed">
                Namma Thanjavur is a free local community portal for buying & selling classifieds, hiring verified helper technicians (electricians, plumbers), and viewing local store discount offers.
              </p>
            </div>

            {/* Q2 */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 flex flex-col gap-1">
              <h4 className="font-heading font-extrabold text-xs text-slate-900">2. How do I log in or register?</h4>
              <p className="text-[11px] text-slate-600 font-semibold leading-relaxed">
                Log in or register directly from the Landing Page using WhatsApp OTP verification. No internal login page exists inside the web application.
              </p>
            </div>

            {/* Q3 */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 flex flex-col gap-1">
              <h4 className="font-heading font-extrabold text-xs text-slate-900">3. Is posting listings free?</h4>
              <p className="text-[11px] text-slate-600 font-semibold leading-relaxed">
                Yes, 100% free with ₹0 subscription cost. Active listings stay published for 30 days and can be managed directly from your Profile section.
              </p>
            </div>

            {/* Q4 */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 flex flex-col gap-1">
              <h4 className="font-heading font-extrabold text-xs text-slate-900">4. Who can register as a Service Provider or Shop?</h4>
              <p className="text-[11px] text-slate-600 font-semibold leading-relaxed">
                Any local technician (electrician, plumber, carpenter, painter) or commercial store owner operating in Thanjavur can register or scan their visiting card.
              </p>
            </div>

            {/* Q5 */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 flex flex-col gap-1">
              <h4 className="font-heading font-extrabold text-xs text-slate-900">5. How does location verification work?</h4>
              <p className="text-[11px] text-slate-600 font-semibold leading-relaxed">
                Gemini AI automatically verifies every entered location to ensure that all listings belong exclusively to Thanjavur District. Locations outside Thanjavur are rejected.
              </p>
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
