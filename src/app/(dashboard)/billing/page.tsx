"use client";

import { useState } from "react";
import { APP_TEXT } from "@/constants/text";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Toast from "@/components/ui/Toast";
import { SearchIcon, BillingIcon, ReportsIcon, DownloadIcon } from "@/components/icons";
import { mockInvoices as initialInvoices, mockSettlements as initialSettlements } from "@/lib/mock/invoices";
import { formatCurrency, formatDate } from "@/lib/format";
import { downloadCsv } from "@/lib/exportCsv";
import { useToast } from "@/lib/useToast";
import type { Invoice, InvoiceStatus, Settlement } from "@/types";

const T = APP_TEXT.billing;

const FILTERS: { key: InvoiceStatus | "all"; label: string }[] = [
  { key: "all", label: T.filters.all },
  { key: "paid", label: T.filters.paid },
  { key: "unpaid", label: T.filters.unpaid },
];

export default function BillingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [settlements, setSettlements] = useState<Settlement[]>(initialSettlements);
  const [filter, setFilter] = useState<InvoiceStatus | "all">("all");
  const [query, setQuery] = useState("");
  const [payInvoiceTarget, setPayInvoiceTarget] = useState<Invoice | null>(null);
  const [paySettlementTarget, setPaySettlementTarget] = useState<Settlement | null>(null);
  const { message, showToast } = useToast();

  const totalRevenue = invoices.filter((i) => i.status === "paid").reduce((sum, i) => sum + i.amount, 0);
  const pendingAmount = invoices.filter((i) => i.status === "unpaid").reduce((sum, i) => sum + i.amount, 0);
  const paidInvoicesCount = invoices.filter((i) => i.status === "paid").length;
  const pendingSettlementsCount = settlements.filter((s) => s.status === "unpaid").length;

  async function confirmPayInvoice() {
    if (!payInvoiceTarget) return;
    await new Promise((r) => setTimeout(r, 400));
    setInvoices((prev) =>
      prev.map((i) => (i.id === payInvoiceTarget.id ? { ...i, status: "paid" } : i))
    );
    showToast(`${payInvoiceTarget.id} marked as paid`);
    setPayInvoiceTarget(null);
  }

  async function confirmPaySettlement() {
    if (!paySettlementTarget) return;
    await new Promise((r) => setTimeout(r, 400));
    setSettlements((prev) =>
      prev.map((s) => (s.id === paySettlementTarget.id ? { ...s, status: "paid" } : s))
    );
    showToast(`${paySettlementTarget.id} marked as paid`);
    setPaySettlementTarget(null);
  }

  function exportInvoices() {
    downloadCsv(
      "invoices.csv",
      filteredInvoices.map((i) => ({
        invoice: i.id,
        load: i.load_id,
        customer: i.customer_name,
        amount: i.amount,
        status: i.status,
        date: formatDate(i.created_at),
      }))
    );
  }

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesFilter = filter === "all" || invoice.status === filter;
    const q = query.trim().toLowerCase();
    const matchesQuery =
      !q ||
      invoice.id.toLowerCase().includes(q) ||
      invoice.load_id.toLowerCase().includes(q) ||
      invoice.customer_name.toLowerCase().includes(q);
    return matchesFilter && matchesQuery;
  });

  return (
    <div>
      <PageHeader
        title={T.title}
        subtitle={T.subtitle}
        action={
          <button
            onClick={exportInvoices}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-sm font-medium px-4 py-2.5 transition-colors shadow-sm"
          >
            <DownloadIcon className="w-4 h-4" />
            {T.exportInvoices}
          </button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label={T.statTotalRevenue} value={formatCurrency(totalRevenue)} Icon={BillingIcon} accent="emerald" />
        <StatCard label={T.statPending} value={formatCurrency(pendingAmount)} Icon={BillingIcon} accent="amber" />
        <StatCard label={T.statPaidInvoices} value={paidInvoicesCount} Icon={ReportsIcon} accent="blue" />
        <StatCard label={T.statPendingSettlements} value={pendingSettlementsCount} Icon={ReportsIcon} accent="red" />
      </div>

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium opacity-70">{T.invoicesTitle}</h2>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={T.searchPlaceholder}
            className="w-full rounded-lg border border-blue-600/10 dark:border-blue-400/10 bg-transparent pl-9 pr-3 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-colors"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                filter === f.key
                  ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-sm shadow-blue-600/25"
                  : "bg-slate-100 hover:bg-slate-200 opacity-70 hover:opacity-100"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden mb-8">
        <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs opacity-50 text-left bg-slate-50">
              <th className="font-medium px-5 py-3">{T.table.invoiceId}</th>
              <th className="font-medium px-5 py-3">{T.table.loadId}</th>
              <th className="font-medium px-5 py-3">{T.table.customer}</th>
              <th className="font-medium px-5 py-3">{T.table.amount}</th>
              <th className="font-medium px-5 py-3">{T.table.status}</th>
              <th className="font-medium px-5 py-3">{T.table.date}</th>
              <th className="font-medium px-5 py-3 text-right">{T.table.action}</th>
            </tr>
          </thead>
          <tbody>
            {filteredInvoices.map((invoice) => (
              <tr
                key={invoice.id}
                className="border-t border-blue-600/5 dark:border-blue-400/5 hover:bg-blue-50/60 transition-colors"
              >
                <td className="px-5 py-3.5 font-medium">{invoice.id}</td>
                <td className="px-5 py-3.5 opacity-70">{invoice.load_id}</td>
                <td className="px-5 py-3.5 opacity-80">{invoice.customer_name}</td>
                <td className="px-5 py-3.5 opacity-80">{formatCurrency(invoice.amount)}</td>
                <td className="px-5 py-3.5">
                  <StatusBadge status={invoice.status} />
                </td>
                <td className="px-5 py-3.5 opacity-50 whitespace-nowrap">{formatDate(invoice.created_at)}</td>
                <td className="px-5 py-3.5 text-right">
                  {invoice.status === "unpaid" && (
                    <button
                      onClick={() => setPayInvoiceTarget(invoice)}
                      className="rounded-lg bg-blue-50 hover:bg-blue-100 px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      {T.markPaid}
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {filteredInvoices.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-sm opacity-50">
                  {T.emptyState}
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>

      <h2 className="text-sm font-medium opacity-70 mb-3">{T.settlementsTitle}</h2>
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs opacity-50 text-left bg-slate-50">
              <th className="font-medium px-5 py-3">{T.table.loadId}</th>
              <th className="font-medium px-5 py-3">{T.table.driver}</th>
              <th className="font-medium px-5 py-3">{T.table.amount}</th>
              <th className="font-medium px-5 py-3">{T.table.status}</th>
              <th className="font-medium px-5 py-3">{T.table.date}</th>
              <th className="font-medium px-5 py-3 text-right">{T.table.action}</th>
            </tr>
          </thead>
          <tbody>
            {settlements.map((s) => (
              <tr
                key={s.id}
                className="border-t border-blue-600/5 dark:border-blue-400/5 hover:bg-blue-50/60 transition-colors"
              >
                <td className="px-5 py-3.5 opacity-70">{s.load_id}</td>
                <td className="px-5 py-3.5 opacity-80">{s.driver_name}</td>
                <td className="px-5 py-3.5 opacity-80">{formatCurrency(s.amount)}</td>
                <td className="px-5 py-3.5">
                  <StatusBadge status={s.status} />
                </td>
                <td className="px-5 py-3.5 opacity-50 whitespace-nowrap">{formatDate(s.created_at)}</td>
                <td className="px-5 py-3.5 text-right">
                  {s.status === "unpaid" && (
                    <button
                      onClick={() => setPaySettlementTarget(s)}
                      className="rounded-lg bg-blue-50 hover:bg-blue-100 px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      {T.markPaid}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(payInvoiceTarget)}
        onClose={() => setPayInvoiceTarget(null)}
        onConfirm={confirmPayInvoice}
        title={T.markPaidConfirmTitle}
        confirmLabel={T.markPaid}
        message={
          payInvoiceTarget ? (
            <>
              Mark invoice{" "}
              <span className="font-medium text-black dark:text-white">{payInvoiceTarget.id}</span> for{" "}
              {payInvoiceTarget.customer_name} ({formatCurrency(payInvoiceTarget.amount)}) as paid?
            </>
          ) : (
            ""
          )
        }
      />
      <ConfirmDialog
        open={Boolean(paySettlementTarget)}
        onClose={() => setPaySettlementTarget(null)}
        onConfirm={confirmPaySettlement}
        title={T.markPaidConfirmTitle}
        confirmLabel={T.markPaid}
        message={
          paySettlementTarget ? (
            <>
              Mark settlement{" "}
              <span className="font-medium text-black dark:text-white">{paySettlementTarget.id}</span> for{" "}
              {paySettlementTarget.driver_name} ({formatCurrency(paySettlementTarget.amount)}) as paid?
            </>
          ) : (
            ""
          )
        }
      />
      <Toast message={message} />
    </div>
  );
}
