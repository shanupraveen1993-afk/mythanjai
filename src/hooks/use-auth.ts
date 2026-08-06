"use client";

import React, { useState, useEffect, createContext, useContext } from "react";
import { auth, db } from "@/lib/firebase";
import { signInAnonymously, onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { UserProfile } from "@/types";

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  updatePhone: (phone: string) => Promise<{ success: boolean }>;
  setAdminStatus: (isAdmin: boolean) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Synchronously load local storage auth state immediately on client-side mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedVerified = localStorage.getItem("my_thanjai_verified") === "true";
      const storedPhone = localStorage.getItem("my_thanjai_phone") || "";
      if (storedVerified) {
        setProfile({
          uid: "localStorage_user",
          phone: storedPhone,
          isVerified: true,
          isAdmin: false,
          createdAt: new Date(),
        });
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      const storedVerified = typeof window !== "undefined" ? (localStorage.getItem("my_thanjai_verified") === "true") : false;
      const storedPhone = typeof window !== "undefined" ? (localStorage.getItem("my_thanjai_phone") || "") : "";

      if (currentUser) {
        // Fetch or create user profile document in Firestore
        const userRef = doc(db, "users", currentUser.uid);
        try {
          const userDoc = await getDoc(userRef);

          if (userDoc.exists()) {
            const data = userDoc.data() as UserProfile;
            // Sync with local verification if local verified state is active
            if (storedVerified) {
              data.isVerified = true;
              data.phone = storedPhone || data.phone;
            }
            // Check if phone matches configured admin phone
            const adminPhone = process.env.NEXT_PUBLIC_ADMIN_PHONE?.replace(/\D/g, "");
            const hasAdminPhone = data.phone && data.phone.replace(/\D/g, "") === adminPhone;
            if (hasAdminPhone && !data.isAdmin) {
              await updateDoc(userRef, { isAdmin: true });
              data.isAdmin = true;
            }
            setProfile(data);
          } else {
            // Initialize new profile
            const newProfile: UserProfile = {
              uid: currentUser.uid,
              phone: storedPhone || "",
              isVerified: storedVerified || false,
              createdAt: serverTimestamp(),
            };
            await setDoc(userRef, newProfile);
            setProfile(newProfile);
          }
        } catch (error) {
          console.error("Error loading user profile:", error);
          setProfile({
            uid: currentUser.uid,
            phone: storedPhone,
            isVerified: storedVerified,
            createdAt: new Date(),
          });
        }
      } else {
        setProfile(null);
        // Force silent guest login for zero friction onboarding
        try {
          await signInAnonymously(auth);
        } catch (error) {
          console.error("Error signing in anonymously:", error);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const updatePhone = async (phone: string) => {
    let activeUser = user;
    if (!activeUser) {
      try {
        const cred = await signInAnonymously(auth);
        activeUser = cred.user;
        setUser(activeUser);
      } catch (e) {
        console.error("Anonymous sign in failed inside updatePhone", e);
      }
    }

    const cleanedPhone = phone.replace(/\D/g, "");
    const targetPhone = cleanedPhone.length === 10 ? `91${cleanedPhone}` : cleanedPhone;
    const adminPhone = process.env.NEXT_PUBLIC_ADMIN_PHONE?.replace(/\D/g, "");
    const isAdminPhone = targetPhone.replace(/\D/g, "") === adminPhone;

    // Set local persistence
    if (typeof window !== "undefined") {
      localStorage.setItem("my_thanjai_verified", "true");
      localStorage.setItem("my_thanjai_phone", targetPhone);
    }

    try {
      if (activeUser) {
        const userRef = doc(db, "users", activeUser.uid);
        await setDoc(userRef, {
          uid: activeUser.uid,
          phone: targetPhone,
          isVerified: true,
          isAdmin: isAdminPhone,
        }, { merge: true });
      }

      setProfile({
        uid: activeUser?.uid || "mock_uid",
        phone: targetPhone,
        isVerified: true,
        isAdmin: isAdminPhone,
        createdAt: new Date(),
      });
      return { success: true };
    } catch (error: any) {
      console.warn("Firestore update failed, falling back to local state mock:", error);
      setProfile({
        uid: activeUser?.uid || "mock_uid",
        phone: targetPhone,
        isVerified: true,
        isAdmin: isAdminPhone,
        createdAt: new Date(),
      });
      return { success: true };
    }
  };

  const setAdminStatus = async (isAdmin: boolean) => {
    if (!user) return;
    const userRef = doc(db, "users", user.uid);
    try {
      await updateDoc(userRef, { isAdmin });
      setProfile((prev) => prev ? { ...prev, isAdmin } : null);
    } catch (error) {
      console.error("Error setting admin status:", error);
    }
  };

  return React.createElement(
    AuthContext.Provider,
    { value: { user, profile, loading, updatePhone, setAdminStatus } },
    children
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    return {
      user: null,
      profile: null,
      loading: true,
      updatePhone: async () => ({ success: false }),
      setAdminStatus: async () => {},
    };
  }
  return context;
}
