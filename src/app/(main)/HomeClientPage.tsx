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

      <div className="w-full text-slate-800 font-sans">
        <SellClientPage />
      </div>
  </>
);
}
