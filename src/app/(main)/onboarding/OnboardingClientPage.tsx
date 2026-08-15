"use client";

import React from "react";
import Image from "next/image";
import { Sparkles, ArrowRight, ShieldCheck, Tag, Wrench, Store, Zap, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";

export default function OnboardingClientPage() {
  const router = useRouter();
  const { profile, user } = useAuth();

  const handleOpenAuth = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("namma_thanjai_open_signin"));
    }
  };

  return (
    <div className="w-full h-screen h-[100dvh] overflow-hidden bg-[#0f172a] text-white flex flex-col justify-between p-6 sm:p-8 relative font-sans select-none border-0">
      
      {/* Background Ambient Glow Effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-10 right-0 w-72 h-72 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* TOP HERO BRANDING CONTAINER */}
      <div className="relative z-10 flex flex-col items-center text-center mt-6 sm:mt-10 gap-4 animate-fade-in">
        
        {/* Official Namma Thanjai Logo Badge */}
        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center p-4 shadow-[0_0_40px_rgba(245,158,11,0.3)] backdrop-blur-md animate-scale-up">
          <Image
            src="/namma_thanjai_logo.png"
            alt="Namma Thanjai Logo"
            width={110}
            height={110}
            className="w-full h-full object-contain filter drop-shadow-md"
            priority
          />
        </div>

        {/* Title & Tagline */}
        <div className="flex flex-col gap-1.5 max-w-sm">
          <h1 className="font-heading font-black text-3xl sm:text-4xl text-white tracking-tight flex items-center justify-center gap-1.5">
            <span>Namma Thanjai</span>
            <span className="w-3 h-3 rounded-full bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.9)] shrink-0" />
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 font-bold tracking-wide">
            Thanjavur Direct Trade & Service Network
          </p>
          <p className="text-[11px] text-slate-400 font-medium leading-relaxed mt-1">
            Connect directly with verified local residents, trade services, and shop deals across Thanjavur.
          </p>
        </div>

        {/* 4 Core App Features Pill Grid */}
        <div className="grid grid-cols-2 gap-2.5 max-w-xs sm:max-w-sm w-full mt-4">
          <div className="bg-slate-800/80 border border-slate-700/80 p-3 rounded-2xl flex items-center gap-2.5 text-left shadow-2xs">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <span className="block text-xs font-black text-white">Buy & Sell</span>
              <span className="block text-[9px] text-slate-400 font-medium">Verified Items</span>
            </div>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/80 p-3 rounded-2xl flex items-center gap-2.5 text-left shadow-2xs">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-yellow-400 flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <span className="block text-xs font-black text-white">Need Posts</span>
              <span className="block text-[9px] text-slate-400 font-medium">Post Requirement</span>
            </div>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/80 p-3 rounded-2xl flex items-center gap-2.5 text-left shadow-2xs">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
              <Wrench className="w-4 h-4" />
            </div>
            <div>
              <span className="block text-xs font-black text-white">Trade Service</span>
              <span className="block text-[9px] text-slate-400 font-medium">Tanjore Pros</span>
            </div>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/80 p-3 rounded-2xl flex items-center gap-2.5 text-left shadow-2xs">
            <div className="w-8 h-8 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center shrink-0">
              <Store className="w-4 h-4" />
            </div>
            <div>
              <span className="block text-xs font-black text-white">Shop Directory</span>
              <span className="block text-[9px] text-slate-400 font-medium">Exclusive Offers</span>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM FIXED ACTION BUTTONS CONTAINER */}
      <div className="relative z-10 flex flex-col gap-3 max-w-sm mx-auto w-full mb-6 sm:mb-8 animate-slide-up">
        
        {/* Verification Note */}
        <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-semibold text-center">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>WhatsApp 2-Step Instant Verification</span>
        </div>

        {/* Primary Action Button: Register & Explore */}
        <button
          type="button"
          onClick={handleOpenAuth}
          className="w-full py-4 bg-yellow-500 hover:bg-yellow-400 text-slate-955 font-heading font-black text-sm uppercase tracking-wider rounded-2xl shadow-xl shadow-yellow-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer border border-yellow-400"
        >
          <span>Register & Explore</span>
          <ArrowRight className="w-4 h-4 stroke-[3]" />
        </button>

        {/* Secondary Button: Login */}
        <button
          type="button"
          onClick={handleOpenAuth}
          className="w-full py-2.5 text-slate-300 hover:text-white font-bold text-xs text-center cursor-pointer transition-colors"
        >
          Already registered? <span className="text-yellow-400 underline font-black">Login to Account</span>
        </button>
      </div>

    </div>
  );
}
