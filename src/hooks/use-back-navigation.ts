"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

export function useBackNavigation() {
  const router = useRouter();
  const pathname = usePathname() || "";

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handlePopState = (e: PopStateEvent) => {
      // If user is on any subpage, back button goes directly to Homepage (/)
      if (pathname !== "/" && pathname !== "/home" && pathname !== "/onboarding") {
        e.preventDefault();
        router.replace("/");
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [pathname, router]);
}
