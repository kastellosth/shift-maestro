import { resolveEntryDate } from "../types/employee";
import type {
  EmployeeForm,
  EmployeeViewModel,
} from "../types/employee";

export function createEmployeeFromForm(
  form: EmployeeForm,
  id: string,
): EmployeeViewModel {
  return {
    id,
    surname: form.surname.trim(),
    name: form.name.trim(),
    company: parseInt(form.company, 10) || 1,
    score: 0,
    esso: form.esso || null,
    essoEntryDate: form.esso
      ? resolveEntryDate(form.esso, form.essoEntryDate || null)
      : form.essoEntryDate || null,
    iClass: form.iClass || null,
    armed: form.armed,
    notes: form.notes.trim() || null,
    status: "new",
  };
}