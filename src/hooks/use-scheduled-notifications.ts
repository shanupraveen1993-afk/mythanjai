"use client";

import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export function useScheduledNotifications() {
  const { user, isVerified, profile } = useAuth();

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

        // Notification 1: 10 Minutes Post-Login Daily Quote / Tip (Namma Thanjai Team)
        const time10m = new Date(now + 10 * 60 * 1000);

        // Notification 2: 20 Minutes Post-Login Feedback Request (Namma Thanjai Team)
        const time20m = new Date(now + 20 * 60 * 1000);

        // Notification 3: Daily Activity Summary (Real analytics calculation)
        const timeDaily = new Date(now + 24 * 60 * 60 * 1000);

        // Fetch real analytics activity across user listings in Firestore
        let totalViews = 0;
        let totalSaves = 0;

        if (user?.uid) {
          try {
            const listingsQuery = query(collection(db, "listings"), where("userId", "==", user.uid));
            const snapshot = await getDocs(listingsQuery);
            snapshot.forEach((docSnap) => {
              const data = docSnap.data();
              totalViews += Number(data.viewsCount || data.views || 0);
              totalSaves += Number(data.savesCount || data.saves || 0);
            });
          } catch (e) {
            console.warn("Analytics fetch note:", e);
          }
        }

        const activityMessage = totalViews > 0 || totalSaves > 0
          ? `Your active posts received ${totalViews} member views and ${totalSaves} saves in Thanjavur today!`
          : "Discover new local marketplace listings and store offers in your area today!";

        await LocalNotifications.schedule({
          notifications: [
            {
              id: 2001,
              title: "✨ Namma Thanjai Daily Tip",
              body: "Explore top festival offers and community listings in Medical College Road & Big Temple areas!",
              schedule: { at: time10m },
              sound: "default",
              actionTypeId: "QUOTE",
              extra: { actionUrl: "/chat?chatId=namma_thanjai_system_welcome" },
            },
            {
              id: 2002,
              title: "💬 How is Namma Thanjai?",
              body: "Vanakkam! We value your experience. Tap to share feedback & help us improve!",
              schedule: { at: time20m },
              sound: "default",
              actionTypeId: "FEEDBACK",
              extra: { actionUrl: "/chat?chatId=namma_thanjai_system_welcome" },
            },
            {
              id: 2003,
              title: "📊 Your Daily Activity Update",
              body: activityMessage,
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
  }, [user?.uid, isVerified, profile?.phone]);
}
