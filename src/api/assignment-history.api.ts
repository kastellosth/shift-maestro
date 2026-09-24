import { API_BASE } from "@/lib/api";
import type { Job, ShiftGroup } from "@/types";
 
export interface EmployeeHistoryEntry {
  assignmentId: string;
  date: Date;
  job: Job;
  shiftGroup: ShiftGroup;
  pinned: boolean;
}

interface RawEmployeeHistoryEntry {
  assignmentId: string;
  date: string;
  job: Job;
  shiftGroup: ShiftGroup;
  pinned: boolean;
}

export async function getEmployeeAssignmentHistory(
  employeeId: string,
): Promise<EmployeeHistoryEntry[]> {
  const response = await fetch(
    `${API_BASE}/assignment-history/${employeeId}`,
  );

  if (!response.ok) {
    throw new Error(
      `History request failed: ${response.status}`,
    );
  }

  const data: RawEmployeeHistoryEntry[] = await response.json();

  return data.map((entry) => ({
    ...entry,
    date: new Date(entry.date),
  }));
}