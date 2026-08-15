"use client";

import React, { useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import RobotHero from "@/components/ui/robot-hero";

function RootPageContent() {
  const router = useRouter();
  const { profile, loading } = useAuth();
  const isAuthVerified = Boolean(profile?.isVerified);

  useEffect(() => {
    // If user is already logged in, take them straight to the app home dashboard
    if (!loading && isAuthVerified) {
      router.replace("/home");
    }
  }, [isAuthVerified, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center font-heading font-black text-xs text-yellow-400">
        Loading Namma Thanjavur...
      </div>
    );
  }

  // If logged in, return null while redirecting to /home
  if (isAuthVerified) {
    return null;
  }

  // Guest Visitor at root /: Render ONLY the rich Robot Hero Landing Page!
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
        <div className="min-h-screen bg-slate-950 flex items-center justify-center font-heading font-black text-xs text-yellow-400">
          Loading Namma Thanjavur...
        </div>
      }
    >
      <RootPageContent />
    </Suspense>
  );
}
