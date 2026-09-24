"use client";

import { useState, type FormEvent } from "react";
import Modal from "@/components/ui/Modal";
import AddCustomerForm from "@/components/forms/AddCustomerForm";
import { APP_TEXT } from "@/constants/text";
import { mockLoadTemplates } from "@/lib/mock/loadTemplates";
import { mockCustomers } from "@/lib/mock/customers";
import type { Customer, Load } from "@/types";

const C = APP_TEXT.common;
const TT = APP_TEXT.loads.loadTemplates;
const CT = APP_TEXT.loads.customerSelect;

const ADD_NEW_CUSTOMER = "__add_new__";

type Errors = Partial<Record<"customer_name" | "pickup_location" | "drop_location" | "weight_kg" | "rate", string>>;

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
  const [templateId, setTemplateId] = useState("");
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers);
  const [customerId, setCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [pickup, setPickup] = useState("");
  const [drop, setDrop] = useState("");
  const [weight, setWeight] = useState("");
  const [rate, setRate] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [showAddCustomer, setShowAddCustomer] = useState(false);

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
    const template = mockLoadTemplates.find((t) => t.id === id);
    if (!template) return;
    setCustomerName(template.customerName);
    setPickup(template.pickupLocation);
    setDrop(template.dropLocation);
    setRate(String(template.defaultRate));
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
    if (!validate()) return;

    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 400));

    const load: Load = {
      id: `LD-${Math.floor(1000 + Math.random() * 9000)}`,
      customer_name: customerName.trim(),
      pickup_location: pickup.trim(),
      drop_location: drop.trim(),
      weight_kg: Number(weight),
      rate: Number(rate),
      status: "pending",
      assigned_driver: null,
      created_at: new Date().toISOString(),
    };

    onAdd(load);
    setSubmitting(false);
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
            {mockLoadTemplates.map((template) => (
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
