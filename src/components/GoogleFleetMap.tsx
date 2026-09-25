"use client";

import { useState } from "react";
import { GoogleMap, MarkerF, InfoWindowF, useJsApiLoader } from "@react-google-maps/api";

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

// Roughly centers the map over India, where seeded driver locations sit.
const DEFAULT_CENTER = { lat: 23.5, lng: 80 };

const MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#1a1a2e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#1a1a2e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8ec3ff" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#2c2c54" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0f1730" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#3a3a6e" }] },
];

export type FleetMapDriver = {
  id: string;
  full_name: string;
  truck_number: string | null;
  location: { lat: number; lng: number; label: string };
};

type GoogleFleetMapProps = {
  drivers: FleetMapDriver[];
  height?: string;
};

export default function GoogleFleetMap({ drivers, height = "18rem" }: GoogleFleetMapProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: "tms-google-map-script",
    googleMapsApiKey: API_KEY,
  });
  const [activeDriverId, setActiveDriverId] = useState<string | null>(null);

  if (!API_KEY) {
    return (
      <div
        style={{ height }}
        className="flex flex-col items-center justify-center gap-2 bg-slate-900 text-center px-6"
      >
        <p className="text-sm text-white/70">Google Maps API key not set</p>
        <p className="text-xs text-white/40 max-w-xs">
          Add it to <code className="text-white/60">admin/.env.local</code> as{" "}
          <code className="text-white/60">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code>, then restart the dev
          server.
        </p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div style={{ height }} className="flex items-center justify-center bg-slate-900">
        <p className="text-sm text-red-400">Failed to load Google Maps</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div style={{ height }} className="flex items-center justify-center bg-slate-900">
        <p className="text-sm text-white/40">Loading map...</p>
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={{ width: "100%", height }}
      center={DEFAULT_CENTER}
      zoom={5}
      options={{
        styles: MAP_STYLE,
        disableDefaultUI: true,
        zoomControl: true,
        mapTypeControl: true,
        mapTypeControlOptions: {
          position: google.maps.ControlPosition.TOP_RIGHT,
          style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
          mapTypeIds: ["roadmap", "hybrid"],
        },
      }}
    >
      {drivers.map((driver) => (
        <MarkerF
          key={driver.id}
          position={{ lat: driver.location.lat, lng: driver.location.lng }}
          onClick={() => setActiveDriverId(driver.id)}
          icon={{
            path: "M -6,-6 6,-6 6,6 -6,6 Z",
            fillColor: "#2563eb",
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 2,
            scale: 1,
          }}
        >
          {activeDriverId === driver.id && (
            <InfoWindowF
              position={{ lat: driver.location.lat, lng: driver.location.lng }}
              onCloseClick={() => setActiveDriverId(null)}
            >
              <div className="text-xs text-slate-900">
                <div className="font-semibold">{driver.full_name}</div>
                <div>{driver.location.label}</div>
                <div>{driver.truck_number}</div>
              </div>
            </InfoWindowF>
          )}
        </MarkerF>
      ))}
    </GoogleMap>
  );
}
