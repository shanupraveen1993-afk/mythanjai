"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

export function useNativeApp() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let unmounted = false;

    // 1. Android Native Back Button Listener
    import("@capacitor/app")
      .then(({ App }) => {
        if (unmounted) return;
        App.addListener("backButton", ({ canGoBack }) => {
          if (pathname === "/onboarding") {
            // Exit app on double back on onboarding screen
            App.exitApp();
          } else if (pathname === "/") {
            // Send back to onboarding if on home page
            router.push("/onboarding");
          } else if (canGoBack) {
            router.back();
          } else {
            router.push("/onboarding");
          }
        }).catch(() => {});
      })
      .catch(() => {});

    // 2. Android Native Status Bar Styling — Black status bar icons on light background
    import("@capacitor/status-bar")
      .then(({ StatusBar, Style }) => {
        if (unmounted) return;
        StatusBar.setOverlaysWebView({ overlay: true }).catch(() => {});
        StatusBar.setStyle({ style: Style.Light }).catch(() => {});
      })
      .catch(() => {});

    // 3. Android Native Keyboard Avoidance & Accessories
    import("@capacitor/keyboard")
      .then(({ Keyboard }) => {
        if (unmounted) return;
        Keyboard.setAccessoryBarVisible({ isVisible: false }).catch(() => {});
      })
      .catch(() => {});

    return () => {
      unmounted = true;
    };
  }, [pathname, router]);
}
