"use client";

import { useEffect, useMemo, useState } from "react";
import { APP_TEXT } from "@/constants/text";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import Toast from "@/components/ui/Toast";
import AddTenderForm from "@/components/forms/AddTenderForm";
import { PlusIcon, TendersIcon } from "@/components/icons";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/lib/useToast";
import { formatDate } from "@/lib/format";
import type { LoadTender } from "@/types";

const T = APP_TEXT.tenders;

type TenderRow = {
  id: string;
  source: LoadTender["source"];
  customer_name: string;
  pickup_location: string;
  drop_location: string;
  rate: number | null;
  weight_kg: number | null;
  truck_type: string | null;
  status: LoadTender["status"];
  received_at: string;
};

function toTender(row: TenderRow): LoadTender {
  return {
    id: row.id,
    source: row.source,
    customerName: row.customer_name,
    pickupLocation: row.pickup_location,
    dropLocation: row.drop_location,
    rate: row.rate,
    weightKg: row.weight_kg,
    truckType: row.truck_type ?? "",
    status: row.status,
    receivedAt: row.received_at,
  };
}

function TendersView() {
  const [tenders, setTenders] = useState<LoadTender[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const { message, showToast } = useToast();

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("load_tenders")
        .select("id, source, customer_name, pickup_location, drop_location, rate, weight_kg, truck_type, status, received_at")
        .order("received_at", { ascending: false });
      setTenders((data ?? []).map(toTender));
    }
    load();
  }, []);

  const pendingTenders = useMemo(() => tenders.filter((t) => t.status === "pending"), [tenders]);
  const acceptedCount = useMemo(() => tenders.filter((t) => t.status === "accepted").length, [tenders]);

  function handleAddedTender(tender: LoadTender) {
    setTenders((prev) => [tender, ...prev]);
  }

  async function acceptTender(tender: LoadTender) {
    setBusyId(tender.id);
    const supabase = createClient();

    const { error: loadError } = await supabase.from("loads").insert({
      customer_name: tender.customerName,
      pickup_location: tender.pickupLocation,
      drop_location: tender.dropLocation,
      rate: tender.rate ?? 0,
      weight_kg: tender.weightKg,
      status: "pending",
    });

    if (loadError) {
      setBusyId(null);
      showToast(loadError.message);
      return;
    }

    const { data: authData } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("load_tenders")
      .update({ status: "accepted", responded_by: authData.user?.id, responded_at: new Date().toISOString() })
      .eq("id", tender.id);

    setBusyId(null);
    if (error) {
      showToast(error.message);
      return;
    }

    setTenders((prev) => prev.map((t) => (t.id === tender.id ? { ...t, status: "accepted" } : t)));
    showToast(T.acceptedToast);
  }

  async function rejectTender(tender: LoadTender) {
    setBusyId(tender.id);
    const supabase = createClient();
    const { data: authData } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("load_tenders")
      .update({ status: "rejected", responded_by: authData.user?.id, responded_at: new Date().toISOString() })
      .eq("id", tender.id);

    setBusyId(null);
    if (error) {
      showToast(error.message);
      return;
    }

    setTenders((prev) => prev.map((t) => (t.id === tender.id ? { ...t, status: "rejected" } : t)));
    showToast(T.rejectedToast);
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
            {T.addTender}
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-4 mb-6 max-w-md">
        <StatCard label={T.statPending} value={pendingTenders.length} Icon={TendersIcon} accent="amber" />
        <StatCard label={T.statAccepted} value={acceptedCount} Icon={TendersIcon} accent="emerald" />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs opacity-50 text-left bg-slate-50">
                <th className="font-medium px-5 py-3">{T.table.customer}</th>
                <th className="font-medium px-5 py-3">{T.table.route}</th>
                <th className="font-medium px-5 py-3">{T.table.rate}</th>
                <th className="font-medium px-5 py-3">{T.table.weight}</th>
                <th className="font-medium px-5 py-3">{T.table.received}</th>
                <th className="font-medium px-5 py-3">{T.table.status}</th>
                <th className="font-medium px-5 py-3 text-right">{T.table.actions}</th>
              </tr>
            </thead>
            <tbody>
              {tenders.map((tender) => (
                <tr
                  key={tender.id}
                  className="border-t border-blue-600/5 dark:border-blue-400/5 hover:bg-blue-50/60 transition-colors"
                >
                  <td className="px-5 py-3.5 font-medium">{tender.customerName}</td>
                  <td className="px-5 py-3.5 opacity-80">
                    {tender.pickupLocation} → {tender.dropLocation}
                  </td>
                  <td className="px-5 py-3.5 opacity-70 whitespace-nowrap">{tender.rate ? `$${tender.rate}` : "—"}</td>
                  <td className="px-5 py-3.5 opacity-70 whitespace-nowrap">
                    {tender.weightKg ? `${tender.weightKg.toLocaleString("en-IN")} kg` : "—"}
                  </td>
                  <td className="px-5 py-3.5 opacity-60 whitespace-nowrap">{formatDate(tender.receivedAt)}</td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        tender.status === "pending"
                          ? "bg-amber-50 text-amber-700"
                          : tender.status === "accepted"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-red-50 text-red-600"
                      }`}
                    >
                      {T.statuses[tender.status]}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right whitespace-nowrap">
                    {tender.status === "pending" && (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => rejectTender(tender)}
                          disabled={busyId === tender.id}
                          className="rounded-lg px-2.5 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 disabled:opacity-50 transition-colors"
                        >
                          {T.reject}
                        </button>
                        <button
                          onClick={() => acceptTender(tender)}
                          disabled={busyId === tender.id}
                          className="rounded-lg px-2.5 py-1.5 text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        >
                          {T.accept}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}

              {tenders.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-sm opacity-50">
                    {T.emptyState}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAddForm && <AddTenderForm open onClose={() => setShowAddForm(false)} onSaved={handleAddedTender} />}
      <Toast message={message} />
    </div>
  );
}

export default TendersView;
