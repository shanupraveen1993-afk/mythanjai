"use client";

import React, { useState, useEffect } from "react";
import { Download, X, Smartphone } from "lucide-react";
import { usePathname } from "next/navigation";

export default function GetAppHomeBanner() {
  const pathname = usePathname() || "";
  const [isDismissed, setIsDismissed] = useState(true);
  const [isNativeApp, setIsNativeApp] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Check if native APK platform
      try {
        const cap = (window as any).Capacitor;
        if (cap && cap.isNativePlatform && cap.isNativePlatform()) {
          setIsNativeApp(true);
          return;
        }
      } catch (e) {}

      // Check session dismissal state
      const dismissed = sessionStorage.getItem("namma_thanjai_apk_banner_dismissed") === "true";
      setIsDismissed(dismissed);
    }
  }, []);

  // Show ONLY on Home page (pathname === "/") on Mobile WebApp (!isNativeApp && !isDismissed)
  if (pathname !== "/" || isNativeApp || isDismissed) {
    return null;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("namma_thanjai_apk_banner_dismissed", "true");
    }
  };

  return (
    <div className="w-full md:hidden bg-blue-50 border-b border-blue-200/80 px-3 py-2 flex items-center justify-between gap-2 text-slate-800 transition-all select-none">
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-7 h-7 rounded-lg bg-[#1d4ed8] text-white flex items-center justify-center shrink-0">
          <Smartphone className="w-4 h-4 text-white stroke-[2.2]" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-medium text-slate-700 leading-tight truncate">
            Get official Namma Thanjai App for faster alerts
          </p>
          <a
            href="/api/apk-download"
            download="NammaThanjai-v16.apk"
            className="text-[11px] font-heading font-black text-[#1d4ed8] hover:underline flex items-center gap-1 mt-0.5"
          >
            <span>Download APK App</span>
            <Download className="w-3 h-3 text-[#1d4ed8] stroke-[2.5]" />
          </a>
        </div>
      </div>

      <button
        type="button"
        onClick={handleDismiss}
        className="p-1 text-slate-400 hover:text-slate-700 rounded-lg transition-colors shrink-0 cursor-pointer"
        title="Dismiss banner"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
