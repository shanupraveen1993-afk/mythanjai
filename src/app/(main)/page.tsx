"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import RobotHero from "@/components/ui/robot-hero";
import HomeClientPage from "./HomeClientPage";

function RootPageContent() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [isGuestMode, setIsGuestMode] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("namma_thanjai_guest_mode") === "true";
  });

  useEffect(() => {
    if (user || isGuestMode) {
      router.replace("/home");
    }
  }, [user, isGuestMode, router]);

  const handleExploreGuest = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("namma_thanjai_guest_mode", "true");
    }
    router.push("/home");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center font-bold text-xs text-slate-400">
        Loading Namma Thanjavur...
      </div>
    );
  }

  // Root URL (/): Render Landing Page with Robot Hero directly on /
  return (
    <RobotHero
      onCtaClick={handleExploreGuest}
      onSignInClick={() => {
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("namma_thanjai_open_signin"));
        }
      }}
    />
  );
}

export default function HomeLandingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center font-bold text-xs text-slate-400">Loading Namma Thanjavur...</div>}>
      <RootPageContent />
    </Suspense>
  );
}
