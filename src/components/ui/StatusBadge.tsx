const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  pending: {
    label: "Pending",
    className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25",
  },
  assigned: {
    label: "Assigned",
    className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25",
  },
  picked_up: {
    label: "Picked Up",
    className: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/25",
  },
  in_transit: {
    label: "In Transit",
    className: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/25",
  },
  delivered: {
    label: "Delivered",
    className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/25",
  },
  active: {
    label: "Active",
    className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25",
  },
  inactive: {
    label: "Inactive",
    className: "bg-blue-600/10 dark:bg-blue-400/10 text-blue-600/50 dark:text-blue-400/50 border-blue-600/10 dark:border-blue-400/15",
  },
  maintenance: {
    label: "Maintenance",
    className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25",
  },
  paid: {
    label: "Paid",
    className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25",
  },
  unpaid: {
    label: "Unpaid",
    className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25",
  },
};

export default function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? {
    label: status,
    className: "bg-blue-600/10 dark:bg-blue-400/10 border-blue-600/10 dark:border-blue-400/15",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium whitespace-nowrap ${style.className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {style.label}
    </span>
  );
}
