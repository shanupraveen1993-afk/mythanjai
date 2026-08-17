"use client";

import React, { useState } from "react";
import { Download, Smartphone, CheckCircle2, ShieldCheck } from "lucide-react";
import { useToast } from "@/context/ToastContext";

export default function StaticApkCard({
  variant = "light",
}: {
  variant?: "light" | "dark";
}) {
  const { toast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadApk = () => {
    setIsDownloading(true);
    toast.success("Starting Namma Thanjai Official APK v5.9 Download...");

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

  return (
    <div className="w-full rounded-[16px] p-6 sm:p-8 bg-white border border-slate-200 hover:border-slate-900 transition-all shadow-md relative overflow-hidden select-none">
      {/* Subtle Warm Accent Background Tint */}
      <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
        
        {/* Left Column: App Icon + Details */}
        <div className="flex items-start gap-4 flex-1">
          {/* 48x48px Slate Icon Box with Yellow Icon */}
          <div className="icon-box-dark shrink-0 mt-1">
            <Smartphone className="w-6 h-6 stroke-[2]" />
          </div>

          <div className="flex flex-col gap-2 flex-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="bg-amber-400 text-slate-900 font-heading font-bold text-xs uppercase tracking-wider px-3 py-1 rounded-full border border-amber-500">
                Official Android App v5.9
              </span>
              <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
                Direct APK • Verified &amp; Safe (33MB)
              </span>
            </div>

            <h3 className="font-heading font-black text-xl sm:text-2xl text-slate-900 leading-tight">
              Install Namma Thanjai Official App
            </h3>
            
            <p className="text-xs sm:text-sm font-normal text-slate-600 leading-relaxed max-w-xl">
              Get instant push alerts for CMDA plots, hire verified Tanjore trade experts, and claim exclusive local store offers with zero broker fees.
            </p>
          </div>
        </div>

        {/* Right Column: Download Button */}
        <div className="w-full md:w-auto shrink-0 pt-2 md:pt-0">
          <button
            type="button"
            onClick={handleDownloadApk}
            disabled={isDownloading}
            className="w-full md:w-auto px-7 py-3.5 btn-primary text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2.5 cursor-pointer"
          >
            {isDownloading ? (
              <>
                <CheckCircle2 className="w-5 h-5 animate-bounce text-slate-900" />
                <span>Downloading APK (33MB)...</span>
              </>
            ) : (
              <>
                <Download className="w-5 h-5 text-slate-900 stroke-[2.5]" />
                <span>Download APK Direct →</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
