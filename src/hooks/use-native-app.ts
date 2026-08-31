"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

const routeStack: string[] = ["/"];
let lastBackPressTime = 0;

export function useNativeApp() {
  const router = useRouter();
  const pathname = usePathname() || "";

  // 1. Maintain in-memory route history stack
  useEffect(() => {
    if (typeof window !== "undefined") {
      const current = window.location.pathname;
      if (routeStack[routeStack.length - 1] !== current) {
        routeStack.push(current);
        if (routeStack.length > 25) routeStack.shift();
      }
    }
  }, [pathname]);

  // 2. Android Native Back Button Listener (Stack Navigation & Double-Back Exit Protection)
  useEffect(() => {
    let backListener: any = null;

    import("@capacitor/app")
      .then(({ App }) => {
        App.addListener("backButton", () => {
          const currentPath = typeof window !== "undefined" ? window.location.pathname : pathname;

          // A. If active mobile chat room is open on /chat, close chat room view first
          if (typeof window !== "undefined" && currentPath.includes("/chat")) {
            const isMobileChatVisible = document.querySelector(".lg\\:flex-1.bg-\\[\\#efeae2\\]");
            window.dispatchEvent(new Event("namma_thanjai_close_mobile_chat"));
          }

          // B. If any modal overlay is open, dispatch close event
          if (typeof window !== "undefined") {
            const openModal = document.querySelector(".fixed.inset-0.z-\\[99999\\], .fixed.inset-0.z-50");
            if (openModal) {
              window.dispatchEvent(new Event("namma_thanjai_close_all_modals"));
              return;
            }
          }

          // B. Check if user is at the absolute home root ("/" or "/home")
          const isHomeRoot = currentPath === "/" || currentPath === "/home";

          if (isHomeRoot) {
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
          } else {
            // C. On any other page (/sell, /need, /services, /shops, /chat, /profile, /listings, /post/*):
            // Pop the current route and navigate back to previous route in stack or "/"
            routeStack.pop();
            const targetRoute = routeStack[routeStack.length - 1] || "/";
            router.push(targetRoute);
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

    // 3. Android Native Keyboard Avoidance & Body Resize Mode
    import("@capacitor/keyboard")
      .then(({ Keyboard, KeyboardResize }) => {
        Keyboard.setAccessoryBarVisible({ isVisible: false }).catch(() => {});
        if (KeyboardResize && KeyboardResize.Body) {
          Keyboard.setResizeMode({ mode: KeyboardResize.Body }).catch(() => {});
        }
      })
      .catch(() => {});

    // 4. Android Native Push & Local Notifications Listener for System Status Bar Alerts
    const pushTimer = setTimeout(() => {
      // A. Request Native Local Notifications Permission for Android System Status Bar
      import("@capacitor/local-notifications")
        .then(({ LocalNotifications }) => {
          LocalNotifications.requestPermissions()
            .then((permResult) => {
              if (permResult.display === "granted") {
                // Ensure notification channel is created for Android 8+
                LocalNotifications.createChannel({
                  id: "namma_thanjai_alerts",
                  name: "Namma Thanjai System Alerts",
                  description: "Real-time chat and listing alerts for Namma Thanjai",
                  importance: 5,
                  visibility: 1,
                  sound: "default",
                  vibration: true,
                }).catch(() => {});
              }
            })
            .catch(() => {});

          LocalNotifications.addListener("localNotificationActionPerformed", (action) => {
            if (action.notification.extra?.actionUrl) {
              router.push(action.notification.extra.actionUrl);
            }
          }).catch(() => {});
        })
        .catch(() => {});

      // B. Request Push Notifications Permission
      import("@capacitor/push-notifications")
        .then(({ PushNotifications }) => {
          PushNotifications.requestPermissions()
            .then((result) => {
              if (result.receive === "granted") {
                PushNotifications.register().catch(() => {});
              }
            })
            .catch(() => {});

          PushNotifications.addListener("pushNotificationReceived", (notification) => {
            if (typeof window !== "undefined") {
              window.dispatchEvent(
                new CustomEvent("namma_thanjai_toast", {
                  detail: { message: `${notification.title}: ${notification.body}`, type: "info" },
                })
              );
            }
          }).catch(() => {});

          PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
            if (action.notification.data?.actionUrl) {
              router.push(action.notification.data.actionUrl);
            }
          }).catch(() => {});
        })
        .catch(() => {});
    }, 1500);

    return () => {
      clearTimeout(pushTimer);
      if (backListener && typeof backListener.remove === "function") {
        backListener.remove();
      }
    };
  }, [pathname, router]);
}
