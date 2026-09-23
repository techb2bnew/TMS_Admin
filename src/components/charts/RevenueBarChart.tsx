"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/format";

type DataPoint = { label: string; value: number };

function niceMax(value: number) {
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
  const normalized = value / magnitude;
  const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return step * magnitude;
}

export default function RevenueBarChart({ data }: { data: DataPoint[] }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const max = niceMax(Math.max(...data.map((d) => d.value)));
  const maxValue = Math.max(...data.map((d) => d.value));
  const gridSteps = [1, 0.5, 0];

  return (
    <div className="viz-root">
      <div className="flex">
        {/* Y-axis labels */}
        <div className="flex flex-col justify-between h-48 pr-3 text-right shrink-0">
          {gridSteps.map((step) => (
            <span
              key={step}
              className="text-[11px] [font-variant-numeric:tabular-nums]"
              style={{ color: "var(--viz-muted)" }}
            >
              {step === 0 ? "0" : `₹${Math.round((max * step) / 1000)}K`}
            </span>
          ))}
        </div>

        {/* Chart area */}
        <div className="relative flex-1 h-48">
          {gridSteps.map((step) => (
            <div
              key={step}
              className="absolute left-0 right-0 h-px"
              style={{ bottom: `${step * 100}%`, background: "var(--viz-gridline)" }}
            />
          ))}

          <div className="absolute inset-0 flex items-end justify-between gap-2 sm:gap-4 px-1">
            {data.map((d, i) => {
              const heightPct = (d.value / max) * 100;
              const isMax = d.value === maxValue;
              return (
                <div
                  key={d.label}
                  className="relative flex-1 h-full flex items-end justify-center"
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(null)}
                >
                  {(hovered === i || isMax) && (
                    <div
                      className="absolute -translate-x-1/2 text-[11px] font-medium whitespace-nowrap px-1.5 py-0.5 rounded [font-variant-numeric:tabular-nums]"
                      style={{
                        left: "50%",
                        bottom: `calc(${heightPct}% + 6px)`,
                        color: "var(--viz-text-primary)",
                        background: hovered === i ? "var(--viz-surface)" : "transparent",
                        boxShadow: hovered === i ? "0 2px 8px rgba(0,0,0,0.15)" : "none",
                      }}
                    >
                      {formatCurrency(d.value)}
                    </div>
                  )}
                  <div
                    className="w-full max-w-6 rounded-t-[4px] transition-opacity"
                    style={{
                      height: `${heightPct}%`,
                      background: "var(--viz-series-1)",
                      opacity: hovered === null || hovered === i ? 1 : 0.55,
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* X-axis labels */}
      <div className="flex pl-[3.25rem] gap-2 sm:gap-4 px-1 mt-2">
        {data.map((d) => (
          <span
            key={d.label}
            className="flex-1 text-center text-[11px]"
            style={{ color: "var(--viz-muted)" }}
          >
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}
