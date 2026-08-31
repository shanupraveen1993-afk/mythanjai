"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import UniversalSearchBar from "@/components/layout/UniversalSearchBar";
import UniversalSearchBarRow from "@/components/layout/UniversalSearchBarRow";
import {
  ChevronRight,
  MapPin,
  ShoppingBag,
  Search,
  Wrench,
  Store,
  MessageSquare,
  Phone,
  Share2,
  Bookmark,
  Loader2,
} from "lucide-react";
import { collection, query, getDocs, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";

import GetAppHomeBanner from "@/components/layout/GetAppHomeBanner";
import SellClientPage from "./sell/SellClientPage";

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

  // Fetch real live listings from Firestore
  useEffect(() => {
    let isMounted = true;
    const fetchLiveListings = async () => {
      setLoadingData(true);
      try {
        const [classifiedsSnap, servicesSnap, shopsSnap] = await Promise.all([
          getDocs(query(collection(db, "needs_and_sales"), limit(16))).catch(() => ({ docs: [] })),
          getDocs(query(collection(db, "services"), limit(8))).catch(() => ({ docs: [] })),
          getDocs(query(collection(db, "shops"), limit(8))).catch(() => ({ docs: [] })),
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

        const filterActiveOnly = (arr: any[]) =>
          arr.filter((p) => {
            if (p.is_sold || p.is_inactive || p.is_offline || p.is_expired || p.status === "inactive" || p.status === "moderation_review") return false;
            return true;
          });

        if (isMounted) {
          setLiveSellPosts(filterActiveOnly(sells).slice(0, 6));
          setLiveNeedPosts(filterActiveOnly(needs).slice(0, 6));
          setLiveServicePosts(filterActiveOnly(services).slice(0, 6));
          setLiveOfferPosts(filterActiveOnly(offers).slice(0, 6));
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
  }, []);

  return (
    <div className="w-full flex flex-col gap-4 text-slate-900 font-sans pb-6 sm:pb-10 bg-[#f8fafc] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col gap-6 pt-4">
        


        {/* ── Universal Sticky 4-Category Segment Bar (Mobile WebApp/APK STICKY TOP) ── */}


        {/* ── Home Page Mobile WebApp Only Dismissible APK Download Banner ── */}
        <GetAppHomeBanner />



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
