"use client";

import React, { useState, useRef, useEffect } from "react";
import { MapPin, Search, ChevronDown, Check } from "lucide-react";
import { TANJORE_LOCALITIES, TanjoreLocality } from "@/lib/constants";

interface SearchableAreaDropdownProps {
  selectedArea: TanjoreLocality | "All Areas";
  onAreaChange: (area: TanjoreLocality | "All Areas") => void;
}

export default function SearchableAreaDropdown({
  selectedArea,
  onAreaChange,
}: SearchableAreaDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const allAreas = ["All Areas", ...TANJORE_LOCALITIES];
  const filteredAreas = allAreas.filter((area) =>
    area.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  return (
    <div ref={dropdownRef} className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100/90 hover:bg-slate-200 border border-slate-200 text-slate-800 text-xs font-bold transition-all cursor-pointer shadow-2xs group select-none"
      >
        <MapPin className="w-3.5 h-3.5 text-amber-600 group-hover:scale-110 transition-transform shrink-0" />
        <span className="truncate max-w-[130px] font-bold text-slate-900">
          {selectedArea}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 sm:right-0 sm:left-auto mt-2 w-64 bg-white border border-slate-200/90 rounded-2xl shadow-xl z-50 overflow-hidden animate-fade-in font-sans">
          {/* Search Input Box */}
          <div className="p-2 border-b border-slate-100 bg-slate-50 relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Tanjore area..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 font-bold"
            />
          </div>

          {/* Localities List */}
          <div className="max-h-60 overflow-y-auto py-1 custom-scrollbar">
            {filteredAreas.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-slate-400 font-medium">
                No area found matching "{searchQuery}"
              </div>
            ) : (
              filteredAreas.map((area) => {
                const isSelected = selectedArea === area;
                return (
                  <button
                    key={area}
                    onClick={() => {
                      onAreaChange(area as TanjoreLocality | "All Areas");
                      setIsOpen(false);
                      setSearchQuery("");
                    }}
                    className={`w-full px-3.5 py-2 text-left text-xs font-bold flex items-center justify-between transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-amber-50 text-amber-800 font-black"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span className="truncate">{area}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
