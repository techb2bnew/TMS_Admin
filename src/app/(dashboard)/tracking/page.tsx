import { APP_TEXT } from "@/constants/text";
import PageHeader from "@/components/ui/PageHeader";
import StatusStepper from "@/components/ui/StatusStepper";
import GoogleFleetMap, { type FleetMapDriver } from "@/components/GoogleFleetMap";
import { createClient } from "@/lib/supabase/server";
import type { LoadStatus } from "@/types";

const T = APP_TEXT.tracking;

const ACTIVE_LOAD_STATUSES: LoadStatus[] = ["assigned", "picked_up", "in_transit"];

type LoadRow = {
  id: string;
  load_number: string;
  pickup_location: string;
  drop_location: string;
  status: LoadStatus;
  assigned_driver_id: string | null;
  assigned_truck_id: string | null;
  drivers: { profiles: { full_name: string } | null } | null;
};

export default async function TrackingPage() {
  const supabase = await createClient();

  const [{ data: loadsData }, { data: locationsData }] = await Promise.all([
    supabase
      .from("loads")
      .select("id, load_number, pickup_location, drop_location, status, assigned_driver_id, assigned_truck_id, drivers(profiles(full_name))")
      .in("status", ACTIVE_LOAD_STATUSES),
    supabase.from("driver_locations").select("driver_id, lat, lng"),
  ]);

  const activeLoads = (loadsData ?? []) as unknown as LoadRow[];
  const locationByDriverId = new Map((locationsData ?? []).map((l) => [l.driver_id, { lat: l.lat, lng: l.lng }]));

  const mapDrivers: FleetMapDriver[] = activeLoads
    .map((l): FleetMapDriver | null => {
      const driverName = l.drivers?.profiles?.full_name;
      const location = l.assigned_driver_id ? locationByDriverId.get(l.assigned_driver_id) : undefined;
      if (!l.assigned_driver_id || !driverName || !location) return null;
      return {
        id: l.assigned_driver_id,
        full_name: driverName,
        truck_number: null,
        location: { lat: location.lat, lng: location.lng, label: "" },
      };
    })
    .filter((d): d is FleetMapDriver => d !== null);

  return (
    <div>
      <PageHeader title={T.title} subtitle={T.subtitle} />

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-blue-600/10 dark:border-blue-400/10">
            <span className="text-sm font-medium">{T.mapTitle}</span>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <span className="relative flex w-1.5 h-1.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 animate-ping opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
              </span>
              Live
            </span>
          </div>
          <GoogleFleetMap drivers={mapDrivers} height="32rem" />
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-medium opacity-70">{T.activeLoadsTitle}</h2>

          {activeLoads.length === 0 && (
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm px-5 py-10 text-center text-sm opacity-50">
              {T.noActiveLoads}
            </div>
          )}

          {activeLoads.map((load) => (
            <div key={load.id} className="rounded-xl border border-slate-200 bg-white shadow-sm p-4">
              <div className="flex items-start justify-between mb-1">
                <span className="font-medium text-sm">{load.load_number}</span>
                <span className="text-xs opacity-50">{load.drivers?.profiles?.full_name ?? "—"}</span>
              </div>
              <div className="text-xs opacity-60 mb-4">
                {load.pickup_location} → {load.drop_location}
              </div>
              <StatusStepper status={load.status} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
