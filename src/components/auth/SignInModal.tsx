"use client";

import React, { useState, useEffect } from "react";
import { X, Phone, MessageSquare, Zap, Loader2, CheckCircle } from "lucide-react";
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
  const [otpCode, setOtpCode] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phoneUpdating, setPhoneUpdating] = useState(false);

  const phoneInputRef = React.useRef<HTMLInputElement>(null);
  const otpInputRef = React.useRef<HTMLInputElement>(null);

  const isHeaderLoginRef = React.useRef(false);
  const pendingTargetRef = React.useRef<string | null>(null);

  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);

  // Capture intent when modal opens and reset state when closed
  useEffect(() => {
    if (isOpen) {
      if (typeof window !== "undefined") {
        // Clear any stale legacy localStorage target route
        localStorage.removeItem("namma_thanjai_target_post_route");

        isHeaderLoginRef.current = sessionStorage.getItem("namma_thanjai_header_login_active") === "true";
        pendingTargetRef.current = sessionStorage.getItem("namma_thanjai_target_post_route");
      }
      
      // Auto-focus phone input immediately when modal opens
      if (step === "phone") {
        setTimeout(() => phoneInputRef.current?.focus(), 50);
      }
    } else {
      setStep("phone");
      setOtpCode("");
      // Clear intent to avoid leaking to next open
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("namma_thanjai_header_login_active");
        sessionStorage.removeItem("namma_thanjai_target_post_route");
        localStorage.removeItem("namma_thanjai_target_post_route");
      }
    }
  }, [isOpen, step]);

  // Auto-focus OTP input whenever step transitions to "otp"
  useEffect(() => {
    if (isOpen && step === "otp") {
      setTimeout(() => otpInputRef.current?.focus(), 50);
    }
  }, [isOpen, step]);

  // OTP Countdown timer when step is OTP
  useEffect(() => {
    let interval: any = null;
    if (isOpen && step === "otp") {
      setResendTimer(30);
      setCanResend(false);
      interval = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOpen, step]);

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber || phoneNumber.length !== 10) {
      toast.error("Please enter a valid 10-digit mobile number.");
      return;
    }
    setStep("otp");
    toast.success("WhatsApp OTP sent to +91 " + phoneNumber);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode !== "123456") {
      toast.error("Invalid WhatsApp OTP. Enter 123456 for testing.");
      return;
    }

    setPhoneUpdating(true);
    try {
      const result = await updatePhone(phoneNumber);
      if (result?.success) {
        toast.success("WhatsApp Number Verified Successfully!");
        
        if (typeof window !== "undefined") {
          localStorage.setItem("namma_thanjai_user_verified", "true");
          localStorage.setItem("namma_thanjai_verified", "true");
          localStorage.setItem("my_thanjai_verified", "true");
          localStorage.setItem("namma_thanjai_phone", phoneNumber);
          localStorage.setItem("my_thanjai_phone", phoneNumber);
          window.dispatchEvent(new Event("namma_thanjai_auth_changed"));
        }

        onClose();

        const isHeaderLogin = isHeaderLoginRef.current;
        const pendingTarget = pendingTargetRef.current;

        if (typeof window !== "undefined") {
          sessionStorage.removeItem("namma_thanjai_header_login_active");
          sessionStorage.removeItem("namma_thanjai_target_post_route");
          localStorage.removeItem("namma_thanjai_target_post_route");
          window.scrollTo({ top: 0, left: 0, behavior: "instant" });
        }

        if (pendingTarget) {
          router.push(pendingTarget);
        } else {
          router.refresh();
        }
      } else {
        toast.error("Verification failed.");
      }
    } catch (err: any) {
      toast.error("Verification failed: " + (err?.message || "Unknown error"));
    } finally {
      setPhoneUpdating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999999] flex items-end sm:items-center justify-center bg-slate-950/70 backdrop-blur-sm p-0 animate-fade-in">
      <div className="bg-white border-t border-slate-200/90 w-full max-w-none sm:max-w-md rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl relative text-slate-800 pb-8 sm:pb-6">
        
        {/* Native App Drag Handle Bar */}
        <div className="w-12 h-1 bg-slate-300 rounded-full mx-auto mb-4 sm:hidden" />

        {/* Header Close */}
        <button
          type="button"
          onClick={() => {
            setStep("phone");
            setOtpCode("");
            onClose();
          }}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer z-50"
          title="Close Modal"
        >
          <X className="w-5 h-5 stroke-[2.5]" />
        </button>

        {/* Modal Body */}
        {step === "phone" ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#128C7E] shrink-0">
                <MessageSquare className="w-5 h-5 fill-[#128C7E]" />
              </div>
              <div>
                <h3 className="font-heading font-black text-base text-slate-900 leading-tight">
                  Login with WhatsApp
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Enter your 10-digit mobile number for WhatsApp OTP
                </p>
              </div>
            </div>

            <form onSubmit={handleSendOtp} className="flex flex-col gap-3 mt-1">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider">
                  WhatsApp Mobile Number
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
                    autoComplete="tel-national"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    placeholder="9994837342"
                    className="w-full pl-22 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-black text-slate-900 focus:outline-none focus:border-[#128C7E] focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#128C7E] hover:bg-[#075e54] text-white font-heading font-black text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all active:scale-98 mt-1"
              >
                <MessageSquare className="w-4 h-4 fill-white shrink-0" />
                <span>Send WhatsApp OTP →</span>
              </button>
            </form>
          </div>
        ) : (
          <div className="flex flex-col gap-4 animate-fade-in">
            <div>
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-heading font-black text-base text-slate-900">
                  Enter 6-Digit WhatsApp OTP
                </h3>
                <button
                  type="button"
                  onClick={() => setStep("phone")}
                  disabled={phoneUpdating}
                  className="text-xs font-black text-blue-600 hover:text-blue-800 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg cursor-pointer flex items-center gap-1 shrink-0"
                >
                  <span>✏️ Change Number</span>
                </button>
              </div>
              <p className="text-xs text-slate-600 font-medium mt-1">
                OTP sent to <strong className="text-slate-900 font-bold">+91 {phoneNumber}</strong>
                <span className="inline-block ml-2 text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md font-bold text-[11px]">
                  Testing Code: 123456
                </span>
              </p>
            </div>

            <form onSubmit={handleVerifyOtp} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider text-center">
                  6-Digit OTP Code
                </label>
                <input
                  ref={otpInputRef}
                  autoFocus
                  type="text"
                  required
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="123456"
                  disabled={phoneUpdating}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-center tracking-[0.5em] font-black rounded-xl py-3 text-lg focus:ring-2 focus:ring-[#128C7E] focus:border-[#128C7E] focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={phoneUpdating}
                className="w-full py-3 bg-[#128C7E] hover:bg-[#075e54] text-white font-heading font-black text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all active:scale-98"
              >
                {phoneUpdating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Verifying OTP...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 text-white" />
                    <span>Verify OTP & Proceed</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                {canResend ? (
                  <button
                    type="button"
                    onClick={() => {
                      setResendTimer(30);
                      setCanResend(false);
                      toast.success("WhatsApp OTP resent to +91 " + phoneNumber);
                    }}
                    className="font-bold text-[#128C7E] hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <span>🔄 Resend OTP via WhatsApp</span>
                  </button>
                ) : (
                  <span className="font-semibold text-slate-400">
                    Resend OTP in <strong className="text-slate-700 font-bold">{resendTimer}s</strong>
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => setStep("phone")}
                  disabled={phoneUpdating}
                  className="font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  ← Back
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
