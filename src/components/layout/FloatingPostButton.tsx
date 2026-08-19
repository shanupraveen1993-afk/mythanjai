"use client";

import React, { useState, useEffect } from "react";
import { Plus, Tag } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";

import { useAuth } from "@/hooks/use-auth";

export default function FloatingPostButton() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, profile } = useAuth();
  const isAuthVerified = Boolean(profile?.isVerified || user);
  const [isVisible, setIsVisible] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  // GUARANTEE: Floating Scroll-Up Post Button is strictly enabled ONLY on the 4 category segment pages
  const isCategoryPage = pathname === "/sell" || pathname === "/need" || pathname === "/services" || pathname === "/shops";

  // Determine button config based on current route
  const getButtonConfig = () => {
    if (pathname === "/need") {
      return { label: "Post Need", route: "/post/need" };
    }
    if (pathname === "/services") {
      return { label: "Post Service", route: "/post/service" };
    }
    if (pathname === "/shops") {
      return { label: "Post Offer", route: "/post/offer" };
    }
    return { label: "Post Item", route: "/post/sell" };
  };

  const { label, route } = getButtonConfig();

  useEffect(() => {
    if (!isCategoryPage) return;

    const handleScroll = () => {
      const currentScrollY = window.scrollY || document.documentElement.scrollTop || 0;

      // Activate on second fold (scrolled past 80px)
      if (currentScrollY > 80) {
        if (currentScrollY < lastScrollY - 2) {
          setIsVisible(true); // Scrolling UP -> Arise from bottom
        } else if (currentScrollY > lastScrollY + 6) {
          setIsVisible(false); // Scrolling DOWN -> Hide into bottom
        } else {
          setIsVisible(true); // Settled on 2nd fold -> Visible
        }
      } else {
        setIsVisible(false);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Initial check

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [lastScrollY, isCategoryPage]);

  if (!isCategoryPage) return null;

  return (
    <div
      style={{ bottom: "calc(5.75rem + env(safe-area-inset-bottom, 0px))" }}
      className={`fixed left-1/2 -translate-x-1/2 z-[10000] md:hidden transition-all duration-300 transform ${
        isVisible
          ? "translate-y-0 opacity-100 pointer-events-auto"
          : "translate-y-20 opacity-0 pointer-events-none"
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
        className="flex items-center gap-1.5 px-5 py-2.5 bg-[#FBBF24] hover:bg-amber-400 text-[#0F172A] font-heading font-black text-xs rounded-full shadow-lg cursor-pointer select-none active:scale-95 transition-all uppercase tracking-wide border border-amber-400/60 whitespace-nowrap"
      >
        <Plus className="w-4 h-4 stroke-[3] shrink-0 text-[#0F172A]" />
        <span>{label}</span>
      </button>
    </div>
  );
}

