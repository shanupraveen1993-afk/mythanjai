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

        if (pendingTarget && pendingTarget.startsWith("/post")) {
          router.push(pendingTarget);
        } else {
          router.push("/");
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

  if (!isOpen || (typeof window !== "undefined" && window.location.pathname.includes("/onboarding"))) return null;

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
        <div className="flex flex-col gap-6 pt-2">
          
          {/* Logo & Brand Header */}
          <div className="flex flex-col items-center text-center gap-2">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 p-2.5 shadow-sm border border-slate-200 flex items-center justify-center">
              <img src="/namma_thanjai_logo.png" alt="Namma Thanjai Logo" className="w-full h-full object-contain" />
            </div>
            <h2 className="font-heading font-black text-2xl text-slate-900 tracking-tight mt-1">
              Sign in to Namma Thanjai
            </h2>
            <p className="text-xs text-slate-600 font-medium max-w-xs leading-relaxed">
              Enter your mobile number to post ads, chat directly with sellers &amp; explore Thanjavur store offers.
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleDirectLogin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider text-left">
                Mobile Number
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-slate-700 bg-slate-200/80 px-2.5 py-1 rounded-md border border-slate-300">
                  +91
                </span>
                <input
                  ref={phoneInputRef}
                  type="tel"
                  inputMode="tel"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="9994837342"
                  className="w-full pl-20 pr-4 py-3.5 bg-slate-50 border border-slate-300 rounded-xl text-base font-bold text-slate-900 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/50 focus:bg-white transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={phoneUpdating}
              className="w-full py-4 bg-[#FBBF24] hover:bg-amber-400 text-slate-950 font-heading font-black text-xs uppercase tracking-wider rounded-xl flex items-center justify-center shadow-lg cursor-pointer transition-all active:scale-98 border border-amber-400"
            >
              <span>{phoneUpdating ? "Verifying Account..." : "Verify & Enter App"}</span>
            </button>
          </form>

          <div className="text-center text-[11px] text-slate-500 font-semibold border-t border-slate-100 pt-3">
            Instant 1-Click Mobile Verification for Thanjavur Community
          </div>
        </div>
      </div>
    </div>
  );
}
