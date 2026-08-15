import React, { Suspense } from "react";
import OnboardingClientPage from "./OnboardingClientPage";

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs font-bold text-slate-400">Loading Onboarding...</div>}>
      <OnboardingClientPage />
    </Suspense>
  );
}
