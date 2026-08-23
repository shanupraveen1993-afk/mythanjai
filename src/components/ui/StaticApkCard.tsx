"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Download, Smartphone, CheckCircle2, ShieldCheck } from "lucide-react";
import { useToast } from "@/context/ToastContext";

export default function StaticApkCard({
  variant = "light",
}: {
  variant?: "light" | "dark";
}) {
  const { toast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);
  const [isNative, setIsNative] = useState(false);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const cap = (window as any).Capacitor;
        if (cap && cap.isNativePlatform && cap.isNativePlatform()) {
          setIsNative(true);
        }
      } catch (e) {}
    }
  }, []);

  if (isNative) return null;

  const handleDownloadApk = () => {
    setIsDownloading(true);
    toast.success("Starting Namma Thanjai Official APK v12 Download...");

    const link = document.createElement("a");
    link.href = "/api/apk-download";
    link.download = "NammaThanjai-v12.apk";
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
          {/* Official App Logo */}
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center p-2 shrink-0 mt-1 shadow-xs">
            <Image
              src="/namma_thanjai_logo.png"
              alt="Namma Thanjai Official App"
              width={48}
              height={48}
              className="w-full h-full object-contain filter drop-shadow-xs"
            />
          </div>

          <div className="flex flex-col gap-2 flex-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="bg-amber-400 text-slate-900 font-heading font-bold text-xs uppercase tracking-wider px-3 py-1 rounded-full border border-amber-500">
                Official Android App v12
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
