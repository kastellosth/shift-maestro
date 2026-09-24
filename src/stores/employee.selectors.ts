import { daysInService } from "../types/employee";
import type {
  ActiveFilters,
  EmployeeViewModel,
} from "../types/employee";

export function filterEmployees(
  employees: EmployeeViewModel[],
  search: string,
  filters: ActiveFilters,
): EmployeeViewModel[] {
  const query = search.trim().toLowerCase();

  return employees.filter((employee) => {
    if (
      query &&
      !employee.name.toLowerCase().includes(query) &&
      !employee.surname.toLowerCase().includes(query) &&
      !String(employee.company).includes(query)
    ) {
      return false;
    }

    if (
      filters.company !== null &&
      employee.company !== filters.company
    ) {
      return false;
    }

    if (filters.esso !== null && employee.esso !== filters.esso) {
      return false;
    }

    if (
      filters.iClass !== null &&
      employee.iClass !== filters.iClass
    ) {
      return false;
    }

    if (
      filters.armed !== null &&
      employee.armed !== filters.armed
    ) {
      return false;
    }

    return true;
  });
}

export function sortEmployees(
  employees: EmployeeViewModel[],
  groupBy: ActiveFilters["groupBy"],
): EmployeeViewModel[] {
  return [...employees].sort((a, b) => {
    if (groupBy === "company") {
      return a.company - b.company;
    }

    if (groupBy === "esso") {
      return (a.esso ?? "").localeCompare(b.esso ?? "");
    }

    if (groupBy === "daysInService") {
      const daysA = a.essoEntryDate
        ? daysInService(a.essoEntryDate)
        : 0;

      const daysB = b.essoEntryDate
        ? daysInService(b.essoEntryDate)
        : 0;

      return daysB - daysA;
    }

    return 0;
  });
}

export function selectDisplayed(
  employees: EmployeeViewModel[],
  search: string,
  filters: ActiveFilters,
): EmployeeViewModel[] {
  const filtered = filterEmployees(
    employees,
    search,
    filters,
  );

  return sortEmployees(filtered, filters.groupBy);
}