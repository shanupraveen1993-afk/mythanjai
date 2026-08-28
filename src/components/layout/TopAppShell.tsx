"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useScrollDirection } from "@/hooks/use-scroll-direction";

interface TopAppShellProps {
  children: React.ReactNode;
}

export default function TopAppShell({ children }: TopAppShellProps) {
  const pathname = usePathname() || "";
  const { scrollDirection, isAtTop } = useScrollDirection();
  const [shouldHide, setShouldHide] = useState(false);

  // Rule 1: Reset top shell to fully visible on route changes
  useEffect(() => {
    setShouldHide(false);
  }, [pathname]);

  // Rule 2: Synchronize scroll direction state
  useEffect(() => {
    if (isAtTop) {
      setShouldHide(false);
    } else if (scrollDirection === "down") {
      setShouldHide(true);
    } else if (scrollDirection === "up") {
      setShouldHide(false);
    }
  }, [scrollDirection, isAtTop]);

  return (
    <div className="sticky top-0 z-40 w-full bg-[#E2E6FE] pointer-events-auto">
      {children}
    </div>
  );
}
