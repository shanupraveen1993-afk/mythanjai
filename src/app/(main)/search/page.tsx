"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Search,
  MapPin,
  MessageSquare,
  Phone,
  ArrowLeft,
  ArrowRight,
  Loader2,
  Package,
  Wrench,
  Store,
  X,
} from "lucide-react";
import { collection, query, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

const RECENT_SEARCHES_KEY = "namma_thanjai_recent_searches";

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const queryParam = searchParams ? searchParams.get("q") || "" : "";
  const catParam = searchParams ? searchParams.get("cat") || "" : "";

  const [searchTerm, setSearchTerm] = useState(queryParam);
  const [activeCategory, setActiveCategory] = useState<string>(catParam);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const [results, setResults] = useState<{
    sell: any[];
    need: any[];
    services: any[];
    offers: any[];
  }>({ sell: [], need: [], services: [], offers: [] });

  // Load Recent Searches from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || "[]");
        if (Array.isArray(stored)) {
          setRecentSearches(stored);
        }
      } catch (e) {
        setRecentSearches([]);
      }
    }
  }, []);

  // Auto-focus search input with blinking cursor on page load
  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Sync state with URL params
  useEffect(() => {
    setSearchTerm(queryParam);
    setActiveCategory(catParam);
  }, [queryParam, catParam]);

  // Helper to save a query term into recent searches
  const saveRecentSearch = (term: string) => {
    const cleaned = term.trim();
    if (!cleaned) return;
    try {
      const filtered = recentSearches.filter((item) => item.toLowerCase() !== cleaned.toLowerCase());
      const updated = [cleaned, ...filtered].slice(0, 10);
      setRecentSearches(updated);
      if (typeof window !== "undefined") {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      }
    } catch (e) {}
  };

  // Clear all recent searches
  const handleClearRecentSearches = () => {
    setRecentSearches([]);
    if (typeof window !== "undefined") {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    }
  };

  // Remove individual recent search item
  const handleRemoveRecentSearch = (termToRemove: string) => {
    const updated = recentSearches.filter((item) => item !== termToRemove);
    setRecentSearches(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    }
  };

  // Execute District-Wide Search across all 4 collections
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
    if (!searchTerm.trim()) return;
    saveRecentSearch(searchTerm.trim());
    const catQuery = activeCategory ? `&cat=${activeCategory}` : "";
    router.push(`/search?q=${encodeURIComponent(searchTerm.trim())}${catQuery}`);
  };

  const handleRecentSearchClick = (term: string) => {
    setSearchTerm(term);
    saveRecentSearch(term);
    const catQuery = activeCategory ? `&cat=${activeCategory}` : "";
    router.push(`/search?q=${encodeURIComponent(term)}${catQuery}`);
  };

  const handleCategorySwitch = (catKey: string) => {
    setActiveCategory(catKey);
    const catQuery = catKey ? `&cat=${catKey}` : "";
    router.push(`/search?q=${encodeURIComponent(searchTerm.trim())}${catQuery}`);
  };

  const totalResults =
    results.sell.length + results.need.length + results.services.length + results.offers.length;

  const isFullCategoryView = Boolean(activeCategory && activeCategory !== "all");

  return (
    <div className="w-full min-h-screen bg-white text-slate-900 font-sans pb-24">
      {/* Dedicated Search Header Bar (No Horizontal Tabs) */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-xs py-3 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          {/* Smart Back Button */}
          <button
            type="button"
            onClick={() => {
              if (isFullCategoryView) {
                handleCategorySwitch("");
              } else {
                const referrer = typeof window !== "undefined" ? sessionStorage.getItem("namma_thanjai_search_referrer") : null;
                if (referrer && referrer !== "/search" && referrer !== "/onboarding") {
                  router.push(referrer);
                } else if (typeof window !== "undefined" && window.history.length > 1) {
                  router.back();
                } else {
                  router.push("/");
                }
              }
            }}
            className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors cursor-pointer shrink-0"
            title="Back"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
          </button>

          {/* Focused Search Input */}
          <form onSubmit={handleSearchSubmit} className="flex-1 relative flex items-center">
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search products, services & offers..."
              className="w-full bg-slate-100 hover:bg-slate-50 focus:bg-white border border-slate-250 focus:border-amber-400 rounded-xl pl-4 pr-10 py-2.5 text-xs sm:text-sm font-black text-slate-900 focus:outline-none transition-all shadow-2xs"
            />
            <button
              type="submit"
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-slate-950 cursor-pointer"
              title="Execute Search"
            >
              <Search className="w-4 h-4 stroke-[2.5]" />
            </button>
          </form>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 flex flex-col gap-6 font-sans">
        
        {/* RECENT SEARCHES SECTION (Shows when search input is empty) */}
        {!searchTerm.trim() ? (
          <div className="flex flex-col gap-4 max-w-xl mx-auto w-full pt-2">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-heading font-black text-sm text-slate-900 tracking-tight">
                Recent Searches
              </h3>
              {recentSearches.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearRecentSearches}
                  className="text-xs font-bold text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>

            {recentSearches.length === 0 ? (
              <div className="text-xs font-medium text-slate-400 py-6 text-center italic">
                No recent searches
              </div>
            ) : (
              <div className="flex flex-col gap-1 w-full">
                {recentSearches.map((term) => (
                  <div
                    key={term}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200/80 transition-all group cursor-pointer"
                    onClick={() => handleRecentSearchClick(term)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Search className="w-4 h-4 text-slate-400 group-hover:text-slate-700 shrink-0 stroke-[2]" />
                      <span className="text-xs sm:text-sm font-bold text-slate-800 truncate">
                        {term}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveRecentSearch(term);
                      }}
                      className="p-1 rounded-full text-slate-300 hover:text-rose-600 transition-colors"
                      title="Remove"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-500">
            <Loader2 className="w-7 h-7 animate-spin text-slate-900" />
            <p className="text-xs font-black">Searching across Thanjavur District...</p>
          </div>
        ) : totalResults === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center flex flex-col items-center gap-3 shadow-xs">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold">
              🔍
            </div>
            <h3 className="font-heading font-black text-base text-slate-900">No Listings Found</h3>
            <p className="text-xs text-slate-500 max-w-md">
              No matching listings found for "{searchTerm}" in Thanjavur District.
            </p>
          </div>
        ) : !isFullCategoryView ? (
          /* 13B — SEARCH OVERVIEW (Only show categories with > 0 results) */
          <div className="flex flex-col gap-8">
            {/* 1. FOR SALE (Only rendered if results exist) */}
            {results.sell.length > 0 && (
              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
                  <div className="flex items-center gap-2">
                    <Package className="w-4.5 h-4.5 text-amber-600 stroke-[2.5]" />
                    <h3 className="font-heading font-black text-base text-slate-900">FOR SALE ({results.sell.length})</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCategorySwitch("sell")}
                    className="text-xs font-heading font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1 cursor-pointer"
                  >
                    <span>View All</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {results.sell.slice(0, 2).map((item) => (
                    <div
                      key={item.id}
                      onClick={() => router.push(`/sell`)}
                      className="bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl p-3.5 flex items-start gap-3 cursor-pointer transition-all"
                    >
                      <img
                        src={item.image_url || (Array.isArray(item.image_urls) && item.image_urls[0]) || "/placeholder.webp"}
                        alt={item.title}
                        className="w-16 h-16 rounded-lg object-cover bg-white border border-slate-200 shrink-0"
                      />
                      <div className="flex flex-col gap-1 min-w-0 flex-1">
                        <span className="text-[10px] font-bold text-amber-700">{item.category || "For Sale"}</span>
                        <h4 className="font-heading font-black text-xs text-slate-900 truncate">{item.title}</h4>
                        {item.price && <span className="font-heading font-black text-xs text-emerald-700">₹{item.price}</span>}
                        <span className="text-[10px] text-slate-500 flex items-center gap-1 truncate">
                          <MapPin className="w-3 h-3 text-amber-600 shrink-0" />
                          <span className="truncate">{item.area_tag || "Thanjavur"}</span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 2. WANTED (Only rendered if results exist) */}
            {results.need.length > 0 && (
              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
                  <div className="flex items-center gap-2">
                    <Search className="w-4.5 h-4.5 text-amber-600 stroke-[2.5]" />
                    <h3 className="font-heading font-black text-base text-slate-900">WANTED ({results.need.length})</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCategorySwitch("need")}
                    className="text-xs font-heading font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1 cursor-pointer"
                  >
                    <span>View All</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {results.need.slice(0, 2).map((item) => (
                    <div
                      key={item.id}
                      onClick={() => router.push(`/need?highlightId=${item.id}`)}
                      className="bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl p-3.5 flex items-start gap-3 cursor-pointer transition-all"
                    >
                      <div className="flex flex-col gap-1 min-w-0 flex-1">
                        <span className="text-[10px] font-bold text-amber-700">{item.category || "Wanted"}</span>
                        <h4 className="font-heading font-black text-xs text-slate-900 truncate">{item.title}</h4>
                        {item.price && <span className="font-heading font-black text-xs text-emerald-700">Budget: ₹{item.price}</span>}
                        <span className="text-[10px] text-slate-500 flex items-center gap-1 truncate">
                          <MapPin className="w-3 h-3 text-amber-600 shrink-0" />
                          <span className="truncate">{item.area_tag || "Thanjavur"}</span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. LOCAL SERVICES (Only rendered if results exist) */}
            {results.services.length > 0 && (
              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
                  <div className="flex items-center gap-2">
                    <Wrench className="w-4.5 h-4.5 text-amber-600 stroke-[2.5]" />
                    <h3 className="font-heading font-black text-base text-slate-900">LOCAL SERVICES ({results.services.length})</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCategorySwitch("services")}
                    className="text-xs font-heading font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1 cursor-pointer"
                  >
                    <span>View All</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {results.services.slice(0, 2).map((item) => (
                    <div
                      key={item.id}
                      onClick={() => router.push(`/services?highlightId=${item.id}`)}
                      className="bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl p-3.5 flex items-start gap-3 cursor-pointer transition-all"
                    >
                      <div className="flex flex-col gap-1 min-w-0 flex-1">
                        <span className="text-[10px] font-bold text-amber-700">{item.skill_category || "Service"}</span>
                        <h4 className="font-heading font-black text-xs text-slate-900 truncate">{item.name}</h4>
                        <span className="text-[10px] text-slate-500 flex items-center gap-1 truncate">
                          <MapPin className="w-3 h-3 text-amber-600 shrink-0" />
                          <span className="truncate">{item.area_tag || "Thanjavur"}</span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. LOCAL OFFERS (Only rendered if results exist) */}
            {results.offers.length > 0 && (
              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
                  <div className="flex items-center gap-2">
                    <Store className="w-4.5 h-4.5 text-amber-600 stroke-[2.5]" />
                    <h3 className="font-heading font-black text-base text-slate-900">LOCAL OFFERS ({results.offers.length})</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCategorySwitch("offers")}
                    className="text-xs font-heading font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1 cursor-pointer"
                  >
                    <span>View All</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {results.offers.slice(0, 2).map((item) => (
                    <div
                      key={item.id}
                      onClick={() => router.push(`/shops?highlightId=${item.id}`)}
                      className="bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl p-3.5 flex items-start gap-3 cursor-pointer transition-all"
                    >
                      <div className="flex flex-col gap-1 min-w-0 flex-1">
                        <span className="text-[10px] font-bold text-amber-700">{item.category || "Offer"}</span>
                        <h4 className="font-heading font-black text-xs text-slate-900 truncate">{item.offer_title || item.shop_name}</h4>
                        <span className="text-[10px] text-slate-500 flex items-center gap-1 truncate">
                          <MapPin className="w-3 h-3 text-amber-600 shrink-0" />
                          <span className="truncate">{item.area_tag || "Thanjavur"}</span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* 13C — FULL CATEGORY SEARCH RESULTS GRID */
          <div className="flex flex-col gap-4">
            <h2 className="font-heading font-black text-base text-slate-900">
              Showing {activeCategory.toUpperCase()} results for "{searchTerm}"
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(activeCategory === "sell" ? results.sell : activeCategory === "need" ? results.need : activeCategory === "services" ? results.services : results.offers).map((item) => (
                <div
                  key={item.id}
                  onClick={() => router.push(activeCategory === "sell" ? "/sell" : activeCategory === "need" ? "/need" : activeCategory === "services" ? "/services" : "/shops")}
                  className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-between gap-3 shadow-xs hover:border-amber-400 transition-all cursor-pointer"
                >
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200 px-2 py-0.5 rounded w-fit">
                      {item.category || item.skill_category || activeCategory.toUpperCase()}
                    </span>
                    <h3 className="font-heading font-black text-sm text-slate-900 line-clamp-1">
                      {item.title || item.name || item.offer_title || item.shop_name}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2">{item.description || item.offer_description}</p>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                    <span className="flex items-center gap-1 truncate">
                      <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span className="truncate">{item.area_tag || "Thanjavur"}</span>
                    </span>
                    <div className="flex items-center gap-1.5">
                      <a
                        href={`https://wa.me/${(item.phone || "919994837342").replace(/\D/g, "")}?text=${encodeURIComponent(`Hi, I saw your listing on Namma Thanjai.`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-1.5 rounded-lg bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-250 transition-colors"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-slate-800" />
                      </a>
                      <a
                        href={`tel:${item.phone || "919994837342"}`}
                        onClick={(e) => e.stopPropagation()}
                        className="p-1.5 rounded-lg bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-250 transition-colors"
                      >
                        <Phone className="w-3.5 h-3.5 text-slate-800" />
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
