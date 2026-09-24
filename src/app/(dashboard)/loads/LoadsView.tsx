"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { APP_TEXT } from "@/constants/text";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import Toast from "@/components/ui/Toast";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import LoadLogModal from "@/components/ui/LoadLogModal";
import AddLoadForm from "@/components/forms/AddLoadForm";
import LogCheckCallForm from "@/components/forms/LogCheckCallForm";
import { SearchIcon, PlusIcon, KebabIcon } from "@/components/icons";
import { mockLoads } from "@/lib/mock/loads";
import { mockCheckCalls } from "@/lib/mock/checkCalls";
import { addMockInvoice } from "@/lib/mock/invoices";
import { formatDate, formatCurrency } from "@/lib/format";
import { useToast } from "@/lib/useToast";
import type { CheckCall, Invoice, Load } from "@/types";

const T = APP_TEXT.loads;
const A = APP_TEXT.loads.loadActions;

type LoadTab = "active" | "planning" | "readyForAccounting" | "all" | "cancelled";

const TABS: { key: LoadTab; label: string }[] = [
  { key: "active", label: T.loadTabs.active },
  { key: "planning", label: T.loadTabs.planning },
  { key: "readyForAccounting", label: T.loadTabs.readyForAccounting },
  { key: "all", label: T.loadTabs.all },
  { key: "cancelled", label: T.loadTabs.cancelled },
];

const ACTIVE_STATUSES = ["assigned", "picked_up", "in_transit"];

function matchesTab(load: Load, tab: LoadTab) {
  switch (tab) {
    case "active":
      return ACTIVE_STATUSES.includes(load.status);
    case "planning":
      return load.status === "pending";
    case "readyForAccounting":
      return load.status === "delivered";
    case "cancelled":
      return load.status === "cancelled";
    case "all":
    default:
      return true;
  }
}

export default function LoadsView() {
  const searchParams = useSearchParams();
  const [loads, setLoads] = useState<Load[]>(mockLoads);
  const [checkCalls, setCheckCalls] = useState<CheckCall[]>(mockCheckCalls);
  const [tab, setTab] = useState<LoadTab>("active");
  const [query, setQuery] = useState(() => searchParams.get("q") ?? "");
  const [showAddForm, setShowAddForm] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Load | null>(null);
  const [checkCallTarget, setCheckCallTarget] = useState<Load | null>(null);
  const [logTarget, setLogTarget] = useState<Load | null>(null);
  const [invoicedLoadIds, setInvoicedLoadIds] = useState<Set<string>>(new Set());
  const { message, showToast } = useToast();
  const menuRef = useRef<HTMLDivElement | null>(null);
  const copyCounterRef = useRef(0);

  useEffect(() => {
    if (!openMenuId) return;
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openMenuId]);

  const filteredLoads = useMemo(() => {
    return loads.filter((load) => {
      const matchesFilter = matchesTab(load, tab);
      const q = query.trim().toLowerCase();
      const matchesQuery =
        !q ||
        load.id.toLowerCase().includes(q) ||
        load.customer_name.toLowerCase().includes(q) ||
        load.pickup_location.toLowerCase().includes(q) ||
        load.drop_location.toLowerCase().includes(q);
      return matchesFilter && matchesQuery;
    });
  }, [loads, tab, query]);

  function handleAddLoad(load: Load) {
    setLoads((prev) => [load, ...prev]);
    showToast(`Load ${load.id} created`);
  }

  function handleCopyLoad(load: Load) {
    setOpenMenuId(null);
    copyCounterRef.current += 1;
    const copy: Load = {
      ...load,
      id: `${load.id}-COPY${copyCounterRef.current}`,
      status: "pending",
      assigned_driver: null,
      created_at: new Date().toISOString(),
    };
    setLoads((prev) => [copy, ...prev]);
    showToast(A.copiedToast);
  }

  function handleArchiveLoad() {
    setOpenMenuId(null);
    showToast(A.archivedToast);
  }

  async function confirmCancelLoad() {
    if (!cancelTarget) return;
    await new Promise((r) => setTimeout(r, 300));
    setLoads((prev) => prev.map((l) => (l.id === cancelTarget.id ? { ...l, status: "cancelled" } : l)));
    showToast(A.cancelledToast);
    setCancelTarget(null);
  }

  function handleSendToAccounting(load: Load) {
    setOpenMenuId(null);
    const invoice: Invoice = {
      id: `INV-${load.id.replace(/\D/g, "") || Date.now()}`,
      load_id: load.id,
      customer_name: load.customer_name,
      amount: load.rate,
      status: "unpaid",
      created_at: new Date().toISOString(),
    };
    addMockInvoice(invoice);
    setInvoicedLoadIds((prev) => new Set(prev).add(load.id));
    showToast(A.invoiceCreatedToast);
  }

  function handleLogCheckCall(note: string) {
    if (!checkCallTarget) return;
    const entry: CheckCall = {
      id: `cc${Date.now()}`,
      loadId: checkCallTarget.id,
      note,
      createdAt: new Date().toISOString(),
      createdBy: "You",
    };
    setCheckCalls((prev) => [entry, ...prev]);
    showToast(A.checkCallLoggedToast);
    setCheckCallTarget(null);
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

      <div className="flex flex-wrap gap-1.5 mb-5 border-b border-blue-600/10 dark:border-blue-400/10 pb-3">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-lg px-3.5 py-2 text-xs font-medium transition-colors ${
              tab === t.key
                ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-sm shadow-blue-600/25"
                : "bg-slate-100 hover:bg-slate-200 opacity-70 hover:opacity-100"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

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
              <th className="font-medium px-5 py-3 text-right">{T.table.actions}</th>
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
                <td className="px-5 py-3.5 text-right relative">
                  <button
                    onClick={() => setOpenMenuId(openMenuId === load.id ? null : load.id)}
                    title={A.menuLabel}
                    className="inline-flex items-center justify-center w-7 h-7 rounded-lg opacity-60 hover:opacity-100 hover:bg-slate-100 transition-colors"
                  >
                    <KebabIcon className="w-4 h-4" />
                  </button>

                  {openMenuId === load.id && (
                    <div
                      ref={menuRef}
                      className="absolute right-5 top-11 z-10 w-48 rounded-lg border border-slate-200 bg-white shadow-lg py-1.5 text-left"
                    >
                      <button
                        onClick={() => handleCopyLoad(load)}
                        className="w-full text-left px-3.5 py-2 text-xs hover:bg-slate-50 transition-colors"
                      >
                        {A.copyLoad}
                      </button>
                      <button
                        onClick={handleArchiveLoad}
                        className="w-full text-left px-3.5 py-2 text-xs hover:bg-slate-50 transition-colors"
                      >
                        {A.archiveLoad}
                      </button>
                      {load.status === "delivered" && !invoicedLoadIds.has(load.id) && (
                        <button
                          onClick={() => handleSendToAccounting(load)}
                          className="w-full text-left px-3.5 py-2 text-xs text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                          {A.sendToAccounting}
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setOpenMenuId(null);
                          setCheckCallTarget(load);
                        }}
                        className="w-full text-left px-3.5 py-2 text-xs hover:bg-slate-50 transition-colors"
                      >
                        {A.logCheckCall}
                      </button>
                      <button
                        onClick={() => {
                          setOpenMenuId(null);
                          setLogTarget(load);
                        }}
                        className="w-full text-left px-3.5 py-2 text-xs hover:bg-slate-50 transition-colors"
                      >
                        {A.viewLoadLog}
                      </button>
                      <button
                        onClick={() => {
                          setOpenMenuId(null);
                          setCancelTarget(load);
                        }}
                        className="w-full text-left px-3.5 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors"
                      >
                        {A.cancelLoad}
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}

            {filteredLoads.length === 0 && (
              <tr>
                <td colSpan={9} className="px-5 py-10 text-center text-sm opacity-50">
                  {T.emptyState}
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>

      <AddLoadForm open={showAddForm} onClose={() => setShowAddForm(false)} onAdd={handleAddLoad} />

      <ConfirmDialog
        open={Boolean(cancelTarget)}
        onClose={() => setCancelTarget(null)}
        onConfirm={confirmCancelLoad}
        title={A.cancelConfirmTitle}
        message={A.cancelConfirmMessage}
        tone="danger"
      />

      <LogCheckCallForm
        open={Boolean(checkCallTarget)}
        loadId={checkCallTarget?.id ?? null}
        onClose={() => setCheckCallTarget(null)}
        onSubmit={handleLogCheckCall}
      />

      <LoadLogModal
        open={Boolean(logTarget)}
        load={logTarget}
        checkCalls={checkCalls}
        onClose={() => setLogTarget(null)}
      />

      <Toast message={message} />
    </div>
  );
}
