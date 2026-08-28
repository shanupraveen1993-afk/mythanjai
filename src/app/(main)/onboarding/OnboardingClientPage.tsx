"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/context/ToastContext";
import { Phone, CheckCircle, Loader2, ShieldCheck, ArrowRight, Sparkles } from "lucide-react";

export default function OnboardingClientPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { updatePhone } = useAuth();

  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneUpdating, setPhoneUpdating] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
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
        toast.success("Welcome to Namma Thanjai!");
        if (typeof window !== "undefined") {
          localStorage.setItem("namma_thanjai_user_verified", "true");
          localStorage.setItem("namma_thanjai_verified", "true");
          localStorage.setItem("my_thanjai_verified", "true");
          localStorage.setItem("namma_thanjai_phone", cleanPhone);
          localStorage.setItem("my_thanjai_phone", cleanPhone);
          window.dispatchEvent(new Event("namma_thanjai_auth_changed"));
        }
        router.push("/");
      } else {
        toast.error("Sign-in failed. Please try again.");
      }
    } catch (err: any) {
      toast.error("Sign-in error: " + (err?.message || "Unknown error"));
    } finally {
      setPhoneUpdating(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-white flex flex-col justify-between p-6 sm:p-10 relative font-sans overflow-y-auto">
      {/* Background Gradient Accents */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Logo */}
      <div className="w-full flex flex-col items-center text-center gap-3 pt-6 relative z-10">
        <div className="w-20 h-20 rounded-3xl bg-white p-3 shadow-2xl border-2 border-amber-400/50 flex items-center justify-center animate-bounce-subtle">
          <img src="/namma_thanjai_logo.png" alt="Namma Thanjai Logo" className="w-full h-full object-contain" />
        </div>
        <div className="flex flex-col items-center">
          <h1 className="font-heading font-black text-2xl sm:text-3xl text-white tracking-tight flex items-center gap-2">
            <span className="text-[#3b82f6]">நம்ம</span>
            <span className="text-[#f59e0b]">thanjai</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 font-bold mt-1">
            தஞ்சாவூரின் முதன்மை வணிக &amp; சேவைத் தளம்
          </p>
        </div>
      </div>

      {/* Center Auth Box */}
      <div className="w-full max-w-sm mx-auto flex flex-col gap-6 py-8 relative z-10">
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl flex flex-col gap-5">
          <div className="flex flex-col gap-1 text-center">
            <h2 className="font-heading font-black text-lg text-white">Sign In to Continue</h2>
            <p className="text-xs text-slate-400 font-medium">Enter your mobile number to post ads &amp; chat with sellers</p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
                Mobile Number
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-slate-200 bg-slate-800 px-2 py-1 rounded-lg border border-slate-700">
                  +91 🇮🇳
                </span>
                <input
                  type="tel"
                  inputMode="tel"
                  required
                  autoFocus
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="9994837342"
                  className="w-full pl-22 pr-4 py-3.5 bg-slate-950 border border-slate-800 rounded-2xl text-base font-semibold text-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all placeholder:text-slate-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={phoneUpdating}
              className="w-full py-4 bg-amber-400 hover:bg-amber-300 text-slate-950 font-heading font-black text-xs uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 shadow-xl cursor-pointer transition-all active:scale-98"
            >
              {phoneUpdating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Verifying Account...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 text-slate-950" />
                  <span>Verify &amp; Enter App →</span>
                </>
              )}
            </button>
          </form>

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-medium pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Instant 1-Click Verification for Tanjore</span>
          </div>
        </div>

        {/* Skip to Browse Feed Button */}
        <button
          type="button"
          onClick={() => router.push("/")}
          className="w-full py-3 bg-slate-900/60 hover:bg-slate-900 border border-slate-800 text-slate-300 font-heading font-bold text-xs rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <span>Skip for now &amp; Explore Marketplace</span>
          <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
        </button>
      </div>

      {/* Footer Copyright */}
      <div className="w-full text-center text-[11px] text-slate-500 font-medium pb-4 relative z-10">
        © {new Date().getFullYear()} Namma Thanjai • Built for Thanjavur Community
      </div>
    </div>
  );
}
