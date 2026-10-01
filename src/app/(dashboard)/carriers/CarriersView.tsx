"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { APP_TEXT } from "@/constants/text";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import Toast from "@/components/ui/Toast";
import AddCarrierForm from "@/components/forms/AddCarrierForm";
import { SearchIcon, PlusIcon, CarriersIcon, PencilIcon } from "@/components/icons";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/lib/useToast";
import type { Carrier } from "@/types";

const T = APP_TEXT.carriers;

type CarrierRow = {
  id: string;
  name: string;
  mc_number: string | null;
  dot_number: string | null;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  insurance_expiry: string | null;
  status: "active" | "inactive";
  created_at: string;
};

function toCarrier(row: CarrierRow): Carrier {
  return {
    id: row.id,
    name: row.name,
    mcNumber: row.mc_number ?? "",
    dotNumber: row.dot_number ?? "",
    contactPerson: row.contact_person ?? "",
    phone: row.phone ?? "",
    email: row.email ?? "",
    insuranceExpiry: row.insurance_expiry,
    status: row.status,
    createdAt: row.created_at,
  };
}

function CarriersView() {
  const searchParams = useSearchParams();
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [query, setQuery] = useState(() => searchParams.get("q") ?? "");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCarrier, setEditingCarrier] = useState<Carrier | null>(null);
  const { message, showToast } = useToast();

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("carriers")
        .select("id, name, mc_number, dot_number, contact_person, phone, email, insurance_expiry, status, created_at")
        .order("created_at", { ascending: false });
      setCarriers((data ?? []).map(toCarrier));
    }
    load();
  }, []);

  const filteredCarriers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return carriers;
    return carriers.filter(
      (c) => c.name.toLowerCase().includes(q) || c.mcNumber.toLowerCase().includes(q)
    );
  }, [carriers, query]);

  const activeCount = useMemo(() => carriers.filter((c) => c.status === "active").length, [carriers]);

  function handleSavedCarrier(carrier: Carrier) {
    setCarriers((prev) => {
      const exists = prev.some((c) => c.id === carrier.id);
      if (exists) return prev.map((c) => (c.id === carrier.id ? carrier : c));
      return [carrier, ...prev];
    });
    showToast(editingCarrier ? `${carrier.name} ${T.updatedToast}` : `${carrier.name} added`);
    setEditingCarrier(null);
  }

  return (
    <div>
      <PageHeader
        title={T.title}
        subtitle={T.subtitle}
        action={
          <button
            onClick={() => {
              setEditingCarrier(null);
              setShowAddForm(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white text-sm font-medium px-4 py-2.5 transition-all shadow-md shadow-blue-600/25 hover:shadow-lg hover:-translate-y-0.5"
          >
            <PlusIcon className="w-4 h-4" />
            {T.addCarrier}
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-4 mb-6 max-w-md">
        <StatCard label={T.statTotal} value={carriers.length} Icon={CarriersIcon} accent="blue" />
        <StatCard label={T.statActive} value={activeCount} Icon={CarriersIcon} accent="emerald" />
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
                <th className="font-medium px-5 py-3">{T.table.name}</th>
                <th className="font-medium px-5 py-3">{T.table.mcNumber}</th>
                <th className="font-medium px-5 py-3">{T.table.contactPerson}</th>
                <th className="font-medium px-5 py-3">{T.table.phone}</th>
                <th className="font-medium px-5 py-3">{T.table.insuranceExpiry}</th>
                <th className="font-medium px-5 py-3">{T.table.status}</th>
                <th className="font-medium px-5 py-3 text-right">{T.table.actions}</th>
              </tr>
            </thead>
            <tbody>
              {filteredCarriers.map((carrier) => (
                <tr
                  key={carrier.id}
                  className="border-t border-blue-600/5 dark:border-blue-400/5 hover:bg-blue-50/60 transition-colors"
                >
                  <td className="px-5 py-3.5 font-medium">{carrier.name}</td>
                  <td className="px-5 py-3.5 opacity-70 whitespace-nowrap">{carrier.mcNumber}</td>
                  <td className="px-5 py-3.5 opacity-80">{carrier.contactPerson}</td>
                  <td className="px-5 py-3.5 opacity-70 whitespace-nowrap">{carrier.phone}</td>
                  <td className="px-5 py-3.5 opacity-70 whitespace-nowrap">{carrier.insuranceExpiry ?? "—"}</td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        carrier.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {T.statuses[carrier.status]}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      onClick={() => {
                        setEditingCarrier(carrier);
                        setShowAddForm(true);
                      }}
                      title={T.edit}
                      className="inline-flex items-center justify-center w-7 h-7 rounded-lg opacity-60 hover:opacity-100 hover:bg-slate-100 transition-colors"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}

              {filteredCarriers.length === 0 && (
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

      {showAddForm && (
        <AddCarrierForm
          key={editingCarrier?.id ?? "new"}
          open
          carrier={editingCarrier}
          onClose={() => {
            setShowAddForm(false);
            setEditingCarrier(null);
          }}
          onSaved={handleSavedCarrier}
        />
      )}
      <Toast message={message} />
    </div>
  );
}

export default CarriersView;
