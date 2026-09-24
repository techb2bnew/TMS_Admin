"use client";

import { useState, type FormEvent } from "react";
import Modal from "@/components/ui/Modal";
import { APP_TEXT } from "@/constants/text";

const C = APP_TEXT.common;
const T = APP_TEXT.loads.loadActions;

type LogCheckCallFormProps = {
  open: boolean;
  loadId: string | null;
  onClose: () => void;
  onSubmit: (note: string) => void;
};

export default function LogCheckCallForm({ open, loadId, onClose, onSubmit }: LogCheckCallFormProps) {
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function reset() {
    setNote("");
    setError("");
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!note.trim()) {
      setError(C.required);
      return;
    }

    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 300));

    onSubmit(note.trim());
    setSubmitting(false);
    reset();
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={T.checkCallTitle}
      subtitle={loadId ? `${T.checkCallSubtitle} — ${loadId}` : T.checkCallSubtitle}
      maxWidth="max-w-sm"
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
            form="log-check-call-form"
            disabled={submitting}
            className="rounded-lg px-4 py-2 text-sm font-medium bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 disabled:opacity-60 text-white transition-all shadow-md shadow-blue-600/20"
          >
            {submitting ? C.saving : T.checkCallSubmit}
          </button>
        </>
      }
    >
      <form id="log-check-call-form" onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">{T.checkCallNoteLabel}</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={T.checkCallNotePlaceholder}
            rows={4}
            className={`w-full rounded-lg border px-3.5 py-2.5 text-sm bg-transparent outline-none transition-colors focus:ring-2 focus:ring-blue-600/20 ${
              error ? "border-red-500" : "border-blue-600/10 dark:border-blue-400/10 focus:border-blue-600"
            }`}
          />
          {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
        </div>
      </form>
    </Modal>
  );
}
