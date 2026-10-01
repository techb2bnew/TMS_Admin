"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { APP_TEXT } from "@/constants/text";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import Toast from "@/components/ui/Toast";
import AddLocationForm from "@/components/forms/AddLocationForm";
import { SearchIcon, PlusIcon, LocationsIcon, PencilIcon } from "@/components/icons";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/lib/useToast";
import type { SavedLocation } from "@/types";

const T = APP_TEXT.locations;

type LocationRow = {
  id: string;
  name: string;
  address: string;
  city: string | null;
  state: string | null;
  lat: number;
  lng: number;
  type: SavedLocation["type"];
  created_at: string;
};

function toLocation(row: LocationRow): SavedLocation {
  return {
    id: row.id,
    name: row.name,
    address: row.address,
    city: row.city ?? "",
    state: row.state ?? "",
    lat: row.lat,
    lng: row.lng,
    type: row.type,
    createdAt: row.created_at,
  };
}

function LocationsView() {
  const searchParams = useSearchParams();
  const [locations, setLocations] = useState<SavedLocation[]>([]);
  const [query, setQuery] = useState(() => searchParams.get("q") ?? "");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingLocation, setEditingLocation] = useState<SavedLocation | null>(null);
  const { message, showToast } = useToast();

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("locations")
        .select("id, name, address, city, state, lat, lng, type, created_at")
        .order("created_at", { ascending: false });
      setLocations((data ?? []).map(toLocation));
    }
    load();
  }, []);

  const filteredLocations = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return locations;
    return locations.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.address.toLowerCase().includes(q) ||
        l.city.toLowerCase().includes(q)
    );
  }, [locations, query]);

  function handleSavedLocation(location: SavedLocation) {
    setLocations((prev) => {
      const exists = prev.some((l) => l.id === location.id);
      if (exists) return prev.map((l) => (l.id === location.id ? location : l));
      return [location, ...prev];
    });
    showToast(editingLocation ? `${location.name} ${T.updatedToast}` : `${location.name} added`);
    setEditingLocation(null);
  }

  return (
    <div>
      <PageHeader
        title={T.title}
        subtitle={T.subtitle}
        action={
          <button
            onClick={() => {
              setEditingLocation(null);
              setShowAddForm(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white text-sm font-medium px-4 py-2.5 transition-all shadow-md shadow-blue-600/25 hover:shadow-lg hover:-translate-y-0.5"
          >
            <PlusIcon className="w-4 h-4" />
            {T.addLocation}
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-4 mb-6 max-w-md">
        <StatCard label={T.statTotal} value={locations.length} Icon={LocationsIcon} accent="blue" />
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
                <th className="font-medium px-5 py-3">{T.table.address}</th>
                <th className="font-medium px-5 py-3">{T.table.city}</th>
                <th className="font-medium px-5 py-3">{T.table.type}</th>
                <th className="font-medium px-5 py-3 text-right">{T.table.actions}</th>
              </tr>
            </thead>
            <tbody>
              {filteredLocations.map((location) => (
                <tr
                  key={location.id}
                  className="border-t border-blue-600/5 dark:border-blue-400/5 hover:bg-blue-50/60 transition-colors"
                >
                  <td className="px-5 py-3.5 font-medium">{location.name}</td>
                  <td className="px-5 py-3.5 opacity-70">{location.address}</td>
                  <td className="px-5 py-3.5 opacity-70 whitespace-nowrap">{location.city}</td>
                  <td className="px-5 py-3.5 opacity-80">{T.types[location.type]}</td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      onClick={() => {
                        setEditingLocation(location);
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

              {filteredLocations.length === 0 && (
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
        <AddLocationForm
          key={editingLocation?.id ?? "new"}
          open
          location={editingLocation}
          onClose={() => {
            setShowAddForm(false);
            setEditingLocation(null);
          }}
          onSaved={handleSavedLocation}
        />
      )}
      <Toast message={message} />
    </div>
  );
}

export default LocationsView;
