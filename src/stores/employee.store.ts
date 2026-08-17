// ─── src/stores/employee.store.ts ────────────────────────────────────────────
//
// Replaces the original employee.store.ts.
// Import path: ../types/employee  (resolves from src/stores/ → src/types/)

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { toast } from "sonner";

import {
  EMPTY_FILTERS,
  DEFAULT_FORM,
  daysInService,
} from "../types/employee";

import type {
  Employee,
  EmployeeForm,
  ActiveFilters,
  DeleteReason,
  EmployeeViewModel,
} from "../types/employee";
import { API_BASE } from "@/lib/api";


// ── ESSO / IClass option lists (also exported for components) ─────────────────
export { ESSO_DEFAULT_ENTRY, resolveEntryDate } from "../types/employee";
export type { EssoBatch, IClass, DeleteReason, ActiveFilters, Employee, EmployeeForm } from "../types/employee";

// ── Store shape ───────────────────────────────────────────────────────────────

interface State {
  employees: EmployeeViewModel[];
  loading: boolean;
  saving: boolean;

  search: string;
  selected: Set<string>;

  activeFilters: ActiveFilters;

  /** IDs queued for deletion — non-null means the DeleteReasonModal is open */
  pendingDelete: string[] | null;

  form: EmployeeForm;
  formError: string | null;

  selectedForSchedule: Set<string>;

  // ── Actions ────────────────────────────────────────────────────────────
  setSearch: (v: string) => void;
  setForm: (v: EmployeeForm) => void;
  setFilters: (f: Partial<ActiveFilters>) => void;
  clearFilters: () => void;

  loadFromDB: () => Promise<void>;
  addEmployee: () => void;

  updateEmployee: (
    id: string,
    field: keyof Omit<Employee, "id">,
    value: any,
  ) => void;

  requestDelete: (id: string) => void;
  requestDeleteSelected: () => void;
  confirmDelete: (reason: DeleteReason) => Promise<void>;
  cancelDelete: () => void;

  saveAll: () => Promise<void>;

  toggleSelect: (id: string) => void;
  toggleAll: (displayed: Employee[]) => void;

