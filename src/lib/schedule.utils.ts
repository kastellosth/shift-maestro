// src/lib/schedule.utils.ts

import type { Employee } from "../types";

export function fullName(
  employee: Employee
): string {
  return `${employee.surname} ${employee.name}`.trim();
}