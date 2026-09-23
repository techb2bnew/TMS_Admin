"use client";

import { useState } from "react";
import { APP_TEXT } from "@/constants/text";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Toast from "@/components/ui/Toast";
import { LoadsIcon, DriversIcon, FleetIcon } from "@/components/icons";
import { mockLoads } from "@/lib/mock/loads";
import { mockDrivers } from "@/lib/mock/drivers";
import { formatCurrency } from "@/lib/format";
import { useToast } from "@/lib/useToast";
import type { Load } from "@/types";

const T = APP_TEXT.dispatch;

export default function DispatchPage() {
  const [loads, setLoads] = useState<Load[]>(mockLoads);
  const [busyDriverIds, setBusyDriverIds] = useState<Set<string>>(
    new Set(
      mockLoads
        .filter((l) => ["assigned", "picked_up", "in_transit"].includes(l.status) && l.assigned_driver)
        .map((l) => mockDrivers.find((d) => d.full_name === l.assigned_driver)?.id)
        .filter(Boolean) as string[]
    )
  );
  const [selectedDriver, setSelectedDriver] = useState<Record<string, string>>({});
  const [confirmTarget, setConfirmTarget] = useState<{ loadId: string; driverId: string } | null>(null);
  const { message, showToast } = useToast();

  const unassignedLoads = loads.filter((l) => l.status === "pending");
  const availableDrivers = mockDrivers.filter(
    (d) => d.status === "active" && d.truck_number && !busyDriverIds.has(d.id)
  );

  function requestAssign(loadId: string) {
    const driverId = selectedDriver[loadId];
    if (!driverId) return;
    setConfirmTarget({ loadId, driverId });
  }

  async function confirmAssign() {
    if (!confirmTarget) return;
    const { loadId, driverId } = confirmTarget;
    const driver = mockDrivers.find((d) => d.id === driverId);
    if (!driver) return;

    await new Promise((r) => setTimeout(r, 500));

    setLoads((prev) =>
      prev.map((l) => (l.id === loadId ? { ...l, status: "assigned", assigned_driver: driver.full_name } : l))
    );
    setBusyDriverIds((prev) => new Set(prev).add(driver.id));
    setConfirmTarget(null);
    showToast(`${driver.full_name} assigned to ${loadId}`);
  }

  const confirmLoad = confirmTarget ? loads.find((l) => l.id === confirmTarget.loadId) : null;
  const confirmDriver = confirmTarget ? mockDrivers.find((d) => d.id === confirmTarget.driverId) : null;

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
                    <div className="font-medium text-sm">{load.id}</div>
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

              <div className="flex gap-2">
                <select
                  value={selectedDriver[load.id] ?? ""}
                  onChange={(e) => setSelectedDriver((prev) => ({ ...prev, [load.id]: e.target.value }))}
                  className="flex-1 rounded-lg border border-blue-600/10 dark:border-blue-400/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-blue-600 transition-colors"
                >
                  <option value="">{T.selectDriver}</option>
                  {availableDrivers.map((driver) => (
                    <option key={driver.id} value={driver.id}>
                      {driver.full_name} — {driver.truck_number}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => requestAssign(load.id)}
                  disabled={!selectedDriver[load.id]}
                  className="rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 transition-colors whitespace-nowrap"
                >
                  {T.assign}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-medium opacity-70">{T.availableDriversTitle}</h2>

          <div className="rounded-xl border border-slate-200 bg-white shadow-sm divide-y divide-blue-600/5 dark:divide-blue-400/5 overflow-hidden">
            {mockDrivers
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
                      <div className="text-xs opacity-50 truncate">{driver.truck_number}</div>
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

            {mockDrivers.filter((d) => d.status === "active").length === 0 && (
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
          confirmLoad && confirmDriver ? (
            <>
              Assign <span className="font-medium text-black dark:text-white">{confirmDriver.full_name}</span> (
              {confirmDriver.truck_number}) to load{" "}
              <span className="font-medium text-black dark:text-white">{confirmLoad.id}</span> —{" "}
              {confirmLoad.pickup_location} → {confirmLoad.drop_location}?
            </>
          ) : (
            ""
          )
        }
      />
      <Toast message={message} />
    </div>
  );
}
