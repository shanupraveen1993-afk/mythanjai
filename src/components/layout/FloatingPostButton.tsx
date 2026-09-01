"use client";

import React, { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useScrollDirection } from "@/hooks/use-scroll-direction";

export default function FloatingPostButton() {
  const router = useRouter();
  const pathname = usePathname() || "";
  const { isVerified } = useAuth();
  const { scrollDirection, isAtTop } = useScrollDirection();
  const [shouldHide, setShouldHide] = useState(false);

  useEffect(() => {
    setShouldHide(false);
  }, [pathname]);

  useEffect(() => {
    if (isAtTop) {
      setShouldHide(false);
    } else if (scrollDirection === "down") {
      setShouldHide(true);
    } else if (scrollDirection === "up") {
      setShouldHide(false);
    }
  }, [scrollDirection, isAtTop]);

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
    if (pathname.includes("/need")) return { label: "Post Wanted Ad", route: "/post/need" };
    if (pathname.includes("/service")) return { label: "Post Service", route: "/post/service" };
    if (pathname.includes("/shops") || pathname.includes("/offer")) return { label: "Post Store Offer", route: "/post/offer" };
    return { label: "Post for Sale", route: "/post/sell" };
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
      className="fixed left-1/2 -translate-x-1/2 bottom-[calc(4.8rem+max(env(safe-area-inset-bottom,0px),12px))] z-40 md:hidden select-none active:scale-95 transition-all duration-200 ease-in-out"
    >
      <button
        type="button"
        onClick={handlePostClick}
        className="bg-[#FBBF24] hover:bg-amber-400 text-slate-950 font-heading font-black text-sm rounded-full shadow-xl shadow-amber-500/35 border-2 border-slate-950 flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap px-6 py-3 transition-all duration-200 relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent"
        aria-label={buttonConfig.label}
        title={buttonConfig.label}
      >
        <Plus className="w-5.5 h-5.5 stroke-[3] text-slate-950 shrink-0 relative z-10" />
        <span className="truncate relative z-10">{buttonConfig.label}</span>
      </button>
    </div>
  );
}
