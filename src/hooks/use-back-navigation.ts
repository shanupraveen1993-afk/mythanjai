"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

export function useBackNavigation() {
  const router = useRouter();
  const pathname = usePathname() || "";

  useEffect(() => {
    if (typeof window === "undefined") return;

    let listenerHandler: any = null;

    const setupCapacitorBack = async () => {
      try {
        const { App } = await import("@capacitor/app");

        listenerHandler = await App.addListener("backButton", ({ canGoBack }) => {
          if (pathname === "/" || pathname === "/home" || pathname === "/sell") {
            // Home feed: Exit app on back
            App.exitApp();
          } else {
            // Subpages: Return to previous screen in stack if available, otherwise fallback to Home
            if (typeof window !== "undefined" && window.history.length > 1) {
              router.back();
            } else {
              router.push("/");
            }
          }
        });
      } catch (e) {
        // Non-native fallback handled by browser history
      }
    };

    setupCapacitorBack();

    return () => {
      if (listenerHandler && typeof listenerHandler.remove === "function") {
        listenerHandler.remove();
      }
    };
  }, [pathname, router]);
}
