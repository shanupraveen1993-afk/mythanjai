import React, { Suspense } from "react";
import PostForm from "../PostForm";

export const dynamic = "force-dynamic";

export default function PostSellPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs font-bold text-slate-400 animate-pulse">Loading Sell Form...</div>}>
      <PostForm segment="sell" />
    </Suspense>
  );
}
