"use client";

import React, { useEffect, Suspense } from "react";
import { useAuth } from "@/hooks/use-auth";
import RobotHero from "@/components/ui/robot-hero";

function RootPageContent() {
  const { profile, loading } = useAuth();
  const isAuthVerified = Boolean(profile?.isVerified);

  useEffect(() => {
    // Logged-in user on root / -> perform hard location replace to /home so browser URL becomes /home
    if (!loading && isAuthVerified) {
      if (typeof window !== "undefined") {
        window.location.replace("/home");
      }
    }
  }, [isAuthVerified, loading]);

  if (loading || isAuthVerified) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center font-heading font-black text-xs text-yellow-400">
        Loading Namma Thanjavur...
      </div>
    );
  }

  // Unauthenticated Guest Visitor at root /: Render ONLY the rich Robot Hero Landing Page!
  return (
    <RobotHero
      onCtaClick={() => {
        if (typeof window !== "undefined") {
          window.location.href = "/home";
        }
      }}
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
          Loading Namma Thanjavur...
        </div>
      }
    >
      <RootPageContent />
    </Suspense>
  );
}
