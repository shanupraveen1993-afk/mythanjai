import React, { Suspense } from "react";
import SellClientPage from "./SellClientPage";

export const dynamic = "force-dynamic";

export default function SellPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs font-bold text-slate-400">Loading Sell Marketplace...</div>}>
      <SellClientPage />
    </Suspense>
  );
}
