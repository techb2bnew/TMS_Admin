"use client";

import { useState, type FormEvent } from "react";
import Modal from "@/components/ui/Modal";
import { APP_TEXT } from "@/constants/text";
import { isValidEmail } from "@/lib/validation";
import { createClient } from "@/lib/supabase/client";
import type { Customer } from "@/types";

const C = APP_TEXT.common;
const T = APP_TEXT.customers;

const PAYMENT_TERMS = ["Net 15", "Net 30", "Due on receipt"];

type Errors = Partial<Record<"name" | "contactPerson" | "phone" | "email", string>>;

type AddCustomerFormProps = {
  open: boolean;
  onClose: () => void;
  onSaved: (customer: Customer) => void;
  // Present when editing an existing customer instead of adding a new one.
  customer?: Customer | null;
};

function inputClass(hasError: boolean) {
  return `w-full rounded-lg border px-3.5 py-2.5 text-sm bg-transparent outline-none transition-colors focus:ring-2 focus:ring-blue-600/20 ${
    hasError ? "border-red-500" : "border-blue-600/10 dark:border-blue-400/10 focus:border-blue-600"
  }`;
}

export default function AddCustomerForm({ open, onClose, onSaved, customer }: AddCustomerFormProps) {
  const isEditing = Boolean(customer);
  // The parent remounts this component (via `key`) whenever it switches
  // between "add new" and "edit customer X", so these initial values only
  // need to be read once per mount — no effect required to keep them in sync.
  const [name, setName] = useState(customer?.name ?? "");
  const [contactPerson, setContactPerson] = useState(customer?.contactPerson ?? "");
  const [phone, setPhone] = useState(customer?.phone ?? "");
  const [email, setEmail] = useState(customer?.email ?? "");
  const [billingAddress, setBillingAddress] = useState(customer?.billingAddress ?? "");
  const [paymentTerms, setPaymentTerms] = useState(customer?.paymentTerms ?? PAYMENT_TERMS[1]);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleClose() {
    onClose();
  }

  function validate() {
    const next: Errors = {};
    if (!name.trim()) next.name = C.required;
    if (!contactPerson.trim()) next.contactPerson = C.required;
    if (!phone.trim()) next.phone = C.required;
    else if (phone.replace(/\D/g, "").length < 10) next.phone = "Enter a valid phone number";
    if (!email.trim()) next.email = C.required;
    else if (!isValidEmail(email)) next.email = "Enter a valid email address";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError("");
    if (!validate()) return;

    setSubmitting(true);

    const supabase = createClient();
    const payload = {
      name: name.trim(),
      contact_person: contactPerson.trim(),
      phone: phone.trim(),
      email: email.trim(),
      billing_address: billingAddress.trim(),
      payment_terms: paymentTerms,
    };

    const query = customer
      ? supabase.from("customers").update(payload).eq("id", customer.id)
      : supabase.from("customers").insert(payload);

    const { data, error } = await query
      .select("id, name, contact_person, phone, email, billing_address, payment_terms, created_at")
      .single();

    setSubmitting(false);

    if (error || !data) {
      setFormError(error?.message ?? "Could not save customer");
      return;
    }

    onSaved({
      id: data.id,
      name: data.name,
      contactPerson: data.contact_person ?? "",
      phone: data.phone ?? "",
      email: data.email ?? "",
      billingAddress: data.billing_address ?? "",
      paymentTerms: data.payment_terms,
      createdAt: data.created_at,
    });
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={isEditing ? T.editCustomer : "Add Customer"}
      subtitle={isEditing ? T.editCustomerSubtitle : "Add a customer you haul loads for"}
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
            form="add-customer-form"
            disabled={submitting}
            className="rounded-lg px-4 py-2 text-sm font-medium bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 disabled:opacity-60 text-white transition-all shadow-md shadow-blue-600/20"
          >
            {submitting ? C.saving : isEditing ? T.saveChanges : "Add Customer"}
          </button>
        </>
      }
    >
      <form id="add-customer-form" onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">Company name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Bansal Traders"
            className={inputClass(Boolean(errors.name))}
          />
          {errors.name && <p className="mt-1.5 text-xs text-red-500">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Contact person</label>
          <input
            value={contactPerson}
            onChange={(e) => setContactPerson(e.target.value)}
            placeholder="e.g. Rohit Bansal"
            className={inputClass(Boolean(errors.contactPerson))}
          />
          {errors.contactPerson && <p className="mt-1.5 text-xs text-red-500">{errors.contactPerson}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1.5">Phone number</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="9876543210"
              maxLength={10}
              className={inputClass(Boolean(errors.phone))}
            />
            {errors.phone && <p className="mt-1.5 text-xs text-red-500">{errors.phone}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value.toLowerCase())}
              placeholder="contact@company.com"
              autoCapitalize="none"
              className={inputClass(Boolean(errors.email))}
            />
            {errors.email && <p className="mt-1.5 text-xs text-red-500">{errors.email}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Billing address (optional)</label>
          <input
            value={billingAddress}
            onChange={(e) => setBillingAddress(e.target.value)}
            placeholder="e.g. 14 Industrial Area, Delhi"
            className={inputClass(false)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Payment terms</label>
          <select
            value={paymentTerms}
            onChange={(e) => setPaymentTerms(e.target.value)}
            className={inputClass(false)}
          >
            {PAYMENT_TERMS.map((term) => (
              <option key={term} value={term}>
                {term}
              </option>
            ))}
          </select>
        </div>

        {formError && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-3.5 py-2.5 text-sm text-red-600">
            {formError}
          </div>
        )}
      </form>
    </Modal>
  );
}
