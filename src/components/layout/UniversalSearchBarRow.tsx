"use client";

import React, { useState, useEffect } from "react";
import UniversalSearchBar from "./UniversalSearchBar";
import { Download, Plus } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useScrollDirection } from "@/hooks/use-scroll-direction";

export default function UniversalSearchBarRow() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, profile, isVerified } = useAuth();
  const { scrollDirection, isAtTop } = useScrollDirection();

  const [isNativeApp, setIsNativeApp] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isApk =
        localStorage.getItem("namma_thanjai_is_apk") === "true" ||
        window.location.search.includes("apk=true");
      setIsNativeApp(isApk);
    }
  }, []);

  // Hide Search Bar Row on Profile, Chat, Post sub-pages
  const isHiddenPage =
    pathname.includes("/profile") ||
    pathname.includes("/chat") ||
    pathname.includes("/post");

  if (isHiddenPage) return null;

  const getDynamicPostRoute = () => {
    if (pathname.includes("/need")) return "/post/need";
    if (pathname.includes("/service")) return "/post/service";
    if (pathname.includes("/shops") || pathname.includes("/offer")) return "/post/offer";
    return "/post/sell";
  };

  const handlePostClick = () => {
    const targetRoute = getDynamicPostRoute();
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
      className={`w-full sticky top-14 sm:top-16 z-40 bg-white/95 backdrop-blur-md border-y border-slate-200/80 py-3 sm:py-3.5 shadow-2xs my-0 transition-transform duration-300 ${
        scrollDirection === "down" && !isAtTop ? "-translate-y-full md:translate-y-0" : "translate-y-0"
      }`}
    >
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 flex items-center justify-between gap-3">
        {/* Left-Aligned Full Width Search Input */}
        <div className="flex-1 min-w-0">
          <UniversalSearchBar />
        </div>


      </div>
    </div>
  );
}
