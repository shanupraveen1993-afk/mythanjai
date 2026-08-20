"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home, ChevronDown, ChevronUp } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    console.error("Global Error Boundary caught exception:", error);
  }, [error]);

  const handleClearCacheAndReset = () => {
    try {
      if (typeof window !== "undefined") {
        localStorage.clear();
        sessionStorage.clear();
      }
    } catch (e) {}
    reset();
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f5f8] flex flex-col items-center justify-center p-4 font-sans text-slate-900">
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 max-w-md w-full shadow-lg flex flex-col items-center text-center gap-4">
        
        {/* Error Icon */}
        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center border border-rose-500/20 shadow-inner">
          <AlertTriangle className="w-7 h-7" />
        </div>

        {/* Header & Message */}
        <div className="flex flex-col gap-1 w-full">
          <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest">
            Application Error Boundary
          </span>
          <h1 className="font-heading font-extrabold text-xl text-slate-900">
            View Render Exception
          </h1>
          <p className="text-xs text-slate-600 font-medium leading-relaxed mt-1 bg-slate-50 p-3 rounded-xl border border-slate-200/70 text-left font-mono break-all max-h-32 overflow-y-auto">
            {error?.message || error?.name || "An unexpected runtime error occurred."}
          </p>
        </div>

        {/* Stack Trace Toggle */}
        {error?.stack && (
          <div className="w-full text-left">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-[11px] font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
            >
              <span>{showDetails ? "Hide Stack Details" : "Show Technical Details"}</span>
              {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            {showDetails && (
              <pre className="mt-2 text-[10px] bg-slate-900 text-slate-200 p-3 rounded-xl overflow-x-auto max-h-40 font-mono leading-tight whitespace-pre-wrap">
                {error.stack}
              </pre>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5 w-full mt-2">
          <button
            onClick={handleClearCacheAndReset}
            className="w-full py-3 bg-amber-400 hover:bg-amber-500 text-slate-950 font-heading font-black text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-98 transition-all"
          >
            <RefreshCw className="w-4 h-4 text-slate-950" />
            <span>Clear App Cache & Recover</span>
          </button>
          
          <Link
            href="/"
            onClick={() => reset()}
            className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-heading font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <Home className="w-4 h-4 text-slate-700" />
            <span>Return to Homepage</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
