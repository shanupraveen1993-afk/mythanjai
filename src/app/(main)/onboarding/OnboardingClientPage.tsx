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

type OnboardingStage = "splash" | "walkthrough1" | "walkthrough2" | "login";

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
    <div className="min-h-screen w-full bg-[#1E244A] text-white flex flex-col justify-between p-6 sm:p-10 relative font-sans overflow-y-auto select-none">
      {/* Background Gradient Accents */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* ========================================================= */}
      {/* STAGE 1: SPLASH SCREEN (2.2s Animated Screen)            */}
      {/* ========================================================= */}
      {stage === "splash" && (
        <div 
          onClick={() => setStage("walkthrough1")}
          className="flex-1 flex flex-col items-center justify-center text-center gap-6 cursor-pointer animate-fade-in py-12"
        >
          <div className="relative group">
            <div className="absolute -inset-2 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-3xl blur-md opacity-70 group-hover:opacity-100 transition duration-1000 animate-pulse" />
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-[#121633] p-4 shadow-2xl border-2 border-amber-400/80 flex items-center justify-center relative">
              <img src="/namma_thanjai_logo_dark_bg.png" alt="Namma Thanjai Logo" className="w-full h-full object-contain animate-scale-up" />
            </div>
          </div>

          <div className="flex flex-col items-center gap-1.5 max-w-sm px-4">
            <h1 className="font-heading font-black text-3xl sm:text-4xl text-white tracking-tight">
              Namma Thanjai
            </h1>
            <span className="bg-amber-400 text-slate-950 font-black text-[11px] uppercase tracking-wider px-3 py-1 rounded-full shadow-md">
              தஞ்சாவூரின் #1 உள்ளூர் தளம்
            </span>
            <p className="text-xs sm:text-sm text-amber-200/90 font-semibold mt-2">
              Thanjavur's Premier Local Classifieds &amp; Service Network
            </p>
          </div>

          <div className="mt-8 flex items-center gap-2 text-xs text-slate-400 font-bold animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
            <span>Tap anywhere to continue...</span>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* STAGE 2: WALKTHROUGH 1 (BUY & SELL MARKETPLACE)           */}
      {/* ========================================================= */}
      {stage === "walkthrough1" && (
        <div className="flex-1 flex flex-col items-center justify-between max-w-md mx-auto w-full py-6 animate-fade-in">
          {/* Top Progress Dots */}
          <div className="flex items-center gap-2 pt-2">
            <div className="w-8 h-2 rounded-full bg-amber-400 transition-all" />
            <div className="w-2 h-2 rounded-full bg-white/20 transition-all" />
            <div className="w-2 h-2 rounded-full bg-white/20 transition-all" />
          </div>

          {/* Center Content Card */}
          <div className="flex flex-col items-center text-center gap-6 my-auto py-8">
            <div className="w-28 h-28 rounded-3xl bg-amber-400/15 border-2 border-amber-400/40 p-6 flex items-center justify-center shadow-xl text-amber-400 relative">
              <ShoppingBag className="w-14 h-14 stroke-[1.8] text-amber-400" />
              <span className="absolute -bottom-2 -right-2 bg-amber-400 text-slate-950 p-2 rounded-2xl shadow-md">
                <Tag className="w-5 h-5 stroke-[2.5]" />
              </span>
            </div>

            <div className="flex flex-col items-center gap-2">
              <span className="text-[10px] font-black tracking-widest text-amber-400 uppercase bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">
                WALKTHROUGH 1 OF 2 • MARKETPLACE
              </span>
              <h2 className="font-heading font-black text-2xl sm:text-3xl text-white tracking-tight">
                Buy &amp; Sell Locally in Thanjavur
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed max-w-xs mt-1">
                Post items for sale, find used cars, bikes, mobiles, electronics &amp; furniture directly from trusted local neighbours.
              </p>
            </div>

            {/* Feature Highlights */}
            <div className="w-full flex flex-col gap-2.5 text-left bg-white/5 border border-white/10 p-4 rounded-2xl">
              <div className="flex items-center gap-2.5 text-xs font-bold text-amber-200">
                <Check className="w-4 h-4 text-amber-400 stroke-[3] shrink-0" />
                <span>Direct Buyer to Seller Chat (Zero Brokerage)</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs font-bold text-amber-200">
                <Check className="w-4 h-4 text-amber-400 stroke-[3] shrink-0" />
                <span>Instant Phone &amp; WhatsApp Contact</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs font-bold text-amber-200">
                <Check className="w-4 h-4 text-amber-400 stroke-[3] shrink-0" />
                <span>Verified Thanjavur Local Listings</span>
              </div>
            </div>
          </div>

          {/* Bottom Action Button */}
          <div className="w-full flex flex-col gap-3">
            <button
              type="button"
              onClick={() => setStage("walkthrough2")}
              className="w-full py-4 bg-[#FBBF24] hover:bg-amber-400 text-slate-950 font-heading font-black text-sm uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 shadow-xl cursor-pointer transition-all active:scale-98"
            >
              <span>Next: Local Services →</span>
              <ChevronRight className="w-5 h-5 text-slate-950 stroke-[3]" />
            </button>
            <button
              type="button"
              onClick={() => setStage("login")}
              className="text-xs text-slate-400 font-bold hover:text-white transition-colors py-1"
            >
              Skip Walkthrough
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* STAGE 3: WALKTHROUGH 2 (LOCAL SERVICES & STORE OFFERS)    */}
      {/* ========================================================= */}
      {stage === "walkthrough2" && (
        <div className="flex-1 flex flex-col items-center justify-between max-w-md mx-auto w-full py-6 animate-fade-in">
          {/* Top Progress Dots */}
          <div className="flex items-center gap-2 pt-2">
            <div className="w-2 h-2 rounded-full bg-white/20 transition-all" />
            <div className="w-8 h-2 rounded-full bg-amber-400 transition-all" />
            <div className="w-2 h-2 rounded-full bg-white/20 transition-all" />
          </div>

          {/* Center Content Card */}
          <div className="flex flex-col items-center text-center gap-6 my-auto py-8">
            <div className="w-28 h-28 rounded-3xl bg-emerald-400/15 border-2 border-emerald-400/40 p-6 flex items-center justify-center shadow-xl text-emerald-400 relative">
              <Wrench className="w-14 h-14 stroke-[1.8] text-emerald-400" />
              <span className="absolute -bottom-2 -right-2 bg-emerald-400 text-slate-950 p-2 rounded-2xl shadow-md">
                <Store className="w-5 h-5 stroke-[2.5]" />
              </span>
            </div>

            <div className="flex flex-col items-center gap-2">
              <span className="text-[10px] font-black tracking-widest text-emerald-400 uppercase bg-emerald-400/10 px-3 py-1 rounded-full border border-emerald-400/20">
                WALKTHROUGH 2 OF 2 • SERVICES &amp; OFFERS
              </span>
              <h2 className="font-heading font-black text-2xl sm:text-3xl text-white tracking-tight">
                Local Services &amp; Store Offers
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed max-w-xs mt-1">
                Discover trusted local plumbers, electricians, AC mechanics, drivers &amp; exclusive discount flyers from your favourite Thanjavur stores.
              </p>
            </div>

            {/* Feature Highlights */}
            <div className="w-full flex flex-col gap-2.5 text-left bg-white/5 border border-white/10 p-4 rounded-2xl">
              <div className="flex items-center gap-2.5 text-xs font-bold text-emerald-200">
                <Check className="w-4 h-4 text-emerald-400 stroke-[3] shrink-0" />
                <span>50+ Local Trades &amp; Skilled Technician Profiles</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs font-bold text-emerald-200">
                <Check className="w-4 h-4 text-emerald-400 stroke-[3] shrink-0" />
                <span>Daily Retail Deals &amp; Store Discount Flyers</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs font-bold text-emerald-200">
                <Check className="w-4 h-4 text-emerald-400 stroke-[3] shrink-0" />
                <span>Direct Contact with Local Business Owners</span>
              </div>
            </div>
          </div>

          {/* Bottom Action Button */}
          <div className="w-full flex flex-col gap-3">
            <button
              type="button"
              onClick={() => setStage("login")}
              className="w-full py-4 bg-[#FBBF24] hover:bg-amber-400 text-slate-950 font-heading font-black text-sm uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 shadow-xl cursor-pointer transition-all active:scale-98"
            >
              <span>Get Started / Login →</span>
              <ArrowRight className="w-5 h-5 text-slate-950 stroke-[3]" />
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
              <img src="/namma_thanjai_logo_dark_bg.png" alt="Namma Thanjai Logo" className="w-full h-full object-contain" />
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

            {/* Skip to Browse Feed Button (No Icons) */}
            <button
              type="button"
              onClick={() => {
                if (typeof window !== "undefined") {
                  localStorage.setItem("namma_thanjai_onboarding_completed_v10", "true");
                }
                router.push("/");
              }}
              className="w-full mt-4 py-3.5 bg-white/5 hover:bg-white/10 border border-white/15 text-slate-200 font-heading font-bold text-xs rounded-2xl flex items-center justify-center transition-all cursor-pointer"
            >
              <span>Skip for now &amp; Explore Marketplace</span>
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