  toggleSelectForSchedule: (id: string) => void;
  clearSelection: () => void;
  loadByCompany: (company: number) => void;
  loadAllForSchedule: () => void;
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useEmployeeStore = create<State>()(
  devtools((set, get) => ({
    employees: [],
    loading: false,
    saving: false,
    search: "",
    selected: new Set(),
    activeFilters: EMPTY_FILTERS,
    pendingDelete: null,
    form: DEFAULT_FORM,
    formError: null,
    selectedForSchedule: new Set<string>(),

    // ── Basic ─────────────────────────────────────────────────────────────
    setSearch: (v) => set({ search: v }),
    setForm: (v) => set({ form: v }),

    setFilters: (partial) =>
      set((s) => ({ activeFilters: { ...s.activeFilters, ...partial } })),

    clearFilters: () => set({ activeFilters: EMPTY_FILTERS }),

    // ── Load ──────────────────────────────────────────────────────────────
    loadFromDB: async () => {
      set({ loading: true });
      try {
        const res = await fetch(
          `${API_BASE}/employees`
        );

        if (!res.ok) {
          throw new Error(
            `Failed to load employees: ${res.status}`
          );
        }

        const data = await res.json();
        set({
          employees: data.map((e: Employee) => ({
            esso: null,
            essoEntryDate: null,
            iClass: null,
            armed: false,
            ...e,
            status: "saved",
          })),
        });
      } catch {
        toast.error("Failed to load");
      } finally {
        set({ loading: false });
      }
    },

    // ── Add ───────────────────────────────────────────────────────────────
    addEmployee: () => {
      const { form } = get();
      if (!form.surname.trim()) {
        set({ formError: "Surname required" });
        return;
      }
      const newEmp: EmployeeViewModel = {
        id: `local_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        surname: form.surname.trim(),
        name: form.name.trim(),
        company: parseInt(form.company, 10) || 1,
        score: 0,
        esso: form.esso || null,
        essoEntryDate: form.essoEntryDate || null,
        iClass: form.iClass || null,
        armed: form.armed,
        notes: form.notes.trim() || null,
        status: "new",
      };
      set((s) => ({ employees: [...s.employees, newEmp], form: DEFAULT_FORM, formError: null }));
      toast.success(`${newEmp.surname} added`);
    },

    // ── Update ────────────────────────────────────────────────────────────
    updateEmployee: (id, field, value) => {
      set((state) => ({
        employees: state.employees.map(
          (employee) =>
            employee.id === id
              ? {
                ...employee,
                [field]: value,

                // New employees must remain "new"
                // so Save knows to POST them.
                status:
                  employee.status === "new"
                    ? "new"
                    : "dirty",
              }
              : employee
        ),
      }));
    },

    // ── Delete modal flow ─────────────────────────────────────────────────
    requestDelete: (id) => set({ pendingDelete: [id] }),

    requestDeleteSelected: () => {
      const { selected } = get();
      if (!selected.size) return;
      set({ pendingDelete: [...selected] });
    },

    cancelDelete: () => set({ pendingDelete: null }),

    confirmDelete: async (reason) => {
      const { pendingDelete, employees } = get();
      if (!pendingDelete?.length) return;
      console.info(`[Delete] reason=${reason} ids=${pendingDelete.join(",")}`);

      for (const id of pendingDelete) {
        const emp = employees.find((e) => e.id === id);
        if (!emp) continue;
        if (emp.status !== "new") {
          try {
            const res = await fetch(`${API_BASE}/employees/${id}`, { method: "DELETE" });
            if (!res.ok) { toast.error(`Failed to delete ${emp.surname}`); continue; }
          } catch {
            toast.error(`Failed to delete ${emp.surname}`);
            continue;
          }
        }
        set((s) => ({
          employees: s.employees.filter((e) => e.id !== id),
          selected: new Set([...s.selected].filter((x) => x !== id)),
          selectedForSchedule: new Set([...s.selectedForSchedule].filter((x) => x !== id)),
        }));
      }

      const count = pendingDelete.length;
      toast.success(`${count} employee${count > 1 ? "s" : ""} removed`);
      set({ pendingDelete: null, selected: new Set() });
    },

    // ── Save ──────────────────────────────────────────────────────────────
    saveAll: async () => {
      const { employees, loadFromDB } = get();

      const newEmployees = employees.filter(
        (employee) => employee.status === "new"
      );

      const dirtyEmployees = employees.filter(
        (employee) => employee.status === "dirty"
      );

      if (
        newEmployees.length === 0 &&
        dirtyEmployees.length === 0
      ) {
        toast.info("Nothing to save");
        return;
      }

      set({ saving: true });

      try {
        // ── 1. Create new employees ──────────────────────────

        if (newEmployees.length > 0) {
          const res = await fetch(
            `${API_BASE}/employees`,
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify(
                newEmployees
              ),
            }
          );

          if (!res.ok) {
            throw new Error(
              "Failed to create employees"
            );
          }
        }

        // ── 2. Update edited employees ──────────────────────

        for (const employee of dirtyEmployees) {
          const res = await fetch(
            `${API_BASE}/employees/${employee.id}`,
            {
              method: "PUT",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify(employee),
            }
          );

          if (!res.ok) {
            throw new Error(
              `Failed to update ${employee.surname}`
            );
          }
        }

        // ── 3. Reload canonical DB state ────────────────────

        await loadFromDB();

        toast.success(
          `Saved ${newEmployees.length +
          dirtyEmployees.length
          } employee${newEmployees.length +
            dirtyEmployees.length ===
            1
            ? ""
            : "s"
          }`
        );
      } catch (error) {
        console.error(error);

        toast.error(
          "Failed to save personnel changes"
        );
      } finally {
        set({ saving: false });
      }
    },

    // ── Selection ─────────────────────────────────────────────────────────
    toggleSelect: (id) =>
      set((s) => {
        const sel = new Set(s.selected);
        sel.has(id) ? sel.delete(id) : sel.add(id);
        return { selected: sel };
      }),

    toggleAll: (displayed) =>
      set((s) => ({
        selected:
          s.selected.size === displayed.length
            ? new Set()
            : new Set(displayed.map((e) => e.id)),
      })),

    // ── Scheduler helpers ─────────────────────────────────────────────────
    toggleSelectForSchedule: (id) =>
      set((s) => {
        const sel = new Set(s.selectedForSchedule);
        sel.has(id) ? sel.delete(id) : sel.add(id);
        return { selectedForSchedule: sel };
      }),

    clearSelection: () => set({ selectedForSchedule: new Set<string>() }),
    loadByCompany: (company) =>
      set({ selectedForSchedule: new Set(get().employees.filter((e) => e.company === company).map((e) => e.id)) }),
    loadAllForSchedule: () =>
      set({ selectedForSchedule: new Set(get().employees.map((e) => e.id)) }),
  })),
);

// ── Selector: displayed + filtered + sorted ───────────────────────────────────
// Use this in components:  const displayed = useEmployeeStore(selectDisplayed);

export function selectDisplayed(s: State): Employee[] {
  const q = s.search.toLowerCase();
  const f = s.activeFilters;

  return s.employees
    .filter((e) => {
      if (q && !(
        e.name.toLowerCase().includes(q) ||
        e.surname.toLowerCase().includes(q) ||
        String(e.company).includes(q)
      )) return false;
      if (f.company !== null && e.company !== f.company) return false;
      if (f.esso !== null && e.esso !== f.esso) return false;
      if (f.iClass !== null && e.iClass !== f.iClass) return false;
      if (f.armed !== null && e.armed !== f.armed) return false;
      return true;
    })
    .sort((a, b) => {
      if (f.groupBy === "company") return a.company - b.company;
      if (f.groupBy === "esso") return (a.esso ?? "").localeCompare(b.esso ?? "");
      if (f.groupBy === "daysInService") {
        const da = a.essoEntryDate ? daysInService(a.essoEntryDate) : 0;
        const db = b.essoEntryDate ? daysInService(b.essoEntryDate) : 0;
        return db - da;
      }
      return 0;
    });
}