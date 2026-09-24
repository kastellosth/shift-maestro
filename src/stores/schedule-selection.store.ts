import { create } from "zustand";

interface ScheduleSelectionState {
  selectedEmployeeIds: Set<string>;

  toggle: (id: string) => void;
  clear: () => void;
  select: (ids: string[]) => void;
}

export const useScheduleSelectionStore =
  create<ScheduleSelectionState>((set) => ({
    selectedEmployeeIds: new Set<string>(),

    toggle: (id) =>
      set((state) => {
        const selected = new Set(state.selectedEmployeeIds);

        if (selected.has(id)) {
          selected.delete(id);
        } else {
          selected.add(id);
        }

        return {
          selectedEmployeeIds: selected,
        };
      }),

    clear: () =>
      set({
        selectedEmployeeIds: new Set<string>(),
      }),

    select: (ids) =>
      set({
        selectedEmployeeIds: new Set(ids),
      }),
  }));