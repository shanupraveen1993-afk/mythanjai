import React, { Suspense } from "react";
import PostForm from "../PostForm";

export default function PostNeedPage() {
  return (
    <Suspense fallback={<div className="w-full min-h-[70vh] flex items-center justify-center p-8 text-center text-xs font-bold text-amber-500 animate-pulse">Loading Requirement Form...</div>}>
      <PostForm segment="need" />
    </Suspense>
  );
}
