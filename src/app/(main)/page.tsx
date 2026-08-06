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

export default function HomeLandingPage() {
  const router = useRouter();
  const { profile } = useAuth();

  const handleCategoryClick = (targetPath: string) => {
    router.push(targetPath);
  };

  return (
    <div className="w-full flex flex-col bg-slate-50 text-slate-800 min-h-screen font-sans">
      
      {/* ==========================================
          HERO SECTION: 3D INTERACTIVE ROBOT HERO
          ========================================== */}
      <div className="w-full h-dvh min-h-[600px] relative">
        <RobotHero
          backgroundText="MY THANJAI"
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
        />
      </div>

      {/* ==========================================
          PORTAL CONTENT: DIRECTORY SEGMENT LINKS Noticeboard
          ========================================== */}
      <div className="w-full max-w-7xl mx-auto px-6 py-20 flex flex-col gap-16">
        
        {/* Section Heading & Branding Emblem */}
        <div className="flex flex-col items-center text-center gap-4.5 max-w-xl mx-auto">
          <div className="w-16 h-16 rounded-full bg-yellow-50 border border-yellow-250 flex items-center justify-center overflow-hidden shrink-0 shadow-sm animate-pulse-slow">
            <Image 
              src="/thanjavur_temple_illustration.png" 
              alt="my thanjai logo" 
              width={50}
              height={50}
              className="object-contain" 
            />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-yellow-600 bg-yellow-50 border border-yellow-200/50 px-3 py-1 rounded-full">
              Thanjavur noticeboard
            </span>
            <h2 className="font-heading font-black text-2xl md:text-3xl text-slate-900 tracking-tight leading-tight mt-3">
              Explore Local noticeboard Channels
            </h2>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Tap any sub-category card below to immediately enter the channel noticeboard, explore listings, or post your ad.
            </p>
          </div>
        </div>

        {/* Categories Noticeboard Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* ==================== BUY & SELL ==================== */}
          <div className="flex flex-col gap-4 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-yellow-50 border border-yellow-200 flex items-center justify-center text-yellow-600 shrink-0">
                <Building className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-black text-slate-900 block">Buy & Sell Ads</span>
                <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Classifieds</span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <button 
                onClick={() => handleCategoryClick("/classifieds?category=Plot%20%2f%20Real%20Estate")}
                className="w-full text-left bg-slate-50 hover:bg-yellow-50 border border-slate-200/60 hover:border-yellow-300 rounded-xl p-3 text-xs font-bold text-slate-700 flex items-center justify-between transition-all group"
              >
                <div className="flex items-center gap-2">
                  <Compass className="w-3.5 h-3.5 text-slate-500" />
                  <span>Lands & Plots</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-yellow-600 group-hover:translate-x-0.5 transition-all" />
              </button>
              <button 
                onClick={() => handleCategoryClick("/classifieds?category=Property%20Rental")}
                className="w-full text-left bg-slate-50 hover:bg-yellow-50 border border-slate-200/60 hover:border-yellow-300 rounded-xl p-3 text-xs font-bold text-slate-700 flex items-center justify-between transition-all group"
              >
                <div className="flex items-center gap-2">
                  <Home className="w-3.5 h-3.5 text-slate-500" />
                  <span>House Rentals</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-yellow-600 group-hover:translate-x-0.5 transition-all" />
              </button>
              <button 
                onClick={() => handleCategoryClick("/classifieds?category=Motor%20Vehicle")}
                className="w-full text-left bg-slate-50 hover:bg-yellow-50 border border-slate-200/60 hover:border-yellow-300 rounded-xl p-3 text-xs font-bold text-slate-700 flex items-center justify-between transition-all group"
              >
                <div className="flex items-center gap-2">
                  <Car className="w-3.5 h-3.5 text-slate-500" />
                  <span>Used Motors</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-yellow-600 group-hover:translate-x-0.5 transition-all" />
              </button>
              <button 
                onClick={() => handleCategoryClick("/classifieds?category=Electronics")}
                className="w-full text-left bg-slate-50 hover:bg-yellow-50 border border-slate-200/60 hover:border-yellow-300 rounded-xl p-3 text-xs font-bold text-slate-700 flex items-center justify-between transition-all group"
              >
                <div className="flex items-center gap-2">
                  <Tv className="w-3.5 h-3.5 text-slate-500" />
                  <span>Home Appliances</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-yellow-600 group-hover:translate-x-0.5 transition-all" />
              </button>
            </div>
            
            <button
              onClick={() => handleCategoryClick("/classifieds")}
              className="mt-2 text-center text-[10px] font-black text-yellow-600 hover:text-yellow-750 uppercase tracking-widest flex items-center justify-center gap-1 py-1"
            >
              <span>View Noticeboard</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* ==================== SERVICES ==================== */}
          <div className="flex flex-col gap-4 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-yellow-50 border border-yellow-200 flex items-center justify-center text-yellow-600 shrink-0">
                <Wrench className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-black text-slate-900 block">Helper Trades</span>
                <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Local Services</span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <button 
                onClick={() => handleCategoryClick("/services?category=Electrician")}
                className="w-full text-left bg-slate-50 hover:bg-yellow-50 border border-slate-200/60 hover:border-yellow-300 rounded-xl p-3 text-xs font-bold text-slate-700 flex items-center justify-between transition-all group"
              >
                <div className="flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-slate-500" />
                  <span>Electricians</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-yellow-600 group-hover:translate-x-0.5 transition-all" />
              </button>
              <button 
                onClick={() => handleCategoryClick("/services?category=Plumber")}
                className="w-full text-left bg-slate-50 hover:bg-yellow-50 border border-slate-200/60 hover:border-yellow-300 rounded-xl p-3 text-xs font-bold text-slate-700 flex items-center justify-between transition-all group"
              >
                <div className="flex items-center gap-2">
                  <Droplet className="w-3.5 h-3.5 text-slate-500" />
                  <span>Plumbers</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-yellow-600 group-hover:translate-x-0.5 transition-all" />
              </button>
              <button 
                onClick={() => handleCategoryClick("/services?category=AC%20%26%20Refrigeration")}
                className="w-full text-left bg-slate-50 hover:bg-yellow-50 border border-slate-200/60 hover:border-yellow-300 rounded-xl p-3 text-xs font-bold text-slate-700 flex items-center justify-between transition-all group"
              >
                <div className="flex items-center gap-2">
                  <Wind className="w-3.5 h-3.5 text-slate-500" />
                  <span>AC Mechanics</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-yellow-600 group-hover:translate-x-0.5 transition-all" />
              </button>
              <button 
                onClick={() => handleCategoryClick("/services?category=Carpenter")}
                className="w-full text-left bg-slate-50 hover:bg-yellow-50 border border-slate-200/60 hover:border-yellow-300 rounded-xl p-3 text-xs font-bold text-slate-700 flex items-center justify-between transition-all group"
              >
                <div className="flex items-center gap-2">
                  <Hammer className="w-3.5 h-3.5 text-slate-500" />
                  <span>Carpenters</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-yellow-600 group-hover:translate-x-0.5 transition-all" />
              </button>
            </div>

            <button
              onClick={() => handleCategoryClick("/services")}
              className="mt-2 text-center text-[10px] font-black text-yellow-600 hover:text-yellow-750 uppercase tracking-widest flex items-center justify-center gap-1 py-1"
            >
              <span>View noticeboard</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* ==================== SHOPS & OFFERS ==================== */}
          <div className="flex flex-col gap-4 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-yellow-50 border border-yellow-200 flex items-center justify-center text-yellow-600 shrink-0">
                <Store className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-black text-slate-900 block">Recent Offer</span>
                <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Deals & Video Reels</span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <button 
                onClick={() => handleCategoryClick("/shops?category=Cafe%20%26%20Restaurant")}
                className="w-full text-left bg-slate-50 hover:bg-yellow-50 border border-slate-200/60 hover:border-yellow-300 rounded-xl p-3 text-xs font-bold text-slate-700 flex items-center justify-between transition-all group"
              >
                <div className="flex items-center gap-2">
                  <Utensils className="w-3.5 h-3.5 text-slate-500" />
                  <span>Cafes & Hotels</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-yellow-600 group-hover:translate-x-0.5 transition-all" />
              </button>
              <button 
                onClick={() => handleCategoryClick("/shops?category=Supermarket%20%26%20Grocery")}
                className="w-full text-left bg-slate-50 hover:bg-yellow-50 border border-slate-200/60 hover:border-yellow-300 rounded-xl p-3 text-xs font-bold text-slate-700 flex items-center justify-between transition-all group"
              >
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-3.5 h-3.5 text-slate-500" />
                  <span>Supermarkets</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-yellow-600 group-hover:translate-x-0.5 transition-all" />
              </button>
              <button 
                onClick={() => handleCategoryClick("/shops?category=Textiles%20%26%20Clothing")}
                className="w-full text-left bg-slate-50 hover:bg-yellow-50 border border-slate-200/60 hover:border-yellow-300 rounded-xl p-3 text-xs font-bold text-slate-700 flex items-center justify-between transition-all group"
              >
                <div className="flex items-center gap-2">
                  <Shirt className="w-3.5 h-3.5 text-slate-500" />
                  <span>Silks & Textiles</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-yellow-600 group-hover:translate-x-0.5 transition-all" />
              </button>
              <button 
                onClick={() => handleCategoryClick("/shops?category=Jewelry%20Showroom")}
                className="w-full text-left bg-slate-50 hover:bg-yellow-50 border border-slate-200/60 hover:border-yellow-300 rounded-xl p-3 text-xs font-bold text-slate-700 flex items-center justify-between transition-all group"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-slate-500" />
                  <span>Gold Jewelry</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-yellow-600 group-hover:translate-x-0.5 transition-all" />
              </button>
            </div>

            <button
              onClick={() => handleCategoryClick("/shops")}
              className="mt-2 text-center text-[10px] font-black text-yellow-600 hover:text-yellow-750 uppercase tracking-widest flex items-center justify-center gap-1 py-1"
            >
              <span>View noticeboard</span>
              <ArrowRight className="w-3 h-3" />
            </button>
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
