"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { APP_TEXT } from "@/constants/text";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import Toast from "@/components/ui/Toast";
import AddTrailerForm from "@/components/forms/AddTrailerForm";
import { SearchIcon, PlusIcon, TrailersIcon, PencilIcon } from "@/components/icons";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/lib/useToast";
import type { Trailer } from "@/types";

const T = APP_TEXT.trailers;

type TrailerRow = {
  id: string;
  trailer_number: string;
  type: Trailer["type"];
  capacity_kg: number | null;
  status: Trailer["status"];
  created_at: string;
};

function toTrailer(row: TrailerRow): Trailer {
  return {
    id: row.id,
    trailerNumber: row.trailer_number,
    type: row.type,
    capacityKg: row.capacity_kg,
    status: row.status,
    createdAt: row.created_at,
  };
}

function TrailersView() {
  const searchParams = useSearchParams();
  const [trailers, setTrailers] = useState<Trailer[]>([]);
  const [query, setQuery] = useState(() => searchParams.get("q") ?? "");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTrailer, setEditingTrailer] = useState<Trailer | null>(null);
  const { message, showToast } = useToast();

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("trailers")
        .select("id, trailer_number, type, capacity_kg, status, created_at")
        .order("created_at", { ascending: false });
      setTrailers((data ?? []).map(toTrailer));
    }
    load();
  }, []);

  const filteredTrailers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return trailers;
    return trailers.filter((t) => t.trailerNumber.toLowerCase().includes(q));
  }, [trailers, query]);

  const availableCount = useMemo(() => trailers.filter((t) => t.status === "available").length, [trailers]);

  function handleSavedTrailer(trailer: Trailer) {
    setTrailers((prev) => {
      const exists = prev.some((t) => t.id === trailer.id);
      if (exists) return prev.map((t) => (t.id === trailer.id ? trailer : t));
      return [trailer, ...prev];
    });
    showToast(editingTrailer ? `${trailer.trailerNumber} ${T.updatedToast}` : `${trailer.trailerNumber} added`);
    setEditingTrailer(null);
  }

  return (
    <div>
      <PageHeader
        title={T.title}
        subtitle={T.subtitle}
        action={
          <button
            onClick={() => {
              setEditingTrailer(null);
              setShowAddForm(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white text-sm font-medium px-4 py-2.5 transition-all shadow-md shadow-blue-600/25 hover:shadow-lg hover:-translate-y-0.5"
          >
            <PlusIcon className="w-4 h-4" />
            {T.addTrailer}
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-4 mb-6 max-w-md">
        <StatCard label={T.statTotal} value={trailers.length} Icon={TrailersIcon} accent="blue" />
        <StatCard label={T.statAvailable} value={availableCount} Icon={TrailersIcon} accent="emerald" />
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
                <th className="font-medium px-5 py-3">{T.table.trailerNumber}</th>
                <th className="font-medium px-5 py-3">{T.table.type}</th>
                <th className="font-medium px-5 py-3">{T.table.capacity}</th>
                <th className="font-medium px-5 py-3">{T.table.status}</th>
                <th className="font-medium px-5 py-3 text-right">{T.table.actions}</th>
              </tr>
            </thead>
            <tbody>
              {filteredTrailers.map((trailer) => (
                <tr
                  key={trailer.id}
                  className="border-t border-blue-600/5 dark:border-blue-400/5 hover:bg-blue-50/60 transition-colors"
                >
                  <td className="px-5 py-3.5 font-medium">{trailer.trailerNumber}</td>
                  <td className="px-5 py-3.5 opacity-80">{T.types[trailer.type]}</td>
                  <td className="px-5 py-3.5 opacity-70 whitespace-nowrap">
                    {trailer.capacityKg ? `${trailer.capacityKg.toLocaleString("en-IN")} kg` : "—"}
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        trailer.status === "available"
                          ? "bg-emerald-50 text-emerald-700"
                          : trailer.status === "in_use"
                            ? "bg-blue-50 text-blue-700"
                            : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {T.statuses[trailer.status]}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      onClick={() => {
                        setEditingTrailer(trailer);
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

              {filteredTrailers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-sm opacity-50">
                    {T.emptyState}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAddForm && (
        <AddTrailerForm
          key={editingTrailer?.id ?? "new"}
          open
          trailer={editingTrailer}
          onClose={() => {
            setShowAddForm(false);
            setEditingTrailer(null);
          }}
          onSaved={handleSavedTrailer}
        />
      )}
      <Toast message={message} />
    </div>
  );
}

export default TrailersView;
