import { APP_TEXT } from "@/constants/text";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import RevenueBarChart from "@/components/charts/RevenueBarChart";
import DriverLeaderboard from "@/components/charts/DriverLeaderboard";
import ExportReportButton from "@/components/ExportReportButton";
import { BillingIcon, ReportsIcon, LoadsIcon, DriversIcon, ExpensesIcon } from "@/components/icons";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/format";
import type { LoadStatus } from "@/types";

const T = APP_TEXT.reports;

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type LoadRow = { status: LoadStatus; rate: number; assigned_driver_id: string | null; drivers: { profiles: { full_name: string } | null } | null };
type InvoiceRow = { amount: number; status: "paid" | "unpaid"; created_at: string };

export default async function ReportsPage() {
  const supabase = await createClient();

  const [{ data: loadsData }, { data: invoicesData }, { data: expensesData }] = await Promise.all([
    supabase.from("loads").select("status, rate, assigned_driver_id, drivers(profiles(full_name))"),
    supabase.from("invoices").select("amount, status, created_at"),
    supabase.from("expenses").select("amount"),
  ]);

  const loads = (loadsData ?? []) as unknown as LoadRow[];
  const invoices = (invoicesData ?? []) as InvoiceRow[];
  const expenses = expensesData ?? [];

  const totalRevenue = invoices.filter((i) => i.status === "paid").reduce((sum, i) => sum + i.amount, 0);
  const deliveredLoads = loads.filter((l) => l.status === "delivered");
  const cancelledLoads = loads.filter((l) => l.status === "cancelled");
  const completedTotal = deliveredLoads.length + cancelledLoads.length;
  const onTimeRate = completedTotal > 0 ? Math.round((deliveredLoads.length / completedTotal) * 100) : 0;
  const avgRate = loads.length > 0 ? Math.round(loads.reduce((sum, l) => sum + l.rate, 0) / loads.length) : 0;
  const totalDeliveries = deliveredLoads.length;
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = totalRevenue - totalExpenses;

  const deliveriesByDriver = new Map<string, number>();
  for (const l of deliveredLoads) {
    const name = l.drivers?.profiles?.full_name;
    if (!name) continue;
    deliveriesByDriver.set(name, (deliveriesByDriver.get(name) ?? 0) + 1);
  }
  const topDrivers = [...deliveriesByDriver.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, value]) => ({ name, value }));

  // Revenue per day for the last 7 days, from invoices created in that window.
  const weeklyRevenue = Array.from({ length: 7 }).map((_, i) => {
    const day = new Date();
    day.setDate(day.getDate() - (6 - i));
    const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate());
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const value = invoices
      .filter((inv) => {
        const created = new Date(inv.created_at);
        return created >= dayStart && created < dayEnd;
      })
      .reduce((sum, inv) => sum + inv.amount, 0);

    return { label: DAY_LABELS[dayStart.getDay()], value };
  });

  return (
    <div>
      <PageHeader
        title={T.title}
        subtitle={T.subtitle}
        action={
          <ExportReportButton
            totalRevenue={totalRevenue}
            onTimeRate={onTimeRate}
            avgRate={avgRate}
            totalDeliveries={totalDeliveries}
            netProfit={netProfit}
            topDrivers={topDrivers}
          />
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <StatCard label={T.statTotalRevenue} value={formatCurrency(totalRevenue)} Icon={BillingIcon} accent="emerald" />
        <StatCard label={T.statOnTimeRate} value={`${onTimeRate}%`} Icon={ReportsIcon} accent="blue" />
        <StatCard label={T.statAvgRate} value={formatCurrency(avgRate)} Icon={LoadsIcon} accent="amber" />
        <StatCard label={T.statTotalDeliveries} value={totalDeliveries} Icon={DriversIcon} accent="blue" />
        <StatCard
          label={T.statNetProfit}
          value={formatCurrency(netProfit)}
          Icon={ExpensesIcon}
          accent={netProfit >= 0 ? "emerald" : "red"}
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-5">
          <h2 className="text-sm font-medium mb-6">{T.revenueChartTitle}</h2>
          <RevenueBarChart data={weeklyRevenue} />
        </div>

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-5">
          <h2 className="text-sm font-medium mb-6">{T.topDriversTitle}</h2>
          <DriverLeaderboard data={topDrivers} />
        </div>
      </div>
    </div>
  );
}
