"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { APP_TEXT } from "@/constants/text";
import { SearchIcon, LoadsIcon, DriversIcon, FleetIcon } from "@/components/icons";
import StatusBadge from "@/components/ui/StatusBadge";
import { createClient } from "@/lib/supabase/client";
import type { LoadStatus, DriverStatus, TruckStatus } from "@/types";

const T = APP_TEXT.search;
const MAX_PER_SECTION = 4;

type LoadResult = {
  id: string;
  load_number: string;
  customer_name: string;
  pickup_location: string;
  drop_location: string;
  status: LoadStatus;
};
type DriverResult = { id: string; full_name: string; phone: string; status: DriverStatus };
type TruckResult = { id: string; truck_number: string; status: TruckStatus };

const EMPTY_RESULTS = { loads: [] as LoadResult[], drivers: [] as DriverResult[], trucks: [] as TruckResult[] };

export default function GlobalSearch() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState(EMPTY_RESULTS);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      // Nothing to reset: the dropdown is hidden whenever the query is
      // empty, so stale results here are simply never rendered.
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      const supabase = createClient();
      const like = `%${q}%`;

      const [loadsRes, driversRes, trucksRes] = await Promise.all([
        supabase
          .from("loads")
          .select("id, load_number, customer_name, pickup_location, drop_location, status")
          .or(
            `load_number.ilike.${like},customer_name.ilike.${like},pickup_location.ilike.${like},drop_location.ilike.${like}`
          )
          .limit(MAX_PER_SECTION),
        supabase
          .from("profiles")
          .select("id, full_name, phone, drivers(status)")
          .eq("role", "driver")
          .or(`full_name.ilike.${like},phone.ilike.${like}`)
          .limit(MAX_PER_SECTION),
        supabase.from("trucks").select("id, truck_number, status").ilike("truck_number", like).limit(MAX_PER_SECTION),
      ]);

      if (cancelled) return;

      setResults({
        loads: (loadsRes.data ?? []) as LoadResult[],
        drivers: ((driversRes.data ?? []) as unknown as { id: string; full_name: string; phone: string; drivers: { status: DriverStatus } | null }[]).map(
          (d) => ({ id: d.id, full_name: d.full_name, phone: d.phone, status: d.drivers?.status ?? "active" })
        ),
        trucks: (trucksRes.data ?? []) as TruckResult[],
      });
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
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
                  onClick={() => goTo(`/loads?q=${encodeURIComponent(load.load_number)}`)}
                  className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-blue-50 transition-colors"
                >
                  <LoadsIcon className="w-4 h-4 opacity-50 shrink-0" />
                  <span className="flex-1 min-w-0">
                    <span className="text-sm font-medium">{load.load_number}</span>
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
