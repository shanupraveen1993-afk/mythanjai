"use client";

import React, { Suspense } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import RobotHero from "@/components/ui/robot-hero";
import HomeClientPage from "./HomeClientPage";

function RootPageContent() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const isAuthVerified = Boolean(profile?.isVerified || user);

  React.useEffect(() => {
    if (!loading && isAuthVerified) {
      router.replace("/home");
    }
  }, [loading, isAuthVerified, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center font-heading font-black text-xs text-amber-400">
        Loading Namma Thanjavur...
      </div>
    );
  }

  // Verified Logged In User: Render Home Marketplace Dashboard while redirecting
  if (isAuthVerified) {
    return <HomeClientPage />;
  }

  // Unauthenticated Visitors (Web App & Website): Render RobotHero (3D Mascot Robo Landing Page)
  return (
    <RobotHero
      onCtaClick={() => router.push("/home")}
      onSignInClick={() => {
        if (typeof window !== "undefined") {
          sessionStorage.removeItem("namma_thanjai_target_post_route");
          localStorage.removeItem("namma_thanjai_target_post_route");
          sessionStorage.setItem("namma_thanjai_header_login_active", "true");
          window.dispatchEvent(new Event("namma_thanjai_open_signin"));
        }
      }}
    />
  );
}

export default function RootPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0f172a] flex items-center justify-center font-heading font-black text-xs text-amber-400">
          Loading Namma Thanjavur...
        </div>
      }
    >
      <RootPageContent />
    </Suspense>
  );
}
