"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";

export default function SplashScreen({
  onComplete,
}: {
  onComplete?: () => void;
}) {
  const [stage, setStage] = useState<"animating" | "settled" | "fading">("animating");

  useEffect(() => {
    // Stage 1: Dot glides from left across text (1.4s)
    const timer1 = setTimeout(() => {
      setStage("settled");
    }, 1400);

    // Stage 2: Hold settled title with dot (0.6s), then fade out
    const timer2 = setTimeout(() => {
      setStage("fading");
    }, 2000);

    // Stage 3: Complete callback
    const timer3 = setTimeout(() => {
      if (onComplete) onComplete();
    }, 2400);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[9999] bg-slate-50 text-slate-900 flex flex-col items-center justify-between select-none transition-opacity duration-500 overflow-hidden font-sans ${
        stage === "fading" ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* Background ambient lighting matching walkthrough */}
      <div className="absolute top-1/4 right-0 w-80 h-80 bg-amber-400/15 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 left-0 w-80 h-80 bg-yellow-400/15 blur-[100px] rounded-full pointer-events-none" />

      {/* Main Branding Container — Scrollable body */}
      <div className="flex-1 w-full overflow-y-auto px-6 py-12 flex flex-col items-center justify-center text-center gap-4 pb-28 z-10">
        {/* Official Namma Thanjai Logo Image */}
        <div className="w-24 h-24 rounded-2xl bg-white border border-slate-200 flex items-center justify-center p-3.5 mb-2 shadow-md backdrop-blur-md animate-scale-up">
          <Image
            src="/namma_thanjai_logo.png"
            alt="Namma Thanjai Logo"
            width={96}
            height={96}
            className="w-full h-full object-contain filter drop-shadow-sm"
            priority
          />
        </div>

        {/* Text Container with Gliding Dot */}
        <div className="relative inline-flex items-center font-heading font-black text-3xl sm:text-4xl md:text-5xl text-slate-900 tracking-tight">
          <span>Namma Thanjai</span>

          {/* Gliding Amber Dot */}
          <span
            className={`inline-block w-3.5 h-3.5 sm:w-4 sm:h-4 bg-amber-500 rounded-full shadow-[0_0_12px_rgba(245,158,11,0.8)] ml-1.5 transition-all duration-1000 ease-out ${
              stage === "animating"
                ? "animate-[glideDot_1.3s_cubic-bezier(0.25,1,0.5,1)_forwards]"
                : "scale-100 opacity-100"
            }`}
          />

          {/* Trailing Glow Particle during animation */}
          {stage === "animating" && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="w-full h-1 bg-gradient-to-r from-transparent via-amber-500/40 to-transparent animate-[laserTrail_1.2s_ease-out_forwards]" />
            </div>
          )}
        </div>

        {/* Subtitle / Tagline */}
        <p className="text-xs sm:text-sm text-slate-600 font-bold tracking-wide mt-1">
          Thanjavur's Direct Network • நம்ம ஊர் சந்தை
        </p>

        {/* Subtle loading indicator line */}
        <div className="w-36 h-1 bg-slate-200 rounded-full overflow-hidden mt-4">
          <div className="h-full bg-gradient-to-r from-yellow-500 to-amber-500 animate-[progressFill_1.8s_ease-in-out_forwards]" />
        </div>
      </div>

      {/* Fixed Bottom CTA Button */}
      <div className="fixed bottom-6 left-6 right-6 z-50 max-w-md mx-auto">
        <button
          type="button"
          onClick={() => {
            if (onComplete) onComplete();
          }}
          className="w-full bg-[#FBBF24] hover:bg-amber-400 text-slate-950 font-heading font-black text-sm py-3.5 px-6 rounded-2xl shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer border border-amber-400/60"
        >
          <span>Proceed to App →</span>
        </button>
      </div>

      {/* Animation keyframes in CSS */}
      <style jsx global>{`
        @keyframes glideDot {
          0% {
            transform: translateX(-240px) scale(1.8);
            opacity: 0.2;
            filter: blur(2px);
          }
          60% {
            transform: translateX(10px) scale(1.3);
            opacity: 1;
            filter: blur(0px);
          }
          85% {
            transform: translateX(-4px) scale(0.9);
          }
          100% {
            transform: translateX(0px) scale(1);
            opacity: 1;
          }
        }

        @keyframes laserTrail {
          0% {
            transform: translateX(-100%);
            opacity: 0;
          }
          50% {
            opacity: 0.8;
          }
          100% {
            transform: translateX(100%);
            opacity: 0;
          }
        }

        @keyframes progressFill {
          0% {
            width: 0%;
          }
          100% {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
