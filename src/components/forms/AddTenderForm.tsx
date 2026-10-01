"use client";

import { useState, type FormEvent } from "react";
import Modal from "@/components/ui/Modal";
import { APP_TEXT } from "@/constants/text";
import { createClient } from "@/lib/supabase/client";
import type { LoadTender } from "@/types";

const C = APP_TEXT.common;

type Errors = Partial<Record<"customerName" | "pickupLocation" | "dropLocation" | "rate" | "weightKg", string>>;

type AddTenderFormProps = {
  open: boolean;
  onClose: () => void;
  onSaved: (tender: LoadTender) => void;
};

function inputClass(hasError: boolean) {
  return `w-full rounded-lg border px-3.5 py-2.5 text-sm bg-transparent outline-none transition-colors focus:ring-2 focus:ring-blue-600/20 ${
    hasError ? "border-red-500" : "border-blue-600/10 dark:border-blue-400/10 focus:border-blue-600"
  }`;
}

export default function AddTenderForm({ open, onClose, onSaved }: AddTenderFormProps) {
  const [customerName, setCustomerName] = useState("");
  const [pickupLocation, setPickupLocation] = useState("");
  const [dropLocation, setDropLocation] = useState("");
  const [rate, setRate] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [truckType, setTruckType] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function validate() {
    const next: Errors = {};
    if (!customerName.trim()) next.customerName = C.required;
    if (!pickupLocation.trim()) next.pickupLocation = C.required;
    if (!dropLocation.trim()) next.dropLocation = C.required;
    if (rate.trim() && Number.isNaN(Number(rate))) next.rate = C.invalidNumber;
    if (weightKg.trim() && Number.isNaN(Number(weightKg))) next.weightKg = C.invalidNumber;
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError("");
    if (!validate()) return;

    setSubmitting(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("load_tenders")
      .insert({
        source: "manual",
        customer_name: customerName.trim(),
        pickup_location: pickupLocation.trim(),
        drop_location: dropLocation.trim(),
        rate: rate.trim() ? Number(rate) : null,
        weight_kg: weightKg.trim() ? Number(weightKg) : null,
        truck_type: truckType.trim() || null,
      })
      .select("id, source, customer_name, pickup_location, drop_location, rate, weight_kg, truck_type, status, received_at")
      .single();

    setSubmitting(false);

    if (error || !data) {
      setFormError(error?.message ?? "Could not add tender");
      return;
    }

    onSaved({
      id: data.id,
      source: data.source,
      customerName: data.customer_name,
      pickupLocation: data.pickup_location,
      dropLocation: data.drop_location,
      rate: data.rate,
      weightKg: data.weight_kg,
      truckType: data.truck_type ?? "",
      status: data.status,
      receivedAt: data.received_at,
    });
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={APP_TEXT.tenders.addTender}
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
            form="add-tender-form"
            disabled={submitting}
            className="rounded-lg px-4 py-2 text-sm font-medium bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 disabled:opacity-60 text-white transition-all shadow-md shadow-blue-600/20"
          >
            {submitting ? C.saving : APP_TEXT.tenders.addTender}
          </button>
        </>
      }
    >
      <form id="add-tender-form" onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">Customer</label>
          <input
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className={inputClass(Boolean(errors.customerName))}
          />
          {errors.customerName && <p className="mt-1.5 text-xs text-red-500">{errors.customerName}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1.5">Pickup</label>
            <input
              value={pickupLocation}
              onChange={(e) => setPickupLocation(e.target.value)}
              className={inputClass(Boolean(errors.pickupLocation))}
            />
            {errors.pickupLocation && <p className="mt-1.5 text-xs text-red-500">{errors.pickupLocation}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Drop</label>
            <input
              value={dropLocation}
              onChange={(e) => setDropLocation(e.target.value)}
              className={inputClass(Boolean(errors.dropLocation))}
            />
            {errors.dropLocation && <p className="mt-1.5 text-xs text-red-500">{errors.dropLocation}</p>}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1.5">Rate</label>
            <input
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              inputMode="decimal"
              className={inputClass(Boolean(errors.rate))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Weight (kg)</label>
            <input
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              inputMode="numeric"
              className={inputClass(Boolean(errors.weightKg))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Truck Type</label>
            <input value={truckType} onChange={(e) => setTruckType(e.target.value)} className={inputClass(false)} />
          </div>
        </div>

        {formError && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-3.5 py-2.5 text-sm text-red-600">{formError}</div>
        )}
      </form>
    </Modal>
  );
}
