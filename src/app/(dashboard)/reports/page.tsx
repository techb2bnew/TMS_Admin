"use client";

import { APP_TEXT } from "@/constants/text";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import RevenueBarChart from "@/components/charts/RevenueBarChart";
import DriverLeaderboard from "@/components/charts/DriverLeaderboard";
import { BillingIcon, ReportsIcon, LoadsIcon, DriversIcon, DownloadIcon } from "@/components/icons";
import { mockWeeklyRevenue } from "@/lib/mock/revenue";
import { mockDrivers } from "@/lib/mock/drivers";
import { mockLoads } from "@/lib/mock/loads";
import { formatCurrency } from "@/lib/format";
import { downloadCsv } from "@/lib/exportCsv";

const T = APP_TEXT.reports;

export default function ReportsPage() {
  const totalRevenue = mockWeeklyRevenue.reduce((sum, d) => sum + d.value, 0);
  const deliveredLoads = mockLoads.filter((l) => l.status === "delivered");
  const cancelledLoads = mockLoads.filter((l) => l.status === "cancelled");
  const completedTotal = deliveredLoads.length + cancelledLoads.length;
  const onTimeRate = completedTotal > 0 ? Math.round((deliveredLoads.length / completedTotal) * 100) : 0;
  const avgRate = Math.round(mockLoads.reduce((sum, l) => sum + l.rate, 0) / mockLoads.length);
  const totalDeliveries = mockDrivers.reduce((sum, d) => sum + d.deliveries_count, 0);

  const topDrivers = [...mockDrivers]
    .sort((a, b) => b.deliveries_count - a.deliveries_count)
    .slice(0, 5)
    .map((d) => ({ name: d.full_name, value: d.deliveries_count }));

  function exportReport() {
    downloadCsv("report-summary.csv", [
      {
        metric: T.statTotalRevenue,
        value: formatCurrency(totalRevenue),
      },
      { metric: T.statOnTimeRate, value: `${onTimeRate}%` },
      { metric: T.statAvgRate, value: formatCurrency(avgRate) },
      { metric: T.statTotalDeliveries, value: totalDeliveries },
    ]);
    downloadCsv(
      "top-drivers.csv",
      topDrivers.map((d) => ({ driver: d.name, deliveries: d.value }))
    );
  }

  return (
    <div>
      <PageHeader
        title={T.title}
        subtitle={T.subtitle}
        action={
          <button
            onClick={exportReport}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-sm font-medium px-4 py-2.5 transition-colors shadow-sm"
          >
            <DownloadIcon className="w-4 h-4" />
            {T.exportReport}
          </button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label={T.statTotalRevenue} value={formatCurrency(totalRevenue)} Icon={BillingIcon} accent="emerald" />
        <StatCard label={T.statOnTimeRate} value={`${onTimeRate}%`} Icon={ReportsIcon} accent="blue" />
        <StatCard label={T.statAvgRate} value={formatCurrency(avgRate)} Icon={LoadsIcon} accent="amber" />
        <StatCard label={T.statTotalDeliveries} value={totalDeliveries} Icon={DriversIcon} accent="blue" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-5">
          <h2 className="text-sm font-medium mb-6">{T.revenueChartTitle}</h2>
          <RevenueBarChart data={mockWeeklyRevenue} />
        </div>

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-5">
          <h2 className="text-sm font-medium mb-6">{T.topDriversTitle}</h2>
          <DriverLeaderboard data={topDrivers} />
        </div>
      </div>
    </div>
  );
}
