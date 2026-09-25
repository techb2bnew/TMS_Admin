"use client";

import { useEffect, useState } from "react";
import { APP_TEXT } from "@/constants/text";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Toast from "@/components/ui/Toast";
import AddDriverForm from "@/components/forms/AddDriverForm";
import AddTruckForm from "@/components/forms/AddTruckForm";
import { LoadsIcon, DriversIcon, FleetIcon, PlusIcon } from "@/components/icons";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/format";
import { useToast } from "@/lib/useToast";
import type { Driver, Load, LoadStatus, Truck } from "@/types";

const T = APP_TEXT.dispatch;
const ACTIVE_LOAD_STATUSES: LoadStatus[] = ["assigned", "picked_up", "in_transit"];
const ADD_NEW_DRIVER = "__add_new_driver__";
const ADD_NEW_TRUCK = "__add_new_truck__";

type LoadRow = Load & { assigned_driver_id: string | null; assigned_truck_id: string | null };

export default function DispatchPage() {
  const [loads, setLoads] = useState<LoadRow[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<Record<string, string>>({});
  const [selectedTruck, setSelectedTruck] = useState<Record<string, string>>({});
  const [confirmTarget, setConfirmTarget] = useState<{ loadId: string; driverId: string; truckId: string } | null>(
    null
  );
  const [showAddDriver, setShowAddDriver] = useState(false);
  const [showAddTruck, setShowAddTruck] = useState(false);
  const [pendingLoadId, setPendingLoadId] = useState<string | null>(null);
  const { message, showToast } = useToast();

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      const [{ data: loadsData }, { data: driversData }, { data: trucksData }] = await Promise.all([
        supabase
          .from("loads")
          .select(
            "id, load_number, customer_name, pickup_location, drop_location, weight_kg, rate, status, assigned_driver_id, assigned_truck_id, created_at"
          ),
        supabase.from("drivers").select("id, status, license_number, created_at, profiles(full_name, phone)"),
        supabase.from("trucks").select("id, truck_number, capacity_kg, status, insurance_expiry, last_maintenance"),
      ]);

      setLoads(
        (loadsData ?? []).map((l) => ({ ...l, assigned_driver: null }))
      );
      setDrivers(
        (driversData ?? []).map((d) => {
          const profile = (d as unknown as { profiles: { full_name: string; phone: string } | null }).profiles;
          return {
            id: d.id,
            full_name: profile?.full_name ?? "Unknown",
            phone: profile?.phone ?? "",
            license_number: d.license_number ?? "",
            status: d.status as Driver["status"],
            deliveries_count: 0,
            joined_at: (d as unknown as { created_at: string }).created_at,
            truck_number: null,
            location: null,
          };
        })
      );
      setTrucks((trucksData ?? []).map((t) => ({ ...t, assigned_driver: null })));
    }

    loadData();
  }, []);

  const busyDriverIds = new Set(
    loads.filter((l) => ACTIVE_LOAD_STATUSES.includes(l.status) && l.assigned_driver_id).map((l) => l.assigned_driver_id as string)
  );
  const busyTruckIds = new Set(
    loads.filter((l) => ACTIVE_LOAD_STATUSES.includes(l.status) && l.assigned_truck_id).map((l) => l.assigned_truck_id as string)
  );

  const unassignedLoads = loads.filter((l) => l.status === "pending");
  const availableDrivers = drivers.filter((d) => d.status === "active" && !busyDriverIds.has(d.id));
  const availableTrucks = trucks.filter((t) => t.status === "active" && !busyTruckIds.has(t.id));

  function handleAddDriver(driver: Driver) {
    setDrivers((prev) => [driver, ...prev]);
    showToast(`${driver.full_name} added`);
    if (pendingLoadId) {
      setSelectedDriver((prev) => ({ ...prev, [pendingLoadId]: driver.id }));
      setPendingLoadId(null);
    }
  }

  function handleAddTruck(truck: Truck) {
    setTrucks((prev) => [truck, ...prev]);
    showToast(`Truck ${truck.truck_number} added`);
    if (pendingLoadId) {
      setSelectedTruck((prev) => ({ ...prev, [pendingLoadId]: truck.id }));
      setPendingLoadId(null);
    }
  }

  function handleDriverSelectChange(loadId: string, value: string) {
    if (value === ADD_NEW_DRIVER) {
      setPendingLoadId(loadId);
      setShowAddDriver(true);
      return;
    }
    setSelectedDriver((prev) => ({ ...prev, [loadId]: value }));
  }

  function handleTruckSelectChange(loadId: string, value: string) {
    if (value === ADD_NEW_TRUCK) {
      setPendingLoadId(loadId);
      setShowAddTruck(true);
      return;
    }
    setSelectedTruck((prev) => ({ ...prev, [loadId]: value }));
  }

  function requestAssign(loadId: string) {
    const driverId = selectedDriver[loadId];
    const truckId = selectedTruck[loadId];
    if (!driverId || !truckId) return;
    setConfirmTarget({ loadId, driverId, truckId });
  }

  async function confirmAssign() {
    if (!confirmTarget) return;
    const { loadId, driverId, truckId } = confirmTarget;

    const supabase = createClient();
    const { error } = await supabase
      .from("loads")
      .update({ status: "assigned", assigned_driver_id: driverId, assigned_truck_id: truckId })
      .eq("id", loadId);

    if (!error) {
      setLoads((prev) =>
        prev.map((l) =>
          l.id === loadId ? { ...l, status: "assigned", assigned_driver_id: driverId, assigned_truck_id: truckId } : l
        )
      );
      const driver = drivers.find((d) => d.id === driverId);
      const loadLabel = loads.find((l) => l.id === loadId)?.load_number ?? loadId;
      showToast(`${driver?.full_name ?? "Driver"} assigned to ${loadLabel}`);
    }
    setConfirmTarget(null);
  }

  const confirmLoad = confirmTarget ? loads.find((l) => l.id === confirmTarget.loadId) : null;
  const confirmDriver = confirmTarget ? drivers.find((d) => d.id === confirmTarget.driverId) : null;
  const confirmTruck = confirmTarget ? trucks.find((t) => t.id === confirmTarget.truckId) : null;

  return (
    <div>
      <PageHeader title={T.title} subtitle={T.subtitle} />

      <div className="grid grid-cols-2 gap-4 mb-6 max-w-md">
        <StatCard label={T.statUnassigned} value={unassignedLoads.length} Icon={LoadsIcon} accent="amber" />
        <StatCard label={T.statAvailable} value={availableDrivers.length} Icon={DriversIcon} accent="blue" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-sm font-medium opacity-70">{T.unassignedTitle}</h2>

          {unassignedLoads.length === 0 && (
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm px-5 py-10 text-center text-sm opacity-50">
              {T.allAssigned}
            </div>
          )}

          {unassignedLoads.map((load) => (
            <div
              key={load.id}
              className="rounded-xl border border-slate-200 bg-white shadow-sm p-4 hover:border-blue-300 hover:shadow-md transition-colors"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center w-10 h-10 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
                    <LoadsIcon className="w-4.5 h-4.5" />
                  </span>
                  <div>
                    <div className="font-medium text-sm">{load.load_number}</div>
                    <div className="text-xs opacity-60 mt-0.5">{load.customer_name}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{formatCurrency(load.rate)}</div>
                  <div className="text-xs opacity-50">{load.weight_kg.toLocaleString("en-IN")} kg</div>
                </div>
              </div>

              <div className="text-xs opacity-70 mb-3">
                {load.pickup_location} → {load.drop_location}
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  value={selectedDriver[load.id] ?? ""}
                  onChange={(e) => handleDriverSelectChange(load.id, e.target.value)}
                  className="flex-1 rounded-lg border border-blue-600/10 dark:border-blue-400/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-blue-600 transition-colors"
                >
                  <option value="">{availableDrivers.length === 0 ? T.noAvailableDrivers : T.selectDriver}</option>
                  {availableDrivers.map((driver) => (
                    <option key={driver.id} value={driver.id}>
                      {driver.full_name}
                    </option>
                  ))}
                  <option value={ADD_NEW_DRIVER}>+ Add New Driver</option>
                </select>
                <select
                  value={selectedTruck[load.id] ?? ""}
                  onChange={(e) => handleTruckSelectChange(load.id, e.target.value)}
                  className="flex-1 rounded-lg border border-blue-600/10 dark:border-blue-400/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-blue-600 transition-colors"
                >
                  <option value="">{availableTrucks.length === 0 ? "No trucks available" : "Select a truck"}</option>
                  {availableTrucks.map((truck) => (
                    <option key={truck.id} value={truck.id}>
                      {truck.truck_number}
                    </option>
                  ))}
                  <option value={ADD_NEW_TRUCK}>+ Add New Truck</option>
                </select>
                <button
                  onClick={() => requestAssign(load.id)}
                  disabled={!selectedDriver[load.id] || !selectedTruck[load.id]}
                  className="rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 transition-colors whitespace-nowrap"
                >
                  {T.assign}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-medium opacity-70">{T.availableDriversTitle}</h2>
            <button
              onClick={() => setShowAddDriver(true)}
              className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
            >
              <PlusIcon className="w-3.5 h-3.5" />
              {APP_TEXT.drivers.addDriver}
            </button>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white shadow-sm divide-y divide-blue-600/5 dark:divide-blue-400/5 overflow-hidden">
            {drivers
              .filter((d) => d.status === "active")
              .map((driver) => {
                const busy = busyDriverIds.has(driver.id);
                return (
                  <div key={driver.id} className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50/60 transition-colors">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
                      <FleetIcon className="w-4 h-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">{driver.full_name}</div>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-medium whitespace-nowrap ${
                        busy ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${busy ? "bg-amber-500" : "bg-emerald-500"}`} />
                      {busy ? T.onRoute : T.idle}
                    </span>
                  </div>
                );
              })}

            {drivers.filter((d) => d.status === "active").length === 0 && (
              <div className="px-4 py-8 text-center text-xs opacity-50">{T.noAvailableDrivers}</div>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(confirmTarget)}
        onClose={() => setConfirmTarget(null)}
        onConfirm={confirmAssign}
        title="Assign this load?"
        confirmLabel={T.assign}
        message={
          confirmLoad && confirmDriver && confirmTruck ? (
            <>
              Assign <span className="font-medium text-black dark:text-white">{confirmDriver.full_name}</span> (
              {confirmTruck.truck_number}) to load{" "}
              <span className="font-medium text-black dark:text-white">{confirmLoad.load_number}</span> —{" "}
              {confirmLoad.pickup_location} → {confirmLoad.drop_location}?
            </>
          ) : (
            ""
          )
        }
      />
      <AddDriverForm
        open={showAddDriver}
        onClose={() => {
          setShowAddDriver(false);
          setPendingLoadId(null);
        }}
        onAdd={handleAddDriver}
      />
      <AddTruckForm
        open={showAddTruck}
        onClose={() => {
          setShowAddTruck(false);
          setPendingLoadId(null);
        }}
        onAdd={handleAddTruck}
      />
      <Toast message={message} />
    </div>
  );
}
