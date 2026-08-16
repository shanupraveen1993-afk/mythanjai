"use client";

import React, { useState, useEffect } from "react";
import { Download, Smartphone, X, Sparkles, CheckCircle2 } from "lucide-react";
import { useToast } from "@/context/ToastContext";

export default function ApkInstallToast() {
  const { toast } = useToast();
  const [showToast, setShowToast] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    // 1. Don't show inside Capacitor Native Android App
    if (typeof window !== "undefined" && (window as any).Capacitor?.isNativePlatform?.()) {
      return;
    }

    // 2. Don't show if user dismissed toast in current session
    const isDismissed = typeof window !== "undefined" && sessionStorage.getItem("namma_thanjai_apk_toast_dismissed");
    if (isDismissed) return;

    // 3. Show toast after 1.5 seconds
    const timer = setTimeout(() => {
      setShowToast(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const handleDownloadApk = () => {
    setIsDownloading(true);
    toast.success("Starting Namma Thanjai APK v5.9 Download...");

    // Create invisible anchor tag to trigger direct browser download of /NammaThanjai.apk
    const link = document.createElement("a");
    link.href = "/NammaThanjai.apk";
    link.download = "NammaThanjai-v5.9.apk";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      setIsDownloading(false);
    }, 3000);
  };

  const handleDismiss = () => {
    setShowToast(false);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("namma_thanjai_apk_toast_dismissed", "true");
    }
  };

  if (!showToast) return null;

  return (
    <div className="fixed bottom-16 sm:bottom-6 left-4 right-4 max-w-sm mx-auto z-[9999] animate-slide-up select-none pointer-events-auto">
      <div className="bg-slate-950/95 border-2 border-amber-500/80 rounded-2xl p-3.5 sm:p-4 shadow-[0_10px_35px_rgba(245,158,11,0.35)] backdrop-blur-xl flex flex-col gap-3">
        
        {/* Header bar: Badge + Close button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 bg-amber-500/15 border border-amber-500/40 px-2.5 py-0.5 rounded-full">
            <Sparkles className="w-3 h-3 text-amber-400 fill-amber-400" />
            <span className="text-[9px] font-black text-amber-300 uppercase tracking-wider">
              Official Android App v5.9
            </span>
          </div>

          <button
            type="button"
            onClick={handleDismiss}
            className="w-6 h-6 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Content Body: App Icon + Description */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 text-slate-955 flex items-center justify-center font-bold shadow-md shrink-0 border border-amber-300">
            <Smartphone className="w-6 h-6 stroke-[2.5]" />
          </div>

          <div className="flex flex-col">
            <h4 className="font-heading font-black text-xs text-white leading-snug">
              Install Namma Thanjai App
            </h4>
            <p className="text-[10px] text-slate-300 font-medium mt-0.5 leading-tight">
              Direct CMDA plots, trade services & local shop deals with zero broker fees.
            </p>
          </div>
        </div>

        {/* Download Action Button */}
        <button
          type="button"
          onClick={handleDownloadApk}
          disabled={isDownloading}
          className="w-full py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-955 font-heading font-black text-xs uppercase tracking-wider rounded-xl shadow-md border border-amber-300 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
        >
          {isDownloading ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-slate-955 animate-bounce" />
              <span>Downloading APK (33MB)...</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4 text-slate-955 stroke-[2.5]" />
              <span>Install APK Direct Download (33MB) →</span>
            </>
          )}
        </button>

      </div>
    </div>
  );
}
