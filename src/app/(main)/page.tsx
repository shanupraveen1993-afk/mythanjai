"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useAuth } from "@/hooks/use-auth";
import RobotHero from "@/components/ui/robot-hero";
import HomeClientPage from "./HomeClientPage";

function RootPageContent() {
  const { user, loading } = useAuth();
  const [isGuestMode, setIsGuestMode] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("namma_thanjai_guest_mode") === "true";
  });

  useEffect(() => {
    if (user) {
      setIsGuestMode(true);
    }
  }, [user]);

  const handleExploreGuest = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("namma_thanjai_guest_mode", "true");
    }
    setIsGuestMode(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center font-bold text-xs text-slate-400">
        Loading Namma Thanjavur...
      </div>
    );
  }

  // Root URL (/): If unauthenticated and not guest, render Landing Page with Robot Hero directly on /
  if (!user && !isGuestMode) {
    return (
      <RobotHero
        onCtaClick={handleExploreGuest}
        onSignInClick={() => {
          if (typeof window !== "undefined") {
            const currentUrl = new URL(window.location.href);
            currentUrl.searchParams.set("auth", "signin");
            window.history.pushState({}, "", currentUrl.toString());
            window.dispatchEvent(new Event("popstate"));
          }
        }}
      />
    );
  }

  // Root URL (/): If logged in or guest mode selected, render Home Dashboard
  return <HomeClientPage />;
}

export default function HomeLandingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center font-bold text-xs text-slate-400">Loading Namma Thanjavur...</div>}>
      <RootPageContent />
    </Suspense>
  );
}
