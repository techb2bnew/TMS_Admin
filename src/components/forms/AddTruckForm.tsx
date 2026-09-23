"use client";

import { useState, type FormEvent } from "react";
import Modal from "@/components/ui/Modal";
import { APP_TEXT } from "@/constants/text";
import { mockDrivers } from "@/lib/mock/drivers";
import type { Truck } from "@/types";

const C = APP_TEXT.common;

type Errors = Partial<Record<"truck_number" | "capacity_kg" | "insurance_expiry", string>>;

type AddTruckFormProps = {
  open: boolean;
  onClose: () => void;
  onAdd: (truck: Truck) => void;
};

function inputClass(hasError: boolean) {
  return `w-full rounded-lg border px-3.5 py-2.5 text-sm bg-transparent outline-none transition-colors focus:ring-2 focus:ring-blue-600/20 ${
    hasError ? "border-red-500" : "border-blue-600/10 dark:border-blue-400/10 focus:border-blue-600"
  }`;
}

export default function AddTruckForm({ open, onClose, onAdd }: AddTruckFormProps) {
  const [truckNumber, setTruckNumber] = useState("");
  const [capacity, setCapacity] = useState("");
  const [insuranceExpiry, setInsuranceExpiry] = useState("");
  const [lastMaintenance, setLastMaintenance] = useState("");
  const [assignedDriver, setAssignedDriver] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);

  function reset() {
    setTruckNumber("");
    setCapacity("");
    setInsuranceExpiry("");
    setLastMaintenance("");
    setAssignedDriver("");
    setErrors({});
  }

  function handleClose() {
    reset();
    onClose();
  }

  function validate() {
    const next: Errors = {};
    if (!truckNumber.trim()) next.truck_number = C.required;
    if (!capacity.trim() || Number.isNaN(Number(capacity)) || Number(capacity) <= 0)
      next.capacity_kg = C.invalidNumber;
    if (!insuranceExpiry.trim()) next.insurance_expiry = C.required;
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 400));

    const truck: Truck = {
      id: `t${Date.now()}`,
      truck_number: truckNumber.trim(),
      capacity_kg: Number(capacity),
      status: "active",
      insurance_expiry: insuranceExpiry,
      last_maintenance: lastMaintenance || new Date().toISOString().slice(0, 10),
      assigned_driver: assignedDriver.trim() || null,
    };

    onAdd(truck);
    setSubmitting(false);
    reset();
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Add Truck"
      subtitle="Register a new truck to the fleet"
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
            form="add-truck-form"
            disabled={submitting}
            className="rounded-lg px-4 py-2 text-sm font-medium bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 disabled:opacity-60 text-white transition-all shadow-md shadow-blue-600/20"
          >
            {submitting ? C.saving : "Add Truck"}
          </button>
        </>
      }
    >
      <form id="add-truck-form" onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">Truck number</label>
          <input
            value={truckNumber}
            onChange={(e) => setTruckNumber(e.target.value)}
            placeholder="e.g. PB-11-TA-4521"
            className={inputClass(Boolean(errors.truck_number))}
          />
          {errors.truck_number && <p className="mt-1.5 text-xs text-red-500">{errors.truck_number}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Capacity (kg)</label>
          <input
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            placeholder="16000"
            inputMode="numeric"
            className={inputClass(Boolean(errors.capacity_kg))}
          />
          {errors.capacity_kg && <p className="mt-1.5 text-xs text-red-500">{errors.capacity_kg}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Insurance expiry</label>
          <input
            type="date"
            value={insuranceExpiry}
            onChange={(e) => setInsuranceExpiry(e.target.value)}
            className={inputClass(Boolean(errors.insurance_expiry))}
          />
          {errors.insurance_expiry && <p className="mt-1.5 text-xs text-red-500">{errors.insurance_expiry}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Last maintenance (optional)</label>
          <input
            type="date"
            value={lastMaintenance}
            onChange={(e) => setLastMaintenance(e.target.value)}
            className={inputClass(false)}
          />
          <p className="mt-1.5 text-xs opacity-50">Leave blank to use today&apos;s date</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Primary driver (optional)</label>
          <select
            value={assignedDriver}
            onChange={(e) => setAssignedDriver(e.target.value)}
            className={inputClass(false)}
          >
            <option value="">No driver assigned</option>
            {mockDrivers
              .filter((d) => d.status === "active")
              .map((d) => (
                <option key={d.id} value={d.full_name}>
                  {d.full_name}
                </option>
              ))}
          </select>
        </div>
      </form>
    </Modal>
  );
}
