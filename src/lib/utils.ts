import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Employee } from "../types";


export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function fullName(
  employee: Employee
): string {
  return `${employee.surname} ${employee.name}`.trim();
}
