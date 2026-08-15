import React, { Suspense } from "react";
import ServicesClientPage from "./ServicesClientPage";

export default function ServicesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs font-bold text-slate-400 animate-pulse">Loading Services...</div>}>
      <ServicesClientPage />
    </Suspense>
  );
}
