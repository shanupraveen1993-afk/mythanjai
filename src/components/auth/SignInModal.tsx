"use client";

import React, { useState, useEffect } from "react";
import { X, Phone, MessageSquare, Zap, Loader2, CheckCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useSearchParams, useRouter } from "next/navigation";
import { useToast } from "@/context/ToastContext";

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SignInModal({ isOpen, onClose }: SignInModalProps) {
  const { toast } = useToast();
  const { profile, updatePhone } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phoneUpdating, setPhoneUpdating] = useState(false);

  const isHeaderLoginRef = React.useRef(false);
  const pendingTargetRef = React.useRef<string | null>(null);

  // Capture intent when modal opens and reset state when closed
  useEffect(() => {
    if (isOpen) {
      if (typeof window !== "undefined") {
        // Clear any stale legacy localStorage target route
        localStorage.removeItem("namma_thanjai_target_post_route");

        isHeaderLoginRef.current = sessionStorage.getItem("namma_thanjai_header_login_active") === "true";
        pendingTargetRef.current = sessionStorage.getItem("namma_thanjai_target_post_route");
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
  }, [isOpen]);

  // Listen to profile verification state to auto-close modal if already verified
  useEffect(() => {
    if (isOpen && profile?.isVerified) {
      onClose();
    }
  }, [isOpen, profile?.isVerified, onClose]);

  if (!isOpen) return null;

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
        onClose();

        const isHeaderLogin = isHeaderLoginRef.current;
        const pendingTarget = pendingTargetRef.current;

        if (typeof window !== "undefined") {
          sessionStorage.removeItem("namma_thanjai_header_login_active");
          sessionStorage.removeItem("namma_thanjai_target_post_route");
          localStorage.removeItem("namma_thanjai_target_post_route");
          window.scrollTo({ top: 0, left: 0, behavior: "instant" });
        }

        if (!isHeaderLogin && pendingTarget && pendingTarget.startsWith("/post/")) {
          router.push(pendingTarget);
        } else {
          router.push("/home");
        }
      } else {
        toast.error("Verification failed.");
      }
    } catch (err: any) {
      toast.error("Verification failed: " + err.message);
    } finally {
      setPhoneUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white border border-slate-200/90 w-full max-w-sm rounded-2xl p-6 shadow-2xl relative text-slate-800">

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
        {profile?.isVerified ? (
          <div className="flex flex-col items-center justify-center text-center py-6 gap-3 animate-fade-in">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
              <CheckCircle className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-heading font-extrabold text-sm text-slate-900">
                Verification Successful
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Your WhatsApp number is verified. Directing to target page...
              </p>
            </div>
          </div>
        ) : step === "phone" ? (
          <div className="flex flex-col gap-4">
            <div>
              <h3 className="font-heading font-extrabold text-sm text-slate-900">
                WhatsApp Verification
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Enter your 10-digit mobile number to receive WhatsApp OTP code.
              </p>
            </div>

            <form onSubmit={handleSendOtp} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-black text-slate-400 uppercase tracking-wider">
                  WhatsApp Number
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">+91</span>
                  <input
                    type="tel"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    placeholder="10-digit mobile number"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl pl-11 pr-3 py-2 text-xs focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 focus:outline-none font-bold"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 btn-primary text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5 text-[#0F172A]" />
                <span>Send WhatsApp OTP →</span>
              </button>
            </form>
          </div>
        ) : (
          <div className="flex flex-col gap-4 animate-fade-in">
            <div>
              <h3 className="font-heading font-extrabold text-sm text-slate-900">
                Enter 6-Digit WhatsApp OTP
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                OTP sent to <strong className="text-slate-900">+91 {phoneNumber}</strong>.
                <span className="block text-amber-600 font-bold mt-0.5">Testing Code: 123456</span>
              </p>
            </div>

            <form onSubmit={handleVerifyOtp} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-black text-slate-400 uppercase tracking-wider">
                  6-Digit OTP Code
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="Enter 123456"
                  disabled={phoneUpdating}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-center tracking-[0.4em] font-extrabold rounded-xl py-2.5 text-base focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={phoneUpdating}
                className="w-full py-2.5 btn-primary text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {phoneUpdating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#0F172A]" />
                    <span>Verifying OTP...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-3.5 h-3.5 text-[#0F172A]" />
                    <span>Verify OTP & Login</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setStep("phone")}
                disabled={phoneUpdating}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 text-center cursor-pointer hover:underline"
              >
                ← Change Mobile Number
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
