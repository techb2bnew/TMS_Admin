// Straight-line (haversine) distance in miles, nudged up ~20% as a rough
// stand-in for actual road distance — good enough for a rate estimate
// without needing to load the Directions API/JS SDK on this page.
export function estimateRoadMiles(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R_MILES = 3958.8;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  const straightLine = 2 * R_MILES * Math.asin(Math.sqrt(h));
  return Math.round(straightLine * 1.2);
}
