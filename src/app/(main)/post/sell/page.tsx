import React, { Suspense } from "react";
import PostForm from "../PostForm";

export default function PostSellPage() {
  return (
    <Suspense fallback={<div className="w-full min-h-[70vh] flex items-center justify-center p-8 text-center text-xs font-bold text-amber-500 animate-pulse">Loading Sell Form...</div>}>
      <PostForm segment="sell" />
    </Suspense>
  );
}
