"use client";

import React from "react";
import { MapPin } from "lucide-react";
import { THANJAVUR_TOWNS } from "@/lib/constants";

interface LocalitySelectorProps {
  p1Area: string;
  setP1Area: (val: string) => void;
  p2Specific: string;
  setP2Specific: (val: string) => void;
}

export default function LocalitySelector({
  p1Area,
  setP1Area,
  p2Specific,
  setP2Specific,
}: LocalitySelectorProps) {
  return (
    <div className="flex flex-col gap-3 bg-slate-50 border border-slate-200/90 rounded-2xl p-4">
      <div className="flex items-center gap-2 text-slate-900 font-heading font-black text-xs sm:text-sm">
        <MapPin className="w-4 h-4 text-amber-600 stroke-[2.5]" />
        <span>Area / Locality <span className="text-red-500">*</span></span>
      </div>

      {/* P1: Major Town / Area Dropdown */}
      <div className="flex flex-col gap-1">
        <label className="text-[11px] font-bold text-slate-600">
          Select Area / Town (P1) <span className="text-red-500">*</span>
        </label>
        <select
          required
          value={p1Area}
          onChange={(e) => setP1Area(e.target.value)}
          className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-3 py-2.5 text-xs sm:text-sm font-bold focus:ring-2 focus:ring-amber-400 focus:outline-none cursor-pointer"
        >
          <option value="">-- Select Area / Town --</option>
          {THANJAVUR_TOWNS.map((town) => (
            <option key={town} value={town}>
              {town}
            </option>
          ))}
        </select>
      </div>

      {/* P2: Specific Location / Street / Landmark */}
      <div className="flex flex-col gap-1">
        <label className="text-[11px] font-bold text-slate-600">
          Specific Street / Landmark (P2) <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          required
          value={p2Specific}
          onChange={(e) => setP2Specific(e.target.value)}
          placeholder="e.g. Ramnagar Street, Near Head Post Office"
          className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-3 py-2.5 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-amber-400 focus:outline-none"
        />
      </div>
    </div>
  );
}
