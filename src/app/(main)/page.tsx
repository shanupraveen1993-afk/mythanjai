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

  const handleCategoryClick = (targetPath: string) => {
    router.push(targetPath);
  };

  return (
    <div className="w-full flex flex-col bg-white text-slate-800 min-h-screen font-sans">
      
      {/* ==========================================
          HERO SECTION: 3D INTERACTIVE ROBOT HERO
          ========================================== */}
      <div className="w-full relative flex flex-col">
        <RobotHero
          backgroundText="NAMMA THANJAI"
          navItemsLeft={[]}
          ctaText={profile?.isVerified ? "Verified" : "Register"}
          onCtaClick={() => {
            if (profile?.isVerified) {
              router.push("/classifieds");
            } else {
              router.push("/?auth=popup&redirect=/classifieds");
            }
          }}
          onCategoryClick={(category) => {
            router.push(`/${category}`);
          }}
          color="#eab308" // Vibrant warm gold-yellow chassis
          pantallaColor="#fbbf24" // Bright yellow display screen
          pantallaBrillo={1.6}
          alerts={alerts}
          activeAlertIdx={activeAlertIdx}
        />
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
