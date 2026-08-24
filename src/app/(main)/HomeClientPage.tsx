"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { MapPin, ChevronRight, ShoppingBag, Search, Wrench, Store, ArrowRight, Lock, UserCheck } from "lucide-react";
import RobotHero from "@/components/ui/robot-hero";
import CategoryBridgeFeed from "@/components/home/CategoryBridgeFeed";
import SplashScreen from "@/components/onboarding/SplashScreen";
import WalkthroughModal from "@/components/onboarding/WalkthroughModal";
import HomeCategorySegmentBar from "@/components/layout/HomeCategorySegmentBar";
import UniversalSearchBarRow from "@/components/layout/UniversalSearchBarRow";
import SellClientPage from "./sell/SellClientPage";

export default function HomeClientPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const isAuthVerified = Boolean(profile?.isVerified);
  const [activeSegment, setActiveSegment] = React.useState<"sell" | "need" | "service" | "offer">("sell");

  const [showSplash, setShowSplash] = useState(false);
  const [showWalkthrough, setShowWalkthrough] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isApkMode = localStorage.getItem("namma_thanjai_is_apk") === "true" || window.location.search.includes("apk=true");
      const hasSeenWalkthrough = localStorage.getItem("namma_thanjai_seen_walkthrough") === "true";

      if (isApkMode && !hasSeenWalkthrough) {
        setShowSplash(true);
      }
    }
  }, []);

  return (
    <>
      {showSplash && (
        <SplashScreen
          onFinished={() => {
            setShowSplash(false);
            setShowWalkthrough(true);
          }}
        />
      )}

      <WalkthroughModal
        isOpen={showWalkthrough}
        onComplete={() => {
          setShowWalkthrough(false);
          if (typeof window !== "undefined") {
            localStorage.setItem("namma_thanjai_seen_walkthrough", "true");
            window.dispatchEvent(new Event("namma_thanjai_open_signin"));
          }
        }}
      />

      <div className="w-full flex flex-col gap-5 text-slate-800 font-sans mt-1 px-3 sm:px-6 max-w-7xl mx-auto">
      {/* ── 1. Universal Search Bar Row (Search Bar + Royal Blue Get App + Golden Yellow Post) ── */}
      <div className="w-full">
        <UniversalSearchBarRow />
      </div>

      {/* ── 2. Hero Banner (Positioned Directly Below Search Bar) ── */}
      <div className="relative w-full min-h-[160px] sm:min-h-[200px] rounded-2xl overflow-hidden bg-slate-950 text-white flex items-center px-6 sm:px-8 py-6 sm:py-8 shadow-md border border-slate-800">
        <img src="/thanjavur_temple_illustration.png" alt="Namma Thanjai" className="absolute right-0 top-0 h-full w-3/5 object-cover opacity-30 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-transparent" />
        <div className="relative z-10 flex flex-col gap-2 max-w-xl">
          <span className="text-white font-extrabold text-xs sm:text-sm tracking-wider w-fit underline decoration-[#FBBF24] decoration-2 underline-offset-4 pb-0.5">
            Namma Thanjai • நம்ம தஞ்சை
          </span>
          <h1 className="font-heading font-black text-xl sm:text-2xl text-white tracking-tight leading-snug">
            Everything you need in our city, all in one place. <span className="text-amber-400 block text-xs sm:text-base font-extrabold mt-1">நம்ம ஊரின் அனைத்து தேவைகளுக்கும் ஒரே இடம்.</span>
          </h1>

          {!isAuthVerified && (
            <div className="mt-2.5 flex items-center justify-start w-fit">
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== "undefined") {
                    window.dispatchEvent(new Event("namma_thanjai_open_signin"));
                  }
                }}
                className="shrink-0 bg-[#FBBF24] hover:bg-amber-400 text-[#0F172A] font-heading font-black text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-md cursor-pointer transition-all flex items-center justify-center gap-1.5 select-none"
              >
                <span>Register to Post Ad</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── 3. Universal Sticky 4-Category Segment Bar (Mobile WebApp/APK STICKY TOP) ── */}
      <HomeCategorySegmentBar />

      {/* ── 4. Live Sell Listings Stream (Direct Vertical Feed) ── */}
      <div className="w-full mt-2">
        <SellClientPage />
      </div>
    </div>
  </>
);
}
