import type { EmployeeViewModel } from "../types/employee";

export function getEmployeesToSave(
  employees: EmployeeViewModel[],
) {
  return {
    newEmployees: employees.filter(
      (employee) => employee.status === "new",
    ),
    dirtyEmployees: employees.filter(
      (employee) => employee.status === "dirty",
    ),
  };
}