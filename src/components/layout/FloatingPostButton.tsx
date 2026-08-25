"use client";

import React, { useState, useEffect, useRef } from "react";
import { Plus, ArrowUp, ArrowDown } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";

export default function FloatingPostButton() {
  const router = useRouter();
  const pathname = usePathname() || "";
  const { isVerified } = useAuth();

  const [isVisible, setIsVisible] = useState(true);
  const [scrollTop, setScrollTop] = useState(0);
  const [hasScrolled, setHasScrolled] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrollTop(currentScrollY);
      setHasScrolled(currentScrollY > 120);

      if (currentScrollY <= 20) {
        setIsVisible(true);
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

  const handleScrollAction = () => {
    if (scrollTop > 120) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    }
  };

  // If not a category page and at top, hide post pill on sub-pages
  if (!isCategoryPage && !hasScrolled) return null;

  return (
    <div
      className={`fixed bottom-[calc(4.25rem+env(safe-area-inset-bottom,0px))] left-1/2 -translate-x-1/2 w-[calc(100%-32px)] max-w-[440px] h-[44px] z-[10000] md:hidden transition-all duration-300 ease-out flex items-center justify-between gap-2 p-1 rounded-xl bg-[#0F172A]/95 text-white backdrop-blur-xl border border-slate-700/80 shadow-[0_8px_24px_rgba(0,0,0,0.25)] ${
        isVisible
          ? "translate-y-0 opacity-100 pointer-events-auto"
          : "translate-y-24 opacity-0 pointer-events-none"
      }`}
    >
      {/* Primary Action: Post Ad (on Category Pages) */}
      {isCategoryPage ? (
        <button
          type="button"
          onClick={handlePostClick}
          className="flex-1 h-full bg-[#FBBF24] hover:bg-amber-400 text-[#0F172A] font-heading font-black text-xs sm:text-sm rounded-xl shadow-md flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer select-none uppercase tracking-wider"
          aria-label="Create Post"
        >
          <Plus className="w-4 h-4 stroke-[3] text-[#0F172A]" />
          <span>{buttonConfig.label}</span>
        </button>
      ) : null}

      {/* Universal Scroll Shortcut Pill (Scroll Up / Scroll Down) */}
      {hasScrolled ? (
        <button
          type="button"
          onClick={handleScrollAction}
          className={`h-full px-3.5 bg-slate-800 hover:bg-slate-700 text-amber-300 font-heading font-black text-xs rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 border border-slate-700 ${
            !isCategoryPage ? "w-full text-sm" : "shrink-0"
          }`}
          aria-label="Scroll Action"
        >
          <ArrowUp className="w-4 h-4 stroke-[2.5]" />
          <span>Top</span>
        </button>
      ) : !isCategoryPage ? (
        <button
          type="button"
          onClick={handleScrollAction}
          className="w-full h-full bg-slate-800 hover:bg-slate-700 text-amber-300 font-heading font-black text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 border border-slate-700"
          aria-label="Scroll to Bottom"
        >
          <ArrowDown className="w-4 h-4 stroke-[2.5]" />
          <span>Go to Bottom</span>
        </button>
      ) : null}
    </div>
  );
}
