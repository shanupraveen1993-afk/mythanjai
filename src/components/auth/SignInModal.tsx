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
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
              <Phone className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-heading font-black text-base text-slate-900 leading-tight">
                Enter Mobile Number
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Verify your 10-digit phone number to publish &amp; access your account
              </p>
            </div>
          </div>

          <form onSubmit={handleDirectLogin} className="flex flex-col gap-3 mt-1">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider">
                10-Digit Mobile Number
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-slate-700 bg-slate-200/60 px-2 py-0.5 rounded-md">
                  +91 🇮🇳
                </span>
                <input
                  ref={phoneInputRef}
                  autoFocus
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
              className="w-full py-3.5 bg-[#FBBF24] hover:bg-amber-400 text-[#0F172A] font-heading font-black text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all active:scale-98 mt-1"
            >
              {phoneUpdating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#0F172A]" />
                  <span>Verifying Account...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 text-[#0F172A]" />
                  <span>Verify &amp; Continue →</span>
                </>
              )}
            </button>
          </form>

          <div className="flex items-center justify-center gap-1 text-[11px] text-slate-400 font-medium pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Encrypted local community sign-in</span>
          </div>
        </div>
      </div>
    </div>
  );
}
