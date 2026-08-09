import React, { Suspense } from "react";
import ShopsClientPage from "./ShopsClientPage";

export const dynamic = "force-dynamic";

export default function ShopsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs font-bold text-slate-400">Loading Store Offers...</div>}>
      <ShopsClientPage />
    </Suspense>
  );
}
