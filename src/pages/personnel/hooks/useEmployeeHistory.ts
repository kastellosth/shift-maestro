// ─── pages/personnel/hooks/useEmployeeHistory.ts ──────────────────────────────
//
// Owns the "view assignment history" modal flow: which employee is being
// viewed, the fetched history, and the loading state. Pulled out of
// PersonnelPage.tsx so the page doesn't carry UI-orchestration state that
// has nothing to do with composing the page layout.

import { useState } from "react";
import {
  getEmployeeAssignmentHistory,
  type EmployeeHistoryEntry,
} from "@/api/assignment-history.api";
import type { EmployeeViewModel } from "@/types/employee";

export function useEmployeeHistory() {
  const [employee, setEmployee] = useState<EmployeeViewModel | null>(null);
  const [history, setHistory] = useState<EmployeeHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const view = async (target: EmployeeViewModel) => {
    setEmployee(target);
    setHistory([]);
    setLoading(true);

    try {
      const entries = await getEmployeeAssignmentHistory(target.id);
      setHistory(entries);
    } catch (error) {
      console.error("Failed to load employee history:", error);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const close = () => {
    setEmployee(null);
    setHistory([]);
  };

  return { employee, history, loading, view, close };
}