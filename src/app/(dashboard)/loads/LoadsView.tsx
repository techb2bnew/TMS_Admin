"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { APP_TEXT } from "@/constants/text";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import Toast from "@/components/ui/Toast";
import AddLoadForm from "@/components/forms/AddLoadForm";
import { SearchIcon, PlusIcon } from "@/components/icons";
import { mockLoads } from "@/lib/mock/loads";
import { formatDate, formatCurrency } from "@/lib/format";
import { useToast } from "@/lib/useToast";
import type { Load, LoadStatus } from "@/types";

const T = APP_TEXT.loads;

const FILTERS: { key: LoadStatus | "all"; label: string }[] = [
  { key: "all", label: T.filters.all },
  { key: "pending", label: T.filters.pending },
  { key: "assigned", label: T.filters.assigned },
  { key: "picked_up", label: T.filters.picked_up },
  { key: "in_transit", label: T.filters.in_transit },
  { key: "delivered", label: T.filters.delivered },
];

export default function LoadsView() {
  const searchParams = useSearchParams();
  const [loads, setLoads] = useState<Load[]>(mockLoads);
  const [filter, setFilter] = useState<LoadStatus | "all">("all");
  const [query, setQuery] = useState(() => searchParams.get("q") ?? "");
  const [showAddForm, setShowAddForm] = useState(false);
  const { message, showToast } = useToast();

  const filteredLoads = useMemo(() => {
    return loads.filter((load) => {
      const matchesFilter = filter === "all" || load.status === filter;
      const q = query.trim().toLowerCase();
      const matchesQuery =
        !q ||
        load.id.toLowerCase().includes(q) ||
        load.customer_name.toLowerCase().includes(q) ||
        load.pickup_location.toLowerCase().includes(q) ||
        load.drop_location.toLowerCase().includes(q);
      return matchesFilter && matchesQuery;
    });
  }, [loads, filter, query]);

  function handleAddLoad(load: Load) {
    setLoads((prev) => [load, ...prev]);
    showToast(`Load ${load.id} created`);
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
            {T.newLoad}
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

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs opacity-50 text-left bg-slate-50">
              <th className="font-medium px-5 py-3">{T.table.loadId}</th>
              <th className="font-medium px-5 py-3">{T.table.customer}</th>
              <th className="font-medium px-5 py-3">{T.table.route}</th>
              <th className="font-medium px-5 py-3">{T.table.weight}</th>
              <th className="font-medium px-5 py-3">{T.table.rate}</th>
              <th className="font-medium px-5 py-3">{T.table.driver}</th>
              <th className="font-medium px-5 py-3">{T.table.status}</th>
              <th className="font-medium px-5 py-3">{T.table.created}</th>
            </tr>
          </thead>
          <tbody>
            {filteredLoads.map((load) => (
              <tr
                key={load.id}
                className="border-t border-blue-600/5 dark:border-blue-400/5 hover:bg-blue-50/60 transition-colors"
              >
                <td className="px-5 py-3.5 font-medium">{load.id}</td>
                <td className="px-5 py-3.5 opacity-80">{load.customer_name}</td>
                <td className="px-5 py-3.5 opacity-70 whitespace-nowrap">
                  {load.pickup_location} → {load.drop_location}
                </td>
                <td className="px-5 py-3.5 opacity-70">{load.weight_kg.toLocaleString("en-IN")} kg</td>
                <td className="px-5 py-3.5 opacity-70">{formatCurrency(load.rate)}</td>
                <td className="px-5 py-3.5 opacity-70">{load.assigned_driver ?? "—"}</td>
                <td className="px-5 py-3.5">
                  <StatusBadge status={load.status} />
                </td>
                <td className="px-5 py-3.5 opacity-50 whitespace-nowrap">{formatDate(load.created_at)}</td>
              </tr>
            ))}

            {filteredLoads.length === 0 && (
              <tr>
                <td colSpan={8} className="px-5 py-10 text-center text-sm opacity-50">
                  {T.emptyState}
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>

      <AddLoadForm open={showAddForm} onClose={() => setShowAddForm(false)} onAdd={handleAddLoad} />
      <Toast message={message} />
    </div>
  );
}
