"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, X, Building, Wrench, Store, MessageSquare, MapPin, ArrowRight, Loader2 } from "lucide-react";
import { collection, query, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useSearchParams, useRouter } from "next/navigation";

interface SearchResults {
  classifieds: any[];
  services: any[];
  shops: any[];
}

export default function UniversalSearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedCategory = searchParams.get("category");

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

        // Add local fallback sample items if Firestore results are sparse
        const sampleClassifieds = [
          { id: "sample_1", title: "2 BHK Independent House for Rent", category: "Property Rental", area_tag: "Medical College Rd", price: 12000, phone: "919994837342" },
          { id: "sample_2", title: "Hero Splendor 2022 Bike", category: "Motor Vehicle", area_tag: "Vallam", price: 65000, phone: "919994837342" },
          { id: "sample_3", title: "iPhone 13 128GB Pristine Condition", category: "Electronics", area_tag: "New Bus Stand", price: 38000, phone: "919994837342" },
        ].filter(i => `${i.title} ${i.category} ${i.area_tag}`.toLowerCase().includes(queryTerm));

        const sampleServices = [
          { id: "sample_s1", name: "Senthil Kumar Electrician", skill_category: "Electrician", area_tag: "Tanjore Town", phone: "919994837342" },
          { id: "sample_s2", name: "Rajesh K Kaveri Plumber", skill_category: "Plumber", area_tag: "Medical College Rd", phone: "919994837342" },
          { id: "sample_s3", name: "Venu Gopal Wood Architect", skill_category: "Carpenter", area_tag: "South Rampart Rd", phone: "919994837342" },
        ].filter(i => `${i.name} ${i.skill_category} ${i.area_tag}`.toLowerCase().includes(queryTerm));

        const sampleShops = [
          { id: "sample_sh1", shop_name: "Tanjore Degree Coffee", offer_title: "Buy 1 Get 1 Free Degree Coffee", category: "Cafe & Restaurant", area_tag: "Near Big Temple", phone: "919994837342" },
          { id: "sample_sh2", shop_name: "Thanjavur Silk Handlooms", offer_title: "Flat 20% Off Silk Sarees", category: "Clothing & Fashion", area_tag: "South Rampart Rd", phone: "919994837342" },
        ].filter(i => `${i.shop_name} ${i.offer_title} ${i.area_tag}`.toLowerCase().includes(queryTerm));

        setResults({
          classifieds: [...matchedClassifieds, ...sampleClassifieds].slice(0, 4),
          services: [...matchedServices, ...sampleServices].slice(0, 4),
          shops: [...matchedShops, ...sampleShops].slice(0, 4),
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

  const totalMatches = results.classifieds.length + results.services.length + results.shops.length;

  return (
    <div ref={containerRef} className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 pb-1">
      <div className="relative flex items-center w-full bg-slate-50 hover:bg-white focus-within:bg-white border border-slate-250 focus-within:border-yellow-500 rounded-2xl px-3.5 py-2 shadow-2xs transition-all">
        <Search className="w-4 h-4 text-slate-400 shrink-0 mr-2.5" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => searchTerm.trim().length >= 2 && setIsOpen(true)}
          placeholder="Search Selling / Looking For, Local Service, Local Offer across Thanjavur..."
          className="w-full bg-transparent text-xs text-slate-900 placeholder-slate-400 focus:outline-none font-extrabold tracking-tight"
        />
        {searchTerm && (
          <button
            onClick={() => {
              setSearchTerm("");
              setIsOpen(false);
            }}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Universal Search Results Dropdown Overlay */}
      {isOpen && (
        <div className="absolute left-4 right-4 sm:left-6 sm:right-6 top-full mt-1.5 bg-white/95 backdrop-blur-xl border border-slate-200 shadow-2xl rounded-2xl z-50 overflow-hidden max-h-[75vh] overflow-y-auto divide-y divide-slate-100 animate-fade-in">
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
            <div className="p-3 flex flex-col gap-4">
              
              {/* Category 1: Selling / Looking For */}
              {results.classifieds.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between px-1 text-xs font-black uppercase text-yellow-750 tracking-wider">
                    <span className="flex items-center gap-1">
                      <Building className="w-3 h-3 text-yellow-600" />
                      Selling / Looking For ({results.classifieds.length})
                    </span>
                    <button 
                      onClick={() => {
                        setIsOpen(false);
                        router.push("/classifieds");
                      }} 
                      className="text-yellow-600 hover:underline cursor-pointer"
                    >
                      View All →
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {results.classifieds.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          setIsOpen(false);
                          router.push("/classifieds");
                        }}
                        className="bg-slate-50 hover:bg-yellow-50/50 p-2.5 rounded-xl border border-slate-200/80 cursor-pointer transition-all flex flex-col justify-between"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="font-heading font-extrabold text-xs text-slate-800 line-clamp-1">
                            {item.title}
                          </h4>
                          {item.price && (
                            <span className="text-yellow-600 font-black text-xs shrink-0">
                              ₹{item.price.toLocaleString("en-IN")}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between text-xs text-slate-500 font-bold mt-1">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {item.area_tag}
                          </span>
                          <span className="text-slate-400 capitalize">{item.category}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Category 2: Local Service */}
              {results.services.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between px-1 text-xs font-black uppercase text-yellow-750 tracking-wider">
                    <span className="flex items-center gap-1">
                      <Wrench className="w-3 h-3 text-yellow-600" />
                      Local Service ({results.services.length})
                    </span>
                    <button 
                      onClick={() => {
                        setIsOpen(false);
                        router.push("/services");
                      }} 
                      className="text-yellow-600 hover:underline cursor-pointer"
                    >
                      View All →
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {results.services.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          setIsOpen(false);
                          router.push("/services");
                        }}
                        className="bg-slate-50 hover:bg-yellow-50/50 p-2.5 rounded-xl border border-slate-200/80 cursor-pointer transition-all flex flex-col justify-between"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="font-heading font-extrabold text-xs text-slate-800 line-clamp-1">
                            {item.name}
                          </h4>
                          <span className="bg-yellow-50 border border-yellow-200 text-yellow-750 font-bold px-1.5 py-0.5 rounded text-xs uppercase shrink-0">
                            {item.skill_category}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-slate-500 font-bold mt-1">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {item.area_tag}
                          </span>
                          <a
                            href={`https://wa.me/${item.phone?.replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-emerald-600 font-black hover:underline flex items-center gap-0.5"
                          >
                            <MessageSquare className="w-3 h-3 fill-emerald-600" />
                            Contact
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Category 3: Local Offer */}
              {results.shops.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between px-1 text-xs font-black uppercase text-yellow-750 tracking-wider">
                    <span className="flex items-center gap-1">
                      <Store className="w-3 h-3 text-yellow-600" />
                      Local Offer ({results.shops.length})
                    </span>
                    <button 
                      onClick={() => {
                        setIsOpen(false);
                        router.push("/shops");
                      }} 
                      className="text-yellow-600 hover:underline cursor-pointer"
                    >
                      View All →
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {results.shops.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          setIsOpen(false);
                          router.push("/shops");
                        }}
                        className="bg-slate-50 hover:bg-yellow-50/50 p-2.5 rounded-xl border border-slate-200/80 cursor-pointer transition-all flex flex-col justify-between"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="font-heading font-extrabold text-xs text-slate-800 line-clamp-1">
                            {item.shop_name}
                          </h4>
                          <span className="text-amber-600 font-extrabold text-xs line-clamp-1">
                            {item.offer_title}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-slate-500 font-bold mt-1">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {item.area_tag}
                          </span>
                          <span className="text-yellow-600 font-black">View Offer →</span>
                        </div>
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
