import React, { Suspense } from "react";
import PostForm from "../PostForm";

export const dynamic = "force-dynamic";

export default function PostNeedPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs font-bold text-slate-400 animate-pulse">Loading Requirement Form...</div>}>
      <PostForm segment="need" />
    </Suspense>
  );
}
