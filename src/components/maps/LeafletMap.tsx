"use client";

import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet marker icon asset mapping inside bundlers (Next.js/Webpack)
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

interface LeafletMapProps {
  latitude: number;
  longitude: number;
  popupText: string;
}

// Sub-component to programmatically change map focus coordinate center on changes
function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], 15);
  }, [lat, lng, map]);
  return null;
}

export default function LeafletMap({
  latitude,
  longitude,
  popupText,
}: LeafletMapProps) {
  // Thanjavur Brihadeeswarar Temple coordinates as fallback center
  const centerLat = latitude || 10.7869;
  const centerLng = longitude || 79.1378;

  return (
    <div className="w-full h-full relative rounded-xl overflow-hidden border border-border shadow-inner bg-slate-50 dark:bg-slate-900/60">
      <MapContainer
        center={[centerLat, centerLng]}
        zoom={15}
        scrollWheelZoom={false}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[centerLat, centerLng]}>
          <Popup>
            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              {popupText}
            </div>
          </Popup>
        </Marker>
        <RecenterMap lat={centerLat} lng={centerLng} />
      </MapContainer>
    </div>
  );
}
