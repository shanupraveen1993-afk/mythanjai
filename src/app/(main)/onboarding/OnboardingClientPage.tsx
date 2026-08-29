"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/context/ToastContext";
import {
  Phone,
  CheckCircle,
  Loader2,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  ShoppingBag,
  Wrench,
  Tag,
  Gift,
  Check,
  ChevronRight,
  Store,
  Star,
  Users,
} from "lucide-react";

type OnboardingStage = "splash" | "walkthrough1" | "login";

export default function OnboardingClientPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { updatePhone } = useAuth();

  const [stage, setStage] = useState<OnboardingStage>("splash");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneUpdating, setPhoneUpdating] = useState(false);

  // Auto-advance Splash Screen to Walkthrough 1 after 2.2 seconds
  useEffect(() => {
    if (stage === "splash") {
      const timer = setTimeout(() => {
        setStage("walkthrough1");
      }, 2200);
      return () => clearTimeout(timer);
    }
  }, [stage]);

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
          localStorage.setItem("namma_thanjai_onboarding_completed_v10", "true");
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
    <div className="h-screen max-h-screen w-full bg-[#1E244A] text-white flex flex-col justify-between p-6 sm:p-10 relative font-sans overflow-hidden select-none">
      {/* Background Gradient Accents */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* ========================================================= */}
      {/* STAGE 1: SPLASH SCREEN (CLEAN & SHARP - NO EXTRA CONTENT) */}
      {/* ========================================================= */}
      {stage === "splash" && (
        <div 
          onClick={() => setStage("walkthrough1")}
          className="flex-1 flex flex-col items-center justify-between text-center gap-8 cursor-pointer animate-fade-in py-12 my-auto"
        >
          <div className="my-auto flex flex-col items-center gap-6">
            {/* Glowing Logo Badge */}
            <div className="relative group">
              <div className="absolute -inset-3 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 rounded-3xl blur-lg opacity-80 animate-pulse" />
              <div className="w-32 h-32 rounded-3xl bg-[#121633] p-4 shadow-2xl border-2 border-amber-400 flex items-center justify-center relative z-10">
                <img src="/namma_thanjai_logo_dark_bg.png" alt="Namma Thanjai Logo" className="w-full h-full object-contain animate-scale-up" />
              </div>
            </div>

            {/* Brand Title */}
            <div className="flex flex-col items-center gap-2 max-w-sm px-4">
              <h1 className="font-heading font-black text-3xl sm:text-4xl text-white tracking-tight">
                Namma Thanjai
              </h1>
              <span className="bg-[#FBBF24] text-slate-950 font-heading font-black text-xs uppercase tracking-wider px-4 py-1 rounded-full shadow-lg border border-amber-300">
                தஞ்சாவூர்
              </span>
            </div>
          </div>

          {/* Animated Gold Loading Line */}
          <div className="w-full max-w-xs flex flex-col items-center gap-2 pb-4">
            <div className="w-full h-1.5 bg-white/15 rounded-full overflow-hidden relative">
              <div className="h-full bg-gradient-to-r from-amber-400 to-yellow-300 rounded-full animate-pulse w-3/4" />
            </div>
            <span className="text-[11px] text-slate-300 font-medium">Opening...</span>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* STAGE 2: SINGLE WALKTHROUGH SCREEN (SIMPLE, PRECISE & SHARP) */}
      {/* ========================================================= */}
      {stage === "walkthrough1" && (
        <div className="flex-1 flex flex-col items-center justify-between max-w-md mx-auto w-full py-6 animate-fade-in">
          {/* Header */}
          <div className="w-full text-center pt-2">
            <span className="text-[10px] font-black tracking-widest text-amber-400 uppercase bg-amber-400/10 px-3.5 py-1 rounded-full border border-amber-400/20">
              WELCOME TO NAMMA THANJAI
            </span>
            <h2 className="font-heading font-black text-2xl sm:text-3xl text-white tracking-tight mt-3">
              Thanjavur's Local Hub
            </h2>
          </div>

          {/* 2 Precise Category Highlights */}
          <div className="w-full flex flex-col gap-4 my-auto py-4">
            {/* Category 1: Buy, Sell & Wanted */}
            <div className="bg-white/10 border border-white/15 p-4 rounded-2xl flex items-center gap-4 text-left shadow-lg">
              <div className="w-12 h-12 rounded-xl bg-[#FBBF24] text-slate-950 flex items-center justify-center shrink-0 shadow-md">
                <ShoppingBag className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div className="flex flex-col">
                <h3 className="font-heading font-black text-base text-white">Buy, Sell &amp; Wanted</h3>
                <p className="text-xs text-slate-300 font-medium mt-0.5">Post ads to sell or request items you need locally</p>
              </div>
            </div>

            {/* Category 2: Local Services & Offers */}
            <div className="bg-white/10 border border-white/15 p-4 rounded-2xl flex items-center gap-4 text-left shadow-lg">
              <div className="w-12 h-12 rounded-xl bg-emerald-400 text-slate-950 flex items-center justify-center shrink-0 shadow-md">
                <Wrench className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div className="flex flex-col">
                <h3 className="font-heading font-black text-base text-white">Services &amp; Store Offers</h3>
                <p className="text-xs text-slate-300 font-medium mt-0.5">Find local skilled services &amp; exclusive shop deals</p>
              </div>
            </div>
          </div>

          {/* Bottom Action Button */}
          <div className="w-full flex flex-col gap-2.5">
            <button
              type="button"
              onClick={() => setStage("login")}
              className="w-full py-4 bg-[#FBBF24] hover:bg-amber-400 text-slate-950 font-heading font-black text-sm uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 shadow-xl cursor-pointer transition-all active:scale-98"
            >
              <span>Get Started →</span>
              <ArrowRight className="w-5 h-5 text-slate-950 stroke-[3]" />
            </button>
            <button
              type="button"
              onClick={() => {
                if (typeof window !== "undefined") {
                  localStorage.setItem("namma_thanjai_onboarding_completed_v10", "true");
                }
                router.push("/");
              }}
              className="text-xs text-slate-400 font-bold hover:text-white transition-colors py-1 text-center"
            >
              Skip
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* STAGE 4: LOGIN PAGE (CLEAN MINIMALIST UI - NO ICONS)      */}
      {/* ========================================================= */}
      {stage === "login" && (
        <div className="flex-1 flex flex-col justify-between max-w-md mx-auto w-full py-4 animate-fade-in">
          {/* Top Header Logo */}
          <div className="w-full flex flex-col items-center text-center gap-3 pt-2 relative z-10">
            <div className="w-20 h-20 rounded-3xl bg-[#121633] p-3 shadow-2xl border-2 border-amber-400/80 flex items-center justify-center">
              <img src="/namma_thanjai_logo.png" alt="Namma Thanjai Logo" className="w-full h-full object-contain" />
            </div>
            <div className="flex flex-col items-center">
              <h1 className="font-heading font-black text-2xl sm:text-3xl text-white tracking-tight">
                Namma Thanjai
              </h1>
              <p className="text-xs text-amber-200 font-bold mt-1">
                தஞ்சாவூரின் முதன்மை வணிக &amp; சேவைத் தளம்
              </p>
            </div>
          </div>

          {/* Center Auth Box */}
          <div className="w-full my-auto py-6 relative z-10">
            <div className="bg-[#121633] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl flex flex-col gap-6">
              <div className="flex flex-col gap-1.5 text-center">
                <h2 className="font-heading font-black text-xl sm:text-2xl text-white">Sign In to Continue</h2>
                <p className="text-xs text-slate-300 font-medium">Enter your mobile number to post ads and chat with sellers</p>
              </div>

              <form onSubmit={handleLogin} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-black text-amber-400 uppercase tracking-wider text-left">
                    Mobile Number
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-slate-200 bg-white/10 px-2.5 py-1.5 rounded-lg border border-white/15">
                      +91
                    </span>
                    <input
                      type="tel"
                      inputMode="tel"
                      required
                      autoFocus
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      placeholder="9994837342"
                      className="w-full pl-20 pr-4 py-3.5 bg-white/5 border border-white/15 rounded-2xl text-base font-semibold text-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all placeholder:text-slate-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={phoneUpdating}
                  className="w-full py-4 bg-[#FBBF24] hover:bg-amber-400 text-slate-950 font-heading font-black text-xs uppercase tracking-wider rounded-2xl flex items-center justify-center shadow-xl cursor-pointer transition-all active:scale-98"
                >
                  <span>{phoneUpdating ? "Verifying Account..." : "Verify & Enter App"}</span>
                </button>
              </form>

              <div className="text-center text-[11px] text-emerald-300 font-bold">
                Instant 1-Click Mobile Verification for Thanjavur
              </div>
            </div>

            {/* Skip Button (Clean Text-Only Button) */}
            <button
              type="button"
              onClick={() => {
                if (typeof window !== "undefined") {
                  localStorage.setItem("namma_thanjai_onboarding_completed_v10", "true");
                }
                router.push("/");
              }}
              className="w-full mt-3 py-3 text-slate-300 hover:text-white font-heading font-bold text-xs rounded-xl flex items-center justify-center transition-all cursor-pointer select-none"
            >
              <span>Skip</span>
            </button>
          </div>

          {/* Footer Copyright */}
          <div className="w-full text-center text-[11px] text-slate-400 font-medium pb-2 relative z-10">
            © {new Date().getFullYear()} Namma Thanjai • Built for Thanjavur Community
          </div>
        </div>
      )}
    </div>
  );
}
