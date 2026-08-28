"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

let lastBackPressTime = 0;

export function useNativeApp() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let backListener: any = null;

    // 1. Android Native Back Button Listener (History Navigation & Double-Back Exit Protection)
    import("@capacitor/app")
      .then(({ App }) => {
        App.addListener("backButton", () => {
          const currentPath = typeof window !== "undefined" ? window.location.pathname : (pathname || "");
          const isMainTab =
            currentPath === "/" ||
            currentPath === "/home" ||
            currentPath === "/sell" ||
            currentPath === "/need" ||
            currentPath === "/services" ||
            currentPath === "/shops";

          if (!isMainTab) {
            // On sub-routes (e.g. /chat, /listings, /profile, /post/*, /search): Navigate back safely
            if (typeof window !== "undefined" && window.history.length > 1) {
              window.history.back();
            } else {
              router.replace("/");
            }
          } else {
            // On main tab root pages: Require double-back press within 2 seconds to exit app
            const now = Date.now();
            if (now - lastBackPressTime < 2000) {
              App.exitApp();
            } else {
              lastBackPressTime = now;
              window.dispatchEvent(
                new CustomEvent("namma_thanjai_toast", {
                  detail: { message: "Press back again to exit app", type: "info" },
                })
              );
            }
          }
        }).then((handle) => {
          backListener = handle;
        }).catch(() => {});
      })
      .catch(() => {});

    // 2. Android Native Status Bar Styling — Black status bar icons on light background
    import("@capacitor/status-bar")
      .then(({ StatusBar, Style }) => {
        StatusBar.setOverlaysWebView({ overlay: true }).catch(() => {});
        StatusBar.setStyle({ style: Style.Light }).catch(() => {});
      })
      .catch(() => {});

    // 3. Android Native Keyboard Avoidance & Accessories
    import("@capacitor/keyboard")
      .then(({ Keyboard }) => {
        Keyboard.setAccessoryBarVisible({ isVisible: false }).catch(() => {});
      })
      .catch(() => {});

    return () => {
      if (backListener && typeof backListener.remove === "function") {
        backListener.remove();
      }
    };
  }, [pathname, router]);
}
