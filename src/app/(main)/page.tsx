"use client";

import React, { Suspense } from "react";
import HomeClientPage from "./HomeClientPage";

export default function RootPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#fff8eb] flex items-center justify-center font-bold text-xs text-amber-500 animate-pulse">
          Loading Namma Thanjai...
        </div>
      }
    >
      <HomeClientPage />
    </Suspense>
  );
}
