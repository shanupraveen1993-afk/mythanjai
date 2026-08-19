"use client";

import React from "react";

interface CategoryIllustrationProps {
  category?: string;
  type?: "need" | "service" | "sell";
  className?: string;
  variant?: "badge" | "tile" | "full";
}

// ── CORPORATE HIGH-PRECISION 2D TRADE VECTOR SVG GRAPHICS ─────────────────────

function PlumbingVector() {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect width="64" height="64" rx="12" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1.5" />
      {/* Precision Pipe Manifold */}
      <path d="M16 22H36V28H22V46H16V22Z" fill="#1D4ED8" fillOpacity="0.08" stroke="#1D4ED8" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M34 22H48V42H34V22Z" stroke="#1E293B" strokeWidth="2.5" strokeLinejoin="round" />
      {/* Water Droplet */}
      <path d="M41 46C41 48.76 38.76 51 36 51C33.24 51 31 48.76 31 46C31 43.5 36 38 36 38C36 38 41 43.5 41 46Z" fill="#1D4ED8" />
    </svg>
  );
}

function ElectricalVector() {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect width="64" height="64" rx="12" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1.5" />
      {/* Circuit Board Lines */}
      <path d="M16 32H26L30 20L34 44L38 32H48" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="16" cy="32" r="3" fill="#1D4ED8" />
      <circle cx="48" cy="32" r="3" fill="#1D4ED8" />
      {/* Lightning Flash */}
      <path d="M35 14L25 32H33L29 48L41 30H33L35 14Z" fill="#F59E0B" stroke="#D97706" strokeWidth="1" strokeLinejoin="round" />
    </svg>
  );
}

function ACFridgeVector() {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect width="64" height="64" rx="12" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1.5" />
      {/* Corporate AC Unit */}
      <rect x="14" y="20" width="36" height="20" rx="4" fill="#FFFFFF" stroke="#1E293B" strokeWidth="2.5" />
      <line x1="18" y1="30" x2="46" y2="30" stroke="#1D4ED8" strokeWidth="2" strokeDasharray="2 2" />
      {/* Airflow Lines */}
      <path d="M20 45C24 43 26 47 30 45" stroke="#1D4ED8" strokeWidth="2" strokeLinecap="round" />
      <path d="M34 45C38 43 40 47 44 45" stroke="#1D4ED8" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function CarpentryVector() {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect width="64" height="64" rx="12" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1.5" />
      {/* Woodworking Tools */}
      <path d="M20 44L38 26L42 30L24 48L20 44Z" fill="#1D4ED8" stroke="#1E293B" strokeWidth="2" strokeLinejoin="round" />
      <rect x="14" y="44" width="36" height="8" rx="2" fill="#1E293B" fillOpacity="0.1" stroke="#1E293B" strokeWidth="2" />
    </svg>
  );
}

function PaintingVector() {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect width="64" height="64" rx="12" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1.5" />
      {/* Roller & Stroke */}
      <rect x="18" y="18" width="28" height="12" rx="3" fill="#1D4ED8" stroke="#1E293B" strokeWidth="2" />
      <path d="M46 24H50V36H34V46" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function RealEstateVector() {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect width="64" height="64" rx="12" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1.5" />
      <path d="M32 16L14 30V48H50V30L32 16Z" fill="#FFFFFF" stroke="#1E293B" strokeWidth="2.5" strokeLinejoin="round" />
      <rect x="27" y="36" width="10" height="12" fill="#1D4ED8" rx="1" />
    </svg>
  );
}

function VehiclesVector() {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect width="64" height="64" rx="12" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1.5" />
      <circle cx="22" cy="42" r="8" fill="#FFFFFF" stroke="#1E293B" strokeWidth="2.5" />
      <circle cx="44" cy="42" r="8" fill="#FFFFFF" stroke="#1E293B" strokeWidth="2.5" />
      <path d="M22 42L32 28H42L44 42" stroke="#1D4ED8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ElectronicsVector() {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect width="64" height="64" rx="12" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1.5" />
      <rect x="22" y="16" width="20" height="34" rx="4" fill="#FFFFFF" stroke="#1E293B" strokeWidth="2.5" />
      <circle cx="32" cy="44" r="1.5" fill="#1D4ED8" />
    </svg>
  );
}

function DefaultTradeVector() {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect width="64" height="64" rx="12" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1.5" />
      <circle cx="32" cy="32" r="14" stroke="#1E293B" strokeWidth="2.5" />
      <path d="M26 32L30 36L38 28" stroke="#1D4ED8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function CategoryVectorIllustration({
  category = "",
  type = "need",
  className = "w-full h-full",
  variant = "tile",
}: CategoryIllustrationProps) {
  const cat = category.toLowerCase();

  const getVectorComponent = () => {
    if (cat.includes("plumber") || cat.includes("water") || cat.includes("pipe")) return <PlumbingVector />;
    if (cat.includes("electrician") || cat.includes("wire") || cat.includes("power")) return <ElectricalVector />;
    if (cat.includes("ac") || cat.includes("cool") || cat.includes("fridge")) return <ACFridgeVector />;
    if (cat.includes("carpenter") || cat.includes("wood") || cat.includes("furniture")) return <CarpentryVector />;
    if (cat.includes("paint")) return <PaintingVector />;

    if (cat.includes("real estate") || cat.includes("plot") || cat.includes("house") || cat.includes("rental") || cat.includes("land") || cat.includes("property")) return <RealEstateVector />;
    if (cat.includes("vehicle") || cat.includes("car") || cat.includes("bike") || cat.includes("scooter") || cat.includes("auto")) return <VehiclesVector />;
    if (cat.includes("electronic") || cat.includes("mobile") || cat.includes("laptop") || cat.includes("tv") || cat.includes("phone")) return <ElectronicsVector />;

    return <DefaultTradeVector />;
  };

  // BADGE VARIANT: Clean Slate Text (NO BACKGROUND TINT CHIP SOUP!)
  if (variant === "badge") {
    return (
      <span className={`text-slate-500 font-semibold text-xs truncate ${className}`}>
        {category || "Requirement"}
      </span>
    );
  }

  // TILE VARIANT: Square Vector Tile on Neutral Slate Surface
  return (
    <div className={`w-full h-full relative overflow-hidden rounded-xl font-sans ${className}`}>
      {getVectorComponent()}
    </div>
  );
}
