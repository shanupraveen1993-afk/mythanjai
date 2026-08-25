"use client";

import React, { useState, useEffect, useRef } from "react";
import { MapPin, Loader2 } from "lucide-react";

interface GooglePlacesInputProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
  label?: string;
  required?: boolean;
}

export default function GooglePlacesInput({
  value,
  onChange,
  placeholder = "Search street, area or landmark in Thanjavur...",
  className = "",
  label,
  required = false,
}: GooglePlacesInputProps) {
  const [query, setQuery] = useState(value);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getApiUrl = (endpoint: string) => {
    if (typeof window !== "undefined") {
      const isNative =
        (window as any).Capacitor?.isNativePlatform() ||
        window.location.protocol === "file:" ||
        window.location.origin.includes("localhost");
      if (isNative) {
        return `https://mythanjai.vercel.app${endpoint}`;
      }
    }
    return endpoint;
  };

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    onChange(val);

    if (val.trim().length < 1) {
      setPredictions([]);
      setIsOpen(false);
      return;
    }

    setLoading(true);
    try {
      const apiUrl = getApiUrl(`/api/places-autocomplete?input=${encodeURIComponent(val)}`);
      const res = await fetch(apiUrl);
      const data = await res.json();
      if (data.predictions && data.predictions.length > 0) {
        setPredictions(data.predictions);
        setIsOpen(true);
      } else {
        // Fallback: match Tanjore localities
        const fallbackList = [
          "Medical College Road",
          "Old Bus Stand",
          "New Bus Stand",
          "Thillai Nagar",
          "Vallam",
          "Pillayarpatti",
          "Karanthai",
          "Sakkottai",
          "Punnainallur Mariamman Kovil",
          "Raja Serfoji College",
          "South Rampart",
          "North Rampart",
          "East Gate",
          "West Gate",
          "Villar Road",
          "MC Road",
          "Yagappa Nagar",
          "LIC Colony",
          "EB Colony",
          "SR Mahal",
          "Nanjikottai Road",
          "Reddypalayam",
        ].filter((loc) => loc.toLowerCase().includes(val.toLowerCase()));

        if (fallbackList.length > 0) {
          setPredictions(
            fallbackList.map((loc) => ({
              place_id: loc,
              main_text: loc,
              secondary_text: "Thanjavur, Tamil Nadu",
              description: `${loc}, Thanjavur, Tamil Nadu`,
            }))
          );
          setIsOpen(true);
        } else {
          setPredictions([]);
          setIsOpen(false);
        }
      }
    } catch (err) {
      console.error("Places fetch error:", err);
      // Fallback on error
      const fallbackList = [
        "Medical College Road",
        "Old Bus Stand",
        "New Bus Stand",
        "Thillai Nagar",
        "Vallam",
        "Pillayarpatti",
        "Karanthai",
        "Villar Road",
        "MC Road",
      ].filter((loc) => loc.toLowerCase().includes(val.toLowerCase()));

      if (fallbackList.length > 0) {
        setPredictions(
          fallbackList.map((loc) => ({
            place_id: loc,
            main_text: loc,
            secondary_text: "Thanjavur, Tamil Nadu",
            description: `${loc}, Thanjavur, Tamil Nadu`,
          }))
        );
        setIsOpen(true);
      } else {
        setPredictions([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPrediction = (p: any) => {
    const text = p.main_text || p.description;
    setQuery(text);
    onChange(text);
    setIsOpen(false);
  };

  const handleFocus = () => {
    if (query.trim().length > 0) {
      handleInputChange({ target: { value: query } } as any);
    } else {
      // Show default Tanjore popular localities on empty click
      const defaultList = [
        "Medical College Road, Thanjavur",
        "Old Bus Stand, Thanjavur",
        "New Bus Stand, Thanjavur",
        "Thillai Nagar, Thanjavur",
        "Vallam, Thanjavur",
        "Pillayarpatti, Thanjavur",
        "Karanthai, Thanjavur",
        "Srinivasapuram, Thanjavur",
        "South Rampart, Thanjavur",
        "MC Road, Thanjavur",
      ].map((loc) => ({
        place_id: loc,
        main_text: loc.split(",")[0],
        secondary_text: "Thanjavur, Tamil Nadu",
        description: loc,
      }));
      setPredictions(defaultList);
      setIsOpen(true);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-amber-500" />
          {label}
        </label>
      )}
      <div className="relative w-full">
        <input
          type="text"
          required={required}
          value={query}
          onChange={handleInputChange}
          onFocus={handleFocus}
          placeholder={placeholder}
          className={
            className ||
            "w-full px-0 py-2.5 text-sm font-semibold border-b-2 border-slate-300 focus:border-amber-500 bg-transparent rounded-none focus:outline-none text-slate-900 transition-colors"
          }
        />
        {loading && (
          <div className="absolute right-2 top-3 z-10">
            <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
          </div>
        )}
      </div>

      {/* Autocomplete Suggestions Dropdown */}
      {isOpen && predictions.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-[99999] mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden max-h-56 overflow-y-auto animate-fade-in">
          {predictions.map((p, idx) => (
            <button
              key={p.place_id || idx}
              type="button"
              onClick={() => handleSelectPrediction(p)}
              className="w-full px-3.5 py-2.5 text-left text-xs font-semibold text-slate-800 hover:bg-amber-50 hover:text-slate-950 flex items-center gap-2 border-b border-slate-100 last:border-0 cursor-pointer transition-colors"
            >
              <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="font-bold truncate text-slate-900">{p.main_text}</span>
                <span className="text-[10px] text-slate-400 truncate">{p.secondary_text}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
