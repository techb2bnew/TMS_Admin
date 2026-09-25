"use client";

import { useEffect, useState, type FormEvent } from "react";
import Modal from "@/components/ui/Modal";
import { APP_TEXT } from "@/constants/text";
import { createClient } from "@/lib/supabase/client";
import type { Expense, ExpenseCategory } from "@/types";

const C = APP_TEXT.common;

const CATEGORIES: ExpenseCategory[] = ["Fuel", "Tolls", "Maintenance", "Insurance", "Other"];

type TruckOption = { id: string; truck_number: string };

type Errors = Partial<Record<"amount" | "truckNumber" | "date", string>>;

type AddExpenseFormProps = {
  open: boolean;
  onClose: () => void;
  onAdd: (expense: Expense) => void;
};

function inputClass(hasError: boolean) {
  return `w-full rounded-lg border px-3.5 py-2.5 text-sm bg-transparent outline-none transition-colors focus:ring-2 focus:ring-blue-600/20 ${
    hasError ? "border-red-500" : "border-blue-600/10 dark:border-blue-400/10 focus:border-blue-600"
  }`;
}

export default function AddExpenseForm({ open, onClose, onAdd }: AddExpenseFormProps) {
  const [trucks, setTrucks] = useState<TruckOption[]>([]);
  const [category, setCategory] = useState<ExpenseCategory>("Fuel");
  const [amount, setAmount] = useState("");
  const [truckId, setTruckId] = useState("");
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    async function load() {
      const supabase = createClient();
      const { data } = await supabase.from("trucks").select("id, truck_number");
      setTrucks(data ?? []);
    }
    load();
  }, [open]);

  function reset() {
    setCategory("Fuel");
    setAmount("");
    setTruckId("");
    setDate("");
    setNotes("");
    setErrors({});
    setFormError("");
  }

  function handleClose() {
    reset();
    onClose();
  }

  function validate() {
    const next: Errors = {};
    if (!amount.trim() || Number.isNaN(Number(amount)) || Number(amount) <= 0) next.amount = C.invalidNumber;
    if (!truckId.trim()) next.truckNumber = C.required;
    if (!date.trim()) next.date = C.required;
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError("");
    if (!validate()) return;

    setSubmitting(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from("expenses")
      .insert({
        category,
        amount: Number(amount),
        truck_id: truckId,
        date,
        notes: notes.trim(),
        status: "approved",
        created_by: user?.id ?? null,
      })
      .select("id, category, amount, date, notes, truck_id")
      .single();

    setSubmitting(false);

    if (error || !data) {
      setFormError(error?.message ?? "Could not add expense");
      return;
    }

    const truckNumber = trucks.find((t) => t.id === truckId)?.truck_number ?? "";

    const expense: Expense = {
      id: data.id,
      category: data.category,
      amount: data.amount,
      truckNumber,
      date: data.date,
      notes: data.notes ?? "",
    };

    onAdd(expense);
    reset();
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Add Expense"
      subtitle="Log a fleet expense"
      footer={
        <>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg px-4 py-2 text-sm font-medium bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            {C.cancel}
          </button>
          <button
            type="submit"
            form="add-expense-form"
            disabled={submitting}
            className="rounded-lg px-4 py-2 text-sm font-medium bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 disabled:opacity-60 text-white transition-all shadow-md shadow-blue-600/20"
          >
            {submitting ? C.saving : "Add Expense"}
          </button>
        </>
      }
    >
      <form id="add-expense-form" onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
            className={inputClass(false)}
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1.5">Amount (₹)</label>
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="5000"
              inputMode="numeric"
              className={inputClass(Boolean(errors.amount))}
            />
            {errors.amount && <p className="mt-1.5 text-xs text-red-500">{errors.amount}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={inputClass(Boolean(errors.date))}
            />
            {errors.date && <p className="mt-1.5 text-xs text-red-500">{errors.date}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Truck</label>
          <select
            value={truckId}
            onChange={(e) => setTruckId(e.target.value)}
            className={inputClass(Boolean(errors.truckNumber))}
          >
            <option value="">Select a truck</option>
            {trucks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.truck_number}
              </option>
            ))}
          </select>
          {errors.truckNumber && <p className="mt-1.5 text-xs text-red-500">{errors.truckNumber}</p>}
        </div>

        {formError && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-3.5 py-2.5 text-sm text-red-600">
            {formError}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1.5">Notes (optional)</label>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Full tank before trip"
            className={inputClass(false)}
          />
        </div>
      </form>
    </Modal>
  );
}
