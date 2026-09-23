"use client";

import { useState, type FormEvent } from "react";
import Modal from "@/components/ui/Modal";
import { APP_TEXT } from "@/constants/text";
import type { Driver } from "@/types";

const C = APP_TEXT.common;

type Errors = Partial<Record<"full_name" | "phone" | "license_number" | "password", string>>;

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
  const [licenseNumber, setLicenseNumber] = useState("");
  const [truckNumber, setTruckNumber] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);

  function reset() {
    setFullName("");
    setPhone("");
    setLicenseNumber("");
    setTruckNumber("");
    setPassword("");
    setErrors({});
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
    if (!licenseNumber.trim()) next.license_number = C.required;
    if (!password.trim()) next.password = C.required;
    else if (password.length < 6) next.password = "Minimum 6 characters";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 400));

    const driver: Driver = {
      id: `d${Date.now()}`,
      full_name: fullName.trim(),
      phone: phone.trim(),
      license_number: licenseNumber.trim(),
      status: "active",
      deliveries_count: 0,
      joined_at: new Date().toISOString().slice(0, 10),
      truck_number: truckNumber.trim() || null,
      location: { lat: 28.61, lng: 77.23, label: "Delhi" },
    };

    onAdd(driver);
    setSubmitting(false);
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
            className={inputClass(Boolean(errors.phone))}
          />
          {errors.phone && <p className="mt-1.5 text-xs text-red-500">{errors.phone}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">License number</label>
          <input
            value={licenseNumber}
            onChange={(e) => setLicenseNumber(e.target.value)}
            placeholder="DL-04-2019-0089341"
            className={inputClass(Boolean(errors.license_number))}
          />
          {errors.license_number && <p className="mt-1.5 text-xs text-red-500">{errors.license_number}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Truck number (optional)</label>
          <input
            value={truckNumber}
            onChange={(e) => setTruckNumber(e.target.value)}
            placeholder="e.g. PB-11-TA-4521"
            className={inputClass(false)}
          />
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
      </form>
    </Modal>
  );
}
