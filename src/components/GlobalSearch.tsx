"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { APP_TEXT } from "@/constants/text";
import { SearchIcon, LoadsIcon, DriversIcon, FleetIcon } from "@/components/icons";
import StatusBadge from "@/components/ui/StatusBadge";
import { mockLoads } from "@/lib/mock/loads";
import { mockDrivers } from "@/lib/mock/drivers";
import { mockTrucks } from "@/lib/mock/trucks";

const T = APP_TEXT.search;
const MAX_PER_SECTION = 4;

export default function GlobalSearch() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return { loads: [], drivers: [], trucks: [] };

    return {
      loads: mockLoads
        .filter(
          (l) =>
            l.id.toLowerCase().includes(q) ||
            l.customer_name.toLowerCase().includes(q) ||
            l.pickup_location.toLowerCase().includes(q) ||
            l.drop_location.toLowerCase().includes(q)
        )
        .slice(0, MAX_PER_SECTION),
      drivers: mockDrivers
        .filter((d) => d.full_name.toLowerCase().includes(q) || d.phone.includes(q))
        .slice(0, MAX_PER_SECTION),
      trucks: mockTrucks
        .filter(
          (t) =>
            t.truck_number.toLowerCase().includes(q) ||
            (t.assigned_driver ?? "").toLowerCase().includes(q)
        )
        .slice(0, MAX_PER_SECTION),
    };
  }, [query]);

  const hasResults = results.loads.length + results.drivers.length + results.trucks.length > 0;
  const hasQuery = query.trim().length > 0;

  function goTo(path: string) {
    router.push(path);
    setOpen(false);
    setQuery("");
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40" />
      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
        placeholder={T.placeholder}
        className="w-full rounded-lg border border-blue-600/10 dark:border-blue-400/10 bg-slate-50 pl-9 pr-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-colors"
      />

      {open && hasQuery && (
        <div className="absolute z-20 mt-2 w-full rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden max-h-96 overflow-y-auto">
          {!hasResults && (
            <div className="px-4 py-8 text-center text-sm opacity-50">{T.noResults}</div>
          )}

          {results.loads.length > 0 && (
            <div className="py-1.5">
              <div className="px-4 py-1 text-[10px] font-semibold uppercase tracking-wider opacity-40">
                {T.sectionLoads}
              </div>
              {results.loads.map((load) => (
                <button
                  key={load.id}
                  onClick={() => goTo(`/loads?q=${encodeURIComponent(load.id)}`)}
                  className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-blue-50 transition-colors"
                >
                  <LoadsIcon className="w-4 h-4 opacity-50 shrink-0" />
                  <span className="flex-1 min-w-0">
                    <span className="text-sm font-medium">{load.id}</span>
                    <span className="text-xs opacity-50 ml-2">
                      {load.customer_name} · {load.pickup_location} → {load.drop_location}
                    </span>
                  </span>
                  <StatusBadge status={load.status} />
                </button>
              ))}
            </div>
          )}

          {results.drivers.length > 0 && (
            <div className="py-1.5 border-t border-blue-600/5 dark:border-blue-400/5">
              <div className="px-4 py-1 text-[10px] font-semibold uppercase tracking-wider opacity-40">
                {T.sectionDrivers}
              </div>
              {results.drivers.map((driver) => (
                <button
                  key={driver.id}
                  onClick={() => goTo(`/drivers?q=${encodeURIComponent(driver.full_name)}`)}
                  className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-blue-50 transition-colors"
                >
                  <DriversIcon className="w-4 h-4 opacity-50 shrink-0" />
                  <span className="flex-1 min-w-0">
                    <span className="text-sm font-medium">{driver.full_name}</span>
                    <span className="text-xs opacity-50 ml-2">{driver.phone}</span>
                  </span>
                  <StatusBadge status={driver.status} />
                </button>
              ))}
            </div>
          )}

          {results.trucks.length > 0 && (
            <div className="py-1.5 border-t border-blue-600/5 dark:border-blue-400/5">
              <div className="px-4 py-1 text-[10px] font-semibold uppercase tracking-wider opacity-40">
                {T.sectionTrucks}
              </div>
              {results.trucks.map((truck) => (
                <button
                  key={truck.id}
                  onClick={() => goTo(`/fleet?q=${encodeURIComponent(truck.truck_number)}`)}
                  className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-blue-50 transition-colors"
                >
                  <FleetIcon className="w-4 h-4 opacity-50 shrink-0" />
                  <span className="flex-1 min-w-0">
                    <span className="text-sm font-medium">{truck.truck_number}</span>
                    <span className="text-xs opacity-50 ml-2">
                      {truck.assigned_driver ?? "Unassigned"}
                    </span>
                  </span>
                  <StatusBadge status={truck.status} />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
