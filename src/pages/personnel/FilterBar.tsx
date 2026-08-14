// ─── components/personnel/FilterBar.tsx ──────────────────────────────────────
//
// Multi-filter bar for the Personnel Manager roster.
//
// Design decisions:
//   • Each filter dimension is a row of toggle-pills. Active pills are
//     highlighted. Clicking an active pill de-selects it (acts as a toggle).
//   • "Group by" is its own section — it changes sort order, not visibility.
//   • Active filters are shown as removable chips below the filter rows so
//     the user always sees what is active without expanding anything.
//   • All state lives in the Zustand store (activeFilters). This component
//     is purely a view of that state + dispatches setFilters / clearFilters.

import { X, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEmployeeStore } from "../../stores/employee.store";
import type { EssoBatch, IClass } from "../../types/employee";

// ── Static option lists ───────────────────────────────────────────────────────

const ESSO_OPTIONS: EssoBatch[] = ["Α", "Β", "Γ", "Δ", "Ε", "ΣΤ"];
const ICLASS_OPTIONS: IClass[]  = ["I1", "I2", "I3", "I4", "I5"];
const COMPANY_OPTIONS            = [1, 2, 3, 4];   // extend as needed

// ── Component ─────────────────────────────────────────────────────────────────

export function FilterBar() {
  const filters     = useEmployeeStore((s) => s.activeFilters);
  const setFilters  = useEmployeeStore((s) => s.setFilters);
  const clearFilters = useEmployeeStore((s) => s.clearFilters);

  // Count active filters (excluding groupBy which is a sort, not a hide)
  const activeCount = [
    filters.company !== null,
    filters.esso    !== null,
    filters.iClass  !== null,
    filters.armed   !== null,
  ].filter(Boolean).length;

  // ── Toggle helpers ──────────────────────────────────────────────────────
  const toggle = <K extends "company" | "esso" | "iClass" | "armed">(
    key: K,
    value: NonNullable<typeof filters[K]>,
  ) => {
    // If already active → deselect (set to null)
    setFilters({ [key]: filters[key] === value ? null : value } as any);
  };

  // ── Pill styling ────────────────────────────────────────────────────────
  const pill = (active: boolean) =>
    `px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer select-none ${
      active
        ? "bg-primary text-primary-foreground border-primary"
        : "bg-background text-muted-foreground border-border hover:border-primary/60 hover:text-foreground"
    }`;

  // ── Active chip list (for summary row) ─────────────────────────────────
  type Chip = { label: string; onRemove: () => void };
  const chips: Chip[] = [];

  if (filters.company !== null)
    chips.push({ label: `Co. ${filters.company}`, onRemove: () => setFilters({ company: null }) });
  if (filters.esso !== null)
    chips.push({ label: `ΕΣΣΟ ${filters.esso}`, onRemove: () => setFilters({ esso: null }) });
  if (filters.iClass !== null)
    chips.push({ label: filters.iClass, onRemove: () => setFilters({ iClass: null }) });
  if (filters.armed !== null)
    chips.push({ label: filters.armed ? "Armed" : "Unarmed", onRemove: () => setFilters({ armed: null }) });
  if (filters.groupBy !== null)
    chips.push({
      label: `Group: ${filters.groupBy === "daysInService" ? "Days in service" : filters.groupBy}`,
      onRemove: () => setFilters({ groupBy: null }),
    });

  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-sm font-medium">Filters</span>
          {activeCount > 0 && (
            <span className="ml-1 rounded-full bg-primary px-1.5 py-0.5 text-xs text-primary-foreground font-semibold">
              {activeCount}
            </span>
          )}
        </div>
        {chips.length > 0 && (
          <button
            onClick={clearFilters}
            className="text-xs text-muted-foreground hover:text-destructive transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {/* ── Filter rows ─────────────────────────────────────────────── */}
      <div className="space-y-2.5">

        {/* Company */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground w-20 shrink-0">Company</span>
          <div className="flex gap-1.5 flex-wrap">
            {COMPANY_OPTIONS.map((c) => (
              <button
                key={c}
                onClick={() => toggle("company", c)}
                className={pill(filters.company === c)}
              >
                Co. {c}
              </button>
            ))}
          </div>
        </div>

        {/* ΕΣΣΟ */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground w-20 shrink-0">ΕΣΣΟ</span>
          <div className="flex gap-1.5 flex-wrap">
            {ESSO_OPTIONS.map((e) => (
              <button
                key={e}
                onClick={() => toggle("esso", e)}
                className={pill(filters.esso === e)}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        {/* I-class */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground w-20 shrink-0">I-class</span>
          <div className="flex gap-1.5 flex-wrap">
            {ICLASS_OPTIONS.map((i) => (
              <button
                key={i}
                onClick={() => toggle("iClass", i)}
                className={pill(filters.iClass === i)}
              >
                {i}
              </button>
            ))}
          </div>
        </div>

        {/* Armed status */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground w-20 shrink-0">Armed</span>
          <div className="flex gap-1.5">
            <button
              onClick={() => toggle("armed", true)}
              className={pill(filters.armed === true)}
            >
              Armed
            </button>
            <button
              onClick={() => toggle("armed", false)}
              className={pill(filters.armed === false)}
            >
              Unarmed
            </button>
          </div>
        </div>

        {/* Group by */}
        <div className="flex items-center gap-2 flex-wrap border-t pt-2.5">
          <span className="text-xs text-muted-foreground w-20 shrink-0">Group by</span>
          <div className="flex gap-1.5 flex-wrap">
            {(["company", "esso", "daysInService"] as const).map((g) => (
              <button
                key={g}
                onClick={() => setFilters({ groupBy: filters.groupBy === g ? null : g })}
                className={pill(filters.groupBy === g)}
              >
                {g === "daysInService" ? "Days in service" : g.charAt(0).toUpperCase() + g.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Active filter chips ──────────────────────────────────────── */}
      {chips.length > 0 && (
        <div className="flex flex-wrap gap-1.5 border-t pt-2.5">
          {chips.map((chip) => (
            <span
              key={chip.label}
              className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
            >
              {chip.label}
              <button onClick={chip.onRemove} className="ml-0.5 hover:text-destructive transition-colors">
                <X className="h-2.5 w-2.5" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
