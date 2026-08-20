"use client";

import React, { useState, useEffect, useRef } from "react";
import { Plus } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";

export default function FloatingPostButton() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, profile } = useAuth();
  const isAuthVerified = Boolean(profile?.isVerified || user);
  const [isVisible, setIsVisible] = useState(false);
  // useRef instead of useState — prevents scroll listener re-registration on every scroll
  const lastScrollY = useRef(0);

  const isCategoryPage =
    pathname === "/sell" ||
    pathname === "/need" ||
    pathname === "/services" ||
    pathname === "/shops";

  const getButtonConfig = () => {
    if (pathname === "/need") return { label: "Post Need", route: "/post/need" };
    if (pathname === "/services") return { label: "Post Service", route: "/post/service" };
    if (pathname === "/shops") return { label: "Post Offer", route: "/post/offer" };
    return { label: "Post Item", route: "/post/sell" };
  };

  const { label, route } = getButtonConfig();

  useEffect(() => {
    if (!isCategoryPage) return;

    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY || document.documentElement.scrollTop || 0;
          if (currentScrollY > 60) {
            if (currentScrollY < lastScrollY.current - 2) {
              setIsVisible(true);
            } else if (currentScrollY > lastScrollY.current + 6) {
              setIsVisible(false);
            } else {
              setIsVisible(true);
            }
          } else {
            setIsVisible(false);
          }
          lastScrollY.current = currentScrollY;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isCategoryPage]); // Only isCategoryPage dep — no scroll-triggered re-registration

  if (!isCategoryPage) return null;

  return (
    <div
      style={{
        bottom: "calc(4.75rem + env(safe-area-inset-bottom, 12px))",
        willChange: "transform, opacity",
      }}
      className={`fixed left-4 right-4 max-w-md mx-auto z-[10000] md:hidden transition-all duration-300 transform-gpu ${
        isVisible
          ? "translate-y-0 opacity-100 pointer-events-auto"
          : "translate-y-16 opacity-0 pointer-events-none"
      }`}
    >
      <button
        type="button"
        onClick={() => {
          if (!isAuthVerified) {
            if (typeof window !== "undefined") {
              localStorage.setItem("namma_thanjai_target_post_route", route);
              window.dispatchEvent(new Event("namma_thanjai_open_signin"));
            }
            return;
          }
          router.push(route);
        }}
        className="w-full flex items-center justify-center gap-2 py-3 px-5 bg-[#FBBF24] hover:bg-amber-400 text-[#0F172A] font-heading font-black text-sm rounded-xl shadow-xl cursor-pointer select-none active:scale-[0.97] transition-all uppercase tracking-wide border border-amber-400/60 touch-manipulation"
      >
        <Plus className="w-4 h-4 stroke-[3] shrink-0 text-[#0F172A]" />
        <span>{label}</span>
      </button>
    </div>
  );
}
