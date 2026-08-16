"use client";

import React from "react";
import { useRouter } from "next/navigation";
import RobotHero from "@/components/ui/robot-hero";

export default function OnboardingClientPage() {
  const router = useRouter();

  return (
    <RobotHero
      onCtaClick={() => router.push("/home")}
      onSignInClick={() => {
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("namma_thanjai_open_signin"));
        }
      }}
    />
  );
}

