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
    pathname.startsWith("/post") ||
    pathname.startsWith("/admin")
  ) {
    return null;
  }

  // Hidden by default on initial page load per user directive
  const [isVisible, setIsVisible] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Until user touches scroll past 80px, keep hidden
      if (currentScrollY <= 80) {
        setIsVisible(false);
      } else if (currentScrollY > lastScrollY.current + 8) {
        // Scrolling DOWN -> Hide FAB
        setIsVisible(false);
      } else if (currentScrollY < lastScrollY.current - 8) {
        // Scrolling UP -> Show FAB
        setIsVisible(true);
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const getButtonConfig = () => {
    if (pathname.includes("/need")) return { label: "+ Post Your Need", route: "/post/need" };
    if (pathname.includes("/service")) return { label: "+ Post Your Service", route: "/post/service" };
    if (pathname.includes("/shops") || pathname.includes("/offer")) return { label: "+ Post an Offer", route: "/post/offer" };
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
      className={`fixed bottom-20 sm:bottom-22 left-1/2 -translate-x-1/2 z-[10000] md:hidden transition-all duration-300 ease-out select-none ${
        isVisible
          ? "translate-y-0 opacity-100 pointer-events-auto"
          : "translate-y-16 opacity-0 pointer-events-none"
      }`}
    >
      <button
        type="button"
        onClick={handlePostClick}
        className="bg-[#FBBF24] hover:bg-amber-400 text-slate-950 font-heading font-black text-xs px-5 py-2.5 rounded-xl shadow-xl shadow-slate-950/25 flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-95 whitespace-nowrap"
        aria-label="Create Post"
      >
        <Plus className="w-4 h-4 stroke-[3] text-slate-950" />
        <span>{buttonConfig.label}</span>
      </button>
    </div>
  );
}
