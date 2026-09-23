"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { APP_TEXT } from "@/constants/text";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import Toast from "@/components/ui/Toast";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import AddTruckForm from "@/components/forms/AddTruckForm";
import { SearchIcon, PlusIcon, FleetIcon, ChevronDownIcon } from "@/components/icons";
import { mockTrucks } from "@/lib/mock/trucks";
import { formatDateLong } from "@/lib/format";
import { useToast } from "@/lib/useToast";
import type { Truck, TruckStatus } from "@/types";

const T = APP_TEXT.fleet;

const FILTERS: { key: TruckStatus | "all"; label: string }[] = [
  { key: "all", label: T.filters.all },
  { key: "active", label: T.filters.active },
  { key: "maintenance", label: T.filters.maintenance },
  { key: "inactive", label: T.filters.inactive },
];

const EXPIRY_WARNING_DAYS = 14;
const TODAY = new Date("2026-09-21T12:00:00Z");

function daysUntil(iso: string) {
  return Math.round((new Date(iso).getTime() - TODAY.getTime()) / 86400000);
}

function FleetView() {
  const searchParams = useSearchParams();
  const [trucks, setTrucks] = useState<Truck[]>(mockTrucks);
  const [filter, setFilter] = useState<TruckStatus | "all">("all");
  const [query, setQuery] = useState(() => searchParams.get("q") ?? "");
  const [showAddForm, setShowAddForm] = useState(false);
  const [maintenanceTarget, setMaintenanceTarget] = useState<Truck | null>(null);
  const [statusTarget, setStatusTarget] = useState<{ truck: Truck; newStatus: TruckStatus } | null>(null);
  const { message, showToast } = useToast();

  const filteredTrucks = useMemo(() => {
    return trucks.filter((truck) => {
      const matchesFilter = filter === "all" || truck.status === filter;
      const q = query.trim().toLowerCase();
      const matchesQuery =
        !q ||
        truck.truck_number.toLowerCase().includes(q) ||
        (truck.assigned_driver ?? "").toLowerCase().includes(q);
      return matchesFilter && matchesQuery;
    });
  }, [trucks, filter, query]);

  function handleAddTruck(truck: Truck) {
    setTrucks((prev) => [truck, ...prev]);
    showToast(`Truck ${truck.truck_number} added to fleet`);
  }

  async function confirmLogMaintenance() {
    if (!maintenanceTarget) return;
    await new Promise((r) => setTimeout(r, 400));

    const today = TODAY.toISOString().slice(0, 10);
    setTrucks((prev) =>
      prev.map((t) => (t.id === maintenanceTarget.id ? { ...t, last_maintenance: today } : t))
    );
    showToast(`Maintenance logged for ${maintenanceTarget.truck_number}`);
    setMaintenanceTarget(null);
  }

  async function confirmChangeStatus() {
    if (!statusTarget) return;
    await new Promise((r) => setTimeout(r, 400));

    setTrucks((prev) =>
      prev.map((t) => (t.id === statusTarget.truck.id ? { ...t, status: statusTarget.newStatus } : t))
    );
    showToast(`${statusTarget.truck.truck_number} marked as ${statusTarget.newStatus}`);
    setStatusTarget(null);
  }

  return (
    <div>
      <PageHeader
        title={T.title}
        subtitle={T.subtitle}
        action={
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white text-sm font-medium px-4 py-2.5 transition-all shadow-md shadow-blue-600/25 hover:shadow-lg hover:-translate-y-0.5"
          >
            <PlusIcon className="w-4 h-4" />
            {T.addTruck}
          </button>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={T.searchPlaceholder}
            className="w-full rounded-lg border border-blue-600/10 dark:border-blue-400/10 bg-transparent pl-9 pr-3 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-colors"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                filter === f.key
                  ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-sm shadow-blue-600/25"
                  : "bg-slate-100 hover:bg-slate-200 opacity-70 hover:opacity-100"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredTrucks.map((truck) => {
          const expiryDays = daysUntil(truck.insurance_expiry);
          const expiringSoon = expiryDays <= EXPIRY_WARNING_DAYS;

          return (
            <div
              key={truck.id}
              className="rounded-xl border border-slate-200 bg-white shadow-sm p-5 hover:border-blue-300 hover:shadow-md transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center w-11 h-11 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
                    <FleetIcon className="w-5 h-5" />
                  </span>
                  <div>
                    <div className="font-medium text-sm">{truck.truck_number}</div>
                    <div className="text-xs opacity-50 mt-0.5">
                      {truck.capacity_kg.toLocaleString("en-IN")} kg capacity
                    </div>
                  </div>
                </div>
                <div className="relative shrink-0">
                  <StatusBadge status={truck.status} />
                  <span className="pointer-events-none absolute -bottom-1 -right-1 flex items-center justify-center w-3.5 h-3.5 rounded-full bg-white border border-slate-200 text-slate-400 shadow-sm">
                    <ChevronDownIcon className="w-2.5 h-2.5" />
                  </span>
                  <select
                    value={truck.status}
                    onChange={(e) =>
                      setStatusTarget({ truck, newStatus: e.target.value as TruckStatus })
                    }
                    title="Change status"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  >
                    <option value="active">Active</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <dl className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <dt className="opacity-50">{T.driver}</dt>
                  <dd className="opacity-80">{truck.assigned_driver ?? "Unassigned"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="opacity-50">{T.lastMaintenance}</dt>
                  <dd className="opacity-80">{formatDateLong(truck.last_maintenance)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="opacity-50">{T.insuranceExpiry}</dt>
                  <dd className={expiringSoon ? "text-amber-600 dark:text-amber-400 font-medium" : "opacity-80"}>
                    {formatDateLong(truck.insurance_expiry)}
                  </dd>
                </div>
              </dl>

              <div className="mt-3 pt-3 border-t border-blue-600/5 dark:border-blue-400/5 flex items-center justify-between">
                {expiringSoon ? (
                  <span className="text-xs text-amber-600 dark:text-amber-400">
                    {expiryDays <= 0 ? T.expired : `${T.expiresIn} ${expiryDays}d`}
                  </span>
                ) : (
                  <span />
                )}
                <button
                  onClick={() => setMaintenanceTarget(truck)}
                  className="rounded-lg bg-blue-50 hover:bg-blue-100 px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors shrink-0"
                >
                  Log Maintenance
                </button>
              </div>
            </div>
          );
        })}

        {filteredTrucks.length === 0 && (
          <div className="col-span-full text-center text-sm opacity-50 py-10">{T.emptyState}</div>
        )}
      </div>

      <AddTruckForm open={showAddForm} onClose={() => setShowAddForm(false)} onAdd={handleAddTruck} />
      <ConfirmDialog
        open={Boolean(maintenanceTarget)}
        onClose={() => setMaintenanceTarget(null)}
        onConfirm={confirmLogMaintenance}
        title="Log maintenance?"
        confirmLabel="Log Maintenance"
        message={
          maintenanceTarget
            ? `Mark maintenance as done today for ${maintenanceTarget.truck_number}?`
            : ""
        }
      />
      <ConfirmDialog
        open={Boolean(statusTarget)}
        onClose={() => setStatusTarget(null)}
        onConfirm={confirmChangeStatus}
        title="Change status?"
        message={
          statusTarget
            ? `Mark ${statusTarget.truck.truck_number} as ${statusTarget.newStatus}?`
            : ""
        }
      />
      <Toast message={message} />
    </div>
  );
}

export default FleetView;
