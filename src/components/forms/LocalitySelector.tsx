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
    <div className="flex flex-col gap-4 w-full">
      {/* P1: Major Town / Area Dropdown */}
      <div className="w-full">
        <select
          required
          value={p1Area}
          onChange={(e) => setP1Area(e.target.value)}
          className="w-full py-2.5 text-sm font-semibold border-b-2 border-slate-200 focus:border-amber-500 bg-transparent rounded-none focus:outline-none text-slate-900 cursor-pointer transition-colors"
        >
          <option value="">Select Area / Town (P1) *</option>
          {THANJAVUR_TOWNS.map((town) => (
            <option key={town} value={town}>
              {town}
            </option>
          ))}
        </select>
      </div>

      {/* P2: Specific Location / Street / Landmark */}
      <div className="w-full">
        <input
          type="text"
          required
          value={p2Specific}
          onChange={(e) => setP2Specific(e.target.value)}
          placeholder="Street name, landmark, near temple/school/hospital * (P2)"
          className="w-full py-2.5 text-sm font-semibold border-b-2 border-slate-200 focus:border-amber-500 bg-transparent rounded-none focus:outline-none text-slate-900 transition-colors placeholder:text-slate-400 placeholder:font-normal"
        />
      </div>
    </div>
  );
}
