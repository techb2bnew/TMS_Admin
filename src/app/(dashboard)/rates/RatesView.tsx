"use client";

import { useEffect, useState, type FormEvent } from "react";
import { APP_TEXT } from "@/constants/text";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import Toast from "@/components/ui/Toast";
import { RatesIcon } from "@/components/icons";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/lib/useToast";
import { geocodeAddress } from "@/lib/geocode";
import { estimateRoadMiles } from "@/lib/distance";

const T = APP_TEXT.rates;

type Tab = "instarate" | "rateview";

function median(values: number[]) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

export default function RatesView() {
  const [tab, setTab] = useState<Tab>("instarate");
  const [pickup, setPickup] = useState("");
  const [drop, setDrop] = useState("");
  const [calculating, setCalculating] = useState(false);
  const [calcError, setCalcError] = useState("");
  const [miles, setMiles] = useState<number | null>(null);

  const [lineHaulRate, setLineHaulRate] = useState(1.98);
  const [fuelSurchargeRate, setFuelSurchargeRate] = useState(0.5);
  const [additionalStopRate, setAdditionalStopRate] = useState(75);
  const [extraStops, setExtraStops] = useState(0);
  const [savingDefaults, setSavingDefaults] = useState(false);

  const [laneRates, setLaneRates] = useState<number[] | null>(null);
  const [laneLoading, setLaneLoading] = useState(false);

  const { message, showToast } = useToast();

  useEffect(() => {
    async function loadSettings() {
      const supabase = createClient();
      const { data } = await supabase
        .from("rate_settings")
        .select("line_haul_rate, fuel_surcharge_rate, additional_stop_rate")
        .eq("id", "00000000-0000-0000-0000-000000000001")
        .single();
      if (data) {
        setLineHaulRate(data.line_haul_rate);
        setFuelSurchargeRate(data.fuel_surcharge_rate);
        setAdditionalStopRate(data.additional_stop_rate);
      }
    }
    loadSettings();
  }, []);

  async function handleGetRates(e: FormEvent) {
    e.preventDefault();
    if (!pickup.trim() || !drop.trim()) return;

    setCalculating(true);
    setCalcError("");
    setMiles(null);
    setLaneRates(null);

    const [pickupGeo, dropGeo] = await Promise.all([geocodeAddress(pickup), geocodeAddress(drop)]);
    setCalculating(false);

    if (!pickupGeo || !dropGeo) {
      setCalcError("Could not locate one of these addresses. Try a more specific city, state.");
      return;
    }

    setMiles(estimateRoadMiles(pickupGeo, dropGeo));

    setLaneLoading(true);
    const supabase = createClient();
    const pickupCity = pickup.split(",")[0].trim();
    const dropCity = drop.split(",")[0].trim();
    const { data } = await supabase
      .from("loads")
      .select("rate")
      .ilike("pickup_location", `%${pickupCity}%`)
      .ilike("drop_location", `%${dropCity}%`)
      .not("status", "eq", "cancelled");
    setLaneLoading(false);
    setLaneRates((data ?? []).map((r) => r.rate).filter((r): r is number => typeof r === "number"));
  }

  async function handleSaveDefaults() {
    setSavingDefaults(true);
    const supabase = createClient();
    const { data: authData } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("rate_settings")
      .update({
        line_haul_rate: lineHaulRate,
        fuel_surcharge_rate: fuelSurchargeRate,
        additional_stop_rate: additionalStopRate,
        updated_by: authData.user?.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", "00000000-0000-0000-0000-000000000001");
    setSavingDefaults(false);
    if (error) {
      showToast(error.message);
      return;
    }
    showToast(T.savedToast);
  }

  const lineHaulTotal = miles ? Math.round(lineHaulRate * miles * 100) / 100 : 0;
  const fuelTotal = miles ? Math.round(fuelSurchargeRate * miles * 100) / 100 : 0;
  const stopsTotal = Math.round(additionalStopRate * extraStops * 100) / 100;
  const grandTotal = lineHaulTotal + fuelTotal + stopsTotal;

  const laneLow = laneRates && laneRates.length > 0 ? Math.min(...laneRates) : null;
  const laneHigh = laneRates && laneRates.length > 0 ? Math.max(...laneRates) : null;
  const laneMedian = laneRates && laneRates.length > 0 ? median(laneRates) : null;

  return (
    <div>
      <PageHeader title={T.title} subtitle={T.subtitle} />

      <form onSubmit={handleGetRates} className="rounded-xl border border-slate-200 bg-white shadow-sm p-5 mb-6">
        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">{T.pickupLabel}</label>
            <input
              value={pickup}
              onChange={(e) => setPickup(e.target.value)}
              placeholder={T.pickupPlaceholder}
              className="w-full rounded-lg border border-blue-600/10 dark:border-blue-400/10 px-3.5 py-2.5 text-sm bg-transparent outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">{T.dropLabel}</label>
            <input
              value={drop}
              onChange={(e) => setDrop(e.target.value)}
              placeholder={T.dropPlaceholder}
              className="w-full rounded-lg border border-blue-600/10 dark:border-blue-400/10 px-3.5 py-2.5 text-sm bg-transparent outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-colors"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={calculating || !pickup.trim() || !drop.trim()}
          className="rounded-lg px-4 py-2.5 text-sm font-medium bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 disabled:opacity-60 text-white transition-all shadow-md shadow-blue-600/20"
        >
          {calculating ? T.calculating : T.getRates}
        </button>
        {calcError && <p className="mt-2 text-xs text-red-500">{calcError}</p>}
      </form>

      {miles !== null && (
        <>
          <div className="flex gap-1 mb-4 border-b border-slate-200">
            <button
              onClick={() => setTab("instarate")}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === "instarate" ? "border-blue-600 text-blue-700" : "border-transparent opacity-60 hover:opacity-100"
              }`}
            >
              {T.instaRateTab}
            </button>
            <button
              onClick={() => setTab("rateview")}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === "rateview" ? "border-blue-600 text-blue-700" : "border-transparent opacity-60 hover:opacity-100"
              }`}
            >
              {T.rateViewTab}
            </button>
          </div>

          {tab === "instarate" && (
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-5">
              <h2 className="text-sm font-semibold mb-1">{T.calculatorTitle}</h2>
              <p className="text-xs opacity-60 mb-4">{T.calculatorSubtitle}</p>

              <div className="grid sm:grid-cols-3 gap-4 mb-5">
                <div>
                  <label className="block text-sm font-medium mb-1.5">{T.lineHaulRate}</label>
                  <input
                    type="number"
                    step="0.01"
                    value={lineHaulRate}
                    onChange={(e) => setLineHaulRate(Number(e.target.value))}
                    className="w-full rounded-lg border border-blue-600/10 dark:border-blue-400/10 px-3.5 py-2.5 text-sm bg-transparent outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">{T.fuelSurchargeRate}</label>
                  <input
                    type="number"
                    step="0.01"
                    value={fuelSurchargeRate}
                    onChange={(e) => setFuelSurchargeRate(Number(e.target.value))}
                    className="w-full rounded-lg border border-blue-600/10 dark:border-blue-400/10 px-3.5 py-2.5 text-sm bg-transparent outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">{T.additionalStopRate}</label>
                  <input
                    type="number"
                    step="0.01"
                    value={additionalStopRate}
                    onChange={(e) => setAdditionalStopRate(Number(e.target.value))}
                    className="w-full rounded-lg border border-blue-600/10 dark:border-blue-400/10 px-3.5 py-2.5 text-sm bg-transparent outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-colors"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 mb-5">
                <button
                  onClick={handleSaveDefaults}
                  disabled={savingDefaults}
                  className="rounded-lg px-4 py-2 text-sm font-medium bg-slate-100 hover:bg-slate-200 disabled:opacity-60 transition-colors"
                >
                  {T.saveDefaults}
                </button>
                <span className="text-xs opacity-50">
                  {miles} {T.miles}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs opacity-50 text-left bg-slate-50">
                      <th className="font-medium px-4 py-2.5">{T.table.charge}</th>
                      <th className="font-medium px-4 py-2.5">{T.table.rate}</th>
                      <th className="font-medium px-4 py-2.5">{T.table.qty}</th>
                      <th className="font-medium px-4 py-2.5">{T.table.total}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-slate-100">
                      <td className="px-4 py-2.5">{T.lineHaul}</td>
                      <td className="px-4 py-2.5">${lineHaulRate.toFixed(2)}</td>
                      <td className="px-4 py-2.5">
                        {miles} {T.miles}
                      </td>
                      <td className="px-4 py-2.5 font-medium">${lineHaulTotal.toFixed(2)}</td>
                    </tr>
                    <tr className="border-t border-slate-100">
                      <td className="px-4 py-2.5">{T.fuelSurcharge}</td>
                      <td className="px-4 py-2.5">${fuelSurchargeRate.toFixed(2)}</td>
                      <td className="px-4 py-2.5">
                        {miles} {T.miles}
                      </td>
                      <td className="px-4 py-2.5 font-medium">${fuelTotal.toFixed(2)}</td>
                    </tr>
                    <tr className="border-t border-slate-100">
                      <td className="px-4 py-2.5">{T.additionalStops}</td>
                      <td className="px-4 py-2.5">${additionalStopRate.toFixed(2)}</td>
                      <td className="px-4 py-2.5">
                        <input
                          type="number"
                          min={0}
                          value={extraStops}
                          onChange={(e) => setExtraStops(Math.max(0, Number(e.target.value)))}
                          className="w-16 rounded-md border border-blue-600/10 dark:border-blue-400/10 px-2 py-1 text-sm bg-transparent outline-none focus:border-blue-600"
                        />
                      </td>
                      <td className="px-4 py-2.5 font-medium">${stopsTotal.toFixed(2)}</td>
                    </tr>
                    <tr className="border-t border-slate-200 bg-slate-50">
                      <td className="px-4 py-2.5 font-semibold" colSpan={3}>
                        {T.total}
                      </td>
                      <td className="px-4 py-2.5 font-semibold">${grandTotal.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === "rateview" && (
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-5">
              <h2 className="text-sm font-semibold mb-1">{T.rateViewTitle}</h2>
              <p className="text-xs opacity-60 mb-4">{T.rateViewSubtitle}</p>

              {laneLoading && <p className="text-sm opacity-50">{T.calculating}</p>}

              {!laneLoading && (!laneRates || laneRates.length === 0) && (
                <p className="text-sm opacity-50">{T.noHistory}</p>
              )}

              {!laneLoading && laneRates && laneRates.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <StatCard label={T.statLow} value={`$${laneLow?.toFixed(0)}`} Icon={RatesIcon} accent="emerald" />
                  <StatCard label={T.statMedian} value={`$${laneMedian?.toFixed(0)}`} Icon={RatesIcon} accent="blue" />
                  <StatCard label={T.statHigh} value={`$${laneHigh?.toFixed(0)}`} Icon={RatesIcon} accent="amber" />
                  <StatCard label={T.statMoves} value={laneRates.length} Icon={RatesIcon} accent="blue" />
                </div>
              )}
            </div>
          )}
        </>
      )}

      {miles === null && !calculating && (
        <div className="rounded-xl border border-dashed border-slate-200 p-10 text-center text-sm opacity-50">
          {T.enterLane}
        </div>
      )}

      <Toast message={message} />
    </div>
  );
}
