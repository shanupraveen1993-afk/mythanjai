"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Activity, ShieldCheck } from "lucide-react";

export interface TickerAlertItem {
  tag?: string;
  text: string;
}

export interface LiveMovingTickerProps {
  alerts?: (string | TickerAlertItem)[];
  intervalMs?: number;
  className?: string;
}

const DEFAULT_TANJORE_STRUCTURED_ALERTS: TickerAlertItem[] = [
  { tag: "PLOT", text: "New CMDA Plot posted in Vallam Road • Zero Brokerage" },
  { tag: "RENTAL", text: "2 BHK House available for rent near Medical College" },
  { tag: "MOBILE", text: "Used iPhone 14 128GB listed for sale in Old Bus Stand" },
  { tag: "SERVICE", text: "Expert AC Technician & Electrician ready in New Bus Stand" },
  { tag: "TAXI", text: "Toyota Innova Taxi Driver available for local & outstation" },
  { tag: "DEAL", text: "Store Offer: 20% OFF Grand Opening Sale in South Rampart" },
  { tag: "NEED", text: "Buyer Need: Looking for Used Royal Enfield in Parisutham Nagar" },
  { tag: "CARPENTER", text: "Wood Carpenter available for custom furniture in Royal Nagar" },
];

export function LiveMovingTicker({
  alerts = DEFAULT_TANJORE_STRUCTURED_ALERTS,
  intervalMs = 3200,
  className = "",
}: LiveMovingTickerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!alerts || alerts.length === 0) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % alerts.length);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [alerts, intervalMs]);

  if (!alerts || alerts.length === 0) return null;

  const currentItem = alerts[currentIndex];
  const itemObj: TickerAlertItem =
    typeof currentItem === "string"
      ? { tag: "LIVE", text: currentItem }
      : currentItem;

  return (
    <div
      className={`w-full bg-slate-955/95 backdrop-blur-md text-white rounded-2xl px-3.5 py-2.5 flex items-center gap-2.5 border border-amber-400/35 shadow-lg shadow-amber-500/5 overflow-hidden select-none ${className}`}
    >
      {/* LIVE Radar Beacon Badge */}
      <div className="flex items-center gap-1.5 bg-amber-500/20 text-amber-300 px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider shrink-0 border border-amber-400/40 shadow-2xs">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-80" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400" />
        </span>
        <span className="text-amber-300 font-black tracking-widest">LIVE</span>
      </div>

      {/* Rotating Alert Text & Tag */}
      <div className="flex-1 overflow-hidden relative h-5 flex items-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.26, ease: "easeOut" }}
            className="absolute inset-0 flex items-center gap-1.5 truncate"
          >
            {itemObj.tag && (
              <span className="bg-amber-400 text-slate-955 text-[9px] font-heading font-black uppercase px-1.5 py-0.5 rounded-md tracking-wider shrink-0 shadow-2xs">
                {itemObj.tag}
              </span>
            )}
            <span className="text-[10px] sm:text-[11px] font-extrabold text-slate-100 truncate tracking-wide">
              {itemObj.text}
            </span>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Subtle Verified Shield Icon */}
      <div className="hidden sm:flex items-center gap-1 text-[10px] font-black text-amber-400/90 shrink-0 bg-amber-400/10 px-2 py-0.5 rounded-lg border border-amber-400/20">
        <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
        <span className="text-[9px] uppercase tracking-wider">Direct</span>
      </div>
    </div>
  );
}

export default LiveMovingTicker;
