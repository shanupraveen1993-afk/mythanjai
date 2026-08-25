"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function HomeCategorySegmentBar() {
  const router = useRouter();
  const pathname = usePathname();

  const [isNativeApp, setIsNativeApp] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isApk =
        localStorage.getItem("namma_thanjai_is_apk") === "true" ||
        window.location.search.includes("apk=true");
      setIsNativeApp(isApk);
    }
    // Prefetch all 4 category segment routes on mount for instant 0-delay switching
    router.prefetch("/sell");
    router.prefetch("/need");
    router.prefetch("/services");
    router.prefetch("/shops");
  }, [router]);

  const getActiveTab = () => {
    if (pathname.includes("/need")) return "need";
    if (pathname.includes("/service")) return "service";
    if (pathname.includes("/shops") || pathname.includes("/offer")) return "offer";
    return "sell";
  };

  const activeTab = getActiveTab();

  const segments = [
    { id: "sell", label: "Sell", route: "/sell" },
    { id: "need", label: "Need", route: "/need" },
    { id: "service", label: "Service", route: "/services" },
    { id: "offer", label: "Offer", route: "/shops" },
  ];

  return (
    <div className="w-full md:hidden sticky top-[110px] z-30 bg-slate-50/98 backdrop-blur-md pt-2 pb-2 border-b border-slate-200/80 shadow-2xs transition-all">
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-6">
        <div className="grid grid-cols-4 gap-1.5 sm:gap-2.5 w-full max-w-2xl mx-auto">
        {segments.map((seg) => {
          const isActive = activeTab === seg.id;
          return (
            <button
              key={seg.id}
              type="button"
              onClick={() => {
                if (typeof window !== "undefined") {
                  localStorage.setItem("namma_thanjai_active_segment", seg.id);
                }
                router.push(seg.route);
              }}
              className={`py-2 px-3 rounded-xl text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center w-full text-center ${
                isActive
                  ? "bg-[#FBBF24] text-slate-950 font-bold border border-amber-400/90 shadow-2xs"
                  : "bg-white text-slate-700 hover:text-slate-950 border border-slate-200/90 font-semibold"
              }`}
            >
              <span className="truncate w-full">{seg.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  </div>
);
}
