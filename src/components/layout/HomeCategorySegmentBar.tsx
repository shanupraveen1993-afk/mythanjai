"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ShoppingBag, Search, Wrench, Tag } from "lucide-react";
import { useScrollDirection } from "@/hooks/use-scroll-direction";

export default function HomeCategorySegmentBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { scrollDirection, isAtTop } = useScrollDirection();

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
    { id: "sell", label: "Buy", route: "/sell", icon: ShoppingBag },
    { id: "need", label: "Wanted", route: "/need", icon: Search },
    { id: "service", label: "Services", route: "/services", icon: Wrench },
    { id: "offer", label: "Offers", route: "/shops", icon: Tag },
  ];

  return (
    <div className="w-full md:hidden bg-white text-slate-800 border-b border-slate-200/80 py-3 shadow-2xs">
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-6">
        <div className="grid grid-cols-4 gap-2 w-full max-w-md mx-auto">
          {segments.map((seg) => {
            const IconComp = seg.icon;
            const isActive = activeTab === seg.id;
            return (
              <div key={seg.id} className="flex flex-col items-center justify-center gap-1.5 w-full text-center">
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== "undefined") {
                      localStorage.setItem("namma_thanjai_active_segment", seg.id);
                    }
                    router.push(seg.route);
                  }}
                  title={seg.label}
                  className={`w-13 h-13 sm:w-14 sm:h-14 rounded-[18px] transition-all cursor-pointer flex items-center justify-center select-none active:scale-95 ${
                    isActive
                      ? "bg-[#FBBF24] text-slate-950 border-2 border-amber-400 shadow-md scale-105"
                      : "bg-[#1F244A] text-white shadow-2xs hover:bg-[#151936]"
                  }`}
                >
                  <IconComp className="w-6 h-6 stroke-[2.2]" />
                </button>
                <span className={`text-[11px] sm:text-xs leading-tight tracking-tight ${isActive ? "font-black text-slate-950" : "font-extrabold text-slate-800"}`}>
                  {seg.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
