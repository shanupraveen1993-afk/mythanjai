"use client";

import React, { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import LandingClientPage from "./LandingClientPage";

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
      <div className="min-h-screen bg-[#fff8eb] flex flex-col items-center justify-center font-heading font-black text-xs text-amber-600 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        <span>Loading Namma Thanjai...</span>
      </div>
    );
  }

  // Logged-in users get redirected to /sell
  if (isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#fff8eb] flex flex-col items-center justify-center font-heading font-black text-xs text-amber-600 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        <span>Redirecting to Marketplace...</span>
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#fff8eb] flex flex-col items-center justify-center font-heading font-black text-xs text-amber-600 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          <span>Loading Landing Page...</span>
        </div>
      }
    >
      <LandingClientPage />
    </Suspense>
  );
}
