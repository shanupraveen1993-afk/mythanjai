"use client";

import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export function useFcmToken() {
  const { user } = useAuth();

  useEffect(() => {
    if (typeof window === "undefined" || !user?.uid) return;

    const setupFcmToken = async () => {
      try {
        const isNative = Boolean((window as any).Capacitor?.isNativePlatform() || window.navigator.userAgent.includes("Capacitor"));

        if (isNative) {
          const { PushNotifications } = await import("@capacitor/push-notifications");

          let perm = await PushNotifications.checkPermissions();
          if (perm.receive !== "granted") {
            perm = await PushNotifications.requestPermissions();
          }

          if (perm.receive === "granted") {
            await PushNotifications.register();

            PushNotifications.addListener("registration", async (tokenData) => {
              if (tokenData?.value) {
                const tokenHash = btoa(tokenData.value).replace(/=/g, "").slice(0, 20);
                const deviceRef = doc(db, "users", user.uid, "devices", tokenHash);

                await setDoc(deviceRef, {
                  token: tokenData.value,
                  platform: "android",
                  lastUpdated: serverTimestamp(),
                }, { merge: true });
              }
            });
          }
        }
      } catch (e) {
        console.warn("FCM token registration note:", e);
      }
    };

    setupFcmToken();
  }, [user?.uid]);
}
