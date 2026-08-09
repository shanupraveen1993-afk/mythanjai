import React, { Suspense } from "react";
import CategoryFeedClient from "@/components/feed/CategoryFeedClient";

export const dynamic = "force-dynamic";

export default function NeedPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs font-bold text-slate-400 animate-pulse">Loading Requirements...</div>}>
      <CategoryFeedClient segmentType="need" />
    </Suspense>
  );
}
