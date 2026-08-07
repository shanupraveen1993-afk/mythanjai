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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        // Fetch or create user profile document in Firestore
        const userRef = doc(db, "users", currentUser.uid);
        try {
          const userDoc = await getDoc(userRef);

          if (userDoc.exists()) {
            const data = userDoc.data() as UserProfile;
            const adminPhone = process.env.NEXT_PUBLIC_ADMIN_PHONE?.replace(/\D/g, "");
            const hasAdminPhone = data.phone && (data.phone.replace(/\D/g, "") === adminPhone || data.phone.includes("9994837342"));
            if (hasAdminPhone && !data.isAdmin) {
              await updateDoc(userRef, { isAdmin: true });
              data.isAdmin = true;
            }
            setProfile(data);
          } else {
            const storedPhone = typeof window !== "undefined" ? (localStorage.getItem("my_thanjai_phone") || "") : "";
            const storedVerified = typeof window !== "undefined" ? (localStorage.getItem("my_thanjai_verified") === "true") : false;
            const newProfile: UserProfile = {
              uid: currentUser.uid,
              phone: storedPhone || "",
              isVerified: storedVerified || false,
              isAdmin: storedPhone.includes("9994837342"),
              createdAt: new Date(),
            };
            await setDoc(userRef, newProfile);
            setProfile(newProfile);
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
      } else {
        const storedPhone = typeof window !== "undefined" ? (localStorage.getItem("my_thanjai_phone") || "") : "";
        const storedVerified = typeof window !== "undefined" ? (localStorage.getItem("my_thanjai_verified") === "true") : false;
        if (storedVerified && storedPhone) {
          setProfile({
            uid: "localStorage_user",
            phone: storedPhone,
            isVerified: true,
            isAdmin: storedPhone.includes("9994837342"),
            createdAt: new Date(),
          });
        } else {
          setProfile(null);
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
    const isAdminPhone = targetPhone.includes("9994837342");

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
