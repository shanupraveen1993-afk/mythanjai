"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import {
  ChevronRight,
  MapPin,
  ShoppingBag,
  Search,
  Wrench,
  Store,
  BarChart3,
  Eye,
  MessageSquare,
  Phone,
  Share2,
  Bookmark,
  Loader2,
} from "lucide-react";
import { collection, query, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function LandingClientPage() {
  const router = useRouter();
  const { user, profile, isVerified } = useAuth();
  const isAuthVerified = isVerified;

  const [activeSellOrNeedPost, setActiveSellOrNeedPost] = useState<any>(null);
  const [activeServiceOrOfferPost, setActiveServiceOrOfferPost] = useState<any>(null);

  // Live Firestore data states (100% real live data — zero sample posts)
  const [liveSellPosts, setLiveSellPosts] = useState<any[]>([]);
  const [liveNeedPosts, setLiveNeedPosts] = useState<any[]>([]);
  const [liveServicePosts, setLiveServicePosts] = useState<any[]>([]);
  const [liveOfferPosts, setLiveOfferPosts] = useState<any[]>([]);
  const [matchedPosts, setMatchedPosts] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
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

  // Fetch real live listings from Firestore
  useEffect(() => {
    let isMounted = true;
    const fetchLiveListings = async () => {
      setLoadingData(true);
      try {
        const [classifiedsSnap, servicesSnap, shopsSnap] = await Promise.all([
          getDocs(query(collection(db, "needs_and_sales"))).catch(() => ({ docs: [] })),
          getDocs(query(collection(db, "services"))).catch(() => ({ docs: [] })),
          getDocs(query(collection(db, "shops"))).catch(() => ({ docs: [] })),
        ]);

        const sells: any[] = [];
        const needs: any[] = [];

        classifiedsSnap.docs.forEach((docSnap) => {
          const d = { id: docSnap.id, ...docSnap.data() };
          if ((d as any).type === "NEED" || (d as any).category === "NEED") {
            needs.push(d);
          } else {
            sells.push(d);
          }
        });

        const services: any[] = servicesSnap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
        const offers: any[] = shopsSnap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));

        if (isMounted) {
          setLiveSellPosts(sells);
          setLiveNeedPosts(needs);
          setLiveServicePosts(services);
          setLiveOfferPosts(offers);

          // Dynamic Matchmaker Logic
          if (activeSellOrNeedPost) {
            const targetType = activeSellOrNeedPost.type === "SELL" ? "NEED" : "SELL";
            const targetCategory = activeSellOrNeedPost.category?.toLowerCase() || "";
            const matches = classifiedsSnap.docs
              .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
              .filter((p: any) => {
                if (targetType === "NEED") return p.type === "NEED" || p.category === "NEED";
                return p.type === "SELL" || p.type !== "NEED";
              })
              .filter((p: any) => !targetCategory || (p.category || "").toLowerCase().includes(targetCategory));

            setMatchedPosts(matches.slice(0, 4));
          }
        }
      } catch (err) {
        console.error("Failed to fetch live listings:", err);
      } finally {
        if (isMounted) setLoadingData(false);
      }
    };

    fetchLiveListings();
    return () => {
      isMounted = false;
    };
  }, [activeSellOrNeedPost]);

  return (
    <div className="w-full flex flex-col gap-6 text-slate-900 font-sans pb-24 bg-[#f8fafc] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col gap-6 pt-4">
        
        {/* ── 1. Hero Banner ── */}
        <div className="relative w-full min-h-[160px] sm:min-h-[200px] rounded-2xl overflow-hidden bg-[#0F172A] text-white flex items-center px-6 sm:px-8 py-6 sm:py-8 shadow-md mt-1 border border-slate-800">
          <img
            src="/thanjavur_temple_illustration.png"
            alt="Namma Thanjai"
            className="absolute right-0 top-0 h-full w-3/5 object-cover opacity-25 pointer-events-none"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0F172A] via-[#0F172A]/90 to-transparent" />
          <div className="relative z-10 flex flex-col gap-2 max-w-xl">
            <span className="text-white font-extrabold text-xs sm:text-sm tracking-wider w-fit underline decoration-[#FBBF24] decoration-2 underline-offset-4 pb-0.5">
              Namma Thanjai • நம்ம தஞ்சை
            </span>
            <h1 className="font-heading font-black text-xl sm:text-2xl text-white tracking-tight leading-snug">
              Everything you need in our city, all in one place.{" "}
              <span className="text-[#FBBF24] block text-xs sm:text-base font-extrabold mt-1">
                நம்ம ஊரின் அனைத்து தேவைகளுக்கும் ஒரே இடம்.
              </span>
            </h1>

            {!isAuthVerified && (
              <div className="mt-2.5 flex items-center justify-start w-fit">
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== "undefined") {
                      window.dispatchEvent(new Event("namma_thanjai_open_signin"));
                    }
                  }}
                  className="bg-[#FBBF24] hover:bg-amber-400 text-slate-950 font-heading font-black text-xs uppercase tracking-wider py-2.5 px-5 rounded-xl transition-all shadow-sm border border-amber-400/80 cursor-pointer active:scale-95 flex items-center gap-1.5"
                >
                  <span>Register to Post Ad</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-950 stroke-[3]" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── 2. 4 Segment Category Cards (Blue Theme Filled Button Cards) ── */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 my-1">
          {/* Card 1: Need to Buy */}
          <div
            onClick={() => router.push("/sell")}
            className="bg-[#1D4ED8] hover:bg-blue-700 text-white rounded-2xl p-4 flex flex-col justify-between gap-3 shadow-md border border-blue-600/80 cursor-pointer transition-all active:scale-[0.98]"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white text-[#1D4ED8] flex items-center justify-center shrink-0 shadow-2xs">
                  <ShoppingBag className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div className="flex flex-col min-w-0">
                  <h3 className="font-heading font-black text-sm text-white truncate">
                    Need to Buy
                  </h3>
                  <span className="text-xs font-bold text-blue-100 leading-tight">
                    வாங்க வேண்டுமா
                  </span>
                </div>
              </div>
              <div className="w-8 h-8 rounded-xl bg-blue-900/60 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <ChevronRight className="w-4 h-4 stroke-[3]" />
              </div>
            </div>

            <div className="flex items-center gap-1.5 overflow-hidden">
              {["Plots", "Bikes"].map((cat, i) => (
                <span
                  key={i}
                  className="text-[10px] text-white font-bold bg-white/15 px-2 py-0.5 rounded-md border border-white/20 whitespace-nowrap shrink-0"
                >
                  {cat}
                </span>
              ))}
              <span className="text-[10px] font-black text-[#FBBF24] bg-amber-400/20 px-2 py-0.5 rounded-md border border-amber-400/30 whitespace-nowrap shrink-0">
                +12 More
              </span>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                router.push("/sell");
              }}
              className="w-full h-9 bg-white text-[#1D4ED8] hover:bg-blue-50 font-heading font-black text-xs px-3 rounded-xl flex items-center justify-center gap-1 shadow-2xs cursor-pointer active:scale-95 transition-all text-center whitespace-nowrap uppercase tracking-wider"
            >
              <span>Explore Seller Post</span>
              <ChevronRight className="w-3.5 h-3.5 text-[#1D4ED8] stroke-[3]" />
            </button>
          </div>

          {/* Card 2: Looking for */}
          <div
            onClick={() => router.push("/need")}
            className="bg-[#1D4ED8] hover:bg-blue-700 text-white rounded-2xl p-4 flex flex-col justify-between gap-3 shadow-md border border-blue-600/80 cursor-pointer transition-all active:scale-[0.98]"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white text-[#1D4ED8] flex items-center justify-center shrink-0 shadow-2xs">
                  <Search className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div className="flex flex-col min-w-0">
                  <h3 className="font-heading font-black text-sm text-white truncate">
                    Looking for
                  </h3>
                  <span className="text-xs font-bold text-blue-100 leading-tight">
                    என்ன தேவை
                  </span>
                </div>
              </div>
              <div className="w-8 h-8 rounded-xl bg-blue-900/60 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <ChevronRight className="w-4 h-4 stroke-[3]" />
              </div>
            </div>

            <div className="flex items-center gap-1.5 overflow-hidden">
              {["Rentals", "Cars"].map((cat, i) => (
                <span
                  key={i}
                  className="text-[10px] text-white font-bold bg-white/15 px-2 py-0.5 rounded-md border border-white/20 whitespace-nowrap shrink-0"
                >
                  {cat}
                </span>
              ))}
              <span className="text-[10px] font-black text-[#FBBF24] bg-amber-400/20 px-2 py-0.5 rounded-md border border-amber-400/30 whitespace-nowrap shrink-0">
                +14 More
              </span>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                router.push("/need");
              }}
              className="w-full h-9 bg-white text-[#1D4ED8] hover:bg-blue-50 font-heading font-black text-xs px-3 rounded-xl flex items-center justify-center gap-1 shadow-2xs cursor-pointer active:scale-95 transition-all text-center whitespace-nowrap uppercase tracking-wider"
            >
              <span>Explore Need Post</span>
              <ChevronRight className="w-3.5 h-3.5 text-[#1D4ED8] stroke-[3]" />
            </button>
          </div>

          {/* Card 3: Local Service */}
          <div
            onClick={() => router.push("/services")}
            className="bg-[#1D4ED8] hover:bg-blue-700 text-white rounded-2xl p-4 flex flex-col justify-between gap-3 shadow-md border border-blue-600/80 cursor-pointer transition-all active:scale-[0.98]"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white text-[#1D4ED8] flex items-center justify-center shrink-0 shadow-2xs">
                  <Wrench className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div className="flex flex-col min-w-0">
                  <h3 className="font-heading font-black text-sm text-white truncate">
                    Local Service
                  </h3>
                  <span className="text-xs font-bold text-blue-100 leading-tight">
                    உள்ளூர் சேவை
                  </span>
                </div>
              </div>
              <div className="w-8 h-8 rounded-xl bg-blue-900/60 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <ChevronRight className="w-4 h-4 stroke-[3]" />
              </div>
            </div>

            <div className="flex items-center gap-1.5 overflow-hidden">
              {["Electrician", "Plumber"].map((cat, i) => (
                <span
                  key={i}
                  className="text-[10px] text-white font-bold bg-white/15 px-2 py-0.5 rounded-md border border-white/20 whitespace-nowrap shrink-0"
                >
                  {cat}
                </span>
              ))}
              <span className="text-[10px] font-black text-[#FBBF24] bg-amber-400/20 px-2 py-0.5 rounded-md border border-amber-400/30 whitespace-nowrap shrink-0">
                +18 More
              </span>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                router.push("/services");
              }}
              className="w-full h-9 bg-white text-[#1D4ED8] hover:bg-blue-50 font-heading font-black text-xs px-3 rounded-xl flex items-center justify-center gap-1 shadow-2xs cursor-pointer active:scale-95 transition-all text-center whitespace-nowrap uppercase tracking-wider"
            >
              <span>Explore Service Provider</span>
              <ChevronRight className="w-3.5 h-3.5 text-[#1D4ED8] stroke-[3]" />
            </button>
          </div>

          {/* Card 4: Local Offer */}
          <div
            onClick={() => router.push("/shops")}
            className="bg-[#1D4ED8] hover:bg-blue-700 text-white rounded-2xl p-4 flex flex-col justify-between gap-3 shadow-md border border-blue-600/80 cursor-pointer transition-all active:scale-[0.98]"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white text-[#1D4ED8] flex items-center justify-center shrink-0 shadow-2xs">
                  <Store className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div className="flex flex-col min-w-0">
                  <h3 className="font-heading font-black text-sm text-white truncate">
                    Local Offer
                  </h3>
                  <span className="text-xs font-bold text-blue-100 leading-tight">
                    உள்ளூர் சலுகைகள்
                  </span>
                </div>
              </div>
              <div className="w-8 h-8 rounded-xl bg-blue-900/60 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <ChevronRight className="w-4 h-4 stroke-[3]" />
              </div>
            </div>

            <div className="flex items-center gap-1.5 overflow-hidden">
              {["Discounts", "Cafes"].map((cat, i) => (
                <span
                  key={i}
                  className="text-[10px] text-white font-bold bg-white/15 px-2 py-0.5 rounded-md border border-white/20 whitespace-nowrap shrink-0"
                >
                  {cat}
                </span>
              ))}
              <span className="text-[10px] font-black text-[#FBBF24] bg-amber-400/20 px-2 py-0.5 rounded-md border border-amber-400/30 whitespace-nowrap shrink-0">
                +15 More
              </span>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                router.push("/shops");
              }}
              className="w-full h-9 bg-white text-[#1D4ED8] hover:bg-blue-50 font-heading font-black text-xs px-3 rounded-xl flex items-center justify-center gap-1 shadow-2xs cursor-pointer active:scale-95 transition-all text-center whitespace-nowrap uppercase tracking-wider"
            >
              <span>Explore Local Offer</span>
              <ChevronRight className="w-3.5 h-3.5 text-[#1D4ED8] stroke-[3]" />
            </button>
          </div>
        </section>

        {/* ── 3. Dynamic Category / Matchmaker / Insights Section (Positioned Below Segment Cards) ── */}
        {activeServiceOrOfferPost ? (
          /* Provider Performance Insights Card */
          <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-5 text-white shadow-xl flex flex-col gap-4 my-1 font-sans">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400 font-bold">
                  <BarChart3 className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="font-heading font-black text-sm text-white">Provider Performance Insights</h3>
                  <p className="text-xs text-slate-400 font-semibold">{activeServiceOrOfferPost.title || activeServiceOrOfferPost.name || activeServiceOrOfferPost.shop_name}</p>
                </div>
              </div>
              <span className="text-[10px] uppercase font-black tracking-widest text-[#FBBF24] bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-700">Live Analytics</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex flex-col gap-0.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1"><Eye className="w-3 h-3 text-slate-300" /> Seen</span>
                <span className="font-heading font-black text-lg text-white">{activeServiceOrOfferPost.views_count || 1}</span>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex flex-col gap-0.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1"><MessageSquare className="w-3 h-3 text-slate-300" /> Interacted</span>
                <span className="font-heading font-black text-lg text-white">{activeServiceOrOfferPost.chats_count || 0}</span>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex flex-col gap-0.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1"><Phone className="w-3 h-3 text-amber-400" /> Calls / Requests</span>
                <span className="font-heading font-black text-lg text-white">{activeServiceOrOfferPost.calls_count || 0}</span>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex flex-col gap-0.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1"><Share2 className="w-3 h-3 text-slate-300" /> Shared</span>
                <span className="font-heading font-black text-lg text-white">{activeServiceOrOfferPost.shares_count || 0}</span>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex flex-col gap-0.5 col-span-2 sm:col-span-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1"><Bookmark className="w-3 h-3 text-slate-300" /> Saved</span>
                <span className="font-heading font-black text-lg text-white">{activeServiceOrOfferPost.saved_count || 0}</span>
              </div>
            </div>
          </div>
        ) : activeSellOrNeedPost ? (
          /* Smart Matchmaker Grid */
          <div className="bg-white border border-slate-250 rounded-2xl p-4 shadow-2xs flex flex-col gap-3 my-1">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-900" />
                <h3 className="font-heading font-black text-sm text-slate-900">
                  Smart Matchmaker ({activeSellOrNeedPost.type === "SELL" ? "Buyers Looking For Your Item" : "Available Sellers"})
                </h3>
              </div>
              <span className="text-[10px] font-bold text-slate-800 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                Live Tanjore Matches
              </span>
            </div>

            {matchedPosts.length === 0 ? (
              <p className="text-xs text-slate-500 py-2">
                Searching for matching {activeSellOrNeedPost.type === "SELL" ? "buyers" : "sellers"} in Thanjavur...
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {matchedPosts.map((m, i) => (
                  <div
                    key={i}
                    onClick={() => router.push(m.type === "NEED" ? "/need" : "/sell")}
                    className="bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl p-3 flex flex-col justify-between gap-1 cursor-pointer transition-all active:scale-[0.98]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] uppercase font-black bg-slate-200 text-slate-900 border border-slate-300 px-1.5 py-0.5 rounded">Match</span>
                      {m.price && <span className="text-[11px] font-black text-slate-900">₹{Number(m.price).toLocaleString("en-IN")}</span>}
                    </div>
                    <h5 className="font-heading font-black text-xs text-slate-900 truncate mt-1">{m.title}</h5>
                    <p className="text-[11px] text-slate-500 font-semibold">📍 {m.area_tag || "Thanjavur"}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}

        {/* ── 4. SELL Preview ── */}
        <section className="flex flex-col gap-3 my-2">
          <div className="flex items-center justify-between">
            <h2 className="font-heading font-black text-base sm:text-lg text-slate-900 tracking-tight">
              Items for Sale (விற்பனை)
            </h2>
            <button
              onClick={() => router.push("/sell")}
              className="text-xs font-bold text-slate-900 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View all</span> <ChevronRight className="w-3.5 h-3.5 text-slate-900" />
            </button>
          </div>

          {loadingData ? (
            <div className="p-8 text-center text-xs font-bold text-slate-400 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
              Loading Live Sellers...
            </div>
          ) : liveSellPosts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center flex flex-col items-center gap-2">
              <ShoppingBag className="w-8 h-8 text-slate-300 stroke-[1.5]" />
              <p className="text-xs font-black text-slate-700">No live seller listings yet in Thanjavur</p>
              <button
                onClick={() => router.push("/post/sell")}
                className="mt-1 bg-[#FBBF24] hover:bg-amber-400 text-slate-950 font-heading font-black text-xs px-5 py-2.5 rounded-xl cursor-pointer transition-colors shadow-2xs"
              >
                + Post Ad
              </button>
            </div>
          ) : (
            <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-2 scrollbar-none">
              {liveSellPosts.map((item) => (
                <div
                  key={item.id}
                  onClick={() => router.push("/sell")}
                  className="w-[260px] sm:w-[280px] shrink-0 snap-start bg-white rounded-xl border border-slate-200/90 overflow-hidden shadow-2xs hover:border-slate-300 transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div className="relative h-36 bg-slate-100 overflow-hidden">
                    <img
                      src={item.image_url || "/thanjavur_temple_illustration.png"}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                    {item.price && (
                      <span className="absolute top-2 left-2 bg-slate-900/90 text-white font-black text-xs px-2.5 py-0.5 rounded-md">
                        ₹{Number(item.price).toLocaleString("en-IN")}
                      </span>
                    )}
                  </div>
                  <div className="p-3.5 flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold text-slate-800 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md w-fit">
                      {item.category || "Sell"}
                    </span>
                    <h3 className="font-heading font-bold text-xs text-slate-900 line-clamp-1">{item.title}</h3>
                    <div className="flex items-center justify-between text-slate-600 text-[11px] pt-1 border-t border-slate-100 mt-1">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[100px]">{item.area_tag || "Thanjavur"}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <a
                          href={`https://wa.me/${(item.phone || "919994837342").replace(/\D/g, "")}?text=${encodeURIComponent(`Hi, I saw your listing "${item.title}" on Namma Thanjai.`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-1 rounded-md bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-250 transition-colors"
                          title="Chat on WhatsApp"
                        >
                          <MessageSquare className="w-3 h-3 text-slate-800" />
                        </a>
                        <a
                          href={`tel:${item.phone || "919994837342"}`}
                          onClick={(e) => e.stopPropagation()}
                          className="p-1 rounded-md bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-250 transition-colors"
                          title="Call Seller"
                        >
                          <Phone className="w-3 h-3 text-slate-800" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── 5. NEED Preview ── */}
        <section className="flex flex-col gap-3 my-2">
          <div className="flex items-center justify-between">
            <h2 className="font-heading font-black text-base sm:text-lg text-slate-900 tracking-tight">
              Items Looking For (தேவைகள்)
            </h2>
            <button
              onClick={() => router.push("/need")}
              className="text-xs font-bold text-slate-900 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View all</span> <ChevronRight className="w-3.5 h-3.5 text-slate-900" />
            </button>
          </div>

          {loadingData ? (
            <div className="p-8 text-center text-xs font-bold text-slate-400 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
              Loading Live Requirements...
            </div>
          ) : liveNeedPosts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center flex flex-col items-center gap-2">
              <Search className="w-8 h-8 text-slate-300 stroke-[1.5]" />
              <p className="text-xs font-black text-slate-700">No active buyer requirements posted yet</p>
              <button
                onClick={() => router.push("/post/need")}
                className="mt-1 bg-[#FBBF24] hover:bg-amber-400 text-slate-950 font-heading font-black text-xs px-5 py-2.5 rounded-xl cursor-pointer transition-colors shadow-2xs"
              >
                + Post Ad
              </button>
            </div>
          ) : (
            <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-2 scrollbar-none">
              {liveNeedPosts.map((item) => (
                <div
                  key={item.id}
                  onClick={() => router.push("/need")}
                  className="w-[260px] sm:w-[280px] shrink-0 snap-start bg-white rounded-xl border border-slate-200/90 overflow-hidden shadow-2xs hover:border-slate-300 transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div className="relative h-36 bg-slate-100 overflow-hidden">
                    <img
                      src={item.image_url || "/thanjavur_temple_illustration.png"}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                    {item.price && (
                      <span className="absolute top-2 left-2 bg-slate-900/90 text-white font-black text-xs px-2.5 py-0.5 rounded-md">
                        Budget: ₹{Number(item.price).toLocaleString("en-IN")}
                      </span>
                    )}
                  </div>
                  <div className="p-3.5 flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold text-slate-800 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md w-fit">
                      {item.category || "Need"}
                    </span>
                    <h3 className="font-heading font-bold text-xs text-slate-900 line-clamp-1">{item.title}</h3>
                    <div className="flex items-center justify-between text-slate-600 text-[11px] pt-1 border-t border-slate-100 mt-1">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[100px]">{item.area_tag || "Thanjavur"}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <a
                          href={`https://wa.me/${(item.phone || "919994837342").replace(/\D/g, "")}?text=${encodeURIComponent(`Hi, I saw your requirement "${item.title}" on Namma Thanjai.`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-1 rounded-md bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-250 transition-colors"
                          title="Chat on WhatsApp"
                        >
                          <MessageSquare className="w-3 h-3 text-slate-800" />
                        </a>
                        <a
                          href={`tel:${item.phone || "919994837342"}`}
                          onClick={(e) => e.stopPropagation()}
                          className="p-1 rounded-md bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-250 transition-colors"
                          title="Call"
                        >
                          <Phone className="w-3 h-3 text-slate-800" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── 6. SERVICES Preview ── */}
        <section className="flex flex-col gap-3 my-2">
          <div className="flex items-center justify-between">
            <h2 className="font-heading font-black text-base sm:text-lg text-slate-900 tracking-tight">
              Local Service (சேவைகள்)
            </h2>
            <button
              onClick={() => router.push("/services")}
              className="text-xs font-bold text-slate-900 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View all</span> <ChevronRight className="w-3.5 h-3.5 text-slate-900" />
            </button>
          </div>

          {loadingData ? (
            <div className="p-8 text-center text-xs font-bold text-slate-400 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
              Loading Service Providers...
            </div>
          ) : liveServicePosts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center flex flex-col items-center gap-2">
              <Wrench className="w-8 h-8 text-slate-300 stroke-[1.5]" />
              <p className="text-xs font-black text-slate-700">No service providers registered yet in Thanjavur</p>
              <button
                onClick={() => router.push("/post/service")}
                className="mt-1 bg-[#FBBF24] hover:bg-amber-400 text-slate-950 font-heading font-black text-xs px-5 py-2.5 rounded-xl cursor-pointer transition-colors shadow-2xs"
              >
                + Post Ad
              </button>
            </div>
          ) : (
            <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-2 scrollbar-none">
              {liveServicePosts.map((item) => (
                <div
                  key={item.id}
                  onClick={() => router.push("/services")}
                  className="w-[260px] sm:w-[280px] shrink-0 snap-start bg-white rounded-xl border border-slate-200/90 overflow-hidden shadow-2xs hover:border-slate-300 transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div className="relative h-36 bg-slate-100 overflow-hidden">
                    <img
                      src={item.image_url || "/thanjavur_temple_illustration.png"}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-3.5 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-800 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                        {item.skill_category || "Service"}
                      </span>
                      {item.experience && <span className="text-[10px] font-bold text-slate-600">{item.experience}</span>}
                    </div>
                    <h3 className="font-heading font-bold text-xs text-slate-900 line-clamp-1">{item.name}</h3>
                    <div className="flex items-center justify-between text-slate-600 text-[11px] pt-1 border-t border-slate-100 mt-1">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[100px]">{item.area_tag || "Thanjavur"}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <a
                          href={`https://wa.me/${(item.phone || "919994837342").replace(/\D/g, "")}?text=${encodeURIComponent(`Hi, I saw your service "${item.name}" on Namma Thanjai.`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-1 rounded-md bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-250 transition-colors"
                          title="Chat on WhatsApp"
                        >
                          <MessageSquare className="w-3 h-3 text-slate-800" />
                        </a>
                        <a
                          href={`tel:${item.phone || "919994837342"}`}
                          onClick={(e) => e.stopPropagation()}
                          className="p-1 rounded-md bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-250 transition-colors"
                          title="Call Technician"
                        >
                          <Phone className="w-3 h-3 text-slate-800" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── 7. OFFERS Preview ── */}
        <section className="flex flex-col gap-3 my-2">
          <div className="flex items-center justify-between">
            <h2 className="font-heading font-black text-base sm:text-lg text-slate-900 tracking-tight">
              Local Offer (சலுகைகள்)
            </h2>
            <button
              onClick={() => router.push("/shops")}
              className="text-xs font-bold text-slate-900 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View all</span> <ChevronRight className="w-3.5 h-3.5 text-slate-900" />
            </button>
          </div>

          {loadingData ? (
            <div className="p-8 text-center text-xs font-bold text-slate-400 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
              Loading Store Offers...
            </div>
          ) : liveOfferPosts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center flex flex-col items-center gap-2">
              <Store className="w-8 h-8 text-slate-300 stroke-[1.5]" />
              <p className="text-xs font-black text-slate-700">No active local store offers posted yet</p>
              <button
                onClick={() => router.push("/post/offer")}
                className="mt-1 bg-[#FBBF24] hover:bg-amber-400 text-slate-950 font-heading font-black text-xs px-5 py-2.5 rounded-xl cursor-pointer transition-colors shadow-2xs"
              >
                + Post Ad
              </button>
            </div>
          ) : (
            <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-2 scrollbar-none">
              {liveOfferPosts.map((item) => (
                <div
                  key={item.id}
                  onClick={() => router.push("/shops")}
                  className="w-[260px] sm:w-[280px] shrink-0 snap-start bg-white rounded-xl border border-slate-200/90 overflow-hidden shadow-2xs hover:border-slate-300 transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div className="relative h-32 bg-slate-900 overflow-hidden">
                    <img
                      src={item.image_url || "/thanjavur_temple_illustration.png"}
                      alt={item.shop_name}
                      className="w-full h-full object-cover opacity-90"
                    />
                    {item.offer_title && (
                      <span className="absolute top-2 left-2 bg-slate-900/90 text-white font-bold text-[10px] px-2.5 py-0.5 rounded-md">
                        {item.offer_title}
                      </span>
                    )}
                  </div>
                  <div className="p-3.5 flex flex-col gap-1">
                    <h3 className="font-heading font-extrabold text-xs text-slate-900 line-clamp-1">{item.shop_name}</h3>
                    <p className="text-[11px] text-slate-600 font-bold line-clamp-1">{item.offer_description || item.category}</p>
                    <div className="flex items-center justify-between text-slate-600 text-[10px] pt-1 border-t border-slate-100 mt-1">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[100px]">{item.area_tag || "Thanjavur"}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <a
                          href={`https://wa.me/${(item.phone || "919994837342").replace(/\D/g, "")}?text=${encodeURIComponent(`Hi, I saw your offer "${item.offer_title || item.shop_name}" on Namma Thanjai.`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-1 rounded-md bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-250 transition-colors"
                          title="Chat on WhatsApp"
                        >
                          <MessageSquare className="w-3 h-3 text-slate-800" />
                        </a>
                        <a
                          href={`tel:${item.phone || "919994837342"}`}
                          onClick={(e) => e.stopPropagation()}
                          className="p-1 rounded-md bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-250 transition-colors"
                          title="Call Store"
                        >
                          <Phone className="w-3 h-3 text-slate-800" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
