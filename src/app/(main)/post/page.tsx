import React, { Suspense } from "react";
import PostClientPage from "./PostClientPage";

export const dynamic = "force-dynamic";

export default function PostPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-xs font-bold text-slate-400 animate-pulse">
          Loading Posting Form...
        </div>
      }
    >
      <PostClientPage />
    </Suspense>
  );
}
