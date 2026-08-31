"use client";

import React, { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";

const ROTATING_SEARCH_SUGGESTIONS = [
  "Search for Cars & Bikes...",
  "Search for Plumbers & Electricians...",
  "Search for Store Offers & Discounts...",
  "Search for Houses & Apartments...",
  "Search for Mobiles & Laptops...",
  "Search for Home Furniture...",
  "Search for Tutors & Classes...",
  "Search for Photographers & Caterers...",
  "Search for AC & Appliance Repair...",
  "Search for Anything in Thanjavur...",
];

export default function UniversalSearchBar() {
  const router = useRouter();
  const [suggestionIndex, setSuggestionIndex] = useState(0);

  // Rotate subtle search suggestion text every 2.5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setSuggestionIndex((prev) => (prev + 1) % ROTATING_SEARCH_SUGGESTIONS.length);
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  const handleLaunchSearch = () => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("namma_thanjai_search_referrer", window.location.pathname);
    }
    router.push("/search");
  };

  return (
    <div
      onClick={handleLaunchSearch}
      className="relative flex items-center w-full h-10 bg-slate-100/90 hover:bg-slate-100 border border-slate-200/90 rounded-xl px-3 shadow-2xs transition-all cursor-pointer select-none overflow-hidden group"
    >
      <Search className="w-4 h-4 text-slate-400 group-hover:text-slate-600 shrink-0 mr-2 transition-colors" />
      
      {/* Subtle rotational placeholder text */}
      <span className="text-xs sm:text-sm text-slate-400/80 font-normal tracking-normal truncate transition-all">
        {ROTATING_SEARCH_SUGGESTIONS[suggestionIndex]}
      </span>
    </div>
  );
}
