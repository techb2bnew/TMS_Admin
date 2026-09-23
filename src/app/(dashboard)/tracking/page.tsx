import { APP_TEXT } from "@/constants/text";
import PageHeader from "@/components/ui/PageHeader";
import StatusStepper from "@/components/ui/StatusStepper";
import GoogleFleetMap from "@/components/GoogleFleetMap";
import { mockLoads } from "@/lib/mock/loads";
import { mockDrivers } from "@/lib/mock/drivers";

const T = APP_TEXT.tracking;

const ACTIVE_LOAD_STATUSES = ["assigned", "picked_up", "in_transit"];

export default function TrackingPage() {
  const activeLoads = mockLoads.filter((l) => ACTIVE_LOAD_STATUSES.includes(l.status));
  const activeDrivers = mockDrivers.filter((d) => d.status === "active" && d.truck_number);

  return (
    <div>
      <PageHeader title={T.title} subtitle={T.subtitle} />

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-blue-600/10 dark:border-blue-400/10">
            <span className="text-sm font-medium">{T.mapTitle}</span>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <span className="relative flex w-1.5 h-1.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 animate-ping opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
              </span>
              Live
            </span>
          </div>
          <GoogleFleetMap drivers={activeDrivers} height="32rem" />
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-medium opacity-70">{T.activeLoadsTitle}</h2>

          {activeLoads.length === 0 && (
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm px-5 py-10 text-center text-sm opacity-50">
              {T.noActiveLoads}
            </div>
          )}

          {activeLoads.map((load) => (
            <div key={load.id} className="rounded-xl border border-slate-200 bg-white shadow-sm p-4">
              <div className="flex items-start justify-between mb-1">
                <span className="font-medium text-sm">{load.id}</span>
                <span className="text-xs opacity-50">{load.assigned_driver}</span>
              </div>
              <div className="text-xs opacity-60 mb-4">
                {load.pickup_location} → {load.drop_location}
              </div>
              <StatusStepper status={load.status} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
