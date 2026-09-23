"use client";

export default function Toast({ message }: { message: string | null }) {
  if (!message) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-fade-in-up" style={{ animationDuration: "0.2s" }}>
      <div className="flex items-center gap-2.5 rounded-lg border border-blue-600/10 dark:border-blue-400/10 bg-[var(--background)] shadow-xl px-4 py-3 text-sm">
        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shrink-0">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        {message}
      </div>
    </div>
  );
}
