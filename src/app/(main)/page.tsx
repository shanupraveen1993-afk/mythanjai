"use client";

import React, { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import LandingClientPage from "./LandingClientPage";

export default function RootPage() {
  const { loading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#fff8eb] flex flex-col items-center justify-center font-heading font-black text-xs text-amber-600 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        <span>Loading Namma Thanjai...</span>
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
