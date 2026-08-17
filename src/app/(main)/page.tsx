"use client";

import React, { Suspense } from "react";
import { useRouter } from "next/navigation";
import RobotHero from "@/components/ui/robot-hero";

export const dynamic = "force-dynamic";

function RootPageContent() {
  const router = useRouter();

  // Root URL (https://mythanjai.vercel.app/): Website Landing Page with Folds 2, 3, 4 + Footer!
  return (
    <RobotHero
      showExtraFolds={true}
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
        <div className="min-h-screen bg-slate-950 flex items-center justify-center font-heading font-black text-xs text-yellow-400">
          Loading Namma Thanjavur Landing Page...
        </div>
      }
    >
      <RootPageContent />
    </Suspense>
  );
}
