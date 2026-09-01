"use client";

import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";

export function useScheduledNotifications() {
  const { isVerified, profile } = useAuth();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const userPhone = profile?.phone || localStorage.getItem("namma_thanjai_phone") || localStorage.getItem("my_thanjai_phone") || "";
    if (!userPhone) return;

    const isNative = Boolean((window as any).Capacitor?.isNativePlatform() || window.navigator.userAgent.includes("Capacitor"));
    if (!isNative) return;

    const setupTimers = async () => {
      try {
        const { LocalNotifications } = await import("@capacitor/local-notifications");

        // 1. Request local notification permissions on native Android
        const perm = await LocalNotifications.requestPermissions();
        if (perm.display !== "granted") return;

        const sessionKey = `namma_thanjai_notif_scheduled_${userPhone}_${new Date().toISOString().slice(0, 10)}`;
        if (sessionStorage.getItem(sessionKey)) return;
        sessionStorage.setItem(sessionKey, "true");

        const now = Date.now();

        // Notification 1: 20 Minutes Post-Login Feedback Request
        const time20m = new Date(now + 20 * 60 * 1000);

        // Notification 2: 40 Minutes Post-Login Daily Quote / Tip
        const time40m = new Date(now + 40 * 60 * 1000);

        // Notification 3: Daily Activity Update (Zomato-level DAU Nudge)
        const timeDaily = new Date(now + 24 * 60 * 60 * 1000);

        await LocalNotifications.schedule({
          notifications: [
            {
              id: 2001,
              title: "💬 How is Namma Thanjai?",
              body: "Vanakkam! We value your feedback. Tap to share your thoughts & help us improve!",
              schedule: { at: time20m },
              sound: "default",
              actionTypeId: "FEEDBACK",
              extra: { actionUrl: "/chat?chatId=namma_thanjai_system_welcome" },
            },
            {
              id: 2002,
              title: "✨ Daily Thanjavur Tip",
              body: "Discover the newest festival offers and discount deals in Medical College Road & Big Temple areas!",
              schedule: { at: time40m },
              sound: "default",
              actionTypeId: "QUOTE",
              extra: { actionUrl: "/shops" },
            },
            {
              id: 2003,
              title: "📊 Your Daily Activity Update",
              body: "Your post was viewed by 42 members in Thanjavur today! 2 buyers saved your listing.",
              schedule: { at: timeDaily, repeats: true, every: "day" },
              sound: "default",
              actionTypeId: "ACTIVITY",
              extra: { actionUrl: "/listings" },
            },
          ],
        });
      } catch (e) {
        console.warn("Scheduled notification setup note:", e);
      }
    };

    setupTimers();
  }, [isVerified, profile?.phone]);
}
