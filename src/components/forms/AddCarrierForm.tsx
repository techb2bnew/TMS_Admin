"use client";

import { useState, type FormEvent } from "react";
import Modal from "@/components/ui/Modal";
import { APP_TEXT } from "@/constants/text";
import { isValidEmail } from "@/lib/validation";
import { createClient } from "@/lib/supabase/client";
import type { Carrier } from "@/types";

const C = APP_TEXT.common;
const T = APP_TEXT.carriers;

const STATUSES: Carrier["status"][] = ["active", "inactive"];

type Errors = Partial<Record<"name" | "phone" | "email", string>>;

type AddCarrierFormProps = {
  open: boolean;
  onClose: () => void;
  onSaved: (carrier: Carrier) => void;
  carrier?: Carrier | null;
};

function inputClass(hasError: boolean) {
  return `w-full rounded-lg border px-3.5 py-2.5 text-sm bg-transparent outline-none transition-colors focus:ring-2 focus:ring-blue-600/20 ${
    hasError ? "border-red-500" : "border-blue-600/10 dark:border-blue-400/10 focus:border-blue-600"
  }`;
}

export default function AddCarrierForm({ open, onClose, onSaved, carrier }: AddCarrierFormProps) {
  const isEditing = Boolean(carrier);
  const [name, setName] = useState(carrier?.name ?? "");
  const [mcNumber, setMcNumber] = useState(carrier?.mcNumber ?? "");
  const [dotNumber, setDotNumber] = useState(carrier?.dotNumber ?? "");
  const [contactPerson, setContactPerson] = useState(carrier?.contactPerson ?? "");
  const [phone, setPhone] = useState(carrier?.phone ?? "");
  const [email, setEmail] = useState(carrier?.email ?? "");
  const [insuranceExpiry, setInsuranceExpiry] = useState(carrier?.insuranceExpiry ?? "");
  const [status, setStatus] = useState<Carrier["status"]>(carrier?.status ?? "active");
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function validate() {
    const next: Errors = {};
    if (!name.trim()) next.name = C.required;
    if (phone.trim() && phone.replace(/\D/g, "").length < 10) next.phone = "Enter a valid phone number";
    if (email.trim() && !isValidEmail(email)) next.email = "Enter a valid email address";
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
      mc_number: mcNumber.trim() || null,
      dot_number: dotNumber.trim() || null,
      contact_person: contactPerson.trim() || null,
      phone: phone.trim() || null,
      email: email.trim() || null,
      insurance_expiry: insuranceExpiry || null,
      status,
    };

    const query = carrier
      ? supabase.from("carriers").update(payload).eq("id", carrier.id)
      : supabase.from("carriers").insert(payload);

    const { data, error } = await query
      .select("id, name, mc_number, dot_number, contact_person, phone, email, insurance_expiry, status, created_at")
      .single();

    setSubmitting(false);

    if (error || !data) {
      setFormError(error?.message ?? "Could not save carrier");
      return;
    }

    onSaved({
      id: data.id,
      name: data.name,
      mcNumber: data.mc_number ?? "",
      dotNumber: data.dot_number ?? "",
      contactPerson: data.contact_person ?? "",
      phone: data.phone ?? "",
      email: data.email ?? "",
      insuranceExpiry: data.insurance_expiry,
      status: data.status,
      createdAt: data.created_at,
    });
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? T.editCarrier : T.addCarrier}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            {C.cancel}
          </button>
          <button
            type="submit"
            form="add-carrier-form"
            disabled={submitting}
            className="rounded-lg px-4 py-2 text-sm font-medium bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 disabled:opacity-60 text-white transition-all shadow-md shadow-blue-600/20"
          >
            {submitting ? C.saving : isEditing ? C.save : T.addCarrier}
          </button>
        </>
      }
    >
      <form id="add-carrier-form" onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">Carrier name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Shree Logistics"
            className={inputClass(Boolean(errors.name))}
          />
          {errors.name && <p className="mt-1.5 text-xs text-red-500">{errors.name}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1.5">MC Number</label>
            <input value={mcNumber} onChange={(e) => setMcNumber(e.target.value)} className={inputClass(false)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">DOT Number</label>
            <input value={dotNumber} onChange={(e) => setDotNumber(e.target.value)} className={inputClass(false)} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Contact person</label>
          <input value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} className={inputClass(false)} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1.5">Phone number</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
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
              autoCapitalize="none"
              className={inputClass(Boolean(errors.email))}
            />
            {errors.email && <p className="mt-1.5 text-xs text-red-500">{errors.email}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1.5">Insurance expiry</label>
            <input
              type="date"
              value={insuranceExpiry}
              onChange={(e) => setInsuranceExpiry(e.target.value)}
              className={inputClass(false)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as Carrier["status"])} className={inputClass(false)}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {T.statuses[s]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {formError && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-3.5 py-2.5 text-sm text-red-600">{formError}</div>
        )}
      </form>
    </Modal>
  );
}
