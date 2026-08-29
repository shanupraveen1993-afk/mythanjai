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
    <div className="w-full md:hidden bg-slate-50/80 text-slate-800 border-b border-slate-200/80 py-2.5 shadow-2xs">
      <div className="w-full max-w-7xl mx-auto px-2 sm:px-4">
        <div className="grid grid-cols-4 gap-1.5 sm:gap-2.5 w-full max-w-2xl mx-auto">
          {segments.map((seg) => {
            const IconComp = seg.icon;
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
                className={`py-2 px-1 rounded-2xl transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 w-full text-center select-none active:scale-95 ${
                  isActive
                    ? "bg-[#FBBF24] text-slate-950 font-black border border-amber-400/90 shadow-2xs scale-102"
                    : "bg-white text-slate-700 font-bold border border-slate-200/90 hover:bg-amber-50 shadow-2xs"
                }`}
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 shadow-2xs ${isActive ? "bg-slate-950 text-amber-400" : "bg-amber-100 text-amber-800"}`}>
                  <IconComp className="w-3.5 h-3.5 stroke-[2.5]" />
                </div>
                <span className={`text-[11px] leading-none truncate w-full ${isActive ? "font-black text-slate-950" : "font-extrabold text-slate-800"}`}>
                  {seg.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
