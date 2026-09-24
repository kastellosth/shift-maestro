import type { Employee } from "../types/employee";
import { API_BASE } from "@/lib/api";

export type CreateEmployeePayload = Omit<
  Employee,
  "id" | "score"
>;

export type UpdateEmployeePayload = Partial<
  Omit<Employee, "id" | "score">
>;

export async function getEmployees(): Promise<Employee[]> {
  const response = await fetch(`${API_BASE}/employees`);

  if (!response.ok) {
    throw new Error(
      `Failed to load employees: ${response.status}`,
    );
  }

  return response.json();
}

export async function createEmployees(
  employees: CreateEmployeePayload[],
): Promise<void> {
  const response = await fetch(`${API_BASE}/employees`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(employees),
  });

  if (!response.ok) {
    throw new Error("Failed to create employees");
  }
}

export async function updateEmployee(
  id: string,
  employee: UpdateEmployeePayload,
): Promise<Employee> {
  const response = await fetch(
    `${API_BASE}/employees/${id}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(employee),
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to update employee ${id}`);
  }

  return response.json();
}

export async function deleteEmployee(
  id: string,
): Promise<void> {
  const response = await fetch(
    `${API_BASE}/employees/${id}`,
    {
      method: "DELETE",
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to delete employee ${id}`);
  }
}