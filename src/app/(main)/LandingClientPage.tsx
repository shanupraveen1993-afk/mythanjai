"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import {
  Search,
  User,
  LogIn,
  ShoppingBag,
  HelpCircle,
  Briefcase,
  Tag,
  ChevronRight,
  MapPin,
  Phone,
  MessageSquare,
  MessageCircle,
  Navigation,
  Sparkles,
  CheckCircle2,
  Building2,
  Wrench,
  Store,
  Compass,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import StaticApkCard from "@/components/ui/StaticApkCard";

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

  // 16 Quick Category Cards (8 columns x 2 rows)
  const categoryCards = [
    // SELL SEGMENT (1-4)
    { id: "sell_plot", segment: "SELL", label: "Sell Plot", icon: "🏡", color: "from-amber-500 to-amber-600", path: "/sell?category=Plots+%26+Real+Estate" },
    { id: "sell_bike", segment: "SELL", label: "Sell Bike", icon: "🏍️", color: "from-amber-500 to-amber-600", path: "/sell?category=Used+Vehicles" },
    { id: "sell_phone", segment: "SELL", label: "Sell Phone", icon: "📱", color: "from-amber-500 to-amber-600", path: "/sell?category=Electronics+%26+Mobiles" },
    { id: "sell_car", segment: "SELL", label: "Sell Car", icon: "🚗", color: "from-amber-500 to-amber-600", path: "/sell?category=Used+Vehicles" },

    // NEED SEGMENT (5-8)
    { id: "need_car", segment: "NEED", label: "Need Car", icon: "🚙", color: "from-blue-500 to-blue-600", path: "/need?category=Used+Vehicles" },
    { id: "need_rental", segment: "NEED", label: "Need Rental House", icon: "🏠", color: "from-blue-500 to-blue-600", path: "/need?category=Property+Rental" },
    { id: "need_land", segment: "NEED", label: "Need Land", icon: "🏞️", color: "from-blue-500 to-blue-600", path: "/need?category=Plots+%26+Real+Estate" },
    { id: "need_laptop", segment: "NEED", label: "Need Laptop", icon: "💻", color: "from-blue-500 to-blue-600", path: "/need?category=Electronics+%26+Mobiles" },

    // SERVICES SEGMENT (9-12)
    { id: "srv_elec", segment: "SERVICES", label: "Electrician", icon: "⚡", color: "from-emerald-500 to-emerald-600", path: "/services?category=Electrician" },
    { id: "srv_plumb", segment: "SERVICES", label: "Plumber", icon: "🚰", color: "from-emerald-500 to-emerald-600", path: "/services?category=Plumber" },
    { id: "srv_carp", segment: "SERVICES", label: "Carpenter", icon: "🔨", color: "from-emerald-500 to-emerald-600", path: "/services?category=Carpenter" },
    { id: "srv_paint", segment: "SERVICES", label: "Painter", icon: "🎨", color: "from-emerald-500 to-emerald-600", path: "/services?category=Painter" },

    // OFFERS SEGMENT (13-16)
    { id: "off_store", segment: "OFFER", label: "Store Discounts", icon: "🏷️", color: "from-rose-500 to-rose-600", path: "/shops" },
    { id: "off_cafe", segment: "OFFER", label: "Cafe Offers", icon: "☕", color: "from-rose-500 to-rose-600", path: "/shops?category=Cafe+%26+Restaurant" },
    { id: "off_saree", segment: "OFFER", label: "Textile Sales", icon: "👗", color: "from-rose-500 to-rose-600", path: "/shops?category=Textiles+%26+Readymades" },
    { id: "off_gold", segment: "OFFER", label: "Jewelry Offers", icon: "💍", color: "from-rose-500 to-rose-600", path: "/shops?category=Gold+%26+Jewelry" },
  ];

  return (
    <div className="w-full flex flex-col gap-8 text-slate-800 font-sans pb-24">
      {/* ── Top Header Bar (Branding Left, Login & Profile Right) ── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3 shadow-2xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Left: Branding Logo */}
          <div
            onClick={() => router.push("/")}
            className="flex items-center gap-2.5 cursor-pointer select-none group shrink-0"
          >
            <div className="w-9 h-9 shrink-0 group-hover:scale-105 transition-transform duration-200 flex items-center justify-center">
              <img src="/namma_thanjai_logo.png" alt="namma thanjai logo" className="w-full h-full object-contain mix-blend-multiply" />
            </div>
            <div className="flex items-center gap-1">
              <span className="font-heading font-black tracking-tight text-amber-600 text-base sm:text-xl leading-none">
                நம்ம Thanjai
              </span>
              <div className="w-2 h-2 rounded-full bg-amber-500 shrink-0 animate-pulse" />
            </div>
          </div>

          {/* Right: Login Button & Profile Button */}
          <div className="flex items-center gap-2.5">
            {isAuthVerified ? (
              <button
                onClick={handleProfileClick}
                className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border border-slate-200/90 cursor-pointer"
              >
                <User className="w-4 h-4 text-amber-600" />
                <span className="hidden sm:inline">My Profile</span>
              </button>
            ) : (
              <>
                <button
                  onClick={handleSignInClick}
                  className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-amber-700 px-3 py-1.5 rounded-full hover:bg-amber-50 transition-colors cursor-pointer"
                >
                  <LogIn className="w-4 h-4 text-amber-600" />
                  <span>Login</span>
                </button>
                <button
                  onClick={handleProfileClick}
                  className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 px-3.5 py-1.5 rounded-full text-xs font-black transition-transform active:scale-95 shadow-2xs cursor-pointer border border-amber-400"
                >
                  <User className="w-4 h-4 text-slate-950" />
                  <span>Profile</span>
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full flex flex-col gap-8">
        {/* ── 8x2 Category Quick Cards (16 Cards across 4 Segments) ── */}
        <section className="flex flex-col gap-3 pt-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-heading font-black text-base sm:text-lg text-slate-900 tracking-tight">
                Quick Category Actions
              </h2>
              <p className="text-xs text-slate-500 font-bold">16 Categories across Sell, Need, Local Services &amp; Offers</p>
            </div>
            <span className="text-xs font-black text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
              Thanjavur Directory
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
            {categoryCards.map((card) => (
              <button
                key={card.id}
                onClick={() => router.push(card.path)}
                className={`p-3 rounded-2xl bg-gradient-to-br ${card.color} text-white flex flex-col justify-between shadow-xs hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] transition-all text-left min-h-[90px] cursor-pointer group`}
              >
                <span className="text-2xl mb-1 group-hover:scale-110 transition-transform">{card.icon}</span>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider opacity-80 block leading-tight">
                    {card.segment}
                  </span>
                  <span className="font-bold text-xs leading-snug line-clamp-1 block">
                    {card.label}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* ── APK Download Banner Card ── */}
        <StaticApkCard variant="dark" />

        {/* ── 1. SELL Segment Carousel ── */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-heading font-black text-base sm:text-lg text-slate-900">
                Sell (சமீபத்திய விற்பனை)
              </h2>
              <p className="text-xs text-slate-500 font-bold">Items for sale by local residents in Tanjore</p>
            </div>
            <button
              onClick={() => router.push("/sell")}
              className="text-xs font-black text-amber-700 hover:text-amber-800 flex items-center gap-0.5 hover:underline cursor-pointer"
            >
              See all <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-2 scrollbar-none">
            {[
              { title: "2400 Sqft CMDA Plot — Vallam", sub: "Plots & Real Estate", price: "₹24,50,000", area: "Vallam", img: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&auto=format&fit=crop" },
              { title: "Hero Splendor 2022 — Single Owner", sub: "Used Vehicles", price: "₹68,000", area: "New Bus Stand", img: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&auto=format&fit=crop" },
              { title: "iPhone 13 128GB Blue", sub: "Electronics & Mobiles", price: "₹42,000", area: "Old Bus Stand", img: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&auto=format&fit=crop" },
              { title: "Teakwood 5-Seater Sofa Set", sub: "Household Goods", price: "₹18,500", area: "Karanthai", img: "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=400&auto=format&fit=crop" },
            ].map((item, idx) => (
              <div
                key={idx}
                onClick={() => router.push("/sell")}
                className="w-[260px] sm:w-[280px] shrink-0 snap-start bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
              >
                <div className="relative h-36 bg-slate-100 overflow-hidden">
                  <img src={item.img} alt={item.title} className="w-full h-full object-cover" />
                  <span className="absolute top-2 left-2 bg-slate-950/80 text-white font-black text-xs px-2.5 py-0.5 rounded-full backdrop-blur-xs">
                    {item.price}
                  </span>
                </div>
                <div className="p-3.5 flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md w-fit">
                    {item.sub}
                  </span>
                  <h3 className="font-heading font-bold text-xs text-slate-900 line-clamp-1">{item.title}</h3>
                  <div className="flex items-center text-slate-500 text-[11px] gap-1">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>{item.area}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── 2. NEED Segment Carousel ── */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-heading font-black text-base sm:text-lg text-slate-900">
                Need (தேவைகள்)
              </h2>
              <p className="text-xs text-slate-500 font-bold">Requirements posted by local buyers</p>
            </div>
            <button
              onClick={() => router.push("/need")}
              className="text-xs font-black text-amber-700 hover:text-amber-800 flex items-center gap-0.5 hover:underline cursor-pointer"
            >
              See all <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-2 scrollbar-none">
            {[
              { title: "Need 1-2 Acres Commercial Land", badge: "🟡 Buy", sub: "Plots & Real Estate", price: "Budget ₹50L+", area: "Vallam" },
              { title: "Need 2 BHK near Medical College", badge: "🟢 Rent", sub: "Property Rental", price: "₹10,000/mo", area: "Medical College Rd" },
              { title: "Need Used Laptop under ₹25,000", badge: "🟡 Buy", sub: "Electronics & Mobiles", price: "₹25,000", area: "Tanjore Town" },
              { title: "Need Brahmin Marriage Caterer", badge: "🟣 Service", sub: "General Requirement", price: "Flexible", area: "South Rampart" },
            ].map((item, idx) => (
              <div
                key={idx}
                onClick={() => router.push("/need")}
                className="w-[260px] sm:w-[280px] shrink-0 snap-start bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full border bg-blue-50 text-blue-800 border-blue-200">
                      {item.badge}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">Just now</span>
                  </div>
                  <h3 className="font-heading font-bold text-xs text-slate-900 line-clamp-2">{item.title}</h3>
                  <div className="flex items-center text-slate-500 text-[11px] gap-1">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>{item.area}</span>
                  </div>
                </div>
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="font-black text-slate-900">{item.price}</span>
                  <span className="text-amber-700 font-bold hover:underline">Chat with Requester →</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── 3. LOCAL SERVICES Segment Carousel ── */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-heading font-black text-base sm:text-lg text-slate-900">
                Local Services (உள்ளூர் சேவைகள்)
              </h2>
              <p className="text-xs text-slate-500 font-bold">Verified skilled tradespeople near you</p>
            </div>
            <button
              onClick={() => router.push("/services")}
              className="text-xs font-black text-amber-700 hover:text-amber-800 flex items-center gap-0.5 hover:underline cursor-pointer"
            >
              See all <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-2 scrollbar-none">
            {[
              { name: "Senthil Kumar — Electrician", trade: "Electrician", area: "Tanjore Town", img: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&auto=format&fit=crop" },
              { name: "Rajesh K — Expert Plumber", trade: "Plumber", area: "Medical College Rd", img: "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=400&auto=format&fit=crop" },
              { name: "Venu Gopal — Wood Architect", trade: "Carpenter", area: "South Rampart", img: "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=400&auto=format&fit=crop" },
              { name: "Muthu Cool Tech — AC Repair", trade: "AC Technician", area: "Old Bus Stand", img: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&auto=format&fit=crop" },
            ].map((item, idx) => (
              <div
                key={idx}
                onClick={() => router.push("/services")}
                className="w-[260px] sm:w-[280px] shrink-0 snap-start bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
              >
                <div className="flex items-center gap-3 mb-2">
                  <img src={item.img} alt={item.name} className="w-12 h-12 rounded-full object-cover border border-slate-200 shrink-0" />
                  <div className="min-w-0">
                    <h3 className="font-heading font-bold text-xs text-slate-900 truncate">{item.name}</h3>
                    <span className="inline-block px-2 py-0.5 bg-emerald-50 text-emerald-800 text-[10px] font-bold rounded-md border border-emerald-200">
                      {item.trade}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[10px] pt-2 border-t border-slate-100">
                  <span className="inline-flex items-center gap-1 font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                    AVAILABLE NOW
                  </span>
                  <span className="text-slate-500 font-medium">{item.area}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── 4. LOCAL OFFER Segment Carousel ── */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-heading font-black text-base sm:text-lg text-slate-900">
                Local Offer (சிறப்பு சலுகைகள்)
              </h2>
              <p className="text-xs text-slate-500 font-bold">Store discounts &amp; deals from Thanjavur shops</p>
            </div>
            <button
              onClick={() => router.push("/shops")}
              className="text-xs font-black text-amber-700 hover:text-amber-800 flex items-center gap-0.5 hover:underline cursor-pointer"
            >
              See all <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-2 scrollbar-none">
            {[
              { store: "GLEN Gallery", title: "Up to 60% OFF — Grand Sale", badge: "🔥 Ends Today!", area: "New Bus Stand", img: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=400&auto=format&fit=crop" },
              { store: "Tanjore Degree Coffee", title: "Free Filter Coffee with Halwa", badge: "⏳ Valid till 30-Aug", area: "South Rampart", img: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&auto=format&fit=crop" },
              { store: "Silk Handloom House", title: "25% OFF Pure Zari Silks", badge: "⏳ Valid till 05-Sep", area: "Karanthai", img: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&auto=format&fit=crop" },
              { store: "Gold Palace", title: "Zero Making Charge — Gold", badge: "🔥 Ends Today!", area: "Gandhiji Road", img: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&auto=format&fit=crop" },
            ].map((item, idx) => (
              <div
                key={idx}
                onClick={() => router.push("/shops")}
                className="w-[260px] sm:w-[280px] shrink-0 snap-start bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
              >
                <div className="relative h-32 bg-slate-900 overflow-hidden">
                  <img src={item.img} alt={item.store} className="w-full h-full object-cover opacity-90" />
                  <span className="absolute top-2 left-2 bg-rose-600 text-white font-black text-[10px] px-2.5 py-0.5 rounded-full shadow-xs">
                    {item.badge}
                  </span>
                </div>
                <div className="p-3.5 flex flex-col gap-1">
                  <h3 className="font-heading font-extrabold text-xs text-slate-900 line-clamp-1">{item.store}</h3>
                  <p className="text-[11px] text-amber-700 font-bold line-clamp-1">{item.title}</p>
                  <div className="flex items-center text-slate-500 text-[10px] gap-1 mt-1">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>{item.area}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Steps to Use Namma Thanjai Section (Bottom Fold) ── */}
        <section className="bg-slate-950 text-white rounded-3xl p-6 sm:p-10 flex flex-col gap-6 shadow-xl relative overflow-hidden my-4 border border-slate-800">
          <div className="absolute right-0 top-0 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="flex flex-col gap-2 max-w-xl relative z-10">
            <span className="text-xs font-black uppercase tracking-widest text-amber-400 bg-amber-400/10 border border-amber-400/30 px-3 py-1 rounded-full w-fit">
              HOW NAMMA THANJAI WORKS
            </span>
            <h2 className="font-heading font-black text-xl sm:text-3xl text-white tracking-tight">
              Steps to Use Namma Thanjai
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
              Connecting Tanjore residents directly with 0 brokerage, 0 commission, and zero middleman fees.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10 mt-2">
            {/* Step 1 */}
            <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl flex flex-col gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 font-heading font-black text-lg flex items-center justify-center shadow-sm">
                1
              </div>
              <h3 className="font-heading font-bold text-sm text-white">Browse or Post Listings</h3>
              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                Post your items to sell, buyer requirements, skilled trade profile, or store discount offers with ₹0 registration fee.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl flex flex-col gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 font-heading font-black text-lg flex items-center justify-center shadow-sm">
                2
              </div>
              <h3 className="font-heading font-bold text-sm text-white">Direct 1:1 Communication</h3>
              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                Contact owners directly via verified phone calls, direct WhatsApp URI handoffs, or built-in in-app safety chat.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl flex flex-col gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 font-heading font-black text-lg flex items-center justify-center shadow-sm">
                3
              </div>
              <h3 className="font-heading font-bold text-sm text-white">Deal Directly with Locals</h3>
              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                Complete transactions 1:1 with Tanjore residents with 0 brokerage, 0 commission, and direct local community trust.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
