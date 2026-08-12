"use client";

import Link from "next/link";
import { Home, ArrowLeft, AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#f4f5f8] flex flex-col items-center justify-center p-4 font-sans text-slate-900">
      <div className="bg-white border border-slate-200/80 rounded-3xl p-8 max-w-md w-full shadow-sm flex flex-col items-center text-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center border border-amber-500/20 shadow-inner">
          <AlertCircle className="w-8 h-8" />
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-xs font-bold text-amber-600 uppercase tracking-widest">
            404 Error
          </span>
          <h1 className="font-heading font-extrabold text-2xl text-slate-900">
            Page Not Found
          </h1>
          <p className="text-xs text-slate-500 font-medium leading-relaxed mt-1">
            The page or listing you are looking for might have been removed, expired, or has a broken link.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full mt-2">
          <Link
            href="/"
            className="flex-1 h-10 bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
          >
            <Home className="w-4 h-4" />
            <span>Go to Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
