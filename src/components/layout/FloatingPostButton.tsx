"use client";

import React, { useState, useEffect } from "react";
import { Plus, Tag } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";

export default function FloatingPostButton() {
  const router = useRouter();
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Hide on onboarding, chat, or post creation pages
  const isExcludedRoute = pathname === "/onboarding" || pathname === "/chat" || pathname.startsWith("/post");

  useEffect(() => {
    if (isExcludedRoute) return;

    const mainElement = document.querySelector("main");
    if (!mainElement) return;

    const handleScroll = () => {
      const currentScrollY = mainElement.scrollTop;

      // Only activate after scrolling down past 250px
      if (currentScrollY < 250) {
        setIsVisible(false);
      } else {
        // Show when scrolling UP, hide when scrolling DOWN
        if (currentScrollY < lastScrollY) {
          setIsVisible(true); // Scrolling UP
        } else {
          setIsVisible(false); // Scrolling DOWN
        }
      }
      setLastScrollY(currentScrollY);
    };

    mainElement.addEventListener("scroll", handleScroll, { passive: true });
    return () => mainElement.removeEventListener("scroll", handleScroll);
  }, [lastScrollY, isExcludedRoute]);

  if (isExcludedRoute) return null;

  return (
    <div
      className={`fixed bottom-20 right-4 z-40 md:hidden transition-all duration-300 transform ${
        isVisible
          ? "translate-y-0 opacity-100 scale-100 pointer-events-auto"
          : "translate-y-16 opacity-0 scale-90 pointer-events-none"
      }`}
    >
      <button
        type="button"
        onClick={() => router.push("/post/sell")}
        className="flex items-center gap-2 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-slate-955 font-heading font-black text-xs px-4 py-3 rounded-full shadow-[0_4px_20px_rgba(234,179,8,0.4)] border border-yellow-300 active:scale-95 transition-transform cursor-pointer"
      >
        <Plus className="w-4 h-4 stroke-[3]" />
        <span className="uppercase tracking-wider">Post / Sell</span>
      </button>
    </div>
  );
}
