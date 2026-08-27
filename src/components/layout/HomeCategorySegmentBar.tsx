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
    <div
      className={`w-full md:hidden sticky transition-all duration-300 z-40 bg-white/98 backdrop-blur-md pt-1.5 pb-2 shadow-[0_4px_16px_rgba(0,0,0,0.06)] ${
        scrollDirection === "down" && !isAtTop
          ? "top-[max(env(safe-area-inset-top,0px),8px)]"
          : "top-[calc(3.5rem+max(env(safe-area-inset-top,0px),12px))]"
      }`}
    >
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
                className={`py-2 px-1 rounded-xl transition-all cursor-pointer flex flex-col items-center justify-center gap-1 w-full text-center ${
                  isActive
                    ? "bg-[#FBBF24] text-slate-950 font-bold border border-amber-400/90 shadow-2xs"
                    : "bg-white text-slate-700 hover:text-slate-950 border border-slate-200/90 font-semibold"
                }`}
              >
                <IconComp className={`w-4 h-4 stroke-[2.2] ${isActive ? "text-slate-950" : "text-slate-600"}`} />
                <span className="text-[11px] sm:text-xs font-bold leading-none truncate w-full">{seg.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
