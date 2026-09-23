"use client";

import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";

const emptySubscribe = () => () => {};
function useMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: string;
};

export default function Modal({ open, onClose, title, subtitle, children, footer, maxWidth = "max-w-md" }: ModalProps) {
  const mounted = useMounted();

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-blue-950/70 backdrop-blur-sm animate-fade-in-up"
        style={{ animationDuration: "0.15s" }}
        onClick={onClose}
      />
      <div
        className={`relative w-full ${maxWidth} rounded-2xl border border-slate-200 bg-white shadow-2xl animate-fade-in-up`}
        style={{ animationDuration: "0.2s" }}
      >
        <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4">
          <div>
            <h2 className="text-lg font-semibold">{title}</h2>
            {subtitle && <p className="text-sm opacity-60 mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-7 h-7 rounded-lg opacity-50 hover:opacity-100 hover:bg-slate-100 transition-colors shrink-0"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" strokeWidth="2">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="px-6 pb-6 max-h-[70vh] overflow-y-auto">{children}</div>

        {footer && (
          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-blue-600/10 dark:border-blue-400/10">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
