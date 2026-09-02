"use client";

import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { dispatchNotification } from "@/lib/notification-service";

export function useScheduledNotifications() {
  const { user, isVerified, profile } = useAuth();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const userPhone = profile?.phone || localStorage.getItem("namma_thanjai_phone") || localStorage.getItem("my_thanjai_phone") || "";
    if (!userPhone) return;

    const setupTimers = async () => {
      try {
        const todayDate = new Date().toISOString().slice(0, 10);
        const sessionKey = `namma_thanjai_notif_scheduled_${userPhone}_${todayDate}`;
        if (sessionStorage.getItem(sessionKey)) return;
        sessionStorage.setItem(sessionKey, "true");

        // Calculate date-scoped daily activity counters
        let todayViews = 0;
        let todaySaves = 0;

        if (user?.uid) {
          try {
            const listingsQuery = query(collection(db, "listings"), where("userId", "==", user.uid));
            const snapshot = await getDocs(listingsQuery);
            snapshot.forEach((docSnap) => {
              const data = docSnap.data();
              if (data.dailyViews && typeof data.dailyViews === "object") {
                todayViews += Number(data.dailyViews[todayDate] || 0);
              } else {
                todayViews += Number(data.viewsCount || data.views || 0);
              }
              if (data.dailySaves && typeof data.dailySaves === "object") {
                todaySaves += Number(data.dailySaves[todayDate] || 0);
              } else {
                todaySaves += Number(data.savesCount || data.saves || 0);
              }
            });
          } catch (e) {
            console.warn("Analytics fetch note:", e);
          }
        }

        const activityMessage = todayViews > 0 || todaySaves > 0
          ? `Your active posts received ${todayViews} member views and ${todaySaves} saves in Thanjavur today!`
          : "Discover new local marketplace listings and store offers in your area today!";

        // Schedule Native Local Timers
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
                  body: "Explore top festival offers and community listings in Medical College Road & Big Temple areas!",
                  schedule: { at: new Date(now + 10 * 60 * 1000) },
                  sound: "default",
                  actionTypeId: "DAILY_QUOTE",
                  extra: { actionUrl: "/chat?chatId=namma_thanjai_system_welcome" },
                },
                {
                  id: 2002,
                  title: "💬 How is Namma Thanjai?",
                  body: "Vanakkam! We value your experience. Tap to share feedback & help us improve!",
                  schedule: { at: new Date(now + 20 * 60 * 1000) },
                  sound: "default",
                  actionTypeId: "TEAM_FEEDBACK",
                  extra: { actionUrl: "/chat?chatId=namma_thanjai_system_welcome" },
                },
                {
                  id: 2003,
                  title: "📊 Your Daily Activity Update",
                  body: activityMessage,
                  schedule: { at: new Date(now + 24 * 60 * 60 * 1000), repeats: true, every: "day" },
                  sound: "default",
                  actionTypeId: "DAILY_ACTIVITY",
                  extra: { actionUrl: "/listings" },
                },
              ],
            });
          }
        }

        // Dispatch Centralized System Notifications if user is logged in
        if (user?.uid) {
          dispatchNotification({
            recipientUid: user.uid,
            type: "DAILY_ACTIVITY",
            title: "📊 Your Daily Activity Update",
            message: activityMessage,
            conversationId: "namma_thanjai_system_welcome",
            actionUrl: "/listings",
          });
        }
      } catch (e) {
        console.warn("Scheduled notification setup note:", e);
      }
    };

    setupTimers();
  }, [user?.uid, isVerified, profile?.phone]);
}
