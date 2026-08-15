"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import RobotHero from "@/components/ui/robot-hero";
import HomeClientPage from "./HomeClientPage";
import OnboardingClientPage from "./onboarding/OnboardingClientPage";

function RootPageContent() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const isAuthVerified = Boolean(profile?.isVerified || user);
  const [isNativeApp, setIsNativeApp] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const cap = (window as any).Capacitor;
      if (cap?.isNativePlatform?.() || window.navigator.userAgent.includes("Capacitor")) {
        setIsNativeApp(true);
      }
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center font-bold text-xs text-slate-400">
        Loading Namma Thanjavur...
      </div>
    );
  }

  // 1. Native Mobile App Unauthenticated View: Fixed Mobile Onboarding
  if (isNativeApp && !isAuthVerified) {
    return <OnboardingClientPage />;
  }

  // 2. Verified User (Web or App): Render Full Home Directory
  if (isAuthVerified) {
    return <HomeClientPage />;
  }

  // 3. Website Visitor: Render Full Website Landing Page with Robot Hero
  return (
    <RobotHero
      onCtaClick={() => router.push("/home")}
      onSignInClick={() => {
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("namma_thanjai_open_signin"));
        }
      }}
    />
  );
}

export default function RootPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center font-bold text-xs text-slate-400">
          Loading Namma Thanjavur...
        </div>
      }
    >
      <RootPageContent />
    </Suspense>
  );
}
