const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

export type GeocodeResult =
  | { ok: true; lat: number; lng: number }
  | { ok: false; reason: string };

// Plain REST call (not the JS SDK) so this never touches the Maps script
// that GoogleFleetMap loads separately — no risk of loading it twice.
// Requires the Geocoding API to be enabled (and billing active) for the
// same Google Cloud project as NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.
export async function geocodeAddressVerbose(address: string): Promise<GeocodeResult> {
  if (!API_KEY) return { ok: false, reason: "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not set" };
  if (!address.trim()) return { ok: false, reason: "Empty address" };

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${API_KEY}`;
    const res = await fetch(url);
    const json = await res.json();
    const location = json?.results?.[0]?.geometry?.location;

    if (!location) {
      // Google's own status/error_message says exactly why (REQUEST_DENIED
      // usually means the Geocoding API isn't enabled, or billing isn't set
      // up, on this project — ZERO_RESULTS means the address text itself
      // couldn't be resolved).
      const reason = json?.error_message || json?.status || "Unknown geocoding error";
      console.error("Geocoding failed for", address, ":", reason);
      return { ok: false, reason };
    }
    return { ok: true, lat: location.lat, lng: location.lng };
  } catch (err) {
    console.error("Geocoding request failed for", address, err);
    return { ok: false, reason: err instanceof Error ? err.message : "Network error" };
  }
}

// Best-effort convenience wrapper for call sites that just want a value or
// null (e.g. load creation, where a failure is only logged, never shown).
export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  const result = await geocodeAddressVerbose(address);
  return result.ok ? { lat: result.lat, lng: result.lng } : null;
}
