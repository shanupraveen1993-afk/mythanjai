import React, { Suspense } from "react";
import NeedClientPage from "./NeedClientPage";

export default function NeedPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs font-bold text-slate-400 animate-pulse">Loading Requirements...</div>}>
      <NeedClientPage />
    </Suspense>
  );
}
