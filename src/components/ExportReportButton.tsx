"use client";

import { APP_TEXT } from "@/constants/text";
import { DownloadIcon } from "@/components/icons";
import { downloadCsv } from "@/lib/exportCsv";
import { formatCurrency } from "@/lib/format";

const T = APP_TEXT.reports;

type ExportReportButtonProps = {
  totalRevenue: number;
  onTimeRate: number;
  avgRate: number;
  totalDeliveries: number;
  netProfit: number;
  topDrivers: { name: string; value: number }[];
};

export default function ExportReportButton({
  totalRevenue,
  onTimeRate,
  avgRate,
  totalDeliveries,
  netProfit,
  topDrivers,
}: ExportReportButtonProps) {
  function exportReport() {
    downloadCsv("report-summary.csv", [
      { metric: T.statTotalRevenue, value: formatCurrency(totalRevenue) },
      { metric: T.statOnTimeRate, value: `${onTimeRate}%` },
      { metric: T.statAvgRate, value: formatCurrency(avgRate) },
      { metric: T.statTotalDeliveries, value: totalDeliveries },
      { metric: T.statNetProfit, value: formatCurrency(netProfit) },
    ]);
    downloadCsv(
      "top-drivers.csv",
      topDrivers.map((d) => ({ driver: d.name, deliveries: d.value }))
    );
  }

  return (
    <button
      onClick={exportReport}
      className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-sm font-medium px-4 py-2.5 transition-colors shadow-sm"
    >
      <DownloadIcon className="w-4 h-4" />
      {T.exportReport}
    </button>
  );
}
