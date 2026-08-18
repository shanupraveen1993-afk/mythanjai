"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

export function useBackNavigation() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      // If user is on a main segment page, back button goes to Homepage (/)
      if (
        pathname === "/sell" ||
        pathname === "/need" ||
        pathname === "/services" ||
        pathname === "/shops"
      ) {
        e.preventDefault();
        router.push("/");
      }
      // For /chat and /profile, default browser back (router.back()) navigates to related previous page.
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [pathname, router]);
}
