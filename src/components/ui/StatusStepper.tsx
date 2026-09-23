const STAGES = ["assigned", "picked_up", "in_transit", "delivered"] as const;

const LABELS: Record<(typeof STAGES)[number], string> = {
  assigned: "Assigned",
  picked_up: "Picked Up",
  in_transit: "In Transit",
  delivered: "Delivered",
};

export default function StatusStepper({ status }: { status: string }) {
  const currentIndex = STAGES.indexOf(status as (typeof STAGES)[number]);

  return (
    <div className="flex items-center">
      {STAGES.map((stage, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;
        const isLast = i === STAGES.length - 1;

        return (
          <div key={stage} className={`flex items-center ${isLast ? "" : "flex-1"}`}>
            <div className="flex flex-col items-center">
              <span
                className={`flex items-center justify-center w-5 h-5 rounded-full shrink-0 ${
                  done
                    ? "bg-emerald-500 text-white"
                    : active
                      ? "bg-blue-600 text-white ring-4 ring-blue-600/20"
                      : "bg-blue-600/10 dark:bg-blue-400/10 opacity-50"
                }`}
              >
                {done && (
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                    <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </span>
              <span
                className={`mt-1.5 text-[10px] whitespace-nowrap ${
                  active ? "font-medium opacity-100" : "opacity-45"
                }`}
              >
                {LABELS[stage]}
              </span>
            </div>
            {!isLast && (
              <div
                className={`flex-1 h-[2px] mx-1.5 -mt-4 ${done ? "bg-emerald-500" : "bg-blue-600/10 dark:bg-blue-400/10"}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
