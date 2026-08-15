"use client";

import React, { Suspense } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import RobotHero from "@/components/ui/robot-hero";
import OnboardingClientPage from "./onboarding/OnboardingClientPage";
import HomeClientPage from "./HomeClientPage";

function RootPageContent() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const isAuthVerified = Boolean(profile?.isVerified || user);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center font-heading font-black text-xs text-amber-400">
        Loading Namma Thanjavur...
      </div>
    );
  }

  // Verified Logged In User: Render Home Marketplace Dashboard
  if (isAuthVerified) {
    return <HomeClientPage />;
  }

  // Unauthenticated Visitors:
  // Mobile Web (< 768px): Render ONLY OnboardingClientPage (Fixed 100vh fold, Register & Explore CTA)
  // Desktop Web (>= 768px): Render RobotHero Landing Page
  return (
    <>
      {/* Mobile Web App View (< 768px): Pure CSS instant display */}
      <div className="md:hidden w-full h-screen h-[100dvh] overflow-hidden">
        <OnboardingClientPage />
      </div>

      {/* Desktop Website View (>= 768px): Pure CSS instant display */}
      <div className="hidden md:block w-full">
        <RobotHero
          onCtaClick={() => router.push("/home")}
          onSignInClick={() => {
            if (typeof window !== "undefined") {
              window.dispatchEvent(new Event("namma_thanjai_open_signin"));
            }
          }}
        />
      </div>
    </>
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
