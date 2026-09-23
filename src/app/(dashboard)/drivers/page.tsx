"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { APP_TEXT } from "@/constants/text";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import Toast from "@/components/ui/Toast";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import AddDriverForm from "@/components/forms/AddDriverForm";
import { SearchIcon, PlusIcon, FleetIcon, ChevronDownIcon } from "@/components/icons";
import { mockDrivers } from "@/lib/mock/drivers";
import { formatDateLong } from "@/lib/format";
import { useToast } from "@/lib/useToast";
import type { Driver, DriverStatus } from "@/types";

const T = APP_TEXT.drivers;

const FILTERS: { key: DriverStatus | "all"; label: string }[] = [
  { key: "all", label: T.filters.all },
  { key: "active", label: T.filters.active },
  { key: "inactive", label: T.filters.inactive },
];

const AVATAR_COLORS = [
  "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  "bg-violet-500/15 text-violet-600 dark:text-violet-400",
  "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  "bg-rose-500/15 text-rose-600 dark:text-rose-400",
];

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function DriversView() {
  const searchParams = useSearchParams();
  const [drivers, setDrivers] = useState<Driver[]>(mockDrivers);
  const [filter, setFilter] = useState<DriverStatus | "all">("all");
  const [query, setQuery] = useState(() => searchParams.get("q") ?? "");
  const [showAddForm, setShowAddForm] = useState(false);
  const [statusTarget, setStatusTarget] = useState<{ driver: Driver; newStatus: DriverStatus } | null>(
    null
  );
  const { message, showToast } = useToast();

  const filteredDrivers = useMemo(() => {
    return drivers.filter((driver) => {
      const matchesFilter = filter === "all" || driver.status === filter;
      const q = query.trim().toLowerCase();
      const matchesQuery =
        !q || driver.full_name.toLowerCase().includes(q) || driver.phone.includes(q);
      return matchesFilter && matchesQuery;
    });
  }, [drivers, filter, query]);

  function handleAddDriver(driver: Driver) {
    setDrivers((prev) => [driver, ...prev]);
    showToast(`${driver.full_name} added — login credentials sent`);
  }

  async function confirmChangeStatus() {
    if (!statusTarget) return;
    await new Promise((r) => setTimeout(r, 400));

    setDrivers((prev) =>
      prev.map((d) => (d.id === statusTarget.driver.id ? { ...d, status: statusTarget.newStatus } : d))
    );
    showToast(`${statusTarget.driver.full_name} marked as ${statusTarget.newStatus}`);
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
            {T.addDriver}
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
        {filteredDrivers.map((driver, i) => (
          <div
            key={driver.id}
            className="rounded-xl border border-slate-200 bg-white shadow-sm p-5 hover:border-blue-300 hover:shadow-md transition-colors"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <span
                  className={`flex items-center justify-center w-11 h-11 rounded-full text-sm font-semibold shrink-0 ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}
                >
                  {getInitials(driver.full_name)}
                </span>
                <div>
                  <div className="font-medium text-sm">{driver.full_name}</div>
                  <div className="text-xs opacity-50 mt-0.5">{driver.phone}</div>
                </div>
              </div>
              <div className="relative shrink-0">
                <StatusBadge status={driver.status} />
                <span className="pointer-events-none absolute -bottom-1 -right-1 flex items-center justify-center w-3.5 h-3.5 rounded-full bg-white border border-slate-200 text-slate-400 shadow-sm">
                  <ChevronDownIcon className="w-2.5 h-2.5" />
                </span>
                <select
                  value={driver.status}
                  onChange={(e) =>
                    setStatusTarget({ driver, newStatus: e.target.value as DriverStatus })
                  }
                  title="Change status"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <dl className="space-y-2 text-xs">
              <div className="flex justify-between">
                <dt className="opacity-50">{T.license}</dt>
                <dd className="opacity-80">{driver.license_number}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="opacity-50">{T.joined}</dt>
                <dd className="opacity-80">{formatDateLong(driver.joined_at)}</dd>
              </div>
            </dl>

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-blue-600/5 dark:border-blue-400/5">
              <span className="inline-flex items-center gap-1.5 text-xs opacity-60">
                <FleetIcon className="w-3.5 h-3.5" />
                {driver.truck_number ?? "No truck assigned"}
              </span>
              <span className="text-xs font-medium">
                {driver.deliveries_count} {T.deliveries}
              </span>
            </div>
          </div>
        ))}

        {filteredDrivers.length === 0 && (
          <div className="col-span-full text-center text-sm opacity-50 py-10">{T.emptyState}</div>
        )}
      </div>

      <AddDriverForm open={showAddForm} onClose={() => setShowAddForm(false)} onAdd={handleAddDriver} />
      <ConfirmDialog
        open={Boolean(statusTarget)}
        onClose={() => setStatusTarget(null)}
        onConfirm={confirmChangeStatus}
        title="Change status?"
        message={
          statusTarget
            ? `Mark ${statusTarget.driver.full_name} as ${statusTarget.newStatus}?`
            : ""
        }
      />
      <Toast message={message} />
    </div>
  );
}

export default function DriversPage() {
  return (
    <Suspense>
      <DriversView />
    </Suspense>
  );
}
