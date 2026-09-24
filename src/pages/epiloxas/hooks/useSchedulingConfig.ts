import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getSchedulingConfig } from "@/api/Config.api";
import type { Job, ShiftGroup } from "@/types";
 
interface SchedulingConfigDefaults {
  jobs: Job[];
  shifts: ShiftGroup[];
}
 
export function useSchedulingConfig(defaults?: SchedulingConfigDefaults) {
  const [jobs, setJobs] = useState<Job[]>(defaults?.jobs ?? []);
  const [shifts, setShifts] = useState<ShiftGroup[]>(defaults?.shifts ?? []);
  const [loading, setLoading] = useState(true);
 
  useEffect(() => {
    let cancelled = false;
 
    (async () => {
      try {
        const config = await getSchedulingConfig();
        if (cancelled) return;
        setJobs(config.jobs);
        setShifts(config.shifts);
      } catch (error) {
        console.error("Failed to load scheduling config:", error);
        if (!cancelled) {
          toast.error("Could not load scheduling configuration");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
 
    return () => {
      cancelled = true;
    };
  }, []);
 
  return { jobs, shifts, loading, setJobs, setShifts };
}