"use client";

import React, { useEffect, useState } from "react";

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
      className={`fixed inset-0 z-[9999] bg-[#0f172a] flex flex-col items-center justify-center select-none transition-opacity duration-500 ${
        stage === "fading" ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* Background ambient glow */}
      <div className="absolute w-72 h-72 bg-amber-500/10 rounded-full blur-3xl animate-pulse pointer-events-none" />

      {/* Main Branding Container */}
      <div className="relative flex flex-col items-center justify-center gap-4 px-6 text-center">
        {/* Tanjore Temple Symbol outline */}
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-2 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
          <svg
            className="w-6 h-6 text-amber-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0h4m-4 0V11m4 10V11m-4 0h4" />
          </svg>
        </div>

        {/* Text Container with Gliding Dot */}
        <div className="relative inline-flex items-center font-heading font-black text-3xl sm:text-4xl md:text-5xl text-white tracking-tight">
          <span>Namma Thanjai</span>

          {/* Gliding Amber Dot */}
          <span
            className={`inline-block w-3.5 h-3.5 sm:w-4 sm:h-4 bg-amber-400 rounded-full shadow-[0_0_12px_rgba(251,191,36,0.9)] ml-1.5 transition-all duration-1000 ease-out ${
              stage === "animating"
                ? "animate-[glideDot_1.3s_cubic-bezier(0.25,1,0.5,1)_forwards]"
                : "scale-100 opacity-100"
            }`}
          />

          {/* Trailing Glow Particle during animation */}
          {stage === "animating" && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="w-full h-1 bg-gradient-to-r from-transparent via-amber-400/40 to-transparent animate-[laserTrail_1.2s_ease-out_forwards]" />
            </div>
          )}
        </div>

        {/* Subtitle / Tagline */}
        <p className="text-xs sm:text-sm text-slate-400 font-medium tracking-wide mt-2">
          நம்ம தஞ்சை நேரடி சேவை • Thanjavur's Direct Network
        </p>

        {/* Subtle loading indicator line */}
        <div className="w-36 h-1 bg-slate-800 rounded-full overflow-hidden mt-6">
          <div className="h-full bg-gradient-to-r from-yellow-500 to-amber-400 animate-[progressFill_1.8s_ease-in-out_forwards]" />
        </div>
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
