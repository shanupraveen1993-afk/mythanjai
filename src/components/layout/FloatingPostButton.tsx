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

  // Hide on main landing page, onboarding, chat, or post creation pages
  const isExcludedRoute = pathname === "/" || pathname === "/onboarding" || pathname === "/chat" || pathname.startsWith("/post");

  // Determine button config based on current route
  const getButtonConfig = () => {
    if (pathname.includes("/need")) {
      return { label: "Post Need", route: "/post/need" };
    }
    if (pathname.includes("/services")) {
      return { label: "Post Service", route: "/post/service" };
    }
    if (pathname.includes("/shops") || pathname.includes("/offers")) {
      return { label: "Post Offer", route: "/post/offer" };
    }
    if (pathname.includes("/sell")) {
      return { label: "Post Item", route: "/post/sell" };
    }
    return { label: "Post / Sell", route: "/post/sell" };
  };

  const { label, route } = getButtonConfig();

  useEffect(() => {
    if (isExcludedRoute) return;

    const mainElement = document.querySelector("main");

    const handleScroll = () => {
      const currentScrollY = mainElement ? mainElement.scrollTop : window.scrollY;

      // Activate on second fold (scrolled past 120px)
      if (currentScrollY > 120) {
        if (currentScrollY < lastScrollY - 4) {
          setIsVisible(true); // Scrolling UP -> Arise from bottom
        } else if (currentScrollY > lastScrollY + 8) {
          setIsVisible(false); // Scrolling DOWN -> Hide into bottom
        } else {
          setIsVisible(true); // Settled on 2nd fold -> Visible
        }
      } else {
        setIsVisible(false);
      }
      setLastScrollY(currentScrollY);
    };

    if (mainElement) {
      mainElement.addEventListener("scroll", handleScroll, { passive: true });
    }
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      if (mainElement) mainElement.removeEventListener("scroll", handleScroll);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [lastScrollY, isExcludedRoute]);

  if (isExcludedRoute) return null;

  return (
    <div
      className={`fixed bottom-20 left-4 right-4 z-40 md:hidden flex justify-center transition-all duration-300 transform ${
        isVisible
          ? "translate-y-0 opacity-100 scale-100 pointer-events-auto"
          : "translate-y-16 opacity-0 scale-90 pointer-events-none"
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
        className="w-full max-w-sm flex items-center justify-center gap-2 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-955 font-heading font-black text-sm px-6 py-3.5 rounded-2xl shadow-[0_8px_28px_rgba(245,158,11,0.45)] border border-amber-300/80 active:scale-95 transition-all cursor-pointer uppercase tracking-wider"
      >
        <Plus className="w-5 h-5 stroke-[3]" />
        <span>{label}</span>
      </button>
    </div>
  );
}


