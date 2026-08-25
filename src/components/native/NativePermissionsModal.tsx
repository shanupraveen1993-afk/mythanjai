"use client";

import React, { useState, useEffect } from "react";
import { MapPin, Bell, ShieldCheck, Check, X } from "lucide-react";

interface NativePermissionsModalProps {
  isOpen?: boolean;
  onComplete?: () => void;
}

export default function NativePermissionsModal({ isOpen: propIsOpen, onComplete }: NativePermissionsModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const cap = (window as any).Capacitor;
        if (cap && cap.isNativePlatform && cap.isNativePlatform()) {
          setIsNative(true);
        }
      } catch (e) {}
    }
  }, []);

  const isOpen = propIsOpen !== undefined ? propIsOpen : internalOpen;

  if (!isOpen) return null;

  const handleGrantPermissions = async () => {
    localStorage.setItem("namma_thanjai_permissions_prompted_v1", "true");
    setInternalOpen(false);
    if (onComplete) onComplete();

    try {
      const cap = (window as any).Capacitor;
      if (cap?.Plugins?.Geolocation) {
        await cap.Plugins.Geolocation.requestPermissions();
      }
      if (cap?.Plugins?.PushNotifications) {
        await cap.Plugins.PushNotifications.requestPermissions();
      }
    } catch (e) {
      console.warn("Capacitor permissions request error:", e);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem("namma_thanjai_permissions_prompted_v1", "true");
    setInternalOpen(false);
    if (onComplete) onComplete();
  };

  return (
    <div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-md flex items-end sm:items-center justify-center p-4 font-sans select-none animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-xl flex flex-col gap-5 relative animate-in slide-in-from-bottom-6 duration-300">
        
        {/* Header Branding */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center p-2">
              <img src="/namma_thanjai_logo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h3 className="font-heading font-black text-slate-900 text-base leading-tight">
                Namma Thanjai Permissions
              </h3>
              <p className="text-xs text-amber-600 font-bold">Google Play Store Guidelines</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDismiss}
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-600 font-medium leading-relaxed">
          To provide local Tanjore deals, doorstep service tracking, and instant chat alerts, Namma Thanjai requests the following permissions:
        </p>

        {/* Permission 1: Location */}
        <div className="flex items-start gap-3 bg-slate-50 border border-slate-200/80 p-3.5 rounded-2xl">
          <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
            <MapPin className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="font-heading font-bold text-xs text-slate-900">
              Location Access (Optional)
            </span>
            <span className="text-[11px] text-slate-500 font-medium leading-normal">
              Shows nearby CMDA plots, house rentals, and trade experts close to your area in Thanjavur.
            </span>
          </div>
        </div>

        {/* Permission 2: Push Notifications */}
        <div className="flex items-start gap-3 bg-slate-50 border border-slate-200/80 p-3.5 rounded-2xl">
          <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
            <Bell className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="font-heading font-bold text-xs text-slate-900">
              Push Notifications (Recommended)
            </span>
            <span className="text-[11px] text-slate-500 font-medium leading-normal">
              Notifies you instantly when buyers message your posts or when local store offers drop.
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-1">
          <button
            type="button"
            onClick={handleDismiss}
            className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-600 font-heading font-bold text-xs hover:bg-slate-100 transition-all cursor-pointer"
          >
            Maybe Later
          </button>

          <button
            type="button"
            onClick={handleGrantPermissions}
            className="flex-1 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-heading font-black text-xs shadow-md border border-amber-400 transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
            <span>Allow Permissions</span>
          </button>
        </div>
      </div>
    </div>
  );
}
