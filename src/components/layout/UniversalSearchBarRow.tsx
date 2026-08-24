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
    <div className="w-full max-w-2xl mx-auto flex items-center gap-2 py-1 sticky top-12 md:static z-30 bg-[#f8fafc]/95 backdrop-blur-md">
      {/* Shortened Width Compact Search Bar */}
      <div className="flex-1 min-w-0">
        <UniversalSearchBar />
      </div>

      {/* Free-Hand Golden Yellow Post Ad Button (Standard Normal Size) */}
      <button
        type="button"
        onClick={handlePostClick}
        className="h-10 bg-[#FBBF24] hover:bg-amber-400 text-[#0F172A] font-heading font-black text-xs px-4 rounded-xl shadow-2xs shrink-0 flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 border border-amber-400/80"
        title="Post a Free Ad in Thanjavur"
        aria-label="Post Ad"
      >
        <Plus className="w-3.5 h-3.5 stroke-[3]" />
        <span>Post</span>
      </button>
    </div>
  );
}
