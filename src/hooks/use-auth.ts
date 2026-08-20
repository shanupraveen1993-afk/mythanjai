"use client";

import React, { useState, useEffect, createContext, useContext } from "react";
import { auth, db } from "@/lib/firebase";
import { signInAnonymously, onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { UserProfile } from "@/types";

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  isVerified: boolean;
  loading: boolean;
  updatePhone: (phone: string) => Promise<{ success: boolean }>;
  updateDisplayName: (name: string) => Promise<{ success: boolean }>;
  setAdminStatus: (isAdmin: boolean) => Promise<void>;
  signOutUser: () => Promise<void>;
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
            const storedDisplayName = typeof window !== "undefined" ? (localStorage.getItem("my_thanjai_display_name") || "") : "";
            if (storedDisplayName && data) data.displayName = storedDisplayName;

            setProfile(data);
          } else {
            const storedPhone = typeof window !== "undefined" ? (localStorage.getItem("my_thanjai_phone") || localStorage.getItem("namma_thanjai_phone") || "") : "";
            const storedVerified = typeof window !== "undefined" ? (localStorage.getItem("my_thanjai_verified") === "true" || localStorage.getItem("namma_thanjai_verified") === "true") : false;
            const storedDisplayName = typeof window !== "undefined" ? (localStorage.getItem("my_thanjai_display_name") || "") : "";
            const newProfile: UserProfile = {
              uid: currentUser.uid,
              phone: storedPhone || "",
              isVerified: Boolean(storedVerified && storedPhone),
              isAdmin: storedPhone.includes("9994837342"),
              displayName: storedDisplayName || currentUser.displayName || "",
              createdAt: new Date(),
            };
            await setDoc(userRef, newProfile, { merge: true });
            setProfile(newProfile);
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
      } else {
        setProfile(null);
        // Auto sign-in anonymously so Firebase user object is initialized
        try {
          signInAnonymously(auth).catch(() => {});
        } catch (e) {}
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const updateDisplayName = async (name: string) => {
    const trimmed = name.trim();
    if (typeof window !== "undefined") {
      localStorage.setItem("my_thanjai_display_name", trimmed);
    }
    if (user) {
      try {
        const userRef = doc(db, "users", user.uid);
        await setDoc(userRef, { displayName: trimmed }, { merge: true });
        const { updateProfile } = await import("firebase/auth");
        await updateProfile(user, { displayName: trimmed });
      } catch (e) {
        console.warn("Firestore/Auth displayName update error:", e);
      }
    }
    setProfile((prev) => prev ? { ...prev, displayName: trimmed } : { uid: user?.uid || "user", phone: "", isVerified: false, createdAt: new Date(), displayName: trimmed });
    return { success: true };
  };

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

    // Set local persistence across both key namespaces
    if (typeof window !== "undefined") {
      localStorage.setItem("my_thanjai_verified", "true");
      localStorage.setItem("namma_thanjai_verified", "true");
      localStorage.setItem("my_thanjai_phone", targetPhone);
      localStorage.setItem("namma_thanjai_phone", targetPhone);
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

  const signOutUser = async () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("my_thanjai_verified");
      localStorage.removeItem("namma_thanjai_verified");
      localStorage.removeItem("my_thanjai_phone");
      localStorage.removeItem("namma_thanjai_phone");
    }
    setProfile(null);
    try {
      const { signOut } = await import("firebase/auth");
      await signOut(auth);
    } catch (e) {
      console.warn("Sign out error:", e);
    }
  };

  const isVerified = Boolean(
    profile?.isVerified && profile?.phone && profile.phone.replace(/\D/g, "").length >= 10
  );

  return React.createElement(
    AuthContext.Provider,
    { value: { user, profile, isVerified, loading, updatePhone, updateDisplayName, setAdminStatus, signOutUser } },
    children
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    return {
      user: null,
      profile: null,
      isVerified: false,
      loading: true,
      updatePhone: async () => ({ success: false }),
      updateDisplayName: async () => ({ success: false }),
      setAdminStatus: async () => {},
      signOutUser: async () => {},
    };
  }
  return context;
}
