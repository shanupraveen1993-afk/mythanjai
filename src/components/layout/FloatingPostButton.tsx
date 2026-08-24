"use client";

import React, { useState, useEffect, useRef } from "react";
import { Plus } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";

export default function FloatingPostButton() {
  const router = useRouter();
  const pathname = usePathname() || "";
  const { isVerified } = useAuth();

  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY <= 20) {
        setIsVisible(true); // Always 100% visible at top of page
      } else if (currentScrollY > lastScrollY.current + 10) {
        setIsVisible(false); // Hide on scroll down
      } else if (currentScrollY < lastScrollY.current - 10) {
        setIsVisible(true); // Show on scroll up
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
    <div
      className={`fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] left-4 right-4 max-w-md mx-auto z-[10000] md:hidden transition-all duration-300 ease-out ${
        isVisible
          ? "translate-y-0 opacity-100 pointer-events-auto"
          : "translate-y-24 opacity-0 pointer-events-none"
      }`}
    >
      <button
        type="button"
        onClick={handlePostClick}
        className="w-full bg-[#FBBF24] hover:bg-amber-400 text-[#0F172A] font-heading font-black text-sm py-3 px-5 rounded-2xl shadow-[0_10px_30px_rgba(251,191,36,0.55)] border-2 border-amber-300/90 flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer select-none uppercase tracking-wider"
        aria-label="Create Post"
      >
        <Plus className="w-5 h-5 stroke-[3] text-[#0F172A]" />
        <span>{buttonConfig.label}</span>
      </button>
    </div>
  );
}
