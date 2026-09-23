import Link from "next/link";
import { APP_TEXT } from "@/constants/text";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";
import { LoadsIcon, DriversIcon, ReportsIcon, NotificationsIcon } from "@/components/icons";
import GoogleFleetMap from "@/components/GoogleFleetMap";
import { mockLoads } from "@/lib/mock/loads";
import { mockDrivers } from "@/lib/mock/drivers";
import { mockNotifications } from "@/lib/mock/notifications";
import { formatRelativeTime } from "@/lib/format";

const LEVEL_DOT: Record<string, string> = {
  info: "bg-blue-500",
  warning: "bg-amber-500",
  success: "bg-emerald-500",
  critical: "bg-red-500",
};

const T = APP_TEXT.dashboard;

const ACTIVE_LOAD_STATUSES = ["assigned", "picked_up", "in_transit"];

export default function DashboardPage() {
  const activeTrucks = mockDrivers.filter((d) => d.status === "active" && d.truck_number);
  const activeLoads = mockLoads.filter((l) => ACTIVE_LOAD_STATUSES.includes(l.status));
  const deliveredToday = mockLoads.filter((l) => l.status === "delivered").length;
  const delayed = 1; // mock — would come from ETA vs current time once live

  return (
    <div>
      <PageHeader title={T.title} subtitle={T.subtitle} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label={T.statActiveTrucks} value={activeTrucks.length} Icon={DriversIcon} accent="blue" />
        <StatCard label={T.statActiveLoads} value={activeLoads.length} Icon={LoadsIcon} accent="amber" />
        <StatCard label={T.statDeliveredToday} value={deliveredToday} Icon={ReportsIcon} accent="emerald" />
        <StatCard label={T.statDelayed} value={delayed} Icon={NotificationsIcon} accent="red" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          {/* Live map */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-blue-600/10 dark:border-blue-400/10">
              <span className="text-sm font-medium">{T.mapTitle}</span>
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                <span className="relative flex w-1.5 h-1.5">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 animate-ping opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                </span>
                {T.mapBadgeLive}
              </span>
            </div>

            <GoogleFleetMap drivers={activeTrucks} height="18rem" />
            <div className="px-5 py-2.5 text-xs opacity-50 border-t border-blue-600/10 dark:border-blue-400/10">
              {T.mapNote}
            </div>
          </div>

          {/* Recent loads */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-blue-600/10 dark:border-blue-400/10">
              <span className="text-sm font-medium">{T.recentLoadsTitle}</span>
              <Link
                href="/loads"
                className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
              >
                {T.viewAll}
              </Link>
            </div>
            <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs opacity-50 text-left">
                  <th className="font-medium px-5 py-2.5">{T.table.loadId}</th>
                  <th className="font-medium px-5 py-2.5">{T.table.customer}</th>
                  <th className="font-medium px-5 py-2.5">{T.table.route}</th>
                  <th className="font-medium px-5 py-2.5">{T.table.driver}</th>
                  <th className="font-medium px-5 py-2.5">{T.table.status}</th>
                </tr>
              </thead>
              <tbody>
                {mockLoads.slice(0, 5).map((load) => (
                  <tr
                    key={load.id}
                    className="border-t border-blue-600/5 dark:border-blue-400/5 hover:bg-blue-50/60"
                  >
                    <td className="px-5 py-3 font-medium">{load.id}</td>
                    <td className="px-5 py-3 opacity-80">{load.customer_name}</td>
                    <td className="px-5 py-3 opacity-70">
                      {load.pickup_location} → {load.drop_location}
                    </td>
                    <td className="px-5 py-3 opacity-70">{load.assigned_driver ?? "—"}</td>
                    <td className="px-5 py-3">
                      <StatusBadge status={load.status} />
                    </td>
                  </tr>
                ))}
              {mockLoads.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-sm opacity-50">
                    {T.noRecentLoads}
                  </td>
                </tr>
              )}
              </tbody>
            </table>
            </div>
          </div>
        </div>

        {/* Alerts */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden h-fit">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-blue-600/10 dark:border-blue-400/10">
            <span className="text-sm font-medium">{T.alertsTitle}</span>
            <Link
              href="/notifications"
              className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              {T.viewAll}
            </Link>
          </div>
          <ul className="divide-y divide-blue-600/5 dark:divide-blue-400/5">
            {mockNotifications.slice(0, 5).map((n) => (
              <li key={n.id} className="flex gap-3 px-5 py-3.5">
                <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${LEVEL_DOT[n.level]}`} />
                <div>
                  <p className="text-sm leading-snug">{n.message}</p>
                  <p className="text-xs opacity-45 mt-1">{formatRelativeTime(n.created_at)}</p>
                </div>
              </li>
            ))}
            {mockNotifications.length === 0 && (
              <li className="px-5 py-10 text-center text-sm opacity-50">{T.noAlerts}</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
