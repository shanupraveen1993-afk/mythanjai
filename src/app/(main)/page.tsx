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
  Shirt,
  ShieldCheck,
  Search
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
      
      {profile?.isVerified ? (
        /* ==========================================
           LOGGED IN DASHBOARD FEED
           ========================================== */
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 mt-4 md:mt-6 pt-2 pb-12 flex flex-col gap-8 animate-fade-in">
          
          {/* 1. COMBINED FEATURED & POPULAR LISTINGS FEED */}
          
          {/* SECTION 1: SELL */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <span className="bg-slate-100 text-slate-700 p-1.5 rounded-xl border border-slate-200">
                  <ShoppingBag className="w-5 h-5 text-slate-700" />
                </span>
                <h2 className="font-heading font-black text-base md:text-lg text-slate-900 tracking-tight">
                  Sell (Classified Items)
                </h2>
              </div>
              <button
                onClick={() => router.push("/sell")}
                className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 hover:underline cursor-pointer"
              >
                <span>View All Sell Posts →</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Card 1: Popular */}
              <div 
                onClick={() => router.push("/sell?category=Plot%20%2f%20Real%20Estate&post=cmda_plot")}
                className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex flex-col gap-3 hover:shadow-md transition-shadow cursor-pointer relative"
              >
                <div className="w-full h-36 rounded-xl overflow-hidden bg-slate-100 relative">
                  <Image 
                    src="/thanjavur_temple_illustration.png" 
                    alt="Plot Land for Sale" 
                    fill 
                    className="object-cover hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 left-2 flex items-center gap-1.5">
                    <span className="text-[9px] font-bold uppercase text-slate-900 bg-white/95 px-2 py-0.5 rounded-md shadow-2xs border border-slate-200">
                      Popular
                    </span>
                    <span className="text-[9px] font-bold uppercase text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md shadow-2xs border border-slate-200">
                      Real Estate
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <h3 className="font-heading font-extrabold text-sm text-slate-800">
                    2400 Sqft CMDA Plot
                  </h3>
                  <span className="text-xs font-black text-slate-900">₹24,50,000</span>
                </div>
                <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                  DTCP approved residential plot with 30ft tar road frontage and Kaveri water line near Vallam.
                </p>
                <div className="flex justify-between items-center pt-2.5 border-t border-slate-100 text-[11px] font-bold text-slate-500">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>Vallam, Thanjavur</span>
                  </div>
                  <span className="text-slate-800 font-bold hover:underline">
                    View Post in Feed →
                  </span>
                </div>
              </div>

              {/* Card 2: Trending */}
              <div 
                onClick={() => router.push("/sell?category=Property%20Rental&post=house_rental")}
                className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex flex-col gap-3 hover:shadow-md transition-shadow cursor-pointer relative"
              >
                <div className="w-full h-36 rounded-xl overflow-hidden bg-slate-100 relative">
                  <Image 
                    src="/hero_building_visual.png" 
                    alt="2 BHK Independent House" 
                    fill 
                    className="object-cover hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 left-2 flex items-center gap-1.5">
                    <span className="text-[9px] font-bold uppercase text-slate-900 bg-white/95 px-2 py-0.5 rounded-md shadow-2xs border border-slate-200">
                      Trending
                    </span>
                    <span className="text-[9px] font-bold uppercase text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md shadow-2xs border border-slate-200">
                      House Rental
                    </span>
                  </div>
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
                  <span className="text-slate-800 font-bold hover:underline">
                    View Post in Feed →
                  </span>
                </div>
              </div>

              {/* Card 3: Recent */}
              <div 
                onClick={() => router.push("/sell?category=Used%20Vehicles&post=hero_bike")}
                className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex flex-col gap-3 hover:shadow-md transition-shadow cursor-pointer relative"
              >
                <div className="w-full h-36 rounded-xl overflow-hidden bg-slate-100 relative">
                  <Image 
                    src="/namma_thanjai_logo.png" 
                    alt="Hero Splendor Motor" 
                    fill 
                    className="object-contain p-4 hover:scale-105 transition-transform duration-300 bg-slate-50"
                  />
                  <div className="absolute top-2 left-2 flex items-center gap-1.5">
                    <span className="text-[9px] font-bold uppercase text-slate-900 bg-white/95 px-2 py-0.5 rounded-md shadow-2xs border border-slate-200">
                      Recent Post
                    </span>
                    <span className="text-[9px] font-bold uppercase text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md shadow-2xs border border-slate-200">
                      Used Motor
                    </span>
                  </div>
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
                  <span className="text-slate-800 font-bold hover:underline">
                    View Post in Feed →
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: NEED */}
          <div className="flex flex-col gap-4 mt-2">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <span className="bg-slate-100 text-slate-700 p-1.5 rounded-xl border border-slate-200">
                  <Search className="w-5 h-5 text-slate-700" />
                </span>
                <h2 className="font-heading font-black text-base md:text-lg text-slate-900 tracking-tight">
                  Need (Looking For Requirements)
                </h2>
              </div>
              <button
                onClick={() => router.push("/need")}
                className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 hover:underline cursor-pointer"
              >
                <span>View All Need Posts →</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Need Card 1: Urgent */}
              <div 
                onClick={() => router.push("/need?post=need_3bhk_medical")}
                className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex flex-col gap-3 hover:shadow-md transition-shadow cursor-pointer relative"
              >
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-bold uppercase text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                    Urgent Need
                  </span>
                  <span className="text-[10px] font-bold text-slate-700">Budget: ₹18,000/mo</span>
                </div>
                <h3 className="font-heading font-extrabold text-sm text-slate-800">
                  Looking for 3 BHK House in Medical College Rd
                </h3>
                <p className="text-xs text-slate-600 font-semibold leading-relaxed">
                  Doctor family searching for clean 3 BHK house with covered car parking and 24/7 water connection.
                </p>
                <div className="flex justify-between items-center pt-2.5 border-t border-slate-100 text-[11px] font-bold text-slate-500">
                  <span className="text-slate-700">Medical College Rd</span>
                  <span className="text-slate-800 font-bold hover:underline">
                    View Requirement →
                  </span>
                </div>
              </div>

              {/* Need Card 2: Trending */}
              <div 
                onClick={() => router.push("/need?post=need_goods_auto")}
                className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex flex-col gap-3 hover:shadow-md transition-shadow cursor-pointer relative"
              >
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-bold uppercase text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                    Trending
                  </span>
                  <span className="text-[10px] font-bold text-slate-700">Budget: ~₹1.2 Lakh</span>
                </div>
                <h3 className="font-heading font-extrabold text-sm text-slate-800">
                  Need Commercial Goods Auto / Mini Truck
                </h3>
                <p className="text-xs text-slate-600 font-semibold leading-relaxed">
                  Required used 3-wheeler goods autorickshaw or Tata Ace in good running condition with valid FC.
                </p>
                <div className="flex justify-between items-center pt-2.5 border-t border-slate-100 text-[11px] font-bold text-slate-500">
                  <span className="text-slate-700">New Bus Stand Area</span>
                  <span className="text-slate-800 font-bold hover:underline">
                    View Requirement →
                  </span>
                </div>
              </div>

              {/* Need Card 3: Recent */}
              <div 
                onClick={() => router.push("/need?post=need_accountant")}
                className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex flex-col gap-3 hover:shadow-md transition-shadow cursor-pointer relative"
              >
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-bold uppercase text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                    Recent Need
                  </span>
                  <span className="text-[10px] font-bold text-slate-700">Salary: ₹18,000/mo</span>
                </div>
                <h3 className="font-heading font-extrabold text-sm text-slate-800">
                  Hiring Full-Time Accountant for Retail Store
                </h3>
                <p className="text-xs text-slate-600 font-semibold leading-relaxed">
                  Hiring accountant experienced in Tally Prime, GST filing, and daily ledger management in Gandhiji Road.
                </p>
                <div className="flex justify-between items-center pt-2.5 border-t border-slate-100 text-[11px] font-bold text-slate-500">
                  <span className="text-slate-700">Gandhiji Road</span>
                  <span className="text-slate-800 font-bold hover:underline">
                    View Requirement →
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: LOCAL SERVICE */}
          <div className="flex flex-col gap-4 mt-2">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <span className="bg-slate-100 text-slate-700 p-1.5 rounded-xl border border-slate-200">
                  <Wrench className="w-5 h-5 text-slate-700" />
                </span>
                <h2 className="font-heading font-black text-base md:text-lg text-slate-900 tracking-tight">
                  Local Service (Technicians & Skilled Trades)
                </h2>
              </div>
              <button
                onClick={() => router.push("/services")}
                className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 hover:underline cursor-pointer"
              >
                <span>View All Services →</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Tech 1: Top Rated */}
              <div 
                onClick={() => router.push("/services?category=Electrician&post=senthil_electrician")}
                className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex flex-col gap-3 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-bold uppercase text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">
                    Top Rated (4.9)
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">Tanjore Town</span>
                </div>
                <h3 className="font-heading font-extrabold text-sm text-slate-800">
                  Senthil Kumar - Home Electrician
                </h3>
                <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                  8+ Years Experience. House wiring, DB box, inverter assembly & quick repairs.
                </p>
                <div className="flex justify-between items-center pt-2.5 border-t border-slate-100 text-[11px] font-bold text-slate-500">
                  <span>Electrician</span>
                  <span className="text-slate-800 font-bold hover:underline">
                    View Profile in Feed →
                  </span>
                </div>
              </div>

              {/* Tech 2: High Demand */}
              <div 
                onClick={() => router.push("/services?category=Plumber&post=rajesh_plumber")}
                className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex flex-col gap-3 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-bold uppercase text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">
                    High Demand
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">Medical College Rd</span>
                </div>
                <h3 className="font-heading font-extrabold text-sm text-slate-800">
                  Rajesh K - Expert Plumber
                </h3>
                <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                  Pipe fitting, water tank washing, Kaveri line tap connections & leak fixes.
                </p>
                <div className="flex justify-between items-center pt-2.5 border-t border-slate-100 text-[11px] font-bold text-slate-500">
                  <span>Plumber</span>
                  <span className="text-slate-800 font-bold hover:underline">
                    View Profile in Feed →
                  </span>
                </div>
              </div>

              {/* Tech 3: Active Today */}
              <div 
                onClick={() => router.push("/services?category=Carpenter&post=venu_carpenter")}
                className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex flex-col gap-3 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-bold uppercase text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">
                    Active Today
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">South Rampart Rd</span>
                </div>
                <h3 className="font-heading font-extrabold text-sm text-slate-800">
                  Venu Gopal - Wood Architect
                </h3>
                <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                  Modular kitchen woodworks, door laminations, locks repairs & bespoke furniture.
                </p>
                <div className="flex justify-between items-center pt-2.5 border-t border-slate-100 text-[11px] font-bold text-slate-500">
                  <span>Carpenter</span>
                  <span className="text-slate-800 font-bold hover:underline">
                    View Profile in Feed →
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 4: LOCAL OFFER */}
          <div className="flex flex-col gap-4 mt-2">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <span className="bg-slate-100 text-slate-700 p-1.5 rounded-xl border border-slate-200">
                  <Store className="w-5 h-5 text-slate-700" />
                </span>
                <h2 className="font-heading font-black text-base md:text-lg text-slate-900 tracking-tight">
                  Local Offer (Store Discounts & Video Deals)
                </h2>
              </div>
              <button
                onClick={() => router.push("/shops")}
                className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 hover:underline cursor-pointer"
              >
                <span>View All Offers →</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Featured Video Offer: GLEN EXCLUSIVE GALLERY */}
              <div 
                onClick={() => router.push("/shops?category=Electronics%20Shop&post=glen_gallery")}
                className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex flex-col gap-3 hover:shadow-md transition-shadow relative cursor-pointer"
              >
                <div className="w-full h-36 rounded-xl overflow-hidden bg-slate-900 relative group">
                  <video 
                    src="/videos/glen_gallery_offer.mp4" 
                    muted 
                    playsInline 
                    preload="metadata"
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-2 left-2 text-[9px] font-bold uppercase text-slate-900 bg-white/95 px-2 py-0.5 rounded-md shadow-2xs z-10 border border-slate-200">
                    Grand Opening Sale
                  </span>
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/10 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-white/90 text-slate-900 flex items-center justify-center font-black shadow-lg">
                      ▶
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <h3 className="font-heading font-extrabold text-sm text-slate-900">
                    GLEN EXCLUSIVE GALLERY
                  </h3>
                  <span className="text-xs font-black text-slate-900">Up to 60% OFF</span>
                </div>
                <p className="text-xs text-slate-600 font-semibold leading-relaxed line-clamp-2">
                  Grand Opening Sale! Up to 60% discount on all kitchen appliances & chimneys at New Busstand Road.
                </p>
                <div className="flex justify-between items-center pt-2.5 border-t border-slate-100 text-[11px] font-bold text-slate-500">
                  <span>New Busstand Rd</span>
                  <span className="text-slate-800 font-bold hover:underline flex items-center gap-1">
                    View Offer in Feed →
                  </span>
                </div>
              </div>

              {/* Offer 2 */}
              <div 
                onClick={() => router.push("/shops?category=Cafe%20%26%20Restaurant&post=degree_coffee")}
                className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex flex-col gap-3 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="w-full h-36 rounded-xl overflow-hidden bg-slate-100 relative">
                  <Image 
                    src="/thanjavur_temple_illustration.png" 
                    alt="Degree Coffee Deal" 
                    fill 
                    className="object-cover hover:scale-105 transition-transform duration-300"
                  />
                  <span className="absolute top-2 left-2 text-[9px] font-bold uppercase text-slate-900 bg-white/95 px-2 py-0.5 rounded-md shadow-2xs border border-slate-200">
                    Limited Deal
                  </span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <h3 className="font-heading font-extrabold text-sm text-slate-800">
                    Tanjore Degree Coffee
                  </h3>
                  <span className="text-xs font-black text-slate-900">Buy 1 Get 1</span>
                </div>
                <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                  Buy 1 Ghee Roast & Get 1 Free Degree Coffee between 4 PM to 7 PM.
                </p>
                <div className="flex justify-between items-center pt-2.5 border-t border-slate-100 text-[11px] font-bold text-slate-500">
                  <span>Big Temple Area</span>
                  <span className="text-slate-800 font-bold hover:underline">
                    View Offer →
                  </span>
                </div>
              </div>

              {/* Offer 3 */}
              <div 
                onClick={() => router.push("/shops?category=Textiles%20%26%20Clothing")}
                className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex flex-col gap-3 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="w-full h-36 rounded-xl overflow-hidden bg-slate-100 relative">
                  <Image 
                    src="/hero_building_visual.png" 
                    alt="Silk Saree Sale" 
                    fill 
                    className="object-cover hover:scale-105 transition-transform duration-300"
                  />
                  <span className="absolute top-2 left-2 text-[9px] font-bold uppercase text-slate-900 bg-white/95 px-2 py-0.5 rounded-md shadow-2xs border border-slate-200">
                    Recent Offer
                  </span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <h3 className="font-heading font-extrabold text-sm text-slate-800">
                    Handloom Silk Saree Sale
                  </h3>
                  <span className="text-xs font-black text-slate-900">20% Off</span>
                </div>
                <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                  20% direct discount on pure Tanjore handloom silk sarees this festival week.
                </p>
                <div className="flex justify-between items-center pt-2.5 border-t border-slate-100 text-[11px] font-bold text-slate-500">
                  <span>South Rampart Rd</span>
                  <span className="text-slate-800 font-bold hover:underline">
                    View Offer →
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ==========================================
           UNAUTHENTICATED GUEST LANDING PAGE (3D ROBOT MASCOT HERO ON DESKTOP & MOBILE)
           ========================================== */
        <div className="w-full relative flex flex-col min-h-[85vh] justify-between my-2">
          
          {/* 3D ROBOT MASCOT HERO (MASSIVE ENLARGED 3D MASCOT) */}
          <div className="w-full">
            <RobotHero
              backgroundText="NAMMA THANJAI"
              navItemsLeft={[]}
              ctaText="Register to Post"
              onCtaClick={() => {
                router.push("/?auth=popup");
              }}
              onCategoryClick={(targetRoute) => {
                if (targetRoute) {
                  router.push(`/${targetRoute}`);
                } else {
                  router.push("/sell");
                }
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
          PORTAL CONTENT: DIRECTORY SEGMENT LINKS Noticeboard (ALWAYS VISIBLE ON DESKTOP WEBSITE, LOGGED IN ON MOBILE)
          ========================================== */}
      <div id="noticeboard-directory" className={`w-full max-w-7xl mx-auto px-5 md:px-6 py-8 flex-col gap-8 bg-white ${profile?.isVerified ? "flex" : "hidden md:flex"}`}>

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
