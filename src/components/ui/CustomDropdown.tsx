"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

export interface DropdownOption {
  label: string;
  value: string;
}

interface CustomDropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  icon?: React.ReactNode;
  className?: string;
}

export default function CustomDropdown({
  options,
  value,
  onChange,
  placeholder = "Select Option",
  icon,
  className = "",
}: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value) || options[0];

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className={`relative inline-block text-left font-sans select-none w-fit ${className}`}>
      {/* Trigger Button (Hug Content constraint) */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-fit bg-white border border-slate-300 hover:border-slate-400 text-slate-800 font-bold text-xs sm:text-sm px-4 py-2 rounded-full shadow-2xs flex items-center justify-between gap-2.5 min-h-[38px] cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-amber-500/40 whitespace-nowrap"
      >
        <div className="flex items-center gap-1.5 shrink-0">
          {icon && <span className="text-slate-500 shrink-0">{icon}</span>}
          <span>{selectedOption?.label || placeholder}</span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-500 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180 text-slate-800" : ""}`} />
      </button>

      {/* Popover Options Menu */}
      {isOpen && (
        <div className="absolute left-0 mt-1.5 z-50 min-w-[200px] w-max max-w-xs bg-white border border-slate-200 rounded-2xl shadow-xl max-h-60 overflow-y-auto py-1.5 animate-in fade-in slide-in-from-top-1 duration-150 scrollbar-none">
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3.5 py-2 text-xs sm:text-sm font-semibold flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                  isSelected ? "bg-amber-50 text-amber-900 font-bold" : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span className="whitespace-nowrap">{opt.label}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
