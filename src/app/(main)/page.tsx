"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import RobotHero from "@/components/ui/robot-hero";
import OnboardingClientPage from "./onboarding/OnboardingClientPage";

function RootPageContent() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const isAuthVerified = Boolean(profile?.isVerified || user);
  const [isMobileWeb, setIsMobileWeb] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const checkMobile = () => {
        setIsMobileWeb(window.innerWidth < 768);
      };
      checkMobile();
      window.addEventListener("resize", checkMobile);
      return () => window.removeEventListener("resize", checkMobile);
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center font-heading font-black text-xs text-amber-400">
        Loading Namma Thanjavur...
      </div>
    );
  }

  // 1. Mobile Web App (Unauthenticated): Render ONLY the single-fold Mobile Onboarding Screen with Register & Explore CTA
  if (isMobileWeb && !isAuthVerified) {
    return <OnboardingClientPage />;
  }

  // 2. Desktop Web Visitor / Authenticated User: Render Desktop RobotHero Landing Page
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
        <div className="min-h-screen bg-[#0f172a] flex items-center justify-center font-heading font-black text-xs text-amber-400">
          Loading Namma Thanjavur...
        </div>
      }
    >
      <RootPageContent />
    </Suspense>
  );
}
