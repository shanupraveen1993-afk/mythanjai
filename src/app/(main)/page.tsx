"use client";

import React, { useEffect } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

// Dynamically import 3D Robot Hero to prevent WebGL SSR hydration stalls
const RobotHero = dynamic(() => import("@/components/ui/robot-hero"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center font-heading font-black text-xs text-yellow-400 gap-3">
      <Loader2 className="w-8 h-8 animate-spin text-yellow-400" />
      <span>Loading Namma Thanjavur 3D Experience...</span>
    </div>
  ),
});

export default function RootPage() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();
  const isLoggedIn = Boolean(user || profile?.isVerified);

  // If user is logged in, redirect directly to /sell page
  useEffect(() => {
    if (!authLoading && isLoggedIn) {
      router.replace("/sell");
    }
  }, [authLoading, isLoggedIn, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center font-heading font-black text-xs text-yellow-400 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-yellow-400" />
        <span>Loading...</span>
      </div>
    );
  }

  // Logged-in users get redirected to /sell
  if (isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center font-heading font-black text-xs text-yellow-400 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-yellow-400" />
        <span>Redirecting to Marketplace...</span>
      </div>
    );
  }

  // Unauthenticated guests get the 3D Robot Landing Page!
  return (
    <RobotHero
      showExtraFolds={true}
      onCtaClick={() => router.push("/sell")}
      onSignInClick={() => {
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("namma_thanjai_open_signin"));
        }
      }}
    />
  );
}
