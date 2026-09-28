import type { SupabaseClient } from "@supabase/supabase-js";
import type { LoadRoute } from "@/components/GoogleFleetMap";
import { geocodeAddress } from "@/lib/geocode";

type LoadForRoute = {
  id: string;
  load_number: string;
  customer_name: string;
  pickup_location: string;
  drop_location: string;
  assigned_truck_id: string | null;
  drivers: { profiles: { full_name: string } | null } | null;
};

// Pulls the geocoded pickup/drop coordinates (and any driver-added waypoint
// stops) for a batch of loads from load_stops, and pairs them with the
// load/driver/truck info the map's InfoWindow needs. A load whose stops
// haven't been geocoded yet (still at the 0,0 default) is left out rather
// than drawing a route to null island.
export async function fetchLoadRoutes(
  supabase: SupabaseClient,
  loads: LoadForRoute[],
  truckNumberById: Map<string, string | null>
): Promise<LoadRoute[]> {
  if (loads.length === 0) return [];
  const loadIds = loads.map((l) => l.id);

  const { data: stopsData } = await supabase
    .from("load_stops")
    .select("load_id, type, label, lat, lng")
    .in("load_id", loadIds)
    .order("sort_order", { ascending: true });

  const stopsByLoad = new Map<
    string,
    { pickup?: { lat: number; lng: number }; drop?: { lat: number; lng: number }; waypoints: { lat: number; lng: number; label: string }[] }
  >();
  for (const row of stopsData ?? []) {
    const entry = stopsByLoad.get(row.load_id) ?? { waypoints: [] };
    if (row.type === "pickup") entry.pickup = { lat: row.lat, lng: row.lng };
    else if (row.type === "drop") entry.drop = { lat: row.lat, lng: row.lng };
    else if (row.lat !== 0 || row.lng !== 0) entry.waypoints.push({ lat: row.lat, lng: row.lng, label: row.label });
    stopsByLoad.set(row.load_id, entry);
  }

  const routes: LoadRoute[] = [];
  for (const load of loads) {
    const stops = stopsByLoad.get(load.id);
    let pickup = stops?.pickup;
    let drop = stops?.drop;
    const pickupMissing = !pickup || (pickup.lat === 0 && pickup.lng === 0);
    const dropMissing = !drop || (drop.lat === 0 && drop.lng === 0);

    if (pickupMissing || dropMissing) {
      // Auto-heal, right here — so viewing this load's route anywhere in
      // admin (Dashboard, Tracking, its own detail page) fixes it
      // permanently the first time, no manual "re-geocode" step needed.
      const [pickupGeo, dropGeo] = await Promise.all([
        pickupMissing ? geocodeAddress(load.pickup_location) : null,
        dropMissing ? geocodeAddress(load.drop_location) : null,
      ]);
      if (pickupGeo) {
        await supabase.from("load_stops").update({ lat: pickupGeo.lat, lng: pickupGeo.lng }).eq("load_id", load.id).eq("type", "pickup");
        pickup = pickupGeo;
      }
      if (dropGeo) {
        await supabase.from("load_stops").update({ lat: dropGeo.lat, lng: dropGeo.lng }).eq("load_id", load.id).eq("type", "drop");
        drop = dropGeo;
      }
    }

    if (!pickup || !drop) continue;

    routes.push({
      loadId: load.id,
      loadNumber: load.load_number,
      customerName: load.customer_name,
      pickupLocation: load.pickup_location,
      dropLocation: load.drop_location,
      truckNumber: load.assigned_truck_id ? truckNumberById.get(load.assigned_truck_id) ?? null : null,
      driverName: load.drivers?.profiles?.full_name ?? null,
      pickup,
      drop,
      waypoints: stops?.waypoints ?? [],
    });
  }
  return routes;
}
