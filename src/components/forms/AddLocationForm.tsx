"use client";

import { useState, type FormEvent } from "react";
import Modal from "@/components/ui/Modal";
import { APP_TEXT } from "@/constants/text";
import { createClient } from "@/lib/supabase/client";
import { geocodeAddress } from "@/lib/geocode";
import type { SavedLocation } from "@/types";

const C = APP_TEXT.common;
const T = APP_TEXT.locations;

const TYPES: SavedLocation["type"][] = ["pickup", "drop", "yard", "other"];

type Errors = Partial<Record<"name" | "address", string>>;

type AddLocationFormProps = {
  open: boolean;
  onClose: () => void;
  onSaved: (location: SavedLocation) => void;
  location?: SavedLocation | null;
};

function inputClass(hasError: boolean) {
  return `w-full rounded-lg border px-3.5 py-2.5 text-sm bg-transparent outline-none transition-colors focus:ring-2 focus:ring-blue-600/20 ${
    hasError ? "border-red-500" : "border-blue-600/10 dark:border-blue-400/10 focus:border-blue-600"
  }`;
}

export default function AddLocationForm({ open, onClose, onSaved, location }: AddLocationFormProps) {
  const isEditing = Boolean(location);
  const [name, setName] = useState(location?.name ?? "");
  const [address, setAddress] = useState(location?.address ?? "");
  const [city, setCity] = useState(location?.city ?? "");
  const [state, setState] = useState(location?.state ?? "");
  const [type, setType] = useState<SavedLocation["type"]>(location?.type ?? "other");
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function validate() {
    const next: Errors = {};
    if (!name.trim()) next.name = C.required;
    if (!address.trim()) next.address = C.required;
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError("");
    if (!validate()) return;

    setSubmitting(true);

    // Only re-geocode when the address text actually changed, or for a new
    // location — editing just the name/type shouldn't re-spend a geocode call.
    const addressChanged = !location || location.address !== address.trim();
    const geo = addressChanged ? await geocodeAddress(`${address.trim()}, ${city.trim()}`) : null;

    const supabase = createClient();
    const payload = {
      name: name.trim(),
      address: address.trim(),
      city: city.trim() || null,
      state: state.trim() || null,
      type,
      ...(geo ? { lat: geo.lat, lng: geo.lng } : {}),
    };

    const query = location
      ? supabase.from("locations").update(payload).eq("id", location.id)
      : supabase.from("locations").insert(payload);

    const { data, error } = await query
      .select("id, name, address, city, state, lat, lng, type, created_at")
      .single();

    setSubmitting(false);

    if (error || !data) {
      setFormError(error?.message ?? "Could not save location");
      return;
    }

    onSaved({
      id: data.id,
      name: data.name,
      address: data.address,
      city: data.city ?? "",
      state: data.state ?? "",
      lat: data.lat,
      lng: data.lng,
      type: data.type,
      createdAt: data.created_at,
    });
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? T.editLocation : T.addLocation}
      subtitle={T.geocodingNote}
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
            form="add-location-form"
            disabled={submitting}
            className="rounded-lg px-4 py-2 text-sm font-medium bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 disabled:opacity-60 text-white transition-all shadow-md shadow-blue-600/20"
          >
            {submitting ? C.saving : isEditing ? C.save : T.addLocation}
          </button>
        </>
      }
    >
      <form id="add-location-form" onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Tampa Warehouse"
            className={inputClass(Boolean(errors.name))}
          />
          {errors.name && <p className="mt-1.5 text-xs text-red-500">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Address</label>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="e.g. 500 Industrial Rd"
            className={inputClass(Boolean(errors.address))}
          />
          {errors.address && <p className="mt-1.5 text-xs text-red-500">{errors.address}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1.5">City</label>
            <input value={city} onChange={(e) => setCity(e.target.value)} className={inputClass(false)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">State</label>
            <input value={state} onChange={(e) => setState(e.target.value)} className={inputClass(false)} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Type</label>
          <select value={type} onChange={(e) => setType(e.target.value as SavedLocation["type"])} className={inputClass(false)}>
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {T.types[t]}
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
