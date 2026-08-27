"use client";

import React, { useState, useEffect, useRef } from "react";
import { Plus } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";

export default function FloatingPostButton() {
  const router = useRouter();
  const pathname = usePathname() || "";
  const { isVerified } = useAuth();

  // Hide FAB on Chat, Profile, My Listings & Post pages per user directive
  if (
    pathname.startsWith("/chat") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/listings") ||
    pathname.startsWith("/post")
  ) {
    return null;
  }

  const getButtonConfig = () => {
    if (pathname.includes("/need")) return { label: "+ Post Wanted Ad", route: "/post/need" };
    if (pathname.includes("/service")) return { label: "+ Post Service", route: "/post/service" };
    if (pathname.includes("/shops") || pathname.includes("/offer")) return { label: "+ Post Store Offer", route: "/post/offer" };
    return { label: "+ Post for Sale", route: "/post/sell" };
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

  return (
    <div
      className="fixed left-1/2 -translate-x-1/2 bottom-[calc(4.25rem+env(safe-area-inset-bottom,0px))] z-[99999] md:hidden select-none pointer-events-auto transition-transform duration-200 active:scale-95"
    >
      <button
        type="button"
        onClick={handlePostClick}
        className="bg-[#FBBF24] hover:bg-amber-400 text-slate-950 font-heading font-black text-xs sm:text-sm px-5 py-2.5 rounded-full shadow-xl shadow-amber-500/25 border-2 border-white flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
        aria-label="Create Post"
      >
        <Plus className="w-4.5 h-4.5 stroke-[3] text-slate-950" />
        <span>{buttonConfig.label}</span>
      </button>
    </div>
  );
}
