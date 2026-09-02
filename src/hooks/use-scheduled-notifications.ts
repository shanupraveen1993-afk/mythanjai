"use client";

import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";

/**
 * Hook: useScheduledNotifications
 * Enforces Section 23 of Namma Thanjai Notification Specification:
 * - Rule #23: Welcome greeting stays inside Team Chat (ZERO push notification on login).
 * - Step 1 (0m): In-App Team Chat Greeting (No Push).
 * - Step 2 (+10m): Daily Tip / Local Quote Push (id: 2001).
 * - Step 3 (+20m): Team Feedback Prompt (id: 2002).
 * - Step 4 (+24h): Daily Activity Update (id: 2003).
 * - Minimum 10-minute gap between automated system notification dispatches.
 */
export function useScheduledNotifications() {
  const { user, isVerified, profile } = useAuth();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const userPhone = profile?.phone || localStorage.getItem("namma_thanjai_phone") || localStorage.getItem("my_thanjai_phone") || "";
    if (!userPhone) return;

    const setupStaggeredTimers = async () => {
      try {
        const todayDate = new Date().toISOString().slice(0, 10);
        const sessionKey = `namma_thanjai_staggered_notif_${userPhone}_${todayDate}`;
        if (sessionStorage.getItem(sessionKey)) return;
        sessionStorage.setItem(sessionKey, "true");

        // Schedule Native Local Notifications on Android / iOS with exact staggered intervals
        const isNative = Boolean((window as any).Capacitor?.isNativePlatform() || window.navigator.userAgent.includes("Capacitor"));
        if (isNative) {
          const { LocalNotifications } = await import("@capacitor/local-notifications");
          const perm = await LocalNotifications.requestPermissions();
          if (perm.display === "granted") {
            const now = Date.now();
            await LocalNotifications.schedule({
              notifications: [
                {
                  id: 2001,
                  title: "✨ Namma Thanjai Daily Tip",
                  body: "Explore top festival offers & community listings in Medical College Road & Big Temple areas!",
                  schedule: { at: new Date(now + 10 * 60 * 1000) }, // +10 Minutes
                  sound: "default",
                  actionTypeId: "DAILY_QUOTE",
                  extra: { actionUrl: "/chat?chatId=namma_thanjai_system_welcome" },
                },
                {
                  id: 2002,
                  title: "💬 How is Namma Thanjai?",
                  body: "Vanakkam! We value your experience. Tap to share feedback & help us improve!",
                  schedule: { at: new Date(now + 20 * 60 * 1000) }, // +20 Minutes
                  sound: "default",
                  actionTypeId: "TEAM_FEEDBACK",
                  extra: { actionUrl: "/chat?chatId=namma_thanjai_system_welcome" },
                },
                {
                  id: 2003,
                  title: "📊 Your Daily Activity Update",
                  body: "Discover new local marketplace listings and store offers in your area today!",
                  schedule: { at: new Date(now + 24 * 60 * 60 * 1000), repeats: true, every: "day" }, // +24 Hours (Next Day)
                  sound: "default",
                  actionTypeId: "DAILY_ACTIVITY",
                  extra: { actionUrl: "/listings" },
                },
              ],
            });
          }
        }

        // NOTE: No immediate dispatchNotification() on login.
        // Rule #23: Initial welcome greeting is inside Team Chat without push distraction.
        // Daily activity and feedback prompts are scheduled for +20m / +24h to avoid notification spam on boot.
      } catch (e) {
        console.warn("Scheduled notification setup note:", e);
      }
    };

    setupStaggeredTimers();
  }, [user?.uid, isVerified, profile?.phone]);
}
