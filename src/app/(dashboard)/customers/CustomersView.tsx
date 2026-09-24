"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { APP_TEXT } from "@/constants/text";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import Toast from "@/components/ui/Toast";
import AddCustomerForm from "@/components/forms/AddCustomerForm";
import { SearchIcon, PlusIcon, CustomersIcon, BillingIcon } from "@/components/icons";
import { mockCustomers } from "@/lib/mock/customers";
import { useToast } from "@/lib/useToast";
import type { Customer } from "@/types";

const T = APP_TEXT.customers;

function CustomersView() {
  const searchParams = useSearchParams();
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers);
  const [query, setQuery] = useState(() => searchParams.get("q") ?? "");
  const [showAddForm, setShowAddForm] = useState(false);
  const { message, showToast } = useToast();

  const filteredCustomers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((customer) => customer.name.toLowerCase().includes(q));
  }, [customers, query]);

  const net30Count = useMemo(
    () => customers.filter((c) => c.paymentTerms === "Net 30").length,
    [customers]
  );

  function handleAddCustomer(customer: Customer) {
    setCustomers((prev) => [customer, ...prev]);
    showToast(`${customer.name} added`);
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
            {T.addCustomer}
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-4 mb-6 max-w-md">
        <StatCard label={T.statTotal} value={customers.length} Icon={CustomersIcon} accent="blue" />
        <StatCard label={T.statNet30} value={net30Count} Icon={BillingIcon} accent="emerald" />
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
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs opacity-50 text-left bg-slate-50">
                <th className="font-medium px-5 py-3">{T.table.name}</th>
                <th className="font-medium px-5 py-3">{T.table.contactPerson}</th>
                <th className="font-medium px-5 py-3">{T.table.phone}</th>
                <th className="font-medium px-5 py-3">{T.table.email}</th>
                <th className="font-medium px-5 py-3">{T.table.paymentTerms}</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((customer) => (
                <tr
                  key={customer.id}
                  className="border-t border-blue-600/5 dark:border-blue-400/5 hover:bg-blue-50/60 transition-colors"
                >
                  <td className="px-5 py-3.5 font-medium">{customer.name}</td>
                  <td className="px-5 py-3.5 opacity-80">{customer.contactPerson}</td>
                  <td className="px-5 py-3.5 opacity-70 whitespace-nowrap">{customer.phone}</td>
                  <td className="px-5 py-3.5 opacity-70">{customer.email}</td>
                  <td className="px-5 py-3.5 opacity-70 whitespace-nowrap">{customer.paymentTerms}</td>
                </tr>
              ))}

              {filteredCustomers.length === 0 && (
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

      <AddCustomerForm open={showAddForm} onClose={() => setShowAddForm(false)} onAdd={handleAddCustomer} />
      <Toast message={message} />
    </div>
  );
}

export default CustomersView;
