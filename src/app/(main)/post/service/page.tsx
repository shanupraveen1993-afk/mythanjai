import React, { Suspense } from "react";
import PostForm from "../PostForm";

export default function PostServicePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs font-bold text-slate-400 animate-pulse">Loading Service Form...</div>}>
      <PostForm segment="service" />
    </Suspense>
  );
}
