"use client";

import React, { useState, useEffect } from "react";
import { X, Phone, CheckCircle, Loader2, ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useToast } from "@/context/ToastContext";

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SignInModal({ isOpen, onClose }: SignInModalProps) {
  const { toast } = useToast();
  const { profile, updatePhone } = useAuth();
  const router = useRouter();

  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneUpdating, setPhoneUpdating] = useState(false);

  const phoneInputRef = React.useRef<HTMLInputElement>(null);
  const isHeaderLoginRef = React.useRef(false);
  const pendingTargetRef = React.useRef<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPhoneNumber("");
      if (typeof window !== "undefined") {
        localStorage.removeItem("namma_thanjai_target_post_route");
        isHeaderLoginRef.current = sessionStorage.getItem("namma_thanjai_header_login_active") === "true";
        pendingTargetRef.current = sessionStorage.getItem("namma_thanjai_target_post_route");
      }
      setTimeout(() => phoneInputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const handleDirectLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phoneNumber.replace(/\D/g, "");
    if (!cleanPhone || cleanPhone.length !== 10) {
      toast.error("Please enter a valid 10-digit mobile number.");
      return;
    }

    setPhoneUpdating(true);
    try {
      const result = await updatePhone(cleanPhone);
      if (result?.success) {
        toast.success("Mobile Number Verified Successfully!");

        if (typeof window !== "undefined") {
          localStorage.setItem("namma_thanjai_user_verified", "true");
          localStorage.setItem("namma_thanjai_verified", "true");
          localStorage.setItem("my_thanjai_verified", "true");
          localStorage.setItem("namma_thanjai_phone", cleanPhone);
          localStorage.setItem("my_thanjai_phone", cleanPhone);
          window.dispatchEvent(new Event("namma_thanjai_auth_changed"));
        }

        onClose();

        const pendingTarget = pendingTargetRef.current;
        if (typeof window !== "undefined") {
          sessionStorage.removeItem("namma_thanjai_header_login_active");
          sessionStorage.removeItem("namma_thanjai_target_post_route");
          localStorage.removeItem("namma_thanjai_target_post_route");
        }

        if (pendingTarget) {
          router.push(pendingTarget);
        } else {
          router.refresh();
        }
      } else {
        toast.error("Sign-in failed.");
      }
    } catch (err: any) {
      toast.error("Sign-in error: " + (err?.message || "Unknown error"));
    } finally {
      setPhoneUpdating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999999] flex items-end sm:items-center justify-center bg-slate-950/70 backdrop-blur-sm p-0 animate-fade-in">
      <div className="bg-white border-t border-slate-200/90 w-full max-w-none sm:max-w-md rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl relative text-slate-800 pb-8 sm:pb-6">
        
        {/* Native Drag Handle */}
        <div className="w-12 h-1 bg-slate-300 rounded-full mx-auto mb-4 sm:hidden" />

        {/* Header Close */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer z-50"
          title="Close"
        >
          <X className="w-5 h-5 stroke-[2.5]" />
        </button>

        {/* Modal Body */}
        <div className="flex flex-col gap-4">
          
          {/* Logo & Brand Header */}
          <div className="flex flex-col items-center text-center gap-1.5 pt-1">
            <div className="w-14 h-14 rounded-2xl bg-white p-2 shadow-md border border-slate-200 flex items-center justify-center">
              <img src="/namma_thanjai_logo.png" alt="Namma Thanjai Logo" className="w-full h-full object-contain" />
            </div>
            <h2 className="font-heading font-black text-xl text-slate-900 tracking-tight flex items-center gap-1.5 mt-1">
              <span className="text-[#1d4ed8]">நம்ம</span>
              <span className="text-[#f59e0b]">thanjai</span>
            </h2>
            <p className="text-xs text-slate-500 font-bold max-w-xs leading-relaxed">
              Thanjavur's #1 Local Marketplace, Need Requests &amp; Trade Directory
            </p>
          </div>

          {/* 4-SEGMENT FEATURE SHOWCASE (DISPLAY ONLY - NOT BUTTONS) */}
          <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-3 flex flex-col gap-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Platform Services Showcase</span>
              <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded">All-in-One Tanjore App</span>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white border border-slate-200 p-2.5 rounded-xl flex items-center gap-2 shadow-2xs select-none">
                <span className="text-base shrink-0">🏷️</span>
                <div className="min-w-0">
                  <span className="text-xs font-extrabold text-slate-900 block leading-none">Sell Items</span>
                  <span className="text-[10px] text-slate-500 font-medium block truncate mt-0.5">Bikes, Phones, Goods</span>
                </div>
              </div>

              <div className="bg-white border border-slate-200 p-2.5 rounded-xl flex items-center gap-2 shadow-2xs select-none">
                <span className="text-base shrink-0">🔍</span>
                <div className="min-w-0">
                  <span className="text-xs font-extrabold text-slate-900 block leading-none">Need Requests</span>
                  <span className="text-[10px] text-slate-500 font-medium block truncate mt-0.5">Rentals &amp; Buying</span>
                </div>
              </div>

              <div className="bg-white border border-slate-200 p-2.5 rounded-xl flex items-center gap-2 shadow-2xs select-none">
                <span className="text-base shrink-0">🛠️</span>
                <div className="min-w-0">
                  <span className="text-xs font-extrabold text-slate-900 block leading-none">Local Services</span>
                  <span className="text-[10px] text-slate-500 font-medium block truncate mt-0.5">Electricians &amp; Drivers</span>
                </div>
              </div>

              <div className="bg-white border border-slate-200 p-2.5 rounded-xl flex items-center gap-2 shadow-2xs select-none">
                <span className="text-base shrink-0">🏪</span>
                <div className="min-w-0">
                  <span className="text-xs font-extrabold text-slate-900 block leading-none">Store Offers</span>
                  <span className="text-[10px] text-slate-500 font-medium block truncate mt-0.5">Shops &amp; Discounts</span>
                </div>
              </div>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleDirectLogin} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider">
                Enter Mobile Number to Sign In
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-slate-700 bg-slate-200/70 px-2 py-0.5 rounded-md">
                  +91 🇮🇳
                </span>
                <input
                  ref={phoneInputRef}
                  type="tel"
                  inputMode="tel"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="9994837342"
                  className="w-full pl-22 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={phoneUpdating}
              className="w-full py-3.5 bg-[#FBBF24] hover:bg-amber-400 text-[#0F172A] font-heading font-black text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all active:scale-98"
            >
              {phoneUpdating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#0F172A]" />
                  <span>Verifying Account...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 text-[#0F172A]" />
                  <span>Verify &amp; Enter Home Page →</span>
                </>
              )}
            </button>
          </form>

          <div className="flex items-center justify-center gap-1 text-[11px] text-slate-400 font-medium pt-0.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Encrypted WhatsApp sign-in for Thanjavur users</span>
          </div>
        </div>
      </div>
    </div>
  );
}
