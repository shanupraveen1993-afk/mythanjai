"use client";

import React, { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useScrollDirection } from "@/hooks/use-scroll-direction";

interface TopAppShellProps {
  children: React.ReactNode;
}

export default function TopAppShell({ children }: TopAppShellProps) {
  const pathname = usePathname() || "";
  const { scrollDirection, isAtTop } = useScrollDirection();
  const [shouldHide, setShouldHide] = useState(false);
  const shellRef = useRef<HTMLDivElement>(null);

  // Dynamic Height Observer: Updates --top-shell-height CSS variable on root
  useEffect(() => {
    const updateShellHeight = () => {
      if (shellRef.current && typeof window !== "undefined") {
        const height = shellRef.current.getBoundingClientRect().height;
        if (height > 0) {
          document.documentElement.style.setProperty("--top-shell-height", `${height}px`);
        }
      }
    };

    updateShellHeight();

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined" && shellRef.current) {
      resizeObserver = new ResizeObserver(() => updateShellHeight());
      resizeObserver.observe(shellRef.current);
    }

    window.addEventListener("resize", updateShellHeight);
    return () => {
      window.removeEventListener("resize", updateShellHeight);
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, [children, pathname]);

  // Rule 1: Reset top shell to fully visible on route changes
  // Rule: Sticky Scroll-Hide Header ONLY on the exact 4 marketplace feed routes
  const isMarketplaceFeed =
    pathname === "/" ||
    pathname === "/sell" ||
    pathname === "/need" ||
    pathname === "/services" ||
    pathname === "/shops";

  useEffect(() => {
    // Reset hide state on route change
    setShouldHide(false);
  }, [pathname]);

  // Synchronize scroll hiding ONLY for Marketplace Feed pages
  useEffect(() => {
    if (!isMarketplaceFeed) {
      setShouldHide(false);
      return;
    }

    if (isAtTop) {
      setShouldHide(false);
    } else if (scrollDirection === "down") {
      setShouldHide(true);
    } else if (scrollDirection === "up") {
      setShouldHide(false);
    }
  }, [scrollDirection, isAtTop, isMarketplaceFeed]);

  return (
    <div
      ref={shellRef}
      className={`fixed top-0 left-0 right-0 z-50 w-full bg-white/98 backdrop-blur-xl border-b border-slate-200/90 shadow-sm rounded-b-2xl sm:rounded-b-3xl md:rounded-b-none transition-transform duration-300 ease-in-out ${
        shouldHide ? "-translate-y-full pointer-events-none" : "translate-y-0 pointer-events-auto"
      }`}
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
    >
      {children}
    </div>
  );
}
