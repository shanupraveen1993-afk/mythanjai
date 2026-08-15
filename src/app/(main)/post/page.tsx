import React, { Suspense } from "react";
import PostClientPage from "./PostClientPage";

export default function PostPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full min-h-[70vh] flex items-center justify-center p-8 text-center text-xs font-bold text-amber-500 animate-pulse">
          Loading Posting Form...
        </div>
      }
    >
      <PostClientPage />
    </Suspense>
  );
}
