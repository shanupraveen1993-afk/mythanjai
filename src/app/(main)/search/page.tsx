"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, MapPin, MessageSquare, Phone, Building, Wrench, Store, ArrowLeft, Loader2 } from "lucide-react";
import { collection, query, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get("q") || "";

  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "sell" | "need" | "services" | "offers">("all");

  const [results, setResults] = useState<{
    sell: any[];
    need: any[];
    services: any[];
    offers: any[];
  }>({ sell: [], need: [], services: [], offers: [] });

  useEffect(() => {
    setSearchTerm(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setResults({ sell: [], need: [], services: [], offers: [] });
      return;
    }

    const qTerm = searchTerm.toLowerCase().trim();
    setLoading(true);

    const performSearch = async () => {
      try {
        const [classifiedsSnap, servicesSnap, shopsSnap] = await Promise.all([
          getDocs(query(collection(db, "needs_and_sales"))).catch(() => ({ docs: [] })),
          getDocs(query(collection(db, "services"))).catch(() => ({ docs: [] })),
          getDocs(query(collection(db, "shops"))).catch(() => ({ docs: [] })),
        ]);

        const sellMatches: any[] = [];
        const needMatches: any[] = [];

        classifiedsSnap.docs.forEach((docSnap) => {
          const d = docSnap.data();
          const text = `${d.title || ""} ${d.description || ""} ${d.category || ""} ${d.area_tag || ""}`.toLowerCase();
          if (text.includes(qTerm)) {
            if (d.type === "NEED" || d.category === "NEED") {
              needMatches.push({ id: docSnap.id, ...d });
            } else {
              sellMatches.push({ id: docSnap.id, ...d });
            }
          }
        });

        const serviceMatches: any[] = [];
        servicesSnap.docs.forEach((docSnap) => {
          const d = docSnap.data();
          const text = `${d.name || ""} ${d.skill_category || ""} ${d.description || ""} ${d.area_tag || ""}`.toLowerCase();
          if (text.includes(qTerm)) {
            serviceMatches.push({ id: docSnap.id, ...d });
          }
        });

        const offerMatches: any[] = [];
        shopsSnap.docs.forEach((docSnap) => {
          const d = docSnap.data();
          const text = `${d.shop_name || ""} ${d.category || ""} ${d.offer_title || ""} ${d.offer_description || ""} ${d.area_tag || ""}`.toLowerCase();
          if (text.includes(qTerm)) {
            offerMatches.push({ id: docSnap.id, ...d });
          }
        });

        // Merge local posts stored in localStorage so local listings are ALWAYS searched on /search!
        if (typeof window !== "undefined") {
          try {
            const localPosts = JSON.parse(localStorage.getItem("namma_thanjai_local_posts") || "[]");
            localPosts.forEach((lp: any) => {
              const text = `${lp.title || lp.name || lp.shop_name || lp.offer_title || ""} ${lp.description || ""} ${lp.category || lp.skill_category || ""} ${lp.area_tag || ""}`.toLowerCase();
              if (text.includes(qTerm)) {
                if (lp.type === "NEED" || lp.category === "NEED") {
                  if (!needMatches.some((n) => n.id === lp.id)) needMatches.push(lp);
                } else if (lp.skill_category || lp.type === "SERVICE") {
                  if (!serviceMatches.some((s) => s.id === lp.id)) serviceMatches.push(lp);
                } else if (lp.type === "OFFER" || lp.type === "SHOP") {
                  if (!offerMatches.some((o) => o.id === lp.id)) offerMatches.push(lp);
                } else {
                  if (!sellMatches.some((s) => s.id === lp.id)) sellMatches.push(lp);
                }
              }
            });
          } catch (e) {}
        }

        setResults({
          sell: sellMatches,
          need: needMatches,
          services: serviceMatches,
          offers: offerMatches,
        });
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(performSearch, 250);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const totalResults =
    results.sell.length + results.need.length + results.services.length + results.offers.length;

  return (
    <div className="w-full min-h-screen bg-[#f8fafc] text-slate-900 font-sans pb-24">
      {/* Top Search Header */}
      <div className="bg-white border-b border-slate-200 sticky top-14 z-30 shadow-2xs py-3 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <form onSubmit={handleSearchSubmit} className="flex-1 relative flex items-center">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search Thanjavur (e.g. Car, Rental, Electrician, Offer)..."
                className="w-full bg-slate-100 hover:bg-slate-50 focus:bg-white border border-slate-250 focus:border-amber-400 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm font-black text-slate-900 focus:outline-none transition-all shadow-2xs"
              />
              <button
                type="submit"
                className="ml-2 bg-[#FBBF24] hover:bg-amber-400 text-slate-950 font-heading font-black text-xs px-4 py-2.5 rounded-xl cursor-pointer transition-colors shrink-0 shadow-2xs"
              >
                Search
              </button>
            </form>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pt-1">
            {[
              { id: "all", label: `All Results (${totalResults})` },
              { id: "sell", label: `Sell (${results.sell.length})` },
              { id: "need", label: `Need (${results.need.length})` },
              { id: "services", label: `Services (${results.services.length})` },
              { id: "offers", label: `Offers (${results.offers.length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-black shrink-0 transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-[#0F172A] text-white shadow-2xs"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Results Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 flex flex-col gap-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-500">
            <Loader2 className="w-7 h-7 animate-spin text-slate-900" />
            <p className="text-xs font-black">Searching Thanjavur Directory...</p>
          </div>
        ) : !searchTerm.trim() ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center flex flex-col items-center gap-3">
            <Search className="w-10 h-10 text-slate-300 stroke-[1.5]" />
            <h3 className="font-heading font-black text-base text-slate-900">Universal Search</h3>
            <p className="text-xs text-slate-500 max-w-md">
              Type any keyword above (such as "Car", "Plot", "Electrician", "House for Rent") to search across all Thanjavur listings.
            </p>
          </div>
        ) : totalResults === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold">
              🔍
            </div>
            <h3 className="font-heading font-black text-base text-slate-900">No Listings Found</h3>
            <p className="text-xs text-slate-500 max-w-md">
              No matching listings found for "{searchTerm}". Be the first to post in Thanjavur!
            </p>
            <button
              onClick={() => router.push("/post/sell")}
              className="mt-2 bg-[#FBBF24] hover:bg-amber-400 text-slate-950 font-heading font-black text-xs px-5 py-2.5 rounded-xl cursor-pointer transition-all shadow-2xs"
            >
              + Post New Ad
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {/* 1. SELL RESULTS */}
            {(activeTab === "all" || activeTab === "sell") && results.sell.length > 0 && (
              <section className="flex flex-col gap-3">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                  <Building className="w-4 h-4 text-slate-900" />
                  <h2 className="font-heading font-black text-sm text-slate-950 uppercase tracking-wider">
                    Sell Listings (விற்பனை) ({results.sell.length})
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {results.sell.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => router.push(`/sell`)}
                      className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between gap-3 shadow-2xs hover:border-slate-300 transition-all cursor-pointer"
                    >
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200 px-2 py-0.5 rounded">
                            {item.category || "Sell"}
                          </span>
                          {item.price && (
                            <span className="font-heading font-black text-xs text-slate-900">
                              ₹{Number(item.price).toLocaleString("en-IN")}
                            </span>
                          )}
                        </div>
                        <h3 className="font-heading font-bold text-xs text-slate-900 line-clamp-1 mt-1">
                          {item.title}
                        </h3>
                        <p className="text-[11px] text-slate-500 line-clamp-2">{item.description}</p>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {item.area_tag || "Thanjavur"}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <a
                            href={`https://wa.me/${(item.phone || "919994837342").replace(/\D/g, "")}?text=${encodeURIComponent(`Hi, I saw your listing "${item.title}" on Namma Thanjai.`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-1.5 rounded-lg bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-250 transition-colors"
                            title="WhatsApp"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-slate-800" />
                          </a>
                          <a
                            href={`tel:${item.phone || "919994837342"}`}
                            onClick={(e) => e.stopPropagation()}
                            className="p-1.5 rounded-lg bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-250 transition-colors"
                            title="Call"
                          >
                            <Phone className="w-3.5 h-3.5 text-slate-800" />
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 2. NEED RESULTS */}
            {(activeTab === "all" || activeTab === "need") && results.need.length > 0 && (
              <section className="flex flex-col gap-3">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                  <Search className="w-4 h-4 text-slate-900" />
                  <h2 className="font-heading font-black text-sm text-slate-950 uppercase tracking-wider">
                    Need Requirements (தேவைகள்) ({results.need.length})
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {results.need.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => router.push(`/need`)}
                      className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between gap-3 shadow-2xs hover:border-slate-300 transition-all cursor-pointer"
                    >
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200 px-2 py-0.5 rounded">
                            {item.category || "Need"}
                          </span>
                          {item.price && (
                            <span className="font-heading font-black text-xs text-slate-900">
                              Budget: ₹{Number(item.price).toLocaleString("en-IN")}
                            </span>
                          )}
                        </div>
                        <h3 className="font-heading font-bold text-xs text-slate-900 line-clamp-1 mt-1">
                          {item.title}
                        </h3>
                        <p className="text-[11px] text-slate-500 line-clamp-2">{item.description}</p>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {item.area_tag || "Thanjavur"}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <a
                            href={`https://wa.me/${(item.phone || "919994837342").replace(/\D/g, "")}?text=${encodeURIComponent(`Hi, I saw your requirement "${item.title}" on Namma Thanjai.`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-1.5 rounded-lg bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-250 transition-colors"
                            title="WhatsApp"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-slate-800" />
                          </a>
                          <a
                            href={`tel:${item.phone || "919994837342"}`}
                            onClick={(e) => e.stopPropagation()}
                            className="p-1.5 rounded-lg bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-250 transition-colors"
                            title="Call"
                          >
                            <Phone className="w-3.5 h-3.5 text-slate-800" />
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 3. SERVICE RESULTS */}
            {(activeTab === "all" || activeTab === "services") && results.services.length > 0 && (
              <section className="flex flex-col gap-3">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                  <Wrench className="w-4 h-4 text-slate-900" />
                  <h2 className="font-heading font-black text-sm text-slate-950 uppercase tracking-wider">
                    Service Providers (சேவைகள்) ({results.services.length})
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {results.services.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => router.push(`/services`)}
                      className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between gap-3 shadow-2xs hover:border-slate-300 transition-all cursor-pointer"
                    >
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200 px-2 py-0.5 rounded">
                            {item.skill_category || "Service"}
                          </span>
                          {item.experience && (
                            <span className="text-[10px] font-bold text-slate-500">{item.experience}</span>
                          )}
                        </div>
                        <h3 className="font-heading font-bold text-xs text-slate-900 line-clamp-1 mt-1">
                          {item.name}
                        </h3>
                        <p className="text-[11px] text-slate-500 line-clamp-2">{item.description}</p>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {item.area_tag || "Thanjavur"}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <a
                            href={`https://wa.me/${(item.phone || "919994837342").replace(/\D/g, "")}?text=${encodeURIComponent(`Hi, I saw your service "${item.name}" on Namma Thanjai.`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-1.5 rounded-lg bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-250 transition-colors"
                            title="WhatsApp"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-slate-800" />
                          </a>
                          <a
                            href={`tel:${item.phone || "919994837342"}`}
                            onClick={(e) => e.stopPropagation()}
                            className="p-1.5 rounded-lg bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-250 transition-colors"
                            title="Call"
                          >
                            <Phone className="w-3.5 h-3.5 text-slate-800" />
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 4. OFFER RESULTS */}
            {(activeTab === "all" || activeTab === "offers") && results.offers.length > 0 && (
              <section className="flex flex-col gap-3">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                  <Store className="w-4 h-4 text-slate-900" />
                  <h2 className="font-heading font-black text-sm text-slate-950 uppercase tracking-wider">
                    Local Offers (சலுகைகள்) ({results.offers.length})
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {results.offers.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => router.push(`/shops`)}
                      className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between gap-3 shadow-2xs hover:border-slate-300 transition-all cursor-pointer"
                    >
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200 px-2 py-0.5 rounded">
                            {item.category || "Offer"}
                          </span>
                          {item.offer_title && (
                            <span className="font-heading font-bold text-xs text-slate-900 line-clamp-1">
                              {item.offer_title}
                            </span>
                          )}
                        </div>
                        <h3 className="font-heading font-extrabold text-xs text-slate-900 line-clamp-1 mt-1">
                          {item.shop_name}
                        </h3>
                        <p className="text-[11px] text-slate-500 line-clamp-2">{item.offer_description || item.address_text}</p>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {item.area_tag || "Thanjavur"}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <a
                            href={`https://wa.me/${(item.phone || "919994837342").replace(/\D/g, "")}?text=${encodeURIComponent(`Hi, I saw your offer "${item.offer_title || item.shop_name}" on Namma Thanjai.`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-1.5 rounded-lg bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-250 transition-colors"
                            title="WhatsApp"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-slate-800" />
                          </a>
                          <a
                            href={`tel:${item.phone || "919994837342"}`}
                            onClick={(e) => e.stopPropagation()}
                            className="p-1.5 rounded-lg bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-250 transition-colors"
                            title="Call"
                          >
                            <Phone className="w-3.5 h-3.5 text-slate-800" />
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs font-bold text-slate-400">Loading Search...</div>}>
      <SearchContent />
    </Suspense>
  );
}
