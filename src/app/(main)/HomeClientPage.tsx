"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { MapPin, ChevronRight, ShoppingBag, Search, Wrench, Store, ArrowRight } from "lucide-react";
import RobotHero from "@/components/ui/robot-hero";
import CategoryBridgeFeed from "@/components/home/CategoryBridgeFeed";

// ── Shared Preview Card ───────────────────────────────────────────────────────

interface PreviewCard {
  title: string;
  sub: string;
  price: string;
  area: string;
  img: string;
}

function PreviewSection({
  title,
  subtitle,
  seeAllPath,
  accentColor,
  cards,
  onCardClick,
}: {
  title: string;
  subtitle: string;
  seeAllPath: string;
  accentColor: string;
  cards: PreviewCard[];
  onCardClick: () => void;
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
          <p className="text-[11px] text-slate-500 font-medium mt-0.5">{subtitle}</p>
        </div>
        <button
          onClick={() => router.push(seeAllPath)}
          className="flex items-center gap-1 text-xs font-black text-slate-600 hover:text-slate-900 transition-colors"
        >
          See All <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Cards row */}
      <div className="flex overflow-x-auto snap-x scrollbar-none gap-3 pb-1 md:grid md:grid-cols-3 md:overflow-visible">
        {cards.map((card, i) => (
          <div
            key={i}
            onClick={onCardClick}
            className="shrink-0 w-[260px] sm:w-[290px] md:w-auto snap-start bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer hover:-translate-y-0.5 active:scale-[0.98]"
          >
            <div className="w-full h-28 overflow-hidden bg-slate-100 relative">
              <img
                src={card.img}
                alt={card.title}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
              <span className="absolute top-2 left-2 text-[9px] font-black bg-white/95 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-md shadow-sm">
                {card.sub}
              </span>
            </div>
            <div className="p-3 flex flex-col gap-1">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-heading font-extrabold text-xs text-slate-900 leading-snug line-clamp-2 flex-1">
                  {card.title}
                </h3>
                <span className="text-xs font-black text-slate-800 shrink-0">{card.price}</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                <MapPin className="w-3 h-3 shrink-0" />
                <span>{card.area}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function HomeClientPage() {
  const router = useRouter();
  const { profile } = useAuth();

  // Alert ticker for robot hero
  const [activeAlertIdx, setActiveAlertIdx] = React.useState(0);
  const alerts = [
    "New plot listed in Vallam — 2400 Sqft CMDA approved",
    "Senthil Electrician: 4.9★ rating, available in Tanjore Town",
    "GLEN Gallery: Up to 60% OFF — Grand Opening Sale",
    "New 2 BHK rental listed near Medical College Road",
    "12 new members joined Namma Thanjavur today!",
  ];

  React.useEffect(() => {
    const interval = setInterval(() => {
      setActiveAlertIdx((prev) => (prev + 1) % alerts.length);
    }, 3200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full flex flex-col bg-white text-slate-800 min-h-screen font-sans">

      {profile?.isVerified ? (
        /* ── LOGGED-IN FEED ──────────────────────────────── */
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 mt-4 pb-24 flex flex-col gap-8">

          {/* Hero Banner */}
          <div className="relative w-full min-h-[180px] sm:min-h-[220px] rounded-3xl overflow-hidden bg-slate-950 text-white flex items-center px-6 sm:px-10 py-8 shadow-lg">
            <img
              src="/thanjavur_temple_illustration.png"
              alt="Namma Thanjavur"
              className="absolute right-0 top-0 h-full w-1/2 object-cover opacity-25 pointer-events-none"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent" />
            <div className="relative z-10 flex flex-col gap-3 max-w-xl">
              <span className="text-[10px] font-black uppercase tracking-widest text-yellow-400 bg-yellow-400/10 border border-yellow-400/30 px-3 py-1 rounded-full w-fit">
                THANJAVUR DIRECT DIRECTORY & MARKETPLACE
              </span>
              <h1 className="font-heading font-black text-2xl sm:text-3xl md:text-4xl text-white leading-tight">
                Thanjavur's Direct Local Community Directory
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Connect directly with Tanjore residents to buy, sell, hire verified tradesmen, and claim exclusive local store offers.
              </p>
            </div>
          </div>


          {/* ── SELL Preview ───────────────────────── */}
          <PreviewSection
            title="Sell"
            subtitle="Items for sale by local residents"
            seeAllPath="/sell"
            accentColor="bg-yellow-500"
            onCardClick={() => router.push("/sell")}
            cards={[
              { title: "2400 Sqft CMDA Plot", sub: "Plots & Real Estate", price: "₹24,50,000", area: "Vallam", img: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&auto=format&fit=crop" },
              { title: "Hero Splendor 2022 — Single Owner", sub: "Used Vehicles", price: "₹68,000", area: "New Bus Stand", img: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&auto=format&fit=crop" },
              { title: "iPhone 13 128GB Blue", sub: "Electronics & Mobiles", price: "₹42,000", area: "Old Bus Stand", img: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&auto=format&fit=crop" },
            ]}
          />

          {/* ── NEED Preview ───────────────────────── */}
          <PreviewSection
            title="Need"
            subtitle="Requirements from local buyers"
            seeAllPath="/need"
            accentColor="bg-yellow-500"
            onCardClick={() => router.push("/need")}
            cards={[
              { title: "Need 1-2 Acres Commercial Land", sub: "Plots & Real Estate", price: "Budget ₹50L+", area: "Vallam", img: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&auto=format&fit=crop" },
              { title: "Need 2 BHK near Medical College", sub: "Property Rental", price: "₹10,000/mo", area: "Medical College Rd", img: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&auto=format&fit=crop" },
              { title: "Need Used Laptop under ₹25,000", sub: "Electronics & Mobiles", price: "₹25,000", area: "Tanjore Town", img: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&auto=format&fit=crop" },
            ]}
          />

          {/* ── SERVICES Preview ───────────────────── */}
          <PreviewSection
            title="Services"
            subtitle="Verified skilled tradespeople near you"
            seeAllPath="/services"
            accentColor="bg-yellow-500"
            onCardClick={() => router.push("/services")}
            cards={[
              { title: "Senthil Kumar — Electrician", sub: "Electrician", price: "★ 4.9", area: "Tanjore Town", img: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&auto=format&fit=crop" },
              { title: "Rajesh K — Expert Plumber", sub: "Plumber", price: "★ 4.8", area: "Medical College Rd", img: "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=400&auto=format&fit=crop" },
              { title: "Venu Gopal — Wood Architect", sub: "Carpenter", price: "★ 5.0", area: "South Rampart", img: "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=400&auto=format&fit=crop" },
            ]}
          />

          {/* ── OFFERS Preview ─────────────────────── */}
          <PreviewSection
            title="Local Offers"
            subtitle="Store discounts & deals from Thanjavur shops"
            seeAllPath="/shops"
            accentColor="bg-yellow-500"
            onCardClick={() => router.push("/shops")}
            cards={[
              { title: "GLEN Gallery — Up to 60% OFF", sub: "Electronics & Mobiles", price: "Grand Sale", area: "New Bus Stand", img: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=400&auto=format&fit=crop" },
              { title: "Silk Handloom — 25% OFF Zari", sub: "Textiles & Readymades", price: "Wedding Offer", area: "Karanthai", img: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&auto=format&fit=crop" },
              { title: "Degree Coffee + Free Halwa", sub: "Cafe & Restaurant", price: "Today Only", area: "South Rampart", img: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&auto=format&fit=crop" },
            ]}
          />

        </div>

      ) : (
        /* ── GUEST ONBOARDING LANDING HERO ──────────────────────────── */
        <div className="w-full relative flex flex-col h-[100dvh] overflow-hidden justify-between py-1 md:h-auto md:min-h-[85vh] md:overflow-visible">
          <div className="w-full">
            <RobotHero
              backgroundText="NAMMA THANJAI"
              navItemsLeft={[]}
              ctaText="Register to Post Ad"
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

      {/* ── GUEST DESKTOP NOTICEBOARD (hidden for logged-in users) ── */}
      <div
        id="noticeboard-directory"
        className={`w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 flex-col gap-10 bg-white ${
          profile?.isVerified ? "hidden" : "hidden md:flex"
        }`}
      >
        {/* Live bulletin */}
        <div className="w-full bg-gradient-to-br from-white via-white to-amber-50/50 border border-slate-200/80 rounded-3xl p-6 sm:p-8 text-slate-900 shadow-xl shadow-slate-200/50 flex flex-col gap-6 relative overflow-hidden ring-1 ring-slate-100">
          <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-400/15 blur-3xl rounded-full pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-amber-400/10 blur-3xl rounded-full pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-5">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 bg-yellow-400 text-slate-950 font-black text-[10px] uppercase px-3 py-1 rounded-lg tracking-wider shadow-sm">
                <span className="w-2 h-2 rounded-full bg-slate-950 animate-ping" />
                LIVE BULLETIN
              </span>
              <h2 className="font-heading font-black text-xl sm:text-2xl text-slate-900 tracking-tight">
                Thanjavur Verified Activity Stream
              </h2>
            </div>
            <span className="text-xs font-medium text-slate-500 bg-white/60 backdrop-blur-sm px-3 py-1.5 rounded-full border border-slate-100">
              Live updates from verified residents & tradesmen
            </span>
          </div>
          
          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { tag: "REAL ESTATE", title: "2,400 Sqft CMDA Plot", desc: "Approved residential plot with tar road frontage & Kaveri water line in Vallam.", time: "Just Now", area: "Vallam", path: "/sell" },
              { tag: "LOCAL SERVICE", title: "Senthil Kumar (Electrician)", desc: "Available for DB box assemblies, inverter setups & short circuit repairs.", time: "5m ago", area: "Tanjore Town", path: "/services" },
              { tag: "REQUIREMENT", title: "Wanted 3 BHK Rental", desc: "Doctor family searching for 3 BHK house near Medical College Road.", time: "12m ago", area: "Medical College Rd", path: "/need" },
              { tag: "STORE OFFER", title: "Glen Exclusive Gallery", desc: "Up to 60% discount on built-in hobs & kitchen chimneys.", time: "25m ago", area: "New Busstand Rd", path: "/shops" },
            ].map((item, i) => (
              <div
                key={i}
                onClick={() => router.push(item.path)}
                className="bg-white/80 backdrop-blur-md border border-slate-200/80 hover:border-yellow-400 hover:bg-gradient-to-b hover:from-white hover:to-yellow-50/50 p-4 sm:p-5 rounded-2xl flex flex-col justify-between gap-3 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-yellow-900/5 shadow-sm group"
              >
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black text-yellow-700 uppercase tracking-widest bg-yellow-100/80 px-2.5 py-1 rounded-md border border-yellow-200/50">
                      {item.tag}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                      {item.time}
                    </span>
                  </div>
                  <h4 className="text-sm font-extrabold text-slate-900 group-hover:text-yellow-600 transition-colors leading-snug">
                    {item.title}
                  </h4>
                  <p className="text-xs text-slate-500 font-medium line-clamp-2 leading-relaxed">{item.desc}</p>
                </div>
                <div className="flex items-center justify-between pt-3 mt-1 border-t border-slate-100 text-[11px] font-bold text-slate-400 group-hover:text-slate-500 transition-colors">
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {item.area}</span>
                  <span className="text-yellow-600 font-black group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">Explore <ArrowRight className="w-3 h-3" /></span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 4-segment grid for desktop guests */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Sell", icon: <ShoppingBag className="w-5 h-5" />, path: "/sell", items: ["Plots & Real Estate", "Property Rental", "Used Vehicles", "Electronics & Mobiles"] },
            { label: "Need", icon: <Search className="w-5 h-5" />, path: "/need", items: ["Wanted House/Rental", "Wanted Land/Plot", "Job Openings", "Wanted Goods & Vehicle"] },
            { label: "Services", icon: <Wrench className="w-5 h-5" />, path: "/services", items: ["Home Electrician", "Expert Plumber", "AC & Fridge Repair", "Carpenter"] },
            { label: "Offers", icon: <Store className="w-5 h-5" />, path: "/shops", items: ["Kitchen & Electronics", "Degree Coffee Deals", "Handloom Silk & Textiles", "Gold & Jewelry Mart"] },
          ].map((seg) => (
            <div key={seg.label} className="group bg-white border border-slate-200 rounded-3xl p-5 shadow-xs flex flex-col gap-4 hover:shadow-md hover:border-yellow-200 transition-all duration-300">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <span className="bg-yellow-50 text-yellow-600 p-2 rounded-xl border border-yellow-100/50 group-hover:scale-105 transition-transform">{seg.icon}</span>
                <h3 className="font-heading font-black text-sm text-slate-900 group-hover:text-yellow-600 transition-colors">{seg.label}</h3>
              </div>
              <div className="flex flex-col gap-2">
                {seg.items.map((item) => (
                  <button
                    key={item}
                    onClick={() => router.push(seg.path)}
                    className="w-full text-left p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-800 transition-colors flex items-center justify-between border border-slate-100"
                  >
                    <span>{item}</span>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-yellow-500 transition-colors" />
                  </button>
                ))}
              </div>
              <button
                onClick={() => router.push(seg.path)}
                className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-wider text-center cursor-pointer group-hover:bg-yellow-400 group-hover:text-slate-950 transition-colors"
              >
                Open {seg.label} →
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <footer className="text-[10px] text-slate-400 font-bold flex gap-4 pt-4 border-t border-slate-200">
          <span>© {new Date().getFullYear()} namma thanjai</span>
          <button onClick={() => router.push("/profile")} className="hover:text-slate-600 transition-colors">
            Profile Control
          </button>
        </footer>
      </div>

    </div>
  );
}
