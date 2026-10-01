"use client";

import { useState, type FormEvent } from "react";
import Modal from "@/components/ui/Modal";
import { APP_TEXT } from "@/constants/text";
import { createClient } from "@/lib/supabase/client";
import type { Trailer } from "@/types";

const C = APP_TEXT.common;
const T = APP_TEXT.trailers;

const TYPES: Trailer["type"][] = ["dry_van", "reefer", "flatbed"];
const STATUSES: Trailer["status"][] = ["available", "in_use", "maintenance"];

type Errors = Partial<Record<"trailerNumber" | "capacityKg", string>>;

type AddTrailerFormProps = {
  open: boolean;
  onClose: () => void;
  onSaved: (trailer: Trailer) => void;
  trailer?: Trailer | null;
};

function inputClass(hasError: boolean) {
  return `w-full rounded-lg border px-3.5 py-2.5 text-sm bg-transparent outline-none transition-colors focus:ring-2 focus:ring-blue-600/20 ${
    hasError ? "border-red-500" : "border-blue-600/10 dark:border-blue-400/10 focus:border-blue-600"
  }`;
}

export default function AddTrailerForm({ open, onClose, onSaved, trailer }: AddTrailerFormProps) {
  const isEditing = Boolean(trailer);
  const [trailerNumber, setTrailerNumber] = useState(trailer?.trailerNumber ?? "");
  const [type, setType] = useState<Trailer["type"]>(trailer?.type ?? "dry_van");
  const [capacityKg, setCapacityKg] = useState(trailer?.capacityKg?.toString() ?? "");
  const [status, setStatus] = useState<Trailer["status"]>(trailer?.status ?? "available");
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function validate() {
    const next: Errors = {};
    if (!trailerNumber.trim()) next.trailerNumber = C.required;
    if (capacityKg.trim() && Number.isNaN(Number(capacityKg))) next.capacityKg = C.invalidNumber;
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
      trailer_number: trailerNumber.trim(),
      type,
      capacity_kg: capacityKg.trim() ? Number(capacityKg) : null,
      status,
    };

    const query = trailer
      ? supabase.from("trailers").update(payload).eq("id", trailer.id)
      : supabase.from("trailers").insert(payload);

    const { data, error } = await query
      .select("id, trailer_number, type, capacity_kg, status, created_at")
      .single();

    setSubmitting(false);

    if (error || !data) {
      setFormError(error?.message ?? "Could not save trailer");
      return;
    }

    onSaved({
      id: data.id,
      trailerNumber: data.trailer_number,
      type: data.type,
      capacityKg: data.capacity_kg,
      status: data.status,
      createdAt: data.created_at,
    });
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? T.editTrailer : T.addTrailer}
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
            form="add-trailer-form"
            disabled={submitting}
            className="rounded-lg px-4 py-2 text-sm font-medium bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 disabled:opacity-60 text-white transition-all shadow-md shadow-blue-600/20"
          >
            {submitting ? C.saving : isEditing ? C.save : T.addTrailer}
          </button>
        </>
      }
    >
      <form id="add-trailer-form" onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">Trailer number</label>
          <input
            value={trailerNumber}
            onChange={(e) => setTrailerNumber(e.target.value)}
            placeholder="e.g. TRL-204"
            className={inputClass(Boolean(errors.trailerNumber))}
          />
          {errors.trailerNumber && <p className="mt-1.5 text-xs text-red-500">{errors.trailerNumber}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1.5">Type</label>
            <select value={type} onChange={(e) => setType(e.target.value as Trailer["type"])} className={inputClass(false)}>
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {T.types[t]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Capacity (kg)</label>
            <input
              value={capacityKg}
              onChange={(e) => setCapacityKg(e.target.value)}
              inputMode="numeric"
              className={inputClass(Boolean(errors.capacityKg))}
            />
            {errors.capacityKg && <p className="mt-1.5 text-xs text-red-500">{errors.capacityKg}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value as Trailer["status"])} className={inputClass(false)}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {T.statuses[s]}
              </option>
            ))}
          </select>
        </div>

        {formError && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-3.5 py-2.5 text-sm text-red-600">{formError}</div>
        )}
      </form>
    </Modal>
  );
}
