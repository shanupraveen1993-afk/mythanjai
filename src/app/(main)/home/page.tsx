"use client";

import React, { Suspense } from "react";
import HomeClientPage from "../HomeClientPage";

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f4f5f8] flex items-center justify-center font-bold text-xs text-slate-400 animate-pulse">
          Loading Home Dashboard...
        </div>
      }
    >
      <HomeClientPage />
    </Suspense>
  );
}
