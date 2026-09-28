import Link from "next/link";
import { notFound } from "next/navigation";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import GoogleFleetMap, { type FleetMapDriver } from "@/components/GoogleFleetMap";
import { createClient } from "@/lib/supabase/server";
import { fetchLoadRoutes } from "@/lib/loadRoutes";
import { formatCurrency, formatDate } from "@/lib/format";
import type { LoadStatus } from "@/types";

const STATUS_LABEL: Record<LoadStatus, string> = {
  pending: "Created",
  assigned: "Assigned",
  picked_up: "Picked up",
  in_transit: "In transit",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

type LoadDetailRow = {
  id: string;
  load_number: string;
  customer_name: string;
  customer_contact: string | null;
  pickup_location: string;
  drop_location: string;
  weight_kg: number;
  rate: number;
  status: LoadStatus;
  assigned_driver_id: string | null;
  assigned_truck_id: string | null;
  created_at: string;
  delivered_at: string | null;
  drivers: { profiles: { full_name: string; phone: string | null } | null } | null;
};

export default async function LoadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: loadData } = await supabase
    .from("loads")
    .select(
      "id, load_number, customer_name, customer_contact, pickup_location, drop_location, weight_kg, rate, status, assigned_driver_id, assigned_truck_id, created_at, delivered_at, drivers(profiles(full_name, phone))"
    )
    .eq("id", id)
    .single();

  if (!loadData) notFound();
  const load = loadData as unknown as LoadDetailRow;

  const [{ data: truckData }, { data: locationData }, { data: historyData }, { data: expensesData }, { data: stopsData }] =
    await Promise.all([
      load.assigned_truck_id
        ? supabase.from("trucks").select("id, truck_number").eq("id", load.assigned_truck_id).single()
        : Promise.resolve({ data: null }),
      load.assigned_driver_id
        ? supabase.from("driver_locations").select("lat, lng").eq("driver_id", load.assigned_driver_id).maybeSingle()
        : Promise.resolve({ data: null }),
      supabase
        .from("load_status_history")
        .select("id, status, changed_at")
        .eq("load_id", id)
        .order("changed_at", { ascending: true }),
      supabase
        .from("expenses")
        .select("id, category, amount, status, created_at")
        .eq("load_id", id)
        .order("created_at", { ascending: false }),
      supabase.from("load_stops").select("id, type, address").eq("load_id", id).eq("type", "waypoint"),
    ]);

  const truckNumberById = new Map(truckData ? [[truckData.id, truckData.truck_number]] : []);
  const routes = await fetchLoadRoutes(supabase, [load], truckNumberById);

  const history = (historyData ?? []) as { id: string; status: LoadStatus; changed_at: string }[];
  const expenses = (expensesData ?? []) as { id: string; category: string; amount: number; status: string; created_at: string }[];
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const waypoints = (stopsData ?? []) as { id: string; type: string; address: string }[];

  const mapDrivers: FleetMapDriver[] =
    locationData && load.drivers?.profiles
      ? [
          {
            id: load.assigned_driver_id as string,
            full_name: load.drivers.profiles.full_name,
            truck_number: truckData?.truck_number ?? null,
            location: { lat: locationData.lat, lng: locationData.lng, label: "Current location" },
          },
        ]
      : [];

  return (
    <div>
      <PageHeader
        title={load.load_number}
        subtitle={load.customer_name}
        action={
          <Link
            href="/loads"
            className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
          >
            ← Back to Loads
          </Link>
        }
      />

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-blue-600/10 dark:border-blue-400/10">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Route</span>
                {waypoints.length > 0 && (
                  <span className="text-xs opacity-50">
                    · {waypoints.length} stop{waypoints.length > 1 ? "s" : ""} added by driver
                  </span>
                )}
              </div>
              <StatusBadge status={load.status} />
            </div>
            <GoogleFleetMap drivers={mapDrivers} routes={routes} height="24rem" />
            {routes.length === 0 && (
              <div className="px-5 py-2.5 text-xs opacity-50 border-t border-blue-600/10 dark:border-blue-400/10">
                Route not available — the pickup/drop address couldn&apos;t be located on the map. Check the addresses are valid.
              </div>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-5">
            <h2 className="text-sm font-medium mb-4">Status history</h2>
            {history.length === 0 ? (
              <p className="text-sm opacity-50">No status changes logged yet.</p>
            ) : (
              <ol className="space-y-3">
                {history.map((h) => (
                  <li key={h.id} className="flex items-center justify-between text-sm">
                    <span className="font-medium">{STATUS_LABEL[h.status]}</span>
                    <span className="opacity-50 text-xs">{formatDate(h.changed_at)}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium">Expenses on this load</h2>
              {expenses.length > 0 && <span className="text-sm font-medium">{formatCurrency(totalExpenses)}</span>}
            </div>
            {expenses.length === 0 ? (
              <p className="text-sm opacity-50">No expenses submitted for this load.</p>
            ) : (
              <ul className="divide-y divide-blue-600/5 dark:divide-blue-400/5">
                {expenses.map((e) => (
                  <li key={e.id} className="flex items-center justify-between py-2.5 text-sm">
                    <div>
                      <div className="font-medium">{e.category}</div>
                      <div className="text-xs opacity-50">{formatDate(e.created_at)} · {e.status}</div>
                    </div>
                    <span>{formatCurrency(e.amount)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-5">
            <h2 className="text-sm font-medium mb-4">Cargo details</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-xs opacity-50 mb-1">Pickup</div>
                <div>{load.pickup_location}</div>
              </div>
              <div>
                <div className="text-xs opacity-50 mb-1">Drop-off</div>
                <div>{load.drop_location}</div>
              </div>
              <div>
                <div className="text-xs opacity-50 mb-1">Weight</div>
                <div>{load.weight_kg.toLocaleString("en-IN")} kg</div>
              </div>
              <div>
                <div className="text-xs opacity-50 mb-1">Rate</div>
                <div>{formatCurrency(load.rate)}</div>
              </div>
              <div>
                <div className="text-xs opacity-50 mb-1">Created</div>
                <div>{formatDate(load.created_at)}</div>
              </div>
              {load.delivered_at && (
                <div>
                  <div className="text-xs opacity-50 mb-1">Delivered</div>
                  <div>{formatDate(load.delivered_at)}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-5">
            <h2 className="text-sm font-medium mb-4">Customer</h2>
            <div className="text-sm space-y-1">
              <div className="font-medium">{load.customer_name}</div>
              <div className="opacity-60">{load.customer_contact ?? "—"}</div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-5">
            <h2 className="text-sm font-medium mb-4">Driver &amp; Truck</h2>
            <div className="text-sm space-y-3">
              <div>
                <div className="text-xs opacity-50 mb-1">Driver</div>
                <div>{load.drivers?.profiles?.full_name ?? "Not assigned"}</div>
                {load.drivers?.profiles?.phone && (
                  <div className="text-xs opacity-60 mt-0.5">{load.drivers.profiles.phone}</div>
                )}
              </div>
              <div>
                <div className="text-xs opacity-50 mb-1">Truck</div>
                <div>{truckData?.truck_number ?? "Not assigned"}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
