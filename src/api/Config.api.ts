import { API_BASE } from "@/lib/api";
import type { Job, ShiftGroup } from "@/types";

export interface SchedulingConfig {
  jobs: Job[];
  shifts: ShiftGroup[];
}

export async function getSchedulingConfig(): Promise<SchedulingConfig> {
  const response = await fetch(`${API_BASE}/config`);

  if (!response.ok) {
    throw new Error(`Failed to load config: ${response.status}`);
  }

  return response.json();
}

export async function updateSchedulingConfig(
  config: SchedulingConfig,
): Promise<SchedulingConfig> {
  const response = await fetch(`${API_BASE}/config`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(config),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error ?? "Failed to save configuration");
  }

  return data;
}