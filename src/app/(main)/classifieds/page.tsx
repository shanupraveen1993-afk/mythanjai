import React, { Suspense } from "react";
import ClassifiedsClientPage from "./ClassifiedsClientPage";

export const dynamic = "force-dynamic";

export default function ClassifiedsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs font-bold text-slate-400">Loading Classifieds...</div>}>
      <ClassifiedsClientPage />
    </Suspense>
  );
}
