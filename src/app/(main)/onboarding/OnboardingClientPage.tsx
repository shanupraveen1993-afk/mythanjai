"use client";

import React from "react";
import { useRouter } from "next/navigation";
import RobotHero from "@/components/ui/robot-hero";

export default function OnboardingClientPage() {
  const router = useRouter();

  return (
    <div className="w-full min-h-screen bg-white">
      <RobotHero
        ctaText="Explore App Marketplace"
        onCtaClick={() => {
          router.push("/");
        }}
        alerts={[
          "New plot listed in Vallam — 2400 Sqft CMDA approved",
          "Senthil Electrician: 4.9★ rating, available in Tanjore Town",
          "GLEN Gallery: Up to 60% OFF — Grand Opening Sale",
          "New 2 BHK rental listed near Medical College Road",
          "12 new members joined Namma Thanjavur today!",
        ]}
      />
    </div>
  );
}
