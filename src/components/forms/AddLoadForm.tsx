"use client";

import { useEffect, useState, type FormEvent } from "react";
import Modal from "@/components/ui/Modal";
import AddCustomerForm from "@/components/forms/AddCustomerForm";
import { APP_TEXT } from "@/constants/text";
import { createClient } from "@/lib/supabase/client";
import type { Customer, Load } from "@/types";

const C = APP_TEXT.common;
const TT = APP_TEXT.loads.loadTemplates;
const CT = APP_TEXT.loads.customerSelect;

const ADD_NEW_CUSTOMER = "__add_new__";

type Errors = Partial<Record<"customer_name" | "pickup_location" | "drop_location" | "weight_kg" | "rate", string>>;

type LoadTemplateRow = {
  id: string;
  name: string;
  customer_id: string | null;
  pickup_location: string;
  drop_location: string;
  default_rate: number | null;
};

type AddLoadFormProps = {
  open: boolean;
  onClose: () => void;
  onAdd: (load: Load) => void;
};

function inputClass(hasError: boolean) {
  return `w-full rounded-lg border px-3.5 py-2.5 text-sm bg-transparent outline-none transition-colors focus:ring-2 focus:ring-blue-600/20 ${
    hasError ? "border-red-500" : "border-blue-600/10 dark:border-blue-400/10 focus:border-blue-600"
  }`;
}

