"use client";

import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

async function sha256Hash(message: string): Promise<string> {
  if (typeof window === "undefined" || !window.crypto?.subtle) {
    return btoa(message).replace(/=/g, "").slice(0, 32);
  }
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function useFcmToken() {
  const { user } = useAuth();

  useEffect(() => {
    if (typeof window === "undefined" || !user?.uid) return;

    const registerPushToken = async () => {
      try {
        const isNative = Boolean((window as any).Capacitor?.isNativePlatform() || window.navigator.userAgent.includes("Capacitor"));
        const platform = isNative
          ? window.navigator.userAgent.includes("iPhone") || window.navigator.userAgent.includes("iPad")
            ? "ios"
            : "android"
          : "web";

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
                const tokenHash = await sha256Hash(tokenData.value);
                const deviceRef = doc(db, "users", user.uid, "devices", tokenHash);

                await setDoc(
                  deviceRef,
                  {
                    token: tokenData.value,
                    platform,
                    userId: user.uid,
                    lastUpdated: serverTimestamp(),
                  },
                  { merge: true }
                );
              }
            });
          }
        } else {
          // Web / PWA Push Notification Registration
          if ("Notification" in window && "serviceWorker" in navigator) {
            let perm = Notification.permission;
            if (perm === "default") {
              perm = await Notification.requestPermission();
            }

            if (perm === "granted") {
              try {
                const { getMessaging, getToken } = await import("firebase/messaging");
                const app = (await import("@/lib/firebase")).default;
                const messaging = getMessaging(app);

                const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
                const token = await getToken(messaging, vapidKey ? { vapidKey } : undefined);

                if (token) {
                  const tokenHash = await sha256Hash(token);
                  const deviceRef = doc(db, "users", user.uid, "devices", tokenHash);

                  await setDoc(
                    deviceRef,
                    {
                      token,
                      platform: "web",
                      userId: user.uid,
                      lastUpdated: serverTimestamp(),
                    },
                    { merge: true }
                  );
                }
              } catch (webPushErr) {
                console.warn("Web FCM token registration note:", webPushErr);
              }
            }
          }
        }
      } catch (e) {
        console.warn("FCM token registration note:", e);
      }
    };

    registerPushToken();
  }, [user?.uid]);
}
