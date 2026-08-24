"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";

export default function HomeCategorySegmentBar() {
  const router = useRouter();
  const pathname = usePathname();

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
    <div className="w-full md:hidden sticky top-14 z-40 bg-[#f8fafc]/95 backdrop-blur-md py-2 border-b border-slate-200/80 shadow-2xs -mx-3 px-3 sm:-mx-6 sm:px-6">
      <div className="grid grid-cols-4 gap-1.5 w-full">
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
              className={`py-2 px-1 rounded-xl font-heading font-black text-xs transition-all cursor-pointer flex items-center justify-center w-full text-center ${
                isActive
                  ? "bg-[#FBBF24] text-[#0F172A] shadow-xs border border-amber-400 font-extrabold scale-102"
                  : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <span className="truncate w-full">{seg.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
