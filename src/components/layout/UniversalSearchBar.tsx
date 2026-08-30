"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, X, Building, Wrench, Store, MessageSquare, MapPin, ArrowRight, Loader2 } from "lucide-react";
import { collection, query, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRouter } from "next/navigation";

interface SearchResults {
  classifieds: any[];
  services: any[];
  shops: any[];
}

export default function UniversalSearchBar() {
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResults>({ classifieds: [], services: [], shops: [] });
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Real-time search filter across Firestore & Local samples
  useEffect(() => {
    if (!searchTerm.trim() || searchTerm.length < 2) {
      setResults({ classifieds: [], services: [], shops: [] });
      setIsOpen(false);
      return;
    }

    const queryTerm = searchTerm.toLowerCase().trim();
    setLoading(true);
    setIsOpen(true);

    const performSearch = async () => {
      try {
        // Query Firestore collections in parallel
        const [classifiedsSnap, servicesSnap, shopsSnap] = await Promise.all([
          getDocs(query(collection(db, "needs_and_sales"))).catch(() => ({ docs: [] })),
          getDocs(query(collection(db, "services"))).catch(() => ({ docs: [] })),
          getDocs(query(collection(db, "shops"))).catch(() => ({ docs: [] })),
        ]);

        const matchedClassifieds: any[] = [];
        classifiedsSnap.docs.forEach((docSnap) => {
          const d = docSnap.data();
          const text = `${d.title || ""} ${d.description || ""} ${d.category || ""} ${d.area_tag || ""}`.toLowerCase();
          if (text.includes(queryTerm)) {
            matchedClassifieds.push({ id: docSnap.id, ...d });
          }
        });

        const matchedServices: any[] = [];
        servicesSnap.docs.forEach((docSnap) => {
          const d = docSnap.data();
          const text = `${d.name || ""} ${d.skill_category || ""} ${d.description || ""} ${d.area_tag || ""}`.toLowerCase();
          if (text.includes(queryTerm)) {
            matchedServices.push({ id: docSnap.id, ...d });
          }
        });

        const matchedShops: any[] = [];
        shopsSnap.docs.forEach((docSnap) => {
          const d = docSnap.data();
          const text = `${d.shop_name || ""} ${d.category || ""} ${d.offer_title || ""} ${d.offer_description || ""} ${d.area_tag || ""}`.toLowerCase();
          if (text.includes(queryTerm)) {
            matchedShops.push({ id: docSnap.id, ...d });
          }
        });

        setResults({
          classifieds: matchedClassifieds.slice(0, 4),
          services: matchedServices.slice(0, 4),
          shops: matchedShops.slice(0, 4),
        });
      } catch (err) {
        console.error("Universal search failed:", err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(performSearch, 200);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      setIsOpen(false);
      router.push(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const totalMatches = results.classifieds.length + results.services.length + results.shops.length;

  return (
    <div ref={containerRef} className="relative w-full max-w-lg">
      <form onSubmit={handleFormSubmit} className="relative flex items-center w-full h-10 sm:h-10.5 bg-white border border-slate-200 focus-within:border-[#1F244A] rounded-xl pl-3 pr-1 shadow-2xs transition-all overflow-hidden">
        <Search className="w-4 h-4 text-slate-400 shrink-0 mr-2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => searchTerm.trim().length >= 2 && setIsOpen(true)}
          placeholder="Search Buy, Wanted, Services, Offers..."
          autoComplete="off"
          className="w-full bg-transparent text-xs sm:text-sm text-slate-900 placeholder:font-normal font-medium placeholder-slate-400 focus:outline-none tracking-normal pr-2"
        />
        {searchTerm ? (
          <button
            type="button"
            onClick={() => {
              setSearchTerm("");
              setIsOpen(false);
            }}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 transition-colors cursor-pointer mr-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : null}
        <button
          type="submit"
          className="bg-[#1F244A] hover:bg-[#151936] text-white px-2.5 sm:px-3 py-1.5 rounded-lg flex items-center justify-center cursor-pointer transition-all shrink-0 active:scale-95 shadow-2xs"
          title="Search"
        >
          <Search className="w-3.5 h-3.5 text-white stroke-[2.5]" />
        </button>
      </form>

      {/* Universal Search Results Dropdown Overlay */}
      {isOpen && (
        <div className="absolute left-0 right-0 sm:-left-4 sm:w-[520px] top-full mt-2 bg-white/98 backdrop-blur-xl border border-slate-200 shadow-2xl rounded-2xl z-50 overflow-hidden max-h-[75vh] overflow-y-auto divide-y divide-slate-100 animate-fade-in">
          {loading ? (
            <div className="p-4 text-center text-xs font-bold text-slate-400 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 text-slate-500 animate-spin" />
              Searching Thanjavur Directory...
            </div>
          ) : totalMatches === 0 ? (
            <div className="p-5 text-center text-xs font-bold text-slate-500">
              No matching listings found for "{searchTerm}". Try searching for rentals, electricians, or offers.
            </div>
          ) : (
            <div className="p-3 flex flex-col gap-3.5">
              
              {/* Category 1: Items for Sale */}
              {results.classifieds.filter((i) => i.type === "SELL" || i.category !== "NEED").length > 0 && (
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between px-1 text-[11px] font-black uppercase text-blue-900 tracking-wider">
                    <span className="flex items-center gap-1">
                      <Building className="w-3.5 h-3.5 text-blue-600" />
                      Items for Sale (Sell)
                    </span>
                    <button 
                      onClick={() => {
                        setIsOpen(false);
                        router.push(`/sell?q=${encodeURIComponent(searchTerm.trim())}`);
                      }} 
                      className="text-blue-700 hover:underline cursor-pointer font-bold text-[11px]"
                    >
                      View All →
                    </button>
                  </div>
                  <div className="flex flex-col gap-1">
                    {results.classifieds.filter((i) => i.type === "SELL" || i.category !== "NEED").map((item) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          setIsOpen(false);
                          router.push(`/sell?q=${encodeURIComponent(searchTerm.trim())}`);
                        }}
                        className="bg-slate-50 hover:bg-blue-50/70 p-2.5 rounded-xl border border-slate-200/80 cursor-pointer transition-all flex items-center justify-between gap-3 group"
                      >
                        <div className="min-w-0 flex-1 flex flex-col">
                          <h4 className="font-heading font-bold text-xs text-slate-900 truncate group-hover:text-blue-900">
                            {item.title}
                          </h4>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium mt-0.5">
                            <span className="flex items-center gap-1 shrink-0">
                              <MapPin className="w-3 h-3 text-blue-600" />
                              {item.area_tag || "Thanjavur"}
                            </span>
                            <span>•</span>
                            <span className="capitalize">{item.category || "Sell"}</span>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Category 2: Requirements (Need) */}
              {results.classifieds.filter((i) => i.type === "NEED" || i.category === "NEED").length > 0 && (
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between px-1 text-[11px] font-black uppercase text-amber-900 tracking-wider">
                    <span className="flex items-center gap-1">
                      <Building className="w-3.5 h-3.5 text-amber-600" />
                      Requirements (Need)
                    </span>
                    <button 
                      onClick={() => {
                        setIsOpen(false);
                        router.push(`/need?q=${encodeURIComponent(searchTerm.trim())}`);
                      }} 
                      className="text-amber-700 hover:underline cursor-pointer font-bold text-[11px]"
                    >
                      View All →
                    </button>
                  </div>
                  <div className="flex flex-col gap-1">
                    {results.classifieds.filter((i) => i.type === "NEED" || i.category === "NEED").map((item) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          setIsOpen(false);
                          router.push(`/need?q=${encodeURIComponent(searchTerm.trim())}`);
                        }}
                        className="bg-slate-50 hover:bg-amber-50/70 p-2.5 rounded-xl border border-slate-200/80 cursor-pointer transition-all flex items-center justify-between gap-3 group"
                      >
                        <div className="min-w-0 flex-1 flex flex-col">
                          <h4 className="font-heading font-bold text-xs text-slate-900 truncate group-hover:text-amber-900">
                            {item.title}
                          </h4>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium mt-0.5">
                            <span className="flex items-center gap-1 shrink-0">
                              <MapPin className="w-3 h-3 text-amber-600" />
                              {item.area_tag || "Thanjavur"}
                            </span>
                            <span>•</span>
                            <span>Buyer Request</span>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 transition-colors shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Category 3: Local Services */}
              {results.services.length > 0 && (
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between px-1 text-[11px] font-black uppercase text-emerald-900 tracking-wider">
                    <span className="flex items-center gap-1">
                      <Wrench className="w-3.5 h-3.5 text-emerald-600" />
                      Local Services
                    </span>
                    <button 
                      onClick={() => {
                        setIsOpen(false);
                        router.push(`/services?q=${encodeURIComponent(searchTerm.trim())}`);
                      }} 
                      className="text-emerald-700 hover:underline cursor-pointer font-bold text-[11px]"
                    >
                      View All →
                    </button>
                  </div>
                  <div className="flex flex-col gap-1">
                    {results.services.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          setIsOpen(false);
                          router.push(`/services?q=${encodeURIComponent(searchTerm.trim())}`);
                        }}
                        className="bg-slate-50 hover:bg-emerald-50/70 p-2.5 rounded-xl border border-slate-200/80 cursor-pointer transition-all flex items-center justify-between gap-3 group"
                      >
                        <div className="min-w-0 flex-1 flex flex-col">
                          <h4 className="font-heading font-bold text-xs text-slate-900 truncate group-hover:text-emerald-900">
                            {item.name}
                          </h4>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium mt-0.5">
                            <span className="flex items-center gap-1 shrink-0">
                              <MapPin className="w-3 h-3 text-emerald-600" />
                              {item.area_tag || "Thanjavur"}
                            </span>
                            <span>•</span>
                            <span>{item.skill_category || "Service"}</span>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Category 4: Store Offers */}
              {results.shops.length > 0 && (
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between px-1 text-[11px] font-black uppercase text-purple-900 tracking-wider">
                    <span className="flex items-center gap-1">
                      <Store className="w-3.5 h-3.5 text-purple-600" />
                      Store Offers
                    </span>
                    <button 
                      onClick={() => {
                        setIsOpen(false);
                        router.push(`/shops?q=${encodeURIComponent(searchTerm.trim())}`);
                      }} 
                      className="text-purple-700 hover:underline cursor-pointer font-bold text-[11px]"
                    >
                      View All →
                    </button>
                  </div>
                  <div className="flex flex-col gap-1">
                    {results.shops.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          setIsOpen(false);
                          router.push(`/shops?q=${encodeURIComponent(searchTerm.trim())}`);
                        }}
                        className="bg-slate-50 hover:bg-purple-50/70 p-2.5 rounded-xl border border-slate-200/80 cursor-pointer transition-all flex items-center justify-between gap-3 group"
                      >
                        <div className="min-w-0 flex-1 flex flex-col">
                          <h4 className="font-heading font-bold text-xs text-slate-900 truncate group-hover:text-purple-900">
                            {item.shop_name}
                          </h4>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium mt-0.5">
                            <span className="flex items-center gap-1 shrink-0">
                              <MapPin className="w-3 h-3 text-purple-600" />
                              {item.area_tag || "Thanjavur"}
                            </span>
                            <span>•</span>
                            <span>{item.category || "Store Offer"}</span>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 transition-colors shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      )}
    </div>
  );
}
