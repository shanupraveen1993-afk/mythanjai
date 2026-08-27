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
  signOutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    if (typeof window !== "undefined") {
      const storedVerified = localStorage.getItem("my_thanjai_verified") === "true" ||
                             localStorage.getItem("namma_thanjai_verified") === "true" ||
                             localStorage.getItem("namma_thanjai_user_verified") === "true";
      const storedPhone = (localStorage.getItem("my_thanjai_phone") || localStorage.getItem("namma_thanjai_phone") || "").replace(/\D/g, "");
      const storedName = localStorage.getItem("my_thanjai_display_name") || "Namma Thanjai User";
      const storedMemberId = localStorage.getItem("namma_thanjai_member_id") || localStorage.getItem("my_thanjai_member_id") || (storedPhone ? `NT-${storedPhone.slice(-10)}` : "");

      if (storedVerified && storedPhone && storedPhone.length >= 10 && storedPhone !== "9876543210") {
        return {
          uid: "saved_session",
          memberId: storedMemberId || `NT-${storedPhone.slice(-10)}`,
          phone: storedPhone,
          isVerified: true,
          displayName: storedName,
          createdAt: new Date(),
        };
      }
    }
    return null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const p1 = localStorage.getItem("my_thanjai_phone");
      const p2 = localStorage.getItem("namma_thanjai_phone");
      if (p1 === "9876543210" || p2 === "9876543210") {
        localStorage.removeItem("my_thanjai_phone");
        localStorage.removeItem("namma_thanjai_phone");
        localStorage.removeItem("my_thanjai_verified");
        localStorage.removeItem("namma_thanjai_verified");
        localStorage.removeItem("namma_thanjai_user_verified");
      }
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      const storedPhone = typeof window !== "undefined" ? (localStorage.getItem("my_thanjai_phone") || localStorage.getItem("namma_thanjai_phone") || "") : "";
      const cleanStoredPhone = storedPhone.replace(/\D/g, "");
      const storedVerified = typeof window !== "undefined" ? (localStorage.getItem("my_thanjai_verified") === "true" || localStorage.getItem("namma_thanjai_verified") === "true" || localStorage.getItem("namma_thanjai_user_verified") === "true") : false;
      const storedDisplayName = typeof window !== "undefined" ? (localStorage.getItem("my_thanjai_display_name") || "") : "";
      const localMemberId = typeof window !== "undefined" ? (localStorage.getItem("namma_thanjai_member_id") || localStorage.getItem("my_thanjai_member_id") || "") : "";

      const activeVerifiedPhone = storedVerified && cleanStoredPhone.length >= 10 && cleanStoredPhone !== "9876543210" ? cleanStoredPhone : "";

      if (currentUser) {
        // Fetch or create user profile document in Firestore (Syncing by phone across APK & Web)
        try {
          let userProfileData: UserProfile | null = null;
          
          if (activeVerifiedPhone) {
            try {
              const { collection, query, where, getDocs } = await import("firebase/firestore");
              const q = query(collection(db, "users"), where("phone", "==", activeVerifiedPhone));
              const querySnap = await getDocs(q);
              if (!querySnap.empty) {
                userProfileData = querySnap.docs[0].data() as UserProfile;
              }
            } catch (e) {}
          }

          if (!userProfileData) {
            const userRef = doc(db, "users", currentUser.uid);
            const userDoc = await getDoc(userRef);
            if (userDoc.exists()) {
              userProfileData = userDoc.data() as UserProfile;
            }
          }

          // IMMUTABLE MEMBER ID: Preserve existing memberId 100% or generate 5-digit code for new registrations
          const effectiveMemberId = userProfileData?.memberId || localMemberId || (activeVerifiedPhone ? `NT-${activeVerifiedPhone.replace(/\D/g, "").slice(-5)}` : `NT-${currentUser.uid.slice(-5).toUpperCase()}`);
          if (typeof window !== "undefined" && effectiveMemberId) {
            localStorage.setItem("namma_thanjai_member_id", effectiveMemberId);
          }

          if (userProfileData) {
            userProfileData.memberId = effectiveMemberId;
            if (activeVerifiedPhone) {
              userProfileData.phone = activeVerifiedPhone;
              userProfileData.isVerified = true;
            }
            if (storedDisplayName) userProfileData.displayName = storedDisplayName;

            setProfile(userProfileData);
          } else {
            const newProfile: UserProfile = {
              uid: currentUser.uid,
              memberId: effectiveMemberId,
              phone: activeVerifiedPhone || "",
              isVerified: Boolean(activeVerifiedPhone),
              displayName: storedDisplayName || currentUser.displayName || "Namma Thanjai User",
              createdAt: new Date(),
            };
            const userRef = doc(db, "users", currentUser.uid);
            await setDoc(userRef, newProfile, { merge: true });
            setProfile(newProfile);
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          const fallbackMemberId = localMemberId || (activeVerifiedPhone ? `NT-${activeVerifiedPhone.slice(-10)}` : `NT-${currentUser.uid.slice(-6).toUpperCase()}`);
          if (activeVerifiedPhone) {
            setProfile({
              uid: currentUser.uid,
              memberId: fallbackMemberId,
              phone: activeVerifiedPhone,
              isVerified: true,
              displayName: storedDisplayName || "Namma Thanjai User",
              createdAt: new Date(),
            });
          }
        }
      } else {
        if (activeVerifiedPhone) {
          const fallbackMemberId = localMemberId || `NT-${activeVerifiedPhone.slice(-10)}`;
          setProfile({
            uid: "saved_session",
            memberId: fallbackMemberId,
            phone: activeVerifiedPhone,
            isVerified: true,
            displayName: storedDisplayName || "Namma Thanjai User",
            createdAt: new Date(),
          });
        } else {
          setProfile(null);
        }
        // Auto sign-in anonymously so Firebase user object is initialized
        try {
          signInAnonymously(auth).catch(() => {});
        } catch (e) {}
      }
      setLoading(false);
    });

    const handleAuthChanged = () => {
      if (typeof window !== "undefined") {
        const storedVerified =
          localStorage.getItem("my_thanjai_verified") === "true" ||
          localStorage.getItem("namma_thanjai_verified") === "true" ||
          localStorage.getItem("namma_thanjai_user_verified") === "true";
        const storedPhone = (
          localStorage.getItem("my_thanjai_phone") ||
          localStorage.getItem("namma_thanjai_phone") ||
          ""
        ).replace(/\D/g, "");
        const storedName =
          localStorage.getItem("my_thanjai_display_name") || "Namma Thanjai User";

        if (storedVerified && storedPhone && storedPhone.length >= 10 && storedPhone !== "9876543210") {
          setProfile((prev) => ({
            uid: prev?.uid || user?.uid || "saved_session",
            phone: storedPhone,
            isVerified: true,
            displayName: storedName,
            createdAt: prev?.createdAt || new Date(),
          }));
        } else {
          setProfile(null);
        }
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("namma_thanjai_auth_changed", handleAuthChanged);
      window.addEventListener("storage", handleAuthChanged);
    }

    return () => {
      unsubscribe();
      if (typeof window !== "undefined") {
        window.removeEventListener("namma_thanjai_auth_changed", handleAuthChanged);
        window.removeEventListener("storage", handleAuthChanged);
      }
    };
  }, [user]);

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
    const existingMemberId = profile?.memberId || (typeof window !== "undefined" ? localStorage.getItem("namma_thanjai_member_id") : null) || `NT-${targetPhone.slice(-10)}`;

    if (typeof window !== "undefined") {
      localStorage.setItem("my_thanjai_verified", "true");
      localStorage.setItem("namma_thanjai_verified", "true");
      localStorage.setItem("namma_thanjai_user_verified", "true");
      localStorage.setItem("my_thanjai_phone", targetPhone);
      localStorage.setItem("namma_thanjai_phone", targetPhone);
      localStorage.setItem("namma_thanjai_member_id", existingMemberId);
      try {
        document.cookie = `namma_thanjai_verified=true; path=/; max-age=${10 * 365 * 86400}; SameSite=Lax`;
        document.cookie = `namma_thanjai_phone=${targetPhone}; path=/; max-age=${10 * 365 * 86400}; SameSite=Lax`;
      } catch (e) {}
    }

    try {
      if (activeUser) {
        const userRef = doc(db, "users", activeUser.uid);
        await setDoc(userRef, {
          uid: activeUser.uid,
          memberId: existingMemberId,
          phone: targetPhone,
          isVerified: true,
        }, { merge: true });
      }

      setProfile((prev) => ({
        uid: activeUser?.uid || prev?.uid || "mock_uid",
        memberId: existingMemberId,
        phone: targetPhone,
        isVerified: true,
        displayName: prev?.displayName || "Namma Thanjai User",
        createdAt: prev?.createdAt || new Date(),
      }));
      return { success: true };
    } catch (error: any) {
      console.warn("Firestore update failed, falling back to local state mock:", error);
      setProfile((prev) => ({
        uid: activeUser?.uid || prev?.uid || "mock_uid",
        memberId: existingMemberId,
        phone: targetPhone,
        isVerified: true,
        displayName: prev?.displayName || "Namma Thanjai User",
        createdAt: prev?.createdAt || new Date(),
      }));
      return { success: true };
    }
  };

  const signOutUser = async () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("my_thanjai_verified");
      localStorage.removeItem("namma_thanjai_verified");
      localStorage.removeItem("namma_thanjai_user_verified");
      localStorage.removeItem("my_thanjai_phone");
      localStorage.removeItem("namma_thanjai_phone");
      try {
        document.cookie = "namma_thanjai_verified=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        document.cookie = "namma_thanjai_phone=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      } catch (e) {}
      window.dispatchEvent(new Event("namma_thanjai_auth_changed"));
    }
    setProfile(null);
    try {
      const { signOut } = await import("firebase/auth");
      await signOut(auth);
    } catch (e) {
      console.warn("Sign out error:", e);
    }
  };

  const getStorageVerified = () => {
    if (typeof window === "undefined") return { isVerified: false, phone: "" };
    const storedVerified =
      localStorage.getItem("my_thanjai_verified") === "true" ||
      localStorage.getItem("namma_thanjai_verified") === "true" ||
      localStorage.getItem("namma_thanjai_user_verified") === "true";
    const storedPhone = (
      localStorage.getItem("my_thanjai_phone") ||
      localStorage.getItem("namma_thanjai_phone") ||
      ""
    ).replace(/\D/g, "");
    if (storedVerified && storedPhone && storedPhone.length >= 10 && storedPhone !== "9876543210") {
      return { isVerified: true, phone: storedPhone };
    }
    return { isVerified: false, phone: "" };
  };

  const storageInfo = getStorageVerified();
  const isVerified = Boolean(
    storageInfo.isVerified ||
    (profile?.isVerified && profile?.phone && profile.phone.replace(/\D/g, "").length >= 10)
  );

  return React.createElement(
    AuthContext.Provider,
    { value: { user, profile, isVerified, loading, updatePhone, updateDisplayName, signOutUser } },
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
      signOutUser: async () => {},
    };
  }
  return context;
}
