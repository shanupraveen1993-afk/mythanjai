"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function GlobalRootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Root Layout Exception:", error);
  }, [error]);

  const handleFullRecovery = () => {
    try {
      if (typeof window !== "undefined") {
        localStorage.clear();
        sessionStorage.clear();
      }
    } catch (e) {}
    if (typeof window !== "undefined") {
      window.location.href = "/";
    } else {
      reset();
    }
  };

  return (
    <html>
      <body className="min-h-screen bg-[#f4f5f8] flex flex-col items-center justify-center p-4 font-sans text-slate-900">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 max-w-md w-full shadow-lg flex flex-col items-center text-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center border border-rose-500/20 shadow-inner">
            <AlertTriangle className="w-7 h-7" />
          </div>

          <div className="flex flex-col gap-1 w-full">
            <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest">
              Application Error
            </span>
            <h1 className="font-heading font-extrabold text-xl text-slate-900">
              Critical App Exception
            </h1>
            <p className="text-xs text-slate-600 font-medium leading-relaxed mt-1 bg-slate-50 p-3 rounded-xl border border-slate-200/70 text-left font-mono break-all max-h-32 overflow-y-auto">
              {error?.message || error?.name || "An unexpected error occurred in root app layout."}
            </p>
          </div>

          <button
            onClick={handleFullRecovery}
            className="w-full py-3 bg-amber-400 hover:bg-amber-500 text-slate-950 font-heading font-black text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-all"
          >
            <RefreshCw className="w-4 h-4 text-slate-950" />
            <span>Reset & Recover App</span>
          </button>
        </div>
      </body>
    </html>
  );
}
