import Link from "next/link";
import { APP_TEXT } from "@/constants/text";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";
import { LoadsIcon, DriversIcon, ReportsIcon, NotificationsIcon } from "@/components/icons";
import GoogleFleetMap, { type FleetMapDriver } from "@/components/GoogleFleetMap";
import { createClient } from "@/lib/supabase/server";
import { formatRelativeTime } from "@/lib/format";
import type { Load, LoadStatus } from "@/types";

const T = APP_TEXT.dashboard;

type NotificationRow = {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
};

const ACTIVE_LOAD_STATUSES: LoadStatus[] = ["assigned", "picked_up", "in_transit"];

type LoadRow = {
  id: string;
  load_number: string;
  customer_name: string;
  pickup_location: string;
  drop_location: string;
  weight_kg: number;
  rate: number;
  status: LoadStatus;
  assigned_driver_id: string | null;
  assigned_truck_id: string | null;
  created_at: string;
  drivers: { profiles: { full_name: string } | null } | null;
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: loadsData }, { data: driversData }, { data: trucksData }, { data: locationsData }, { data: notificationsData }] =
    await Promise.all([
      supabase
        .from("loads")
        .select(
          "id, load_number, customer_name, pickup_location, drop_location, weight_kg, rate, status, assigned_driver_id, assigned_truck_id, created_at, drivers(profiles(full_name))"
        )
        .order("created_at", { ascending: false }),
      supabase.from("drivers").select("id, status, profiles(full_name)").eq("status", "active"),
      supabase.from("trucks").select("id, truck_number"),
      supabase.from("driver_locations").select("driver_id, lat, lng"),
      user
        ? supabase.from("notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false })
        : Promise.resolve({ data: [] as NotificationRow[] }),
    ]);

  const loadRows = (loadsData ?? []) as unknown as LoadRow[];
  const truckNumberById = new Map((trucksData ?? []).map((t) => [t.id, t.truck_number]));
  const locationByDriverId = new Map((locationsData ?? []).map((l) => [l.driver_id, { lat: l.lat, lng: l.lng }]));

  const activeLoads = loadRows.filter((l) => ACTIVE_LOAD_STATUSES.includes(l.status));
  const activeTruckIds = new Set(activeLoads.map((l) => l.assigned_truck_id).filter(Boolean));
  const deliveredToday = loadRows.filter((l) => l.status === "delivered").length;
  const delayed = 0; // no ETA data yet — will be real once trip ETAs are tracked

  const truckNumberByDriverId = new Map(
    activeLoads
      .filter((l) => l.assigned_driver_id && l.assigned_truck_id)
      .map((l) => [l.assigned_driver_id as string, truckNumberById.get(l.assigned_truck_id as string) ?? null])
  );

  const mapDrivers: FleetMapDriver[] = (driversData ?? [])
    .map((d): FleetMapDriver | null => {
      const profile = (d as unknown as { profiles: { full_name: string } | null }).profiles;
      const location = locationByDriverId.get(d.id);
      if (!profile || !location) return null;
      return {
        id: d.id,
        full_name: profile.full_name,
        truck_number: truckNumberByDriverId.get(d.id) ?? null,
        location: { lat: location.lat, lng: location.lng, label: "" },
      };
    })
    .filter((d): d is FleetMapDriver => d !== null);

  const recentLoads: (Load & { driverName: string | null })[] = loadRows.slice(0, 5).map((l) => ({
    id: l.id,
    load_number: l.load_number,
    customer_name: l.customer_name,
    pickup_location: l.pickup_location,
    drop_location: l.drop_location,
    weight_kg: l.weight_kg,
    rate: l.rate,
    status: l.status,
    assigned_driver: l.drivers?.profiles?.full_name ?? null,
    created_at: l.created_at,
    driverName: l.drivers?.profiles?.full_name ?? null,
  }));

  const notifications = (notificationsData ?? []) as NotificationRow[];

  return (
    <div>
      <PageHeader title={T.title} subtitle={T.subtitle} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label={T.statActiveTrucks} value={activeTruckIds.size} Icon={DriversIcon} accent="blue" />
        <StatCard label={T.statActiveLoads} value={activeLoads.length} Icon={LoadsIcon} accent="amber" />
        <StatCard label={T.statDeliveredToday} value={deliveredToday} Icon={ReportsIcon} accent="emerald" />
        <StatCard label={T.statDelayed} value={delayed} Icon={NotificationsIcon} accent="red" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          {/* Live map */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-blue-600/10 dark:border-blue-400/10">
              <span className="text-sm font-medium">{T.mapTitle}</span>
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                <span className="relative flex w-1.5 h-1.5">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 animate-ping opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                </span>
                {T.mapBadgeLive}
              </span>
            </div>

            <GoogleFleetMap drivers={mapDrivers} height="18rem" />
            <div className="px-5 py-2.5 text-xs opacity-50 border-t border-blue-600/10 dark:border-blue-400/10">
              {T.mapNote}
            </div>
          </div>

          {/* Recent loads */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-blue-600/10 dark:border-blue-400/10">
              <span className="text-sm font-medium">{T.recentLoadsTitle}</span>
              <Link
                href="/loads"
                className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
              >
                {T.viewAll}
              </Link>
            </div>
            <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs opacity-50 text-left">
                  <th className="font-medium px-5 py-2.5">{T.table.loadId}</th>
                  <th className="font-medium px-5 py-2.5">{T.table.customer}</th>
                  <th className="font-medium px-5 py-2.5">{T.table.route}</th>
                  <th className="font-medium px-5 py-2.5">{T.table.driver}</th>
                  <th className="font-medium px-5 py-2.5">{T.table.status}</th>
                </tr>
              </thead>
              <tbody>
                {recentLoads.map((load) => (
                  <tr
                    key={load.id}
                    className="border-t border-blue-600/5 dark:border-blue-400/5 hover:bg-blue-50/60"
                  >
                    <td className="px-5 py-3 font-medium">{load.load_number}</td>
                    <td className="px-5 py-3 opacity-80">{load.customer_name}</td>
                    <td className="px-5 py-3 opacity-70">
                      {load.pickup_location} → {load.drop_location}
                    </td>
                    <td className="px-5 py-3 opacity-70">{load.driverName ?? "—"}</td>
                    <td className="px-5 py-3">
                      <StatusBadge status={load.status} />
                    </td>
                  </tr>
                ))}
              {recentLoads.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-sm opacity-50">
                    {T.noRecentLoads}
                  </td>
                </tr>
              )}
              </tbody>
            </table>
            </div>
          </div>
        </div>

        {/* Alerts */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden h-fit">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-blue-600/10 dark:border-blue-400/10">
            <span className="text-sm font-medium">{T.alertsTitle}</span>
            <Link
              href="/notifications"
              className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              {T.viewAll}
            </Link>
          </div>
          <ul className="divide-y divide-blue-600/5 dark:divide-blue-400/5">
            {notifications.slice(0, 5).map((n) => (
              <li key={n.id} className="flex gap-3 px-5 py-3.5">
                <span
                  className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${n.is_read ? "bg-slate-300" : "bg-blue-500"}`}
                />
                <div>
                  <p className="text-sm leading-snug">{n.message}</p>
                  <p className="text-xs opacity-45 mt-1">{formatRelativeTime(n.created_at)}</p>
                </div>
              </li>
            ))}
            {notifications.length === 0 && (
              <li className="px-5 py-10 text-center text-sm opacity-50">{T.noAlerts}</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
