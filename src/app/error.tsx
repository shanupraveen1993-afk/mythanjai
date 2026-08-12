"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global Error Boundary caught exception:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#f4f5f8] flex flex-col items-center justify-center p-4 font-sans text-slate-900">
      <div className="bg-white border border-slate-200/80 rounded-3xl p-8 max-w-md w-full shadow-sm flex flex-col items-center text-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center border border-rose-500/20 shadow-inner">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-xs font-bold text-rose-600 uppercase tracking-widest">
            Application Error
          </span>
          <h1 className="font-heading font-extrabold text-2xl text-slate-900">
            Something went wrong
          </h1>
          <p className="text-xs text-slate-500 font-medium leading-relaxed mt-1">
            An unexpected error occurred while loading this view. Please try refreshing or return home.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full mt-2">
          <button
            onClick={() => reset()}
            className="flex-1 h-10 bg-yellow-500 hover:bg-yellow-400 text-slate-955 font-bold px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs border border-yellow-400"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Again</span>
          </button>
          <Link
            href="/"
            className="flex-1 h-10 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer border border-slate-200"
          >
            <Home className="w-4 h-4 text-slate-600" />
            <span>Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
