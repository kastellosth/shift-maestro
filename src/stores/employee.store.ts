import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { toast } from "sonner";
import { EMPTY_FILTERS, DEFAULT_FORM } from "../types/employee";
import type { Employee, EmployeeForm, ActiveFilters, DeleteReason, EmployeeViewModel } from "../types/employee";
import { getEmployees, createEmployees, updateEmployee as updateEmployeeApi, deleteEmployee, } from "../api/employee.api";
import { createEmployeeFromForm } from "./employee.mapper";
import { getEmployeesToSave } from "./employee.utils";

export { ESSO_DEFAULT_ENTRY, resolveEntryDate } from "../types/employee";
export type { EssoBatch, IClass, DeleteReason, ActiveFilters, Employee, EmployeeForm } from "../types/employee";

type EditableEmployeeField = keyof Omit<Employee, "id">;

type EmployeeFieldValue<K extends EditableEmployeeField> =
  Employee[K];

// ── Store shape ───────────────────────────────────────────────────────────────

interface State {
  employees: EmployeeViewModel[];
  loading: boolean;
  saving: boolean;
  search: string;
  selected: Set<string>;
  activeFilters: ActiveFilters;
  pendingDelete: string[] | null;
  form: EmployeeForm;
  formError: string | null;

  // ── Actions ────────────────────────────────────────────────────────────
  setSearch: (v: string) => void;
  setForm: (v: EmployeeForm) => void;
  setFilters: (f: Partial<ActiveFilters>) => void;
  clearFilters: () => void;
  loadFromDB: () => Promise<void>;
  addEmployee: () => void;
  updateEmployee: <K extends EditableEmployeeField>(
    id: string,
    field: K,
    value: EmployeeFieldValue<K>,
  ) => void;

  requestDelete: (id: string) => void;
  requestDeleteSelected: () => void;
  confirmDelete: (reason: DeleteReason) => Promise<void>;
  cancelDelete: () => void;
  saveAll: () => Promise<void>;
  toggleSelect: (id: string) => void;
  toggleAll: (displayed: Employee[]) => void;
}


function toPayload(employee: EmployeeViewModel) {
  const {
    id: _id,
    score: _score,
    status: _status,
    ...payload
  } = employee;

  return payload;
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

    setSearch: (v) => set({ search: v }),
    setForm: (v) => set({ form: v }),

    setFilters: (partial) =>
      set((s) => ({ activeFilters: { ...s.activeFilters, ...partial } })),

    clearFilters: () => set({ activeFilters: EMPTY_FILTERS }),

    loadFromDB: async () => {
      set({ loading: true });

      try {
        const data = await getEmployees();

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

      const newEmp = createEmployeeFromForm(
        form,
        `local_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      );

      set((state) => ({
        employees: [...state.employees, newEmp],
        form: DEFAULT_FORM,
        formError: null,
      }));

      toast.success(`${newEmp.surname} added`);
    },

    updateEmployee: <K extends EditableEmployeeField>(
      id: string,
      field: K,
      value: EmployeeFieldValue<K>,
    ) => {
      set((state) => ({
        employees: state.employees.map((employee) =>
          employee.id === id
            ? {
              ...employee,
              [field]: value,
              status:
                employee.status === "new"
                  ? "new"
                  : "dirty",
            }
            : employee,
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

      if (!pendingDelete?.length) {
        return;
      }

      console.info(
        `[Delete] reason=${reason} ids=${pendingDelete.join(",")}`,
      );

      const employeesToDelete = employees.filter((employee) =>
        pendingDelete.includes(employee.id),
      );

      set({ saving: true });

      try {
        for (const employee of employeesToDelete) {
          if (employee.status === "new") {
            continue;
          }

          await deleteEmployee(employee.id);
        }

        const deletedIds = new Set(
          employeesToDelete.map((employee) => employee.id),
        );

        set((state) => ({
          employees: state.employees.filter(
            (employee) => !deletedIds.has(employee.id),
          ),
          selected: new Set(
            [...state.selected].filter(
              (id) => !deletedIds.has(id),
            ),
          ),

          pendingDelete: null,
          saving: false,
        }));

        const count = employeesToDelete.length;

        toast.success(
          `${count} employee${count === 1 ? "" : "s"} removed`,
        );
      } catch (error) {
        console.error(error);

        set({ saving: false });

        toast.error("Failed to delete personnel");
      }
    },
    // ── Save ──────────────────────────────────────────────────────────────
    saveAll: async () => {
      const { employees, loadFromDB } = get();

      const { newEmployees, dirtyEmployees } =
        getEmployeesToSave(employees);

      if (
        newEmployees.length === 0 &&
        dirtyEmployees.length === 0
      ) {
        toast.info("Nothing to save");
        return;
      }

      set({ saving: true });

      try {
        if (newEmployees.length > 0) {
          await createEmployees(
            newEmployees.map(toPayload),
          );
        }

        for (const employee of dirtyEmployees) {
          await updateEmployeeApi(
            employee.id,
            toPayload(employee),
          );
        }

        await loadFromDB();

        const savedCount =
          newEmployees.length + dirtyEmployees.length;

        toast.success(
          `Saved ${savedCount} employee${savedCount === 1 ? "" : "s"
          }`,
        );
      } catch (error) {
        console.error(error);
        toast.error("Failed to save personnel changes");
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
      set((state) => {
        const allSelected =
          displayed.length > 0 &&
          displayed.every((employee) =>
            state.selected.has(employee.id),
          );

        return {
          selected: allSelected
            ? new Set()
            : new Set(displayed.map((employee) => employee.id)),
        };
      }),

  })),
);