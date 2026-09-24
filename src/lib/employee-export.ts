import type { EmployeeViewModel } from "@/types/employee";

export function exportEmployees(
  employees: EmployeeViewModel[],
): void {
  const blob = new Blob(
    [JSON.stringify(employees, null, 2)],
    {
      type: "application/json",
    },
  );

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "employees.json";
  link.click();

  URL.revokeObjectURL(url);
}