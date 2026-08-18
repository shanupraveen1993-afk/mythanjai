"use client";

import React, { useState, useMemo } from "react";
import { MapPin, AlertCircle, Compass } from "lucide-react";
import { TANJORE_LOCALITIES } from "@/lib/constants";
import { useRouter } from "next/navigation";

interface ThanjavurLocationInputProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

const THANJAVUR_DISTRICT_KEYWORDS = [
  "thanjavur", "tanjore", "vallam", "medical college", "bus stand",
  "vilar", "karanthai", "ring road", "srinivasapuram", "mariamman kovil",
  "thiruvaiyaru", "orathanadu", "kumbakonam", "papanasam", "pattukkottai",
  "grand anicut", "peravurani", "budalur", "thiruvonam", "thanjavur district"
];

export default function ThanjavurLocationInput({
  value,
  onChange,
  placeholder = "Type your Thanjavur area or pincode...",
}: ThanjavurLocationInputProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  // Filter localities based on user input
  const suggestions = useMemo(() => {
    if (!value.trim()) return TANJORE_LOCALITIES;
    const q = value.toLowerCase().trim();
    return TANJORE_LOCALITIES.filter((loc) => loc.toLowerCase().includes(q));
  }, [value]);

  // Check if entered location is outside Thanjavur District
  const isOutsideThanjavur = useMemo(() => {
    if (!value.trim() || value.trim().length < 3) return false;
    const valLower = value.toLowerCase().trim();
    const isMatch = THANJAVUR_DISTRICT_KEYWORDS.some((kw) => valLower.includes(kw));
    return !isMatch;
  }, [value]);

  return (
    <div className="relative w-full flex flex-col gap-1.5">
      <div className="relative w-full">
        <input
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full pl-9 pr-4 py-2 text-xs font-semibold border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
        />
        <MapPin className="w-4 h-4 text-amber-500 absolute left-3 top-2.5 pointer-events-none" />
      </div>

      {/* Autocomplete Dropdown List */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-30 mt-1 max-h-48 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg p-1.5 flex flex-col gap-1 animate-in fade-in-50 duration-150">
          <div className="text-[10px] font-bold text-slate-400 px-2 py-1 uppercase tracking-wider">
            Thanjavur District Localities & Pincodes
          </div>
          {suggestions.map((loc) => (
            <button
              key={loc}
              type="button"
              onClick={() => {
                onChange(loc);
                setIsOpen(false);
              }}
              className="w-full text-left text-xs font-bold text-slate-700 hover:text-amber-800 hover:bg-amber-50 px-2.5 py-1.5 rounded-lg transition-colors flex items-center justify-between"
            >
              <span>{loc}</span>
              <span className="text-[10px] text-amber-700 font-semibold bg-amber-100/80 px-2 py-0.5 rounded-md">Thanjavur</span>
            </button>
          ))}
        </div>
      )}

      {/* Out-of-bound Location Warning Notification */}
      {isOutsideThanjavur && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 shadow-2xs mt-1 animate-fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <div className="flex flex-col">
              <span className="text-xs font-black text-amber-900">
                {value} is outside Thanjavur District!
              </span>
              <span className="text-[11px] font-bold text-amber-700">
                Expansion to other districts is <span className="bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded-md font-black">Coming Soon</span>
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="btn-primary text-[11px] font-bold px-3 py-1.5 rounded-lg shrink-0 flex items-center gap-1 shadow-2xs cursor-pointer"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Explore Thanjavur Marketplace</span>
          </button>
        </div>
      )}
    </div>
  );
}
