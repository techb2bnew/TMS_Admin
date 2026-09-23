"use client";

import { useState } from "react";

type DriverPoint = { name: string; value: number };

export default function DriverLeaderboard({ data }: { data: DriverPoint[] }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const max = Math.max(...data.map((d) => d.value));

  return (
    <div className="viz-root space-y-3">
      {data.map((d, i) => {
        const widthPct = (d.value / max) * 100;
        return (
          <div
            key={d.name}
            className="flex items-center gap-3"
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          >
            <span
              className="w-24 shrink-0 text-xs truncate"
              style={{ color: "var(--viz-text-secondary)" }}
            >
              {d.name}
            </span>
            <div className="flex-1 h-5 rounded-[4px] overflow-hidden" style={{ background: "var(--viz-gridline)" }}>
              <div
                className="h-full rounded-[4px] transition-opacity flex items-center justify-end px-2"
                style={{
                  width: `${widthPct}%`,
                  background: "var(--viz-series-1)",
                  opacity: hovered === null || hovered === i ? 1 : 0.55,
                }}
              >
                {widthPct > 25 && (
                  <span className="text-[11px] font-medium text-white [font-variant-numeric:tabular-nums]">
                    {d.value}
                  </span>
                )}
              </div>
            </div>
            {widthPct <= 25 && (
              <span
                className="w-6 shrink-0 text-xs [font-variant-numeric:tabular-nums]"
                style={{ color: "var(--viz-text-primary)" }}
              >
                {d.value}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
