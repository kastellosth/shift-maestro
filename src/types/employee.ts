// ─── src/types/employee.ts ───────────────────────────────────────────────────
//
// All employee-specific types. Sits next to your existing types/index.ts.
// Zero imports from anywhere else in the app — this is the base layer.

// ── ESSO batch ────────────────────────────────────────────────────────────────
export type EssoBatch = "Α" | "Β" | "Γ" | "Δ" | "Ε" | "ΣΤ";

// Default entry dates per batch (MM-DD). Β/Γ/Δ unknown — fill manually.
export const ESSO_DEFAULT_ENTRY: Record<EssoBatch, string | null> = {
  "Α":  "01-10",   // 10 January
  "Β":  null,
  "Γ":  null,
  "Δ":  null,
  "Ε":  "09-10",   // 10 September
  "ΣΤ": "11-10",   // 10 November
};

/**
 * Resolves the most recent past ISO date (YYYY-MM-DD) for a given batch.
 * If an override date is provided it takes precedence.
 * Returns null if neither the batch has a default nor an override is given.
 */
export function resolveEntryDate(batch: EssoBatch, override?: string | null): string | null {
  const mmdd = override ?? ESSO_DEFAULT_ENTRY[batch];
  if (!mmdd) return null;
  const today = new Date();
  const [mm, dd] = mmdd.split("-").map(Number);
  let year = today.getFullYear();
  if (new Date(year, mm - 1, dd) > today) year -= 1;
  return `${year}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
}

/** Returns days elapsed since an ISO entry date (always >= 0). */
export function daysInService(entryDateISO: string): number {
  const entry = new Date(entryDateISO);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  entry.setHours(0, 0, 0, 0);
  return Math.max(0, Math.floor((today.getTime() - entry.getTime()) / 86_400_000));
}

// ── I-class ───────────────────────────────────────────────────────────────────
export type IClass = "I1" | "I2" | "I3" | "I4" | "I5";

// ── Delete reason ─────────────────────────────────────────────────────────────
export type DeleteReason = "laid_off" | "changed_battalion";

export const DELETE_REASON_LABELS: Record<DeleteReason, string> = {
  laid_off:          "Laid off / Αποστρατεία",
  changed_battalion: "Changed battalion / Μετάθεση",
};

// ── Employee ──────────────────────────────────────────────────────────────────
export interface Employee {
  id: string;
  name: string;
  surname: string;
  company: number;

  score: number;

  esso: EssoBatch | null;
  essoEntryDate: string | null;
  iClass: IClass | null;
  armed: boolean;

  notes: string | null;
}

export type EmployeeSyncStatus = "new" | "saved" | "dirty";

export interface EmployeeViewModel extends Employee {
  status: EmployeeSyncStatus;
}

// ── Filters ───────────────────────────────────────────────────────────────────
export interface ActiveFilters {
  company: number | null;
  esso:    EssoBatch | null;
  iClass:  IClass | null;
  armed:   boolean | null;
  groupBy: "company" | "esso" | "daysInService" | null;
}

export const EMPTY_FILTERS: ActiveFilters = {
  company: null,
  esso:    null,
  iClass:  null,
  armed:   null,
  groupBy: null,
};

// ── Add-form shape ────────────────────────────────────────────────────────────
export interface EmployeeForm {
  surname:       string;
  name:          string;
  company:       string;
  score:         string;
  esso:          EssoBatch | "";
  essoEntryDate: string;
  iClass:        IClass | "";
  armed:         boolean;
  notes: string;
}

export const DEFAULT_FORM: EmployeeForm = {
  surname:       "",
  name:          "",
  company:       "1",
  score:         "",
  esso:          "",
  essoEntryDate: "",
  iClass:        "",
  armed:         false,
  notes:        "",
};