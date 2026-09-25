"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
import { createClient } from "@/lib/supabase/client";
import { formatDate, formatCurrency } from "@/lib/format";
import { useToast } from "@/lib/useToast";
import type { CheckCall, Load, LoadStatus } from "@/types";

const T = APP_TEXT.loads;
const A = APP_TEXT.loads.loadActions;

type LoadTab = "active" | "planning" | "readyForAccounting" | "all" | "cancelled";

const TABS: { key: LoadTab; label: string }[] = [
  { key: "all", label: T.loadTabs.all },
  { key: "active", label: T.loadTabs.active },
  { key: "planning", label: T.loadTabs.planning },
  { key: "readyForAccounting", label: T.loadTabs.readyForAccounting },
  { key: "cancelled", label: T.loadTabs.cancelled },
];

const ACTIVE_STATUSES: LoadStatus[] = ["assigned", "picked_up", "in_transit"];

type LoadRow = Load & { driverName: string | null; assigned_driver_id: string | null };

function matchesTab(load: LoadRow, tab: LoadTab) {
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
  const [loads, setLoads] = useState<LoadRow[]>([]);
  const [tab, setTab] = useState<LoadTab>("all");
  const [query, setQuery] = useState(() => searchParams.get("q") ?? "");
  const [showAddForm, setShowAddForm] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null);
  const [cancelTarget, setCancelTarget] = useState<LoadRow | null>(null);
  const [checkCallTarget, setCheckCallTarget] = useState<LoadRow | null>(null);
  const [logTarget, setLogTarget] = useState<LoadRow | null>(null);
  const [logCheckCalls, setLogCheckCalls] = useState<CheckCall[]>([]);
  const [invoicedLoadIds, setInvoicedLoadIds] = useState<Set<string>>(new Set());
  const { message, showToast } = useToast();
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    async function loadLoads() {
      const supabase = createClient();
      const { data } = await supabase
        .from("loads")
        .select(
          "id, load_number, customer_name, pickup_location, drop_location, weight_kg, rate, status, assigned_driver_id, created_at, drivers(profiles(full_name))"
        )
        .order("created_at", { ascending: false });

      setLoads(
        (data ?? []).map((l) => {
          const driverName =
            (l as unknown as { drivers: { profiles: { full_name: string } | null } | null }).drivers?.profiles
              ?.full_name ?? null;
          return { ...l, assigned_driver: driverName, driverName };
        })
      );
    }

    loadLoads();
  }, []);

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

  useEffect(() => {
    if (!openMenuId) return;
    function closeMenu() {
      setOpenMenuId(null);
    }
    window.addEventListener("scroll", closeMenu, true);
    window.addEventListener("resize", closeMenu);
    return () => {
      window.removeEventListener("scroll", closeMenu, true);
      window.removeEventListener("resize", closeMenu);
    };
  }, [openMenuId]);

  const filteredLoads = useMemo(() => {
    return loads.filter((load) => {
      const matchesFilter = matchesTab(load, tab);
      const q = query.trim().toLowerCase();
      const matchesQuery =
        !q ||
        load.load_number.toLowerCase().includes(q) ||
        load.customer_name.toLowerCase().includes(q) ||
        load.pickup_location.toLowerCase().includes(q) ||
        load.drop_location.toLowerCase().includes(q);
      return matchesFilter && matchesQuery;
    });
  }, [loads, tab, query]);

  function handleAddLoad(load: Load) {
    setLoads((prev) => [{ ...load, driverName: null, assigned_driver_id: null }, ...prev]);
    showToast(`Load ${load.load_number} created`);
  }

  async function handleCopyLoad(load: LoadRow) {
    setOpenMenuId(null);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("loads")
      .insert({
        customer_name: load.customer_name,
        pickup_location: load.pickup_location,
        drop_location: load.drop_location,
        weight_kg: load.weight_kg,
        rate: load.rate,
        status: "pending",
      })
      .select("id, load_number, customer_name, pickup_location, drop_location, weight_kg, rate, status, created_at")
      .single();

    if (!error && data) {
      setLoads((prev) => [
        { ...data, assigned_driver: null, driverName: null, assigned_driver_id: null },
        ...prev,
      ]);
      showToast(A.copiedToast);
    }
  }

  function handleArchiveLoad() {
    setOpenMenuId(null);
    showToast(A.archivedToast);
  }

  async function confirmCancelLoad() {
    if (!cancelTarget) return;
    const supabase = createClient();
    const { error } = await supabase.from("loads").update({ status: "cancelled" }).eq("id", cancelTarget.id);

    if (!error) {
      setLoads((prev) => prev.map((l) => (l.id === cancelTarget.id ? { ...l, status: "cancelled" } : l)));
      showToast(A.cancelledToast);
    }
    setCancelTarget(null);
  }

  async function handleSendToAccounting(load: LoadRow) {
    setOpenMenuId(null);
    const supabase = createClient();

    const { error: invoiceError } = await supabase.from("invoices").insert({
      load_id: load.id,
      amount: load.rate,
      status: "unpaid",
    });

    if (invoiceError) return;

    if (load.assigned_driver_id) {
      await supabase.from("settlements").insert({
        load_id: load.id,
        driver_id: load.assigned_driver_id,
        amount: load.rate,
        status: "unpaid",
      });
    }

    setInvoicedLoadIds((prev) => new Set(prev).add(load.id));
    showToast(A.invoiceCreatedToast);
  }

  async function handleLogCheckCall(note: string) {
    if (!checkCallTarget) return;
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase
      .from("check_calls")
      .insert({ load_id: checkCallTarget.id, note, created_by: user?.id ?? null });

    if (!error) showToast(A.checkCallLoggedToast);
    setCheckCallTarget(null);
  }

  async function openLoadLog(load: LoadRow) {
    setOpenMenuId(null);
    setLogTarget(load);
    const supabase = createClient();
    const { data } = await supabase
      .from("check_calls")
      .select("id, load_id, note, created_at, created_by")
      .eq("load_id", load.id)
      .order("created_at", { ascending: false });

    setLogCheckCalls(
      (data ?? []).map((c) => ({
        id: c.id,
        loadId: c.load_id,
        note: c.note,
        createdAt: c.created_at,
        createdBy: c.created_by ?? "—",
      }))
    );
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
                <td className="px-5 py-3.5 font-medium">{load.load_number}</td>
                <td className="px-5 py-3.5 opacity-80">{load.customer_name}</td>
                <td className="px-5 py-3.5 opacity-70 whitespace-nowrap">
                  {load.pickup_location} → {load.drop_location}
                </td>
                <td className="px-5 py-3.5 opacity-70">{load.weight_kg.toLocaleString("en-IN")} kg</td>
                <td className="px-5 py-3.5 opacity-70">{formatCurrency(load.rate)}</td>
                <td className="px-5 py-3.5 opacity-70">{load.driverName ?? "—"}</td>
                <td className="px-5 py-3.5">
                  <StatusBadge status={load.status} />
                </td>
                <td className="px-5 py-3.5 opacity-50 whitespace-nowrap">{formatDate(load.created_at)}</td>
                <td className="px-5 py-3.5 text-right relative">
                  <button
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setMenuPos({ top: rect.bottom + 6, right: window.innerWidth - rect.right });
                      setOpenMenuId(openMenuId === load.id ? null : load.id);
                    }}
                    title={A.menuLabel}
                    className="inline-flex items-center justify-center w-7 h-7 rounded-lg opacity-60 hover:opacity-100 hover:bg-slate-100 transition-colors"
                  >
                    <KebabIcon className="w-4 h-4" />
                  </button>
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

      {openMenuId &&
        menuPos &&
        typeof document !== "undefined" &&
        (() => {
          const load = filteredLoads.find((l) => l.id === openMenuId);
          if (!load) return null;
          return createPortal(
            <div
              ref={menuRef}
              style={{ position: "fixed", top: menuPos.top, right: menuPos.right }}
              className="z-50 w-48 rounded-lg border border-slate-200 bg-white shadow-lg py-1.5 text-left"
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
                onClick={() => openLoadLog(load)}
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
            </div>,
            document.body
          );
        })()}

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
        loadId={checkCallTarget?.load_number ?? null}
        onClose={() => setCheckCallTarget(null)}
        onSubmit={handleLogCheckCall}
      />

      <LoadLogModal
        open={Boolean(logTarget)}
        load={logTarget}
        checkCalls={logCheckCalls}
        onClose={() => setLogTarget(null)}
      />

      <Toast message={message} />
    </div>
  );
}
