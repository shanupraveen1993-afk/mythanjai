import React, { Suspense } from "react";
import AdminClientPage from "./AdminClientPage";

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs font-bold text-slate-400">Loading Admin Console...</div>}>
      <AdminClientPage />
    </Suspense>
  );
}
