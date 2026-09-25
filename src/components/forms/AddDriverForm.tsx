"use client";

import { useState, type FormEvent } from "react";
import Modal from "@/components/ui/Modal";
import { APP_TEXT } from "@/constants/text";
import { isValidEmail } from "@/lib/validation";
import { createDriverAction } from "@/lib/actions/drivers";
import type { Driver } from "@/types";

const C = APP_TEXT.common;

type Errors = Partial<Record<"full_name" | "phone" | "email" | "license_number" | "password", string>>;

type AddDriverFormProps = {
  open: boolean;
  onClose: () => void;
  onAdd: (driver: Driver) => void;
};

function inputClass(hasError: boolean) {
  return `w-full rounded-lg border px-3.5 py-2.5 text-sm bg-transparent outline-none transition-colors focus:ring-2 focus:ring-blue-600/20 ${
    hasError ? "border-red-500" : "border-blue-600/10 dark:border-blue-400/10 focus:border-blue-600"
  }`;
}

export default function AddDriverForm({ open, onClose, onAdd }: AddDriverFormProps) {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function reset() {
    setFullName("");
    setPhone("");
    setEmail("");
    setLicenseNumber("");
    setPassword("");
    setErrors({});
    setFormError("");
  }

  function handleClose() {
    reset();
    onClose();
  }

  function validate() {
    const next: Errors = {};
    if (!fullName.trim()) next.full_name = C.required;
    if (!phone.trim()) next.phone = C.required;
    else if (phone.replace(/\D/g, "").length < 10) next.phone = "Enter a valid phone number";
    if (!email.trim()) next.email = C.required;
    else if (!isValidEmail(email)) next.email = "Enter a valid email address";
    if (!licenseNumber.trim()) next.license_number = C.required;
    if (!password.trim()) next.password = C.required;
    else if (password.length < 6) next.password = "Minimum 6 characters";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError("");
    if (!validate()) return;

    setSubmitting(true);

    const result = await createDriverAction({
      full_name: fullName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      license_number: licenseNumber.trim(),
      password,
    });

    setSubmitting(false);

    if (!result.ok) {
      setFormError(result.error);
      return;
    }

    const driver: Driver = {
      ...result.driver,
      deliveries_count: 0,
      joined_at: result.driver.created_at.slice(0, 10),
      truck_number: null,
      location: null,
    };

    onAdd(driver);
    reset();
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Add Driver"
      subtitle="Admin sets the login password — the driver signs in with these credentials"
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
            form="add-driver-form"
            disabled={submitting}
            className="rounded-lg px-4 py-2 text-sm font-medium bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 disabled:opacity-60 text-white transition-all shadow-md shadow-blue-600/20"
          >
            {submitting ? C.saving : "Add Driver"}
          </button>
        </>
      }
    >
      <form id="add-driver-form" onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">Full name</label>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="e.g. Ramesh Kumar"
            className={inputClass(Boolean(errors.full_name))}
          />
          {errors.full_name && <p className="mt-1.5 text-xs text-red-500">{errors.full_name}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Phone number</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91 98765 43210"
            maxLength={16}
            className={inputClass(Boolean(errors.phone))}
          />
          {errors.phone && <p className="mt-1.5 text-xs text-red-500">{errors.phone}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Email</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value.toLowerCase())}
            placeholder="driver@tms.com"
            autoCapitalize="none"
            className={inputClass(Boolean(errors.email))}
          />
          {errors.email && <p className="mt-1.5 text-xs text-red-500">{errors.email}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">License number</label>
          <input
            value={licenseNumber}
            onChange={(e) => setLicenseNumber(e.target.value.toUpperCase())}
            placeholder="DL-04-2019-0089341"
            className={inputClass(Boolean(errors.license_number))}
          />
          {errors.license_number && <p className="mt-1.5 text-xs text-red-500">{errors.license_number}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Login password</label>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Set a password for the driver"
            className={inputClass(Boolean(errors.password))}
          />
          {errors.password && <p className="mt-1.5 text-xs text-red-500">{errors.password}</p>}
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
