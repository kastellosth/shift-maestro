// ─── components/schedule/ScheduleStatsCard.tsx ───────────────────────────────
//
// Three panels displayed after a schedule is generated:
//   1. Spider (radar) chart — company contribution (people scheduled per company)
//   2. Company burden table — ranked by total fatigue load
//   3. Individual burden list — top people who got the hardest assignments
//
// The chart is drawn with pure SVG — no charting library needed.
// This keeps the bundle small and gives us full control over style.

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Employee, ScheduleGroup, Job, ShiftGroup } from "../../../../types";
import {
  buildSpiderData,
  buildCompanyBurden,
  buildPersonBurden,
} from "../../utils/scheduleStats";
import { workloadStyle } from "../../utils";

interface ScheduleStatsCardProps {
  schedule: ScheduleGroup[];
  employees: Employee[];
  jobs: Job[];
  shifts: ShiftGroup[];
}

// ── Spider chart (pure SVG radar) ─────────────────────────────────────────────

function SpiderChart({ schedule, employees }: { schedule: ScheduleGroup[]; employees: Employee[] }) {
  const data = buildSpiderData(schedule, employees);
  const n = data.length;
  if (n < 2) return <p className="text-xs text-muted-foreground">Need ≥2 companies</p>;

  const cx = 140; const cy = 140; const r = 100;
  const levels = 4;

  // Polygon point helpers
  const angle = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2;
  const pt = (i: number, radius: number) => ({
    x: cx + radius * Math.cos(angle(i)),
    y: cy + radius * Math.sin(angle(i)),
  });

  const maxVal = Math.max(...data.map((d) => d.total), 1);

  // Data polygon
  const dataPoints = data.map((d, i) => pt(i, (d.count / maxVal) * r));
  const dataPath = dataPoints.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ") + "Z";

  // Grid polygons
  const gridPaths = Array.from({ length: levels }, (_, li) => {
    const frac = (li + 1) / levels;
    return data
      .map((_, i) => pt(i, frac * r))
      .map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`)
      .join(" ") + "Z";
  });

  return (
    <svg viewBox="0 0 280 280" className="w-full max-w-[260px] mx-auto">
      {/* Grid rings */}
      {gridPaths.map((d, i) => (
        <path key={i} d={d} fill="none" stroke="currentColor" strokeOpacity={0.1} strokeWidth={1} />
      ))}
      {/* Axes */}
      {data.map((_, i) => {
        const outer = pt(i, r);
        return <line key={i} x1={cx} y1={cy} x2={outer.x} y2={outer.y} stroke="currentColor" strokeOpacity={0.15} strokeWidth={1} />;
      })}
      {/* Data fill */}
      <path d={dataPath} fill="hsl(var(--primary))" fillOpacity={0.18} stroke="hsl(var(--primary))" strokeWidth={2} />
      {/* Data dots */}
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={4} fill="hsl(var(--primary))" />
      ))}
      {/* Labels */}
      {data.map((d, i) => {
        const labelPt = pt(i, r + 22);
        return (
          <g key={i}>
            <text
              x={labelPt.x} y={labelPt.y - 5}
              textAnchor="middle" dominantBaseline="middle"
              fontSize={11} fill="currentColor" fontWeight={600}
            >
              {d.company}
            </text>
            <text
              x={labelPt.x} y={labelPt.y + 8}
              textAnchor="middle" dominantBaseline="middle"
              fontSize={10} fill="currentColor" opacity={0.6}
            >
              {d.count}/{d.total}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function ScheduleStatsCard({ schedule, employees, jobs, shifts }: ScheduleStatsCardProps) {
  const [tab, setTab] = useState<"spider" | "company" | "people">("spider");

  const companyBurden = buildCompanyBurden(schedule, employees);
  const personBurden = buildPersonBurden(schedule, employees);

  const tabs = [
    { key: "spider", label: "Company Mix" },
    { key: "company", label: "Company Burden" },
    { key: "people", label: "Hardest Hits" },
  ] as const;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Schedule Analytics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* Tab bar */}
        <div className="flex gap-1 rounded-lg bg-muted p-1 w-fit">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${tab === t.key
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
                }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Tab: Spider ─────────────────────────────────────────────── */}
        {tab === "spider" && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Radar shows how many people from each company were scheduled vs their total roster.
              Larger area = higher utilisation.
            </p>
            <SpiderChart schedule={schedule} employees={employees} />
            {/* Legend table below chart */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs mt-2">
              {buildSpiderData(schedule, employees).map((d) => (
                <div key={d.company} className="flex items-center justify-between gap-2">
                  <span className="font-medium">{d.company}</span>
                  <span className="text-muted-foreground">
                    {d.count}/{d.total}
                    <span className="ml-1 opacity-60">
                      ({d.total > 0 ? Math.round((d.count / d.total) * 100) : 0}%)
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Tab: Company burden ──────────────────────────────────────── */}
        {tab === "company" && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Total fatigue absorbed by each company's employees. Higher = harder workload.
            </p>
            <div className="space-y-2">
              {companyBurden.map((c, rank) => {
                const maxWorkload = companyBurden[0]?.totalWorkload || 1;
                const pct = Math.round((c.totalWorkload / maxWorkload) * 100);
                return (
                  <div key={c.company} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-4">#{rank + 1}</span>
                        <span className="font-medium">Company {c.company}</span>
                        <span className="text-xs text-muted-foreground">{c.scheduledCount} people</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">avg {c.avgworkload}</span>
                        <span
                          className="text-xs font-semibold rounded-full px-2 py-0.5"
                          style={workloadStyle(c.totalWorkload / Math.max(c.scheduledCount, 1))}
                        >
                          Σ {c.totalWorkload}
                        </span>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    {c.hardestSlot && (
                      <p className="text-xs text-muted-foreground pl-6">
                        Hardest: {c.hardestSlot.jobLabel} / Shift {c.hardestSlot.shiftName}
                        <span
                          className="ml-1.5 inline-block rounded-full px-1.5 py-0.5 text-xs font-medium"
                          style={workloadStyle(c.hardestSlot.workload)}
                        >
                          {c.hardestSlot.workload}
                        </span>
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Tab: Hardest people ──────────────────────────────────────── */}
        {tab === "people" && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              People ranked by workload assigned in this generated schedule.
              Higher means a harder duty today.
            </p>
            {personBurden.slice(0, 10).map((p, i) => (
              <div
                key={p.name}
                className={`flex items-start gap-3 rounded-lg px-3 py-2.5 ${i === 0 ? "bg-destructive/8 border border-destructive/20" :
                  i <= 2 ? "bg-orange-50/60 dark:bg-orange-950/20" : "bg-muted/40"
                  }`}
              >
                <span className="text-xs font-bold text-muted-foreground w-5 pt-0.5">
                  #{i + 1}
                </span>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold truncate">{p.name}</span>
                    <span
                      className="text-xs rounded-full px-2 py-0.5 font-bold shrink-0"
                      style={workloadStyle(p.totalWorkload)}
                    >
                      {p.totalWorkload}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>Co. {p.company}</span>
                    <span>Today's workload {p.totalWorkload}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {p.slots.map((s, si) => (
                      <span
                        key={si}
                        className="inline-block rounded px-1.5 py-0.5 text-xs"
                        style={workloadStyle(s.workload)}
                      >
                        {s.jobLabel} / {s.shiftName}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </CardContent>
    </Card>
  );
}
