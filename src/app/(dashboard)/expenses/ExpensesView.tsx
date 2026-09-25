"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { APP_TEXT } from "@/constants/text";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import Toast from "@/components/ui/Toast";
import AddExpenseForm from "@/components/forms/AddExpenseForm";
import { SearchIcon, PlusIcon, ExpensesIcon } from "@/components/icons";
import { createClient } from "@/lib/supabase/client";
import { formatDate, formatCurrency } from "@/lib/format";
import { useToast } from "@/lib/useToast";
import type { Expense, ExpenseCategory } from "@/types";

const T = APP_TEXT.expenses;

const FILTERS: { key: ExpenseCategory | "all"; label: string }[] = [
  { key: "all", label: T.filters.all },
  { key: "Fuel", label: T.filters.Fuel },
  { key: "Tolls", label: T.filters.Tolls },
  { key: "Maintenance", label: T.filters.Maintenance },
  { key: "Insurance", label: T.filters.Insurance },
  { key: "Other", label: T.filters.Other },
];

function ExpensesView() {
  const searchParams = useSearchParams();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filter, setFilter] = useState<ExpenseCategory | "all">("all");
  const [query, setQuery] = useState(() => searchParams.get("q") ?? "");
  const [showAddForm, setShowAddForm] = useState(false);
  const { message, showToast } = useToast();

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("expenses")
        .select("id, category, amount, date, notes, trucks(truck_number)")
        .order("date", { ascending: false });

      setExpenses(
        (data ?? []).map((e) => ({
          id: e.id,
          category: e.category as ExpenseCategory,
          amount: e.amount,
          truckNumber:
            (e as unknown as { trucks: { truck_number: string } | null }).trucks?.truck_number ?? "—",
          date: e.date,
          notes: e.notes ?? "",
        }))
      );
    }
    load();
  }, []);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      const matchesFilter = filter === "all" || expense.category === filter;
      const q = query.trim().toLowerCase();
      const matchesQuery =
        !q ||
        expense.truckNumber.toLowerCase().includes(q) ||
        expense.notes.toLowerCase().includes(q);
      return matchesFilter && matchesQuery;
    });
  }, [expenses, filter, query]);

  const totalExpenses = useMemo(() => expenses.reduce((sum, e) => sum + e.amount, 0), [expenses]);
  const totalByCategory = (category: ExpenseCategory) =>
    expenses.filter((e) => e.category === category).reduce((sum, e) => sum + e.amount, 0);

  function handleAddExpense(expense: Expense) {
    setExpenses((prev) => [expense, ...prev]);
    showToast(`${expense.category} expense added for ${expense.truckNumber}`);
  }

  return (
    <div>
      <PageHeader
        title={T.title}
        subtitle={T.subtitle}
        action={
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white text-sm font-medium px-4 py-2.5 transition-all shadow-md shadow-blue-600/25 hover:shadow-lg hover:-translate-y-0.5"
          >
            <PlusIcon className="w-4 h-4" />
            {T.addExpense}
          </button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label={T.statTotal} value={formatCurrency(totalExpenses)} Icon={ExpensesIcon} accent="red" />
        <StatCard label={T.statFuel} value={formatCurrency(totalByCategory("Fuel"))} Icon={ExpensesIcon} accent="amber" />
        <StatCard
          label={T.statMaintenance}
          value={formatCurrency(totalByCategory("Maintenance"))}
          Icon={ExpensesIcon}
          accent="blue"
        />
        <StatCard
          label={T.statInsurance}
          value={formatCurrency(totalByCategory("Insurance"))}
          Icon={ExpensesIcon}
          accent="emerald"
        />
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

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs opacity-50 text-left bg-slate-50">
                <th className="font-medium px-5 py-3">{T.table.date}</th>
                <th className="font-medium px-5 py-3">{T.table.category}</th>
                <th className="font-medium px-5 py-3">{T.table.truck}</th>
                <th className="font-medium px-5 py-3">{T.table.amount}</th>
                <th className="font-medium px-5 py-3">{T.table.notes}</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.map((expense) => (
                <tr
                  key={expense.id}
                  className="border-t border-blue-600/5 dark:border-blue-400/5 hover:bg-blue-50/60 transition-colors"
                >
                  <td className="px-5 py-3.5 opacity-70 whitespace-nowrap">{formatDate(expense.date)}</td>
                  <td className="px-5 py-3.5 font-medium">{expense.category}</td>
                  <td className="px-5 py-3.5 opacity-70 whitespace-nowrap">{expense.truckNumber}</td>
                  <td className="px-5 py-3.5 opacity-70">{formatCurrency(expense.amount)}</td>
                  <td className="px-5 py-3.5 opacity-70">{expense.notes || "—"}</td>
                </tr>
              ))}

              {filteredExpenses.length === 0 && (
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

      <AddExpenseForm open={showAddForm} onClose={() => setShowAddForm(false)} onAdd={handleAddExpense} />
      <Toast message={message} />
    </div>
  );
}

export default ExpensesView;
