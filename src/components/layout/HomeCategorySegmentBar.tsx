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
    <div className="w-full md:hidden bg-white border-t border-slate-200/60 border-b border-slate-200/80 pt-1.5 pb-2 shadow-2xs">
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
                className={`py-2 px-1 rounded-2xl transition-all cursor-pointer flex flex-col items-center justify-center gap-1 w-full text-center select-none active:scale-95 ${
                  isActive
                    ? "bg-[#FBBF24] text-slate-950 font-black border-2 border-amber-500 shadow-md scale-[1.02]"
                    : "bg-slate-100/90 hover:bg-slate-200/80 text-slate-700 font-bold border border-slate-200/80 shadow-2xs"
                }`}
              >
                <IconComp className={`w-4.5 h-4.5 transition-all duration-200 ${isActive ? "text-slate-950 fill-slate-950 stroke-[1.2]" : "text-slate-700 stroke-[2] fill-transparent"}`} />
                <span className={`text-[11px] sm:text-xs leading-none truncate w-full ${isActive ? "font-black text-slate-950" : "font-bold text-slate-700"}`}>
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
