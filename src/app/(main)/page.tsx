"use client";

import React, { Suspense } from "react";
import { useAuth } from "@/hooks/use-auth";
import HomeClientPage from "./HomeClientPage";
import OnboardingClientPage from "./onboarding/OnboardingClientPage";

function RootPageContent() {
  const { user, profile, loading } = useAuth();
  const isAuthVerified = Boolean(profile?.isVerified || user);

  if (loading) {
    return (
      <div className="h-screen w-full bg-[#0f172a] flex items-center justify-center font-heading font-black text-xs text-amber-400">
        Loading Namma Thanjai...
      </div>
    );
  }

  // Unauthenticated Visitors: Render ONLY the fixed 100vh mobile Onboarding Screen (No extra folds/scroll)
  if (!isAuthVerified) {
    return <OnboardingClientPage />;
  }

  // Authenticated Verified Users: Render full Thanjavur Marketplace & Directory
  return <HomeClientPage />;
}

export default function RootPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen w-full bg-[#0f172a] flex items-center justify-center font-heading font-black text-xs text-amber-400">
          Loading Namma Thanjai...
        </div>
      }
    >
      <RootPageContent />
    </Suspense>
  );
}
