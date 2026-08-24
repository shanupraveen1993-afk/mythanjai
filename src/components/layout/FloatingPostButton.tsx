"use client";

import React, { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";

export default function FloatingPostButton() {
  const router = useRouter();
  const pathname = usePathname() || "";
  const { user, profile, isVerified } = useAuth();

  // FAB is ONLY visible on the 4 main category segment pages
  const isCategoryPage =
    pathname === "/" ||
    pathname === "/home" ||
    pathname === "/sell" ||
    pathname === "/need" ||
    pathname === "/services" ||
    pathname === "/shops";

  const getButtonConfig = () => {
    if (pathname.includes("/need")) return { label: "+ Post Need", route: "/post/need" };
    if (pathname.includes("/service")) return { label: "+ Post Service", route: "/post/service" };
    if (pathname.includes("/shops") || pathname.includes("/offer")) return { label: "+ Post Offer", route: "/post/offer" };
    return { label: "+ Post Item", route: "/post/sell" };
  };

  const buttonConfig = getButtonConfig();

  const handlePostClick = () => {
    const targetRoute = buttonConfig.route;
    if (!isVerified) {
      if (typeof window !== "undefined") {
        sessionStorage.setItem("namma_thanjai_target_post_route", targetRoute);
        window.dispatchEvent(new Event("namma_thanjai_open_signin"));
      }
      return;
    }
    router.push(targetRoute);
  };

  if (!isCategoryPage) return null;

  return (
    <div className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] right-4 z-[10000] md:hidden animate-fade-in pointer-events-auto">
      <button
        type="button"
        onClick={handlePostClick}
        className="bg-[#FBBF24] hover:bg-amber-400 text-[#0F172A] font-heading font-black text-xs sm:text-sm py-3 px-4 rounded-full shadow-[0_10px_30px_rgba(251,191,36,0.55)] border-2 border-amber-300/90 flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer select-none uppercase tracking-wider"
        aria-label="Create Post"
      >
        <Plus className="w-5 h-5 stroke-[3] text-[#0F172A]" />
        <span>{buttonConfig.label}</span>
      </button>
    </div>
  );
}
