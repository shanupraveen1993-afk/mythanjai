import React, { Suspense } from "react";
import ProfileClientPage from "./ProfileClientPage";

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs font-bold text-slate-400">Loading User Profile...</div>}>
      <ProfileClientPage />
    </Suspense>
  );
}