export default function AddLoadForm({ open, onClose, onAdd }: AddLoadFormProps) {
  const [templates, setTemplates] = useState<LoadTemplateRow[]>([]);
  const [templateId, setTemplateId] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [pickup, setPickup] = useState("");
  const [drop, setDrop] = useState("");
  const [weight, setWeight] = useState("");
  const [rate, setRate] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showAddCustomer, setShowAddCustomer] = useState(false);

  useEffect(() => {
    if (!open) return;
    async function load() {
      const supabase = createClient();
      const [{ data: customersData }, { data: templatesData }] = await Promise.all([
        supabase.from("customers").select("id, name, contact_person, phone, email, billing_address, payment_terms, created_at"),
        supabase.from("load_templates").select("id, name, customer_id, pickup_location, drop_location, default_rate"),
      ]);
      setCustomers(
        (customersData ?? []).map((c) => ({
          id: c.id,
          name: c.name,
          contactPerson: c.contact_person ?? "",
          phone: c.phone ?? "",
          email: c.email ?? "",
          billingAddress: c.billing_address ?? "",
          paymentTerms: c.payment_terms,
          createdAt: c.created_at,
        }))
      );
      setTemplates(templatesData ?? []);
    }
    load();
  }, [open]);

  function handleCustomerChange(id: string) {
    if (id === ADD_NEW_CUSTOMER) {
      setShowAddCustomer(true);
      return;
    }
    setCustomerId(id);
    setCustomerName(customers.find((c) => c.id === id)?.name ?? "");
  }

  function handleNewCustomer(customer: Customer) {
    setCustomers((prev) => [customer, ...prev]);
    setCustomerId(customer.id);
    setCustomerName(customer.name);
    setShowAddCustomer(false);
  }

  function handleTemplateChange(id: string) {
    setTemplateId(id);
    const template = templates.find((t) => t.id === id);
    if (!template) return;
    if (template.customer_id) {
      handleCustomerChange(template.customer_id);
    }
    setPickup(template.pickup_location);
    setDrop(template.drop_location);
    setRate(template.default_rate ? String(template.default_rate) : "");
  }

  function reset() {
    setTemplateId("");
    setCustomerId("");
    setCustomerName("");
    setPickup("");
    setDrop("");
    setWeight("");
    setRate("");
    setErrors({});
    setFormError("");
  }

  function handleClose() {
    reset();
    onClose();
  }

  function validate() {
    const next: Errors = {};
    if (!customerName.trim()) next.customer_name = C.required;
    if (!pickup.trim()) next.pickup_location = C.required;
    if (!drop.trim()) next.drop_location = C.required;
    if (!weight.trim() || Number.isNaN(Number(weight)) || Number(weight) <= 0) next.weight_kg = C.invalidNumber;
    if (!rate.trim() || Number.isNaN(Number(rate)) || Number(rate) <= 0) next.rate = C.invalidNumber;
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
      .from("loads")
      .insert({
        customer_name: customerName.trim(),
        customer_id: customerId || null,
        pickup_location: pickup.trim(),
        drop_location: drop.trim(),
        weight_kg: Number(weight),
        rate: Number(rate),
        status: "pending",
        created_by: user?.id ?? null,
      })
      .select("id, load_number, customer_name, pickup_location, drop_location, weight_kg, rate, status, created_at")
      .single();

    setSubmitting(false);

    if (error || !data) {
      setFormError(error?.message ?? "Could not create load");
      return;
    }

    onAdd({ ...data, assigned_driver: null });
    reset();
    onClose();
  }

  return (
    <>
    <Modal
      open={open}
      onClose={handleClose}
      title="New Load"
      subtitle="Create a load — it'll show up as pending until dispatched"
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
            form="add-load-form"
            disabled={submitting}
            className="rounded-lg px-4 py-2 text-sm font-medium bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 disabled:opacity-60 text-white transition-all shadow-md shadow-blue-600/20"
          >
            {submitting ? C.saving : "Create Load"}
          </button>
        </>
      }
    >
      <form id="add-load-form" onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">{TT.label}</label>
          <select
            value={templateId}
            onChange={(e) => handleTemplateChange(e.target.value)}
            className="w-full rounded-lg border px-3.5 py-2.5 text-sm bg-transparent outline-none transition-colors focus:ring-2 focus:ring-blue-600/20 border-blue-600/10 dark:border-blue-400/10 focus:border-blue-600"
          >
            <option value="">{TT.noneOption}</option>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">{CT.label}</label>
          <select
            value={customerId}
            onChange={(e) => handleCustomerChange(e.target.value)}
            className={inputClass(Boolean(errors.customer_name))}
          >
            <option value="">{CT.placeholder}</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
            <option value={ADD_NEW_CUSTOMER}>{CT.addNewOption}</option>
          </select>
          {errors.customer_name && <p className="mt-1.5 text-xs text-red-500">{errors.customer_name}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1.5">Pickup location</label>
            <input
              value={pickup}
              onChange={(e) => setPickup(e.target.value)}
              placeholder="Delhi"
              className={inputClass(Boolean(errors.pickup_location))}
            />
            {errors.pickup_location && <p className="mt-1.5 text-xs text-red-500">{errors.pickup_location}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Drop location</label>
            <input
              value={drop}
              onChange={(e) => setDrop(e.target.value)}
              placeholder="Jaipur"
              className={inputClass(Boolean(errors.drop_location))}
            />
            {errors.drop_location && <p className="mt-1.5 text-xs text-red-500">{errors.drop_location}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1.5">Weight (kg)</label>
            <input
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="8200"
              inputMode="numeric"
              className={inputClass(Boolean(errors.weight_kg))}
            />
            {errors.weight_kg && <p className="mt-1.5 text-xs text-red-500">{errors.weight_kg}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Rate (₹)</label>
            <input
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              placeholder="24500"
              inputMode="numeric"
              className={inputClass(Boolean(errors.rate))}
            />
            {errors.rate && <p className="mt-1.5 text-xs text-red-500">{errors.rate}</p>}
          </div>
        </div>

        {formError && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-3.5 py-2.5 text-sm text-red-600">
            {formError}
          </div>
        )}
      </form>
    </Modal>
      <AddCustomerForm
        open={showAddCustomer}
        onClose={() => setShowAddCustomer(false)}
        onAdd={handleNewCustomer}
      />
    </>
  );
}
