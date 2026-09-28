"use client";

import { useEffect, useState } from "react";
import { GoogleMap, MarkerF, PolylineF, InfoWindowF, useJsApiLoader } from "@react-google-maps/api";

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

// One distinct color per load — cycled by a stable hash of the load id, not
// by list position, so a load's color doesn't shift as others come and go.
const ROUTE_COLORS = [
  "#3b82f6",
  "#ef4444",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f97316",
  "#6366f1",
  "#84cc16",
];

function colorForLoad(loadId: string) {
  let hash = 0;
  for (let i = 0; i < loadId.length; i++) hash = (hash * 31 + loadId.charCodeAt(i)) >>> 0;
  return ROUTE_COLORS[hash % ROUTE_COLORS.length];
}

export type FleetMapDriver = {
  id: string;
  full_name: string;
  truck_number: string | null;
  location: { lat: number; lng: number; label: string };
};

export type LoadRoute = {
  loadId: string;
  loadNumber: string;
  customerName: string;
  pickupLocation: string;
  dropLocation: string;
  truckNumber: string | null;
  driverName: string | null;
  pickup: { lat: number; lng: number };
  drop: { lat: number; lng: number };
  waypoints: { lat: number; lng: number; label: string }[];
};

type GoogleFleetMapProps = {
  drivers: FleetMapDriver[];
  routes?: LoadRoute[];
  height?: string;
};

// Fetches the real road-following path between a load's pickup and drop via
// the Directions API (a straight line otherwise) and renders it. One
// DirectionsService call per route — requires "Directions API" enabled on
// the same Google Cloud project as NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.
function RouteLine({
  pickup,
  drop,
  waypoints = [],
  color,
  onClick,
}: {
  pickup: { lat: number; lng: number };
  drop: { lat: number; lng: number };
  waypoints?: { lat: number; lng: number }[];
  color: string;
  onClick: () => void;
}) {
  const [path, setPath] = useState<google.maps.LatLngLiteral[] | null>(null);
  const waypointsKey = waypoints.map((w) => `${w.lat},${w.lng}`).join("|");

  useEffect(() => {
    let cancelled = false;
    const directionsService = new google.maps.DirectionsService();
    directionsService.route(
      {
        origin: pickup,
        destination: drop,
        waypoints: waypoints.map((w) => ({ location: w, stopover: true })),
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (cancelled) return;
        if (status === google.maps.DirectionsStatus.OK && result?.routes[0]) {
          setPath(result.routes[0].overview_path.map((p) => ({ lat: p.lat(), lng: p.lng() })));
        }
      }
    );
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickup.lat, pickup.lng, drop.lat, drop.lng, waypointsKey]);

  return (
    <PolylineF
      path={path ?? [pickup, drop]}
      options={{ strokeColor: color, strokeOpacity: 0.9, strokeWeight: 3 }}
      onClick={onClick}
    />
  );
}

export default function GoogleFleetMap({ drivers, routes = [], height = "18rem" }: GoogleFleetMapProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: "tms-google-map-script",
    googleMapsApiKey: API_KEY,
  });
  const [activeDriverId, setActiveDriverId] = useState<string | null>(null);
  const [activeRouteId, setActiveRouteId] = useState<string | null>(null);

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

  const activeRoute = routes.find((r) => r.loadId === activeRouteId);
  const activeRouteMidpoint = activeRoute
    ? {
        lat: (activeRoute.pickup.lat + activeRoute.drop.lat) / 2,
        lng: (activeRoute.pickup.lng + activeRoute.drop.lng) / 2,
      }
    : null;

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
      {routes.map((r) => (
        <RouteLine
          key={r.loadId}
          pickup={r.pickup}
          drop={r.drop}
          waypoints={r.waypoints}
          color={colorForLoad(r.loadId)}
          onClick={() => setActiveRouteId(r.loadId)}
        />
      ))}

      {routes.map((r) => {
        const color = colorForLoad(r.loadId);
        return (
          <MarkerF
            key={`${r.loadId}-pickup`}
            position={r.pickup}
            onClick={() => setActiveRouteId(r.loadId)}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              fillColor: color,
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 1.5,
              scale: 6,
            }}
          />
        );
      })}
      {routes.map((r) => {
        const color = colorForLoad(r.loadId);
        return (
          <MarkerF
            key={`${r.loadId}-drop`}
            position={r.drop}
            onClick={() => setActiveRouteId(r.loadId)}
            icon={{
              path: "M -5,-5 5,-5 5,5 -5,5 Z",
              fillColor: color,
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 1.5,
              scale: 1,
            }}
          />
        );
      })}

      {routes.map((r) => {
        const color = colorForLoad(r.loadId);
        return r.waypoints.map((w, i) => (
          <MarkerF
            key={`${r.loadId}-stop-${i}`}
            position={{ lat: w.lat, lng: w.lng }}
            title={w.label}
            onClick={() => setActiveRouteId(r.loadId)}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              fillColor: "#ffffff",
              fillOpacity: 1,
              strokeColor: color,
              strokeWeight: 2,
              scale: 5,
            }}
          />
        ));
      })}

      {activeRoute && activeRouteMidpoint && (
        <InfoWindowF position={activeRouteMidpoint} onCloseClick={() => setActiveRouteId(null)}>
          <div className="text-xs text-slate-900 space-y-0.5">
            <div className="font-semibold">{activeRoute.loadNumber}</div>
            <div>{activeRoute.customerName}</div>
            <div>
              {activeRoute.pickupLocation} → {activeRoute.dropLocation}
            </div>
            <div>Driver: {activeRoute.driverName ?? "—"}</div>
            <div>Truck: {activeRoute.truckNumber ?? "—"}</div>
          </div>
        </InfoWindowF>
      )}

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
