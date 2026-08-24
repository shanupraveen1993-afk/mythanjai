"use client";

import React, { useState, useEffect } from "react";
import UniversalSearchBar from "./UniversalSearchBar";
import { Download, Plus } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";

export default function UniversalSearchBarRow() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, profile } = useAuth();
  const isAuthVerified = Boolean(profile?.isVerified);

  const [isNativeApp, setIsNativeApp] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isApk =
        localStorage.getItem("namma_thanjai_is_apk") === "true" ||
        window.location.search.includes("apk=true");
      setIsNativeApp(isApk);
    }
  }, []);

  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > 120 && currentScrollY > lastScrollY) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  // Hide Search Bar Row on Profile, Chat, Post, Admin, and Listings sub-pages
  const isHiddenPage =
    pathname.includes("/profile") ||
    pathname.includes("/chat") ||
    pathname.includes("/post") ||
    pathname.includes("/admin");

  if (isHiddenPage) return null;

  const getDynamicPostRoute = () => {
    if (pathname.includes("/need")) return "/post/need";
    if (pathname.includes("/service")) return "/post/service";
    if (pathname.includes("/shops") || pathname.includes("/offer")) return "/post/offer";
    return "/post/sell";
  };

  const handlePostClick = () => {
    const targetRoute = getDynamicPostRoute();
    if (!isAuthVerified && !user) {
      if (typeof window !== "undefined") {
        sessionStorage.setItem("namma_thanjai_target_post_route", targetRoute);
        window.dispatchEvent(new Event("namma_thanjai_open_signin"));
      }
      return;
    }
    router.push(targetRoute);
  };

  const handleGetAppClick = (e: React.MouseEvent) => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("namma_thanjai_apk_downloaded", "true");
      } catch (err) {}
    }
  };

  return (
    <div
      className={`w-full flex items-center justify-between gap-3 py-1 mt-2 sm:mt-3 sticky top-14 sm:top-16 z-30 bg-[#f8fafc]/95 backdrop-blur-md transition-all duration-300 ${
        isVisible
          ? "translate-y-0 opacity-100"
          : "-translate-y-full opacity-0 pointer-events-none md:translate-y-0 md:opacity-100 md:pointer-events-auto"
      }`}
    >
      {/* Left-Aligned Full Width Search Input */}
      <div className="flex-1 min-w-0">
        <UniversalSearchBar />
      </div>

      {/* Desktop & Website Right-Aligned Golden Yellow Post Ad Button */}
      <button
        type="button"
        onClick={handlePostClick}
        className="hidden md:flex h-10 bg-[#FBBF24] hover:bg-amber-400 text-[#0F172A] font-heading font-black text-xs px-4 rounded-xl shadow-2xs shrink-0 items-center gap-1.5 cursor-pointer transition-all active:scale-95 border border-amber-400/80 ml-auto whitespace-nowrap"
        title="Post a Free Ad in Thanjavur"
        aria-label="Post Ad"
      >
        <Plus className="w-4 h-4 stroke-[3]" />
        <span>Post Ad</span>
      </button>
    </div>
  );
}
