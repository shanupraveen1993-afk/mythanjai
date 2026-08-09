import React, { Suspense } from "react";
import HomeClientPage from "./HomeClientPage";

export const dynamic = "force-dynamic";

export default function HomeLandingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center font-bold text-xs text-slate-400">Loading Namma Thanjavur...</div>}>
      <HomeClientPage />
    </Suspense>
  );
}
