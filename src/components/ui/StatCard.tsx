import type { ComponentType } from "react";

type StatCardProps = {
  label: string;
  value: string | number;
  hint?: string;
  Icon: ComponentType<{ className?: string }>;
  accent?: "blue" | "emerald" | "amber" | "red";
};

const ACCENTS: Record<NonNullable<StatCardProps["accent"]>, { wash: string; icon: string; bar: string }> = {
  blue: {
    wash: "from-blue-50/80 via-white to-white",
    icon: "from-blue-500 to-blue-600 shadow-blue-500/30",
    bar: "from-blue-500 to-blue-400",
  },
  emerald: {
    wash: "from-emerald-50/80 via-white to-white",
    icon: "from-emerald-500 to-emerald-600 shadow-emerald-500/30",
    bar: "from-emerald-500 to-emerald-400",
  },
  amber: {
    wash: "from-amber-50/80 via-white to-white",
    icon: "from-amber-500 to-amber-600 shadow-amber-500/30",
    bar: "from-amber-500 to-amber-400",
  },
  red: {
    wash: "from-red-50/80 via-white to-white",
    icon: "from-red-500 to-red-600 shadow-red-500/30",
    bar: "from-red-500 to-red-400",
  },
};

export default function StatCard({ label, value, hint, Icon, accent = "blue" }: StatCardProps) {
  const a = ACCENTS[accent];

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-slate-200 bg-gradient-to-br ${a.wash} shadow-sm p-5 hover:shadow-md hover:-translate-y-0.5 transition-all`}
    >
      <span className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${a.bar}`} />
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-slate-500">{label}</span>
        <span
          className={`flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br ${a.icon} text-white shadow-lg`}
        >
          <Icon className="w-4.5 h-4.5" />
        </span>
      </div>
      <div className="text-3xl font-semibold text-[#10182b]">{value}</div>
      {hint && <div className="text-xs text-slate-400 mt-1.5">{hint}</div>}
    </div>
  );
}
