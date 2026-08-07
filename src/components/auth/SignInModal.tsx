"use client";

import React, { useState, useEffect } from "react";
import { X, Phone, MessageSquare, Zap, Loader2, CheckCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useSearchParams, useRouter } from "next/navigation";
import confetti from "canvas-confetti";

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SignInModal({ isOpen, onClose }: SignInModalProps) {
  const { profile, updatePhone } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneUpdating, setPhoneUpdating] = useState(false);
  const [verificationPending, setVerificationPending] = useState(false);
  const [verificationToken, setVerificationToken] = useState("");

  // Listen to profile verification state to close modal and redirect
  useEffect(() => {
    if (profile?.isVerified) {
      onClose();
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        if (params.get("auth")) {
          params.delete("auth");
          const newSearch = params.toString() ? `?${params.toString()}` : "";
          window.history.replaceState(null, "", `${window.location.pathname}${newSearch}`);
        }
      }
      const redirect = searchParams.get("redirect");
      if (redirect) {
        router.push(redirect);
      }
    }
  }, [profile?.isVerified, onClose, searchParams, router]);

  if (!isOpen) return null;

  const handleInitiateWhatsAppVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber || phoneNumber.length < 10) {
      alert("Please enter a valid 10-digit mobile number.");
      return;
    }

    setPhoneUpdating(true);
    try {
      // Mock bypass: immediately verify and register the phone number
      const result = await updatePhone(phoneNumber);
      if (result?.success) {
        confetti({ particleCount: 80, spread: 60 });
      } else {
        alert("Verification failed.");
      }
    } catch (err: any) {
      alert("Verification failed: " + err.message);
    } finally {
      setPhoneUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/65 backdrop-blur-xs p-0 sm:p-4 animate-fade-in">
      <div className="bg-white border-t-2 sm:border border-slate-200/90 w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl p-6 sm:p-5 shadow-2xl relative animate-slide-up sm:animate-scale-up text-slate-800 pb-8 sm:pb-5">
        
        {/* Mobile Bottom Sheet Handle Bar */}
        <div className="w-12 h-1 bg-slate-300 rounded-full mx-auto mb-3 block sm:hidden" />

        {/* Header Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="w-4 h-4" />
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
              <p className="text-[10px] text-slate-500 mt-1">
                Your WhatsApp number is verified. Directing to target page...
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div>
              <h3 className="font-heading font-extrabold text-sm text-slate-900">
                WhatsApp Verification
              </h3>
              <p className="text-[10px] text-slate-500 mt-1">
                Enter any 10-digit mobile number for immediate verification login (testing mode).
              </p>
            </div>

            <form onSubmit={handleInitiateWhatsAppVerify} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">
                  WhatsApp Number
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">+91</span>
                  <input
                    type="tel"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    placeholder="10-digit number"
                    disabled={phoneUpdating}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl pl-11 pr-3 py-2 text-xs focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 focus:outline-none font-bold"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={phoneUpdating}
                className="bg-yellow-500 hover:bg-yellow-600 text-slate-950 font-black w-full py-2.5 rounded-xl text-xs transition-colors shadow-sm flex items-center justify-center gap-1.5"
              >
                {phoneUpdating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <Phone className="w-3.5 h-3.5 text-slate-950" />
                    <span>Verify & Login</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
