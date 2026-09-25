import { API_BASE } from "@/lib/api";
import type { buildFinalizeSchedulePayload } from "@/lib/scheduling/finalize";

type FinalizeSchedulePayload = ReturnType<typeof buildFinalizeSchedulePayload>;

export interface FinalizeScheduleResult {
  created: number;
  assignments: unknown[];
}

export async function finalizeSchedule(
  payload: FinalizeSchedulePayload,
): Promise<FinalizeScheduleResult> {
  const response = await fetch(`${API_BASE}/assignments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error ?? "Failed to finalize schedule");
  }

  return data;
}