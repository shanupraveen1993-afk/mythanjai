"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { MapPin, AlertCircle, Compass, Check, Search } from "lucide-react";
import { TANJORE_LOCALITIES } from "@/lib/constants";
import { useRouter } from "next/navigation";

declare global {
  interface Window {
    google: any;
  }
}

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
  const [googlePredictions, setGooglePredictions] = useState<string[]>([]);
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);
  const autocompleteServiceRef = useRef<any>(null);

  // Load Google Maps Script if NEXT_PUBLIC_GOOGLE_PLACES_API_KEY or window.google exists
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (window.google?.maps?.places) {
      setIsGoogleLoaded(true);
      autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
      return;
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
    if (apiKey && !document.getElementById("google-maps-script")) {
      const script = document.createElement("script");
      script.id = "google-maps-script";
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.onload = () => {
        if (window.google?.maps?.places) {
          setIsGoogleLoaded(true);
          autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
        }
      };
      document.head.appendChild(script);
    }
  }, []);

  // Fetch Google Places predictions on input change
  useEffect(() => {
    if (!value.trim() || value.trim().length < 2) {
      setGooglePredictions([]);
      return;
    }

    if (autocompleteServiceRef.current && isGoogleLoaded) {
      try {
        autocompleteServiceRef.current.getPlacePredictions(
          {
            input: value,
            componentRestrictions: { country: "in" },
            // Bounds roughly for Thanjavur district area
            locationBias: new window.google.maps.LatLngBounds(
              new window.google.maps.LatLng(10.5, 78.9),
              new window.google.maps.LatLng(11.1, 79.5)
            ),
          },
          (predictions: any[], status: any) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
              setGooglePredictions(predictions.map((p) => p.description));
            } else {
              setGooglePredictions([]);
            }
          }
        );
      } catch (e) {
        setGooglePredictions([]);
      }
    }
  }, [value, isGoogleLoaded]);

  // Combine Google Places predictions with local Thanjavur localities
  const suggestions = useMemo(() => {
    if (googlePredictions.length > 0) return googlePredictions;
    if (!value.trim()) return TANJORE_LOCALITIES;
    const q = value.toLowerCase().trim();
    return TANJORE_LOCALITIES.filter((loc) => loc.toLowerCase().includes(q));
  }, [value, googlePredictions]);

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
          className="w-full pl-9 pr-9 py-2 text-xs font-semibold border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
        />
        <MapPin className="w-4 h-4 text-amber-500 absolute left-3 top-2.5 pointer-events-none" />
        {value.trim().length >= 2 && (
          <span className="absolute right-3 top-2.5 w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-2xs" title="Location selected">
            <Check className="w-2.5 h-2.5 stroke-[3]" />
          </span>
        )}
      </div>

      {/* Autocomplete Dropdown List */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-30 mt-1 max-h-52 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg p-1.5 flex flex-col gap-1 animate-in fade-in-50 duration-150">
          <div className="text-[10px] font-black text-slate-400 px-2 py-1 uppercase tracking-wider flex items-center justify-between">
            <span>{googlePredictions.length > 0 ? "Google Places Autocomplete" : "Thanjavur Localities"}</span>
            <span className="text-amber-600 font-bold">Thanjavur</span>
          </div>
          {suggestions.map((loc) => (
            <button
              key={loc}
              type="button"
              onClick={() => {
                onChange(loc);
                setIsOpen(false);
              }}
              className="w-full text-left text-xs font-bold text-slate-700 hover:text-amber-800 hover:bg-amber-50 px-2.5 py-2 rounded-lg transition-colors flex items-center justify-between gap-2"
            >
              <span className="line-clamp-1">{loc}</span>
              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md shrink-0 border border-emerald-200/60">Select</span>
            </button>
          ))}
        </div>
      )}

      {/* Autocomplete Failure Fallback (Pincode / Area Name Optional Field) */}
      {value.trim().length > 2 && suggestions.length === 0 && (
        <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-3 flex flex-col gap-1.5 mt-1">
          <span className="text-xs font-bold text-slate-700">
            No exact location match found?
          </span>
          <span className="text-[11px] text-slate-500 font-medium">
            Type Pincode (e.g. 613001) or custom area name (Optional):
          </span>
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="e.g. 613007 / Vallam Main Road"
            className="w-full px-3 py-1.5 text-xs font-semibold border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-amber-500"
          />
        </div>
      )}

    </div>
  );
}
