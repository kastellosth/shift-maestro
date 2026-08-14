import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Upload, Sparkles, Download, GripVertical, X,
  Send, Plus, Trash2, Settings2, AlertTriangle, CheckCircle2,
  CalendarX, Shield, BarChart2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { format, eachDayOfInterval, getDay } from "date-fns";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DaySlot {
  count: number; // 0 = REST
}

interface PersonConstraints {
  maxShifts?: number;          // cap for this entire period (undefined = unlimited)
  blockedWeekdays: number[];   // 0=Sun,1=Mon,...,6=Sat
  blockedDates: string[];      // specific "yyyy-MM-dd" dates (unavailable)
  preferredDates: string[];    // specific "yyyy-MM-dd" dates (pre-arranged / must work)
}

const defaultConstraints = (): PersonConstraints => ({
  maxShifts: undefined,
  blockedWeekdays: [],
  blockedDates: [],
  preferredDates: [],
});

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// ─── Pattern presets ──────────────────────────────────────────────────────────

interface PatternPreset {
  label: string;       // e.g. "1 on / 1 off"
  description: string; // short explanation
  slots: DaySlot[];
}

const PATTERN_PRESETS: PatternPreset[] = [
  {
    label: "1 on / 1 off",
    description: "Every other day — highest frequency",
    slots: [{ count: 1 }, { count: 0 }],
  },
  {
    label: "1 on / 2 off",
    description: "One day on, two days rest — moderate load",
    slots: [{ count: 1 }, { count: 0 }, { count: 0 }],
  },
  {
    label: "1 on / 3 off",
    description: "One day on, three days rest — light load",
    slots: [{ count: 1 }, { count: 0 }, { count: 0 }, { count: 0 }],
  },
  {
    label: "2 on / 1 off",
    description: "Two days on, one day rest",
    slots: [{ count: 1 }, { count: 1 }, { count: 0 }],
  },
  {
    label: "2 on / 2 off",
    description: "Two days on, two days rest",
    slots: [{ count: 1 }, { count: 1 }, { count: 0 }, { count: 0 }],
  },
  {
    label: "3 on / 1 off",
    description: "Three days on, one day rest",
    slots: [{ count: 1 }, { count: 1 }, { count: 1 }, { count: 0 }],
  },
  {
    label: "5 on / 2 off",
    description: "Classic workweek — weekdays only",
    slots: [{ count: 1 }, { count: 1 }, { count: 1 }, { count: 1 }, { count: 1 }, { count: 0 }, { count: 0 }],
  },
  {
    label: "Every day",
    description: "Someone assigned every single day",
    slots: [{ count: 1 }],
  },
];

/**
 * Given the full schedule and a person's name, build a compact pattern string
 * like "W · R · R · W · R" representing their personal on/off sequence.
 */
const buildPersonPattern = (
  schedule: Record<string, string[]>,
  name: string,
  days: Date[]
): { pattern: string[]; workDays: number; restDays: number } => {
  const pattern: string[] = [];
  let workDays = 0;
  let restDays = 0;

  days.forEach((d) => {
    const key = format(d, "yyyy-MM-dd");
    const assigned = schedule[key] ?? [];
    if (assigned[0] === "REST" || !assigned.includes(name)) {
      pattern.push("off");
      restDays++;
    } else {
      pattern.push("on");
      workDays++;
    }
  });

  return { pattern, workDays, restDays };
};

/**
 * Compress a pattern array into a human-readable run-length string.
 * e.g. ["on","on","off","off","on"] → "2 on · 2 off · 1 on"
 */
const compressPattern = (pattern: string[]): string => {
  if (pattern.length === 0) return "—";
  const runs: { type: string; count: number }[] = [];
  pattern.forEach((p) => {
    const last = runs[runs.length - 1];
    if (last && last.type === p) last.count++;
    else runs.push({ type: p, count: 1 });
  });
  return runs.map((r) => `${r.count} ${r.type}`).join(" · ");
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const computeShiftCounts = (
  schedule: Record<string, string[]>,
  names: string[]
): Record<string, number> => {
  const counts: Record<string, number> = {};
  names.forEach((n) => (counts[n] = 0));
  Object.values(schedule).forEach((assigned) => {
    assigned.forEach((name) => {
      if (name !== "REST") counts[name] = (counts[name] ?? 0) + 1;
    });
  });
  return counts;
};

/**
 * Fair scheduling algorithm — preferred dates pre-reserved, then least-assigned-first.
 *
 * Key insight: preferred dates must be guaranteed BEFORE fair distribution runs.
 * We pre-reserve their quota in each person's budget so fair fill never uses them up.
 *
 * Order of priority on each day:
 *   1. Preferred/pre-arranged people (locked in, count toward max)
 *   2. Remaining slots filled fairly (least-assigned first, respecting blocked + max)
 *
 * A preferred date overrides a REST slot — if someone is pre-arranged on a rest day,
 * they still get assigned (slot expands to fit them).
 */
const generateFairSchedule = (
  names: string[],
  days: Date[],
  slots: DaySlot[],
  constraints: Record<string, PersonConstraints>
): { schedule: Record<string, string[]>; warnings: string[] } => {
  const counts: Record<string, number> = {};
  names.forEach((n) => (counts[n] = 0));

  // Pre-reserve: count how many preferred dates each person has so fair fill
  // never steals shifts that belong to pre-arranged days.
  const reservedForPreferred: Record<string, number> = {};
  names.forEach((n) => {
    const c = constraints[n] ?? defaultConstraints();
    reservedForPreferred[n] = c.preferredDates.length;
  });

  const schedule: Record<string, string[]> = {};
  const warnings: string[] = [];

  days.forEach((day, dayIndex) => {
    const key = format(day, "yyyy-MM-dd");
    const weekday = getDay(day);
    const slot = slots[dayIndex % slots.length];

    // Who is pre-arranged for today?
    const preferredToday = names.filter((name) => {
      const c = constraints[name] ?? defaultConstraints();
      return c.preferredDates.includes(key);
    });

    const isRestDay = slot.count === 0 && preferredToday.length === 0;
    if (isRestDay) {
      schedule[key] = ["REST"];
      return;
    }

    const assigned: string[] = [];

    // ── Step 1: Lock pre-arranged people ──────────────────────────────────
    preferredToday.forEach((name) => {
      if (assigned.includes(name)) return;
      const c = constraints[name] ?? defaultConstraints();
      // Respect maxShifts — pre-arranged days are the shifts
      if (c.maxShifts !== undefined && counts[name] >= c.maxShifts) {
        warnings.push(`${name} is pre-arranged on ${key} but already at max shifts — skipped`);
        return;
      }
      counts[name]++;
      // Decrement the reservation so it no longer blocks fair-fill budget
      reservedForPreferred[name] = Math.max(0, (reservedForPreferred[name] ?? 0) - 1);
      assigned.push(name);
    });

    // ── Step 2: Fill remaining slots fairly ───────────────────────────────
    const slotsToFill = Math.max(slot.count, assigned.length); // never shrink below pre-arranged
    for (let p = assigned.length; p < slotsToFill; p++) {
      // Available budget for fair-fill = maxShifts - already assigned - still-pending preferred days
      const eligible = names.filter((name) => {
        if (assigned.includes(name)) return false;
        const c = constraints[name] ?? defaultConstraints();
        if (c.blockedDates.includes(key)) return false;
        if (c.blockedWeekdays.includes(weekday)) return false;
        if (c.maxShifts !== undefined) {
          const pending = reservedForPreferred[name] ?? 0;
          const available = c.maxShifts - counts[name] - pending;
          if (available <= 0) return false;
        }
        return true;
      });

      if (eligible.length === 0) {
        // Fallback: relax the budget reservation (keep hard blocks)
        const fallback = names.filter((name) => {
          if (assigned.includes(name)) return false;
          const c = constraints[name] ?? defaultConstraints();
          if (c.blockedDates.includes(key)) return false;
          if (c.blockedWeekdays.includes(weekday)) return false;
          if (c.maxShifts !== undefined && counts[name] >= c.maxShifts) return false;
          return true;
        });

        if (fallback.length === 0) {
          warnings.push(`No available person for ${key} slot ${p + 1} — left empty`);
          assigned.push("—");
        } else {
          fallback.sort((a, b) => counts[a] - counts[b] || a.localeCompare(b));
          const chosen = fallback[0];
          warnings.push(`${chosen} exceeded max shifts on ${key} (no other option)`);
          counts[chosen]++;
          assigned.push(chosen);
        }
      } else {
        eligible.sort((a, b) => counts[a] - counts[b] || a.localeCompare(b));
        const chosen = eligible[0];
        counts[chosen]++;
        assigned.push(chosen);
      }
    }

    schedule[key] = assigned;
  });

  return { schedule, warnings };
};

// ─── Component ────────────────────────────────────────────────────────────────

const SecondOffice = () => {
  const navigate = useNavigate();

  const [names, setNames] = useState<string[]>([]);
  const [nameInput, setNameInput] = useState("");
  const [constraints, setConstraints] = useState<Record<string, PersonConstraints>>({});
  const [expandedPerson, setExpandedPerson] = useState<string | null>(null);

  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [slots, setSlots] = useState<DaySlot[]>([{ count: 2 }]);

  const [schedule, setSchedule] = useState<Record<string, string[]> | null>(null);
  const [scheduleWarnings, setScheduleWarnings] = useState<string[]>([]);
  const [dragItem, setDragItem] = useState<{ date: string; index: number } | null>(null);
  const [editingCell, setEditingCell] = useState<{ date: string; index: number } | null>(null);
  const [viewingPattern, setViewingPattern] = useState<string | null>(null);

  // Close dropdown on outside click — use capture=false + a small delay
  // so the opening click doesn't immediately re-close the dropdown.
  useEffect(() => {
    if (!editingCell) return;
    let mounted = true;
    const handler = (e: MouseEvent) => {
      // Ignore the very first event that opened the dropdown
      if (!mounted) return;
      const target = e.target as HTMLElement;
      // If the click is inside a popover/dropdown (z-50), don't close
      if (target.closest(".editing-dropdown")) return;
      setEditingCell(null);
    };
    // Small timeout so the current click event finishes first
    const id = setTimeout(() => {
      document.addEventListener("mousedown", handler);
    }, 0);
    return () => {
      mounted = false;
      clearTimeout(id);
      document.removeEventListener("mousedown", handler);
    };
  }, [editingCell]);

  // ── Derived ──────────────────────────────────────────────────────────────

  const shiftCounts = useMemo(
    () => (schedule ? computeShiftCounts(schedule, names) : null),
    [schedule, names]
  );

  const maxShifts = shiftCounts ? Math.max(1, ...Object.values(shiftCounts)) : 1;
  const minShifts = shiftCounts ? Math.min(...Object.values(shiftCounts)) : 0;
  const fairnessGap = maxShifts - minShifts;

  const days = useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) return [];
    return eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
  }, [dateRange]);

  // ── Personnel ─────────────────────────────────────────────────────────────

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const parsed = text.split("\n").map((l) => l.trim()).filter(Boolean);
      const list = parsed[0]?.toLowerCase().includes("name") ? parsed.slice(1) : parsed;
      setNames(list);
      setSchedule(null);
      toast.success(`${list.length} names loaded`);
    };
    reader.readAsText(file);
  };

  const addName = () => {
    const trimmed = nameInput.trim();
    if (!trimmed || names.includes(trimmed)) return;
    setNames((prev) => [...prev, trimmed]);
    setNameInput("");
  };

  const removeName = (idx: number) => {
    const name = names[idx];
    setNames((prev) => prev.filter((_, i) => i !== idx));
    setConstraints((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  // ── Constraint helpers ────────────────────────────────────────────────────

  const getConstraints = (name: string): PersonConstraints =>
    constraints[name] ?? defaultConstraints();

  const setPersonConstraint = <K extends keyof PersonConstraints>(
    name: string,
    key: K,
    value: PersonConstraints[K]
  ) => {
    setConstraints((prev) => ({
      ...prev,
      [name]: { ...getConstraints(name), [key]: value },
    }));
  };

  const toggleBlockedWeekday = (name: string, day: number) => {
    const current = getConstraints(name).blockedWeekdays;
    const next = current.includes(day) ? current.filter((d) => d !== day) : [...current, day];
    setPersonConstraint(name, "blockedWeekdays", next);
  };

  // ── Slot helpers ──────────────────────────────────────────────────────────

  const addSlot = () => setSlots((prev) => [...prev, { count: 1 }]);
  const removeSlot = (idx: number) =>
    setSlots((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev));
  const updateSlotCount = (idx: number, value: number) =>
    setSlots((prev) => prev.map((s, i) => (i === idx ? { count: Math.max(0, value) } : s)));

  // ── Generate ──────────────────────────────────────────────────────────────

  const generate = () => {
    if (names.length === 0) { toast.error("Add at least one name"); return; }
    if (days.length === 0) { toast.error("Select a date range"); return; }

    const { schedule: result, warnings } = generateFairSchedule(names, days, slots, constraints);
    setSchedule(result);
    setScheduleWarnings(warnings);

    if (warnings.length > 0) {
      toast.warning(`Schedule generated with ${warnings.length} warning(s)`);
    } else {
      toast.success("Schedule generated — perfectly fair!");
    }
  };

  // ── Drag & drop ───────────────────────────────────────────────────────────

  const handleDragStart = (date: string, index: number) => setDragItem({ date, index });

  const handleDrop = (targetDate: string, targetIndex: number) => {
    if (!dragItem || !schedule) return;
    setSchedule((prev) => {
      if (!prev) return prev;
      const srcArr = [...(prev[dragItem.date] ?? [])];
      const tgtArr = dragItem.date === targetDate ? srcArr : [...(prev[targetDate] ?? [])];
      const temp = srcArr[dragItem.index];
      srcArr[dragItem.index] = tgtArr[targetIndex];
      tgtArr[targetIndex] = temp;
      return {
        ...prev,
        [dragItem.date]: srcArr,
        [targetDate]: dragItem.date === targetDate ? srcArr : tgtArr,
      };
    });
    setDragItem(null);
    toast.info("Assignment swapped");
  };

  // ── Replace a single assignment with a chosen name ───────────────────────

  const replaceAssignment = (date: string, index: number, newName: string) => {
    if (!schedule) return;
    setSchedule((prev) => {
      if (!prev) return prev;
      const updated = [...(prev[date] ?? [])];
      updated[index] = newName;
      return { ...prev, [date]: updated };
    });
    setEditingCell(null);
    toast.info(`Updated to ${newName}`);
  };

  // ── Check if a person is assigned on a blocked day (post-drag sanity) ─────

  const isViolation = (name: string, dateKey: string): boolean => {
    if (!schedule) return false;
    const c = getConstraints(name);
    if (c.blockedDates.includes(dateKey)) return true;
    const weekday = getDay(new Date(dateKey + "T12:00:00")); // noon to avoid tz
    if (c.blockedWeekdays.includes(weekday)) return true;
    return false;
  };

  // ── CSV export ────────────────────────────────────────────────────────────

  const downloadCSV = () => {
    if (!schedule) return;
    let csv = "Date,Day,Assigned\n";
    days.forEach((d) => {
      const key = format(d, "yyyy-MM-dd");
      csv += `${key},${format(d, "EEE")},${schedule[key]?.join("; ") || ""}\n`;
    });
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "schedule_2og.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  // ── Calendar HTML export ──────────────────────────────────────────────────

  const downloadCalendar = () => {
    if (!schedule || days.length === 0) return;

    // Group days by year-month
    const months: Map<string, Date[]> = new Map();
    days.forEach((d) => {
      const key = format(d, "yyyy-MM");
      if (!months.has(key)) months.set(key, []);
      months.get(key)!.push(d);
    });

    // Pastel colors cycling per person
    const COLORS = [
      "#dbeafe", "#dcfce7", "#fef9c3", "#fce7f3", "#ede9fe",
      "#ffedd5", "#cffafe", "#d1fae5", "#fef3c7", "#f3e8ff",
      "#fee2e2", "#e0f2fe",
    ];
    const personColor: Record<string, string> = {};
    names.forEach((n, i) => { personColor[n] = COLORS[i % COLORS.length]; });

    const personTextColor: Record<string, string> = {};
    names.forEach((n, i) => {
      // Slightly darker shade for text
      const darks = [
        "#1e40af","#166534","#854d0e","#9d174d","#5b21b6",
        "#9a3412","#155e75","#065f46","#92400e","#6b21a8",
        "#991b1b","#075985",
      ];
      personTextColor[n] = darks[i % darks.length];
    });

    // Build a set of dateKey → [preferred names] for quick lookup in the calendar
    const preferredOnDate: Record<string, string[]> = {};
    names.forEach((n) => {
      const c = constraints[n] ?? defaultConstraints();
      (c.preferredDates ?? []).forEach((d) => {
        if (!preferredOnDate[d]) preferredOnDate[d] = [];
        preferredOnDate[d].push(n);
      });
    });

    const renderMonth = (monthKey: string, monthDays: Date[]): string => {
      const firstDay = monthDays[0];
      const monthLabel = format(firstDay, "MMMM yyyy");

      // Build a full 6-week grid for the month
      const firstDow = getDay(firstDay); // 0=Sun
      const calStart = new Date(firstDay);
      calStart.setDate(firstDay.getDate() - firstDow);

      const cells: { date: Date; inRange: boolean }[] = [];
      for (let i = 0; i < 42; i++) {
        const d = new Date(calStart);
        d.setDate(calStart.getDate() + i);
        const key = format(d, "yyyy-MM");
        cells.push({ date: d, inRange: key === monthKey });
      }

      // Split into rows of 7
      const rows: string[] = [];
      for (let r = 0; r < 6; r++) {
        const rowCells = cells.slice(r * 7, r * 7 + 7).map(({ date, inRange }) => {
          const key = format(date, "yyyy-MM-dd");
          const assigned = schedule[key] ?? [];
          const isRest = assigned[0] === "REST";
          const isWeekend = getDay(date) === 0 || getDay(date) === 6;
          const dayNum = date.getDate();
          const hasPreferred = inRange && (preferredOnDate[key]?.length ?? 0) > 0;

          const badgesHtml = inRange && !isRest && assigned.length > 0
            ? assigned.map((n) => {
                if (n === "—") return `<span style="color:#9ca3af;font-size:10px">—</span>`;
                const isNPreferred = (preferredOnDate[key] ?? []).includes(n);
                const bg = isNPreferred ? "#d1fae5" : (personColor[n] ?? "#f3f4f6");
                const fg = isNPreferred ? "#065f46" : (personTextColor[n] ?? "#374151");
                const pin = isNPreferred ? "✓ " : "";
                return `<span style="display:inline-block;background:${bg};color:${fg};border-radius:4px;padding:1px 5px;font-size:10px;font-weight:600;margin:1px 1px 0 0;white-space:nowrap;">${pin}${n}</span>`;
              }).join("")
            : "";

          const restBadge = inRange && isRest
            ? `<span style="color:#9ca3af;font-size:10px;font-style:italic;">REST</span>`
            : "";

          const cellBg = !inRange ? "#f9fafb"
            : hasPreferred ? "#f0fdf4"
            : isWeekend ? "#f0f9ff"
            : "#ffffff";

          const borderStyle = hasPreferred ? "2px solid #86efac" : "1px solid #e5e7eb";

          return `<td style="border:${borderStyle};vertical-align:top;padding:4px 5px;height:72px;background:${cellBg};opacity:${!inRange ? "0.4" : "1"};">
              <div style="font-size:11px;font-weight:${isWeekend ? "700" : "500"};color:${isWeekend ? "#2563eb" : hasPreferred ? "#166534" : "#374151"};margin-bottom:3px;">${dayNum}${hasPreferred ? ' <span style="font-size:9px;color:#16a34a;">●</span>' : ""}</div>
              <div style="line-height:1.5;">${badgesHtml}${restBadge}</div>
            </td>`;
        }).join("");
        rows.push(`<tr>${rowCells}</tr>`);
      }

      return `
        <div style="margin-bottom:40px;page-break-inside:avoid;">
          <h2 style="font-size:18px;font-weight:700;color:#111827;margin:0 0 10px 0;letter-spacing:-0.3px;">${monthLabel}</h2>
          <table style="width:100%;border-collapse:collapse;table-layout:fixed;">
            <thead>
              <tr>
                ${["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d, i) =>
                  `<th style="padding:5px 0;font-size:11px;font-weight:600;color:${i===0||i===6?"#2563eb":"#6b7280"};text-align:left;border-bottom:2px solid #e5e7eb;">${d}</th>`
                ).join("")}
              </tr>
            </thead>
            <tbody>${rows.join("")}</tbody>
          </table>
        </div>`;
    };

    // Legend
    const legendHtml = names.map((n) => {
      const bg = personColor[n] ?? "#f3f4f6";
      const fg = personTextColor[n] ?? "#374151";
      return `<span style="display:inline-flex;align-items:center;gap:5px;margin:3px 8px 3px 0;">
        <span style="display:inline-block;width:12px;height:12px;border-radius:3px;background:${bg};"></span>
        <span style="font-size:11px;color:${fg};font-weight:600;">${n}</span>
      </span>`;
    }).join("");

    const monthsHtml = Array.from(months.entries())
      .map(([k, d]) => renderMonth(k, d))
      .join("");

    const html = `<!DOCTYPE html>
<html lang="el">
<head>
  <meta charset="UTF-8"/>
  <title>2ο Γραφείο — Schedule Calendar</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #fff; color: #111827; padding: 32px; }
    @media print {
      body { padding: 16px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div style="display:flex;align-items:baseline;justify-content:space-between;margin-bottom:24px;border-bottom:2px solid #111827;padding-bottom:12px;">
    <div>
      <h1 style="font-size:22px;font-weight:800;letter-spacing:-0.5px;">2ο Γραφείο — Schedule</h1>
      <p style="font-size:12px;color:#6b7280;margin-top:3px;">
        ${format(days[0], "dd MMM yyyy")} — ${format(days[days.length - 1], "dd MMM yyyy")}
        &nbsp;·&nbsp; ${days.length} days &nbsp;·&nbsp; ${names.length} personnel
      </p>
    </div>
    <button class="no-print" onclick="window.print()" style="padding:8px 16px;background:#111827;color:#fff;border:none;border-radius:6px;font-size:13px;cursor:pointer;">🖨 Print</button>
  </div>

  <div style="margin-bottom:20px;padding:10px 12px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;">
    <p style="font-size:11px;font-weight:600;color:#6b7280;margin-bottom:6px;">PERSONNEL</p>
    <div>${legendHtml}</div>
  </div>

  <div style="margin-bottom:20px;padding:8px 12px;background:#f0fdf4;border:1px solid #86efac;border-radius:8px;display:flex;align-items:center;gap:10px;">
    <span style="font-size:11px;font-weight:600;color:#166534;">● Green cells</span>
    <span style="font-size:11px;color:#166534;">= Pre-arranged shift (person was locked in before fair distribution)</span>
  </div>

  ${monthsHtml}

  <p style="font-size:10px;color:#9ca3af;margin-top:16px;">Generated by 2ο Γραφείο Scheduling · ${format(new Date(), "dd/MM/yyyy HH:mm")}</p>
</body>
</html>`;

    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "schedule_2og_calendar.html"; a.click();
    URL.revokeObjectURL(url);
    toast.success("Calendar downloaded — open in browser and Print to PDF");
  };

  const patternPreview = slots.map((s) => (s.count === 0 ? "REST" : `${s.count}`)).join(" → ");

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card px-6 py-4">
        <div className="container mx-auto flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold text-foreground">2ο Γραφείο — Calendar Scheduling</h1>
        </div>
      </header>

      <main className="container mx-auto space-y-6 px-6 py-8">

        {/* ── Personnel ── */}
        <Card>
          <CardHeader><CardTitle className="text-base">Personnel</CardTitle></CardHeader>
          <CardContent className="space-y-4">

            {/* Upload + manual add */}
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border-2 border-dashed border-border px-6 py-3 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary">
                <Upload className="h-4 w-4" /> Upload CSV
                <input type="file" accept=".csv,.txt" className="hidden" onChange={handleFileUpload} />
              </label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add name…"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addName()}
                  className="w-52"
                />
                <Button size="sm" onClick={addName} variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Name badges + per-person constraint panel */}
            {names.length > 0 && (
              <div className="space-y-2">
                {names.map((name, i) => {
                  const c = getConstraints(name);
                  const isExpanded = expandedPerson === name;
                  const hasConstraints =
                    c.maxShifts !== undefined ||
                    c.blockedWeekdays.length > 0 ||
                    c.blockedDates.length > 0;

                  return (
                    <div key={name} className="rounded-lg border bg-card">
                      {/* Row */}
                      <div className="flex items-center gap-2 px-3 py-2">
                        <span className="flex-1 text-sm font-medium">{name}</span>

                        {hasConstraints && (
                          <Shield className="h-3.5 w-3.5 text-amber-500" aria-label="Has constraints" />
                        )}

                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 gap-1 text-xs text-muted-foreground"
                          onClick={() => setExpandedPerson(isExpanded ? null : name)}
                        >
                          <Settings2 className="h-3.5 w-3.5" />
                          {isExpanded ? "Done" : "Constraints"}
                        </Button>

                        <button
                          onClick={() => removeName(i)}
                          className="rounded-full p-0.5 text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Expanded constraint panel */}
                      {isExpanded && (
                        <div className="border-t bg-muted/30 px-4 py-4 space-y-4">

                          {/* Max shifts */}
                          <div className="flex items-center gap-3">
                            <label className="w-36 text-xs font-medium text-muted-foreground">
                              Max shifts this period
                            </label>
                            <Input
                              type="number"
                              min={1}
                              placeholder="Unlimited"
                              value={c.maxShifts ?? ""}
                              onChange={(e) => {
                                const v = e.target.value;
                                setPersonConstraint(
                                  name,
                                  "maxShifts",
                                  v === "" ? undefined : Math.max(1, parseInt(v) || 1)
                                );
                              }}
                              className="w-28 text-sm"
                            />
                            {c.maxShifts !== undefined && (
                              <button
                                className="text-xs text-muted-foreground hover:text-destructive"
                                onClick={() => setPersonConstraint(name, "maxShifts", undefined)}
                              >
                                Clear
                              </button>
                            )}
                          </div>

                          {/* Blocked weekdays */}
                          <div className="space-y-1.5">
                            <p className="text-xs font-medium text-muted-foreground">Blocked weekdays</p>
                            <div className="flex gap-1.5 flex-wrap">
                              {WEEKDAY_LABELS.map((label, day) => {
                                const blocked = c.blockedWeekdays.includes(day);
                                return (
                                  <button
                                    key={day}
                                    onClick={() => toggleBlockedWeekday(name, day)}
                                    className={cn(
                                      "rounded-md px-2.5 py-1 text-xs font-medium transition-colors border",
                                      blocked
                                        ? "bg-destructive/10 border-destructive/40 text-destructive"
                                        : "bg-background border-border text-muted-foreground hover:border-primary hover:text-primary"
                                    )}
                                  >
                                    {label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Blocked specific dates */}
                          <div className="space-y-1.5">
                            <p className="text-xs font-medium text-muted-foreground">Blocked specific dates</p>
                            <div className="flex flex-wrap gap-1.5">
                              {c.blockedDates.map((d) => (
                                <Badge key={d} variant="outline" className="gap-1 text-xs border-destructive/40 text-destructive">
                                  <CalendarX className="h-3 w-3" />
                                  {d}
                                  <button
                                    onClick={() =>
                                      setPersonConstraint(
                                        name,
                                        "blockedDates",
                                        c.blockedDates.filter((x) => x !== d)
                                      )
                                    }
                                    className="ml-0.5 hover:text-destructive/70"
                                  >
                                    <X className="h-2.5 w-2.5" />
                                  </button>
                                </Badge>
                              ))}
                              {/* Date picker for blocked dates */}
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button size="sm" variant="outline" className="h-6 gap-1 text-xs">
                                    <Plus className="h-3 w-3" /> Add date
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="multiple"
                                    selected={c.blockedDates.map((d) => new Date(d + "T12:00:00"))}
                                    onSelect={(dates) => {
                                      const formatted = (dates ?? []).map((d) => format(d, "yyyy-MM-dd"));
                                      setPersonConstraint(name, "blockedDates", formatted);
                                    }}
                                    className="p-3 pointer-events-auto"
                                  />
                                </PopoverContent>
                              </Popover>
                            </div>
                          </div>

                          {/* Pre-arranged / preferred dates */}
                          <div className="space-y-1.5">
                            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                              <span className="inline-block h-2 w-2 rounded-sm bg-emerald-500" />
                              Pre-arranged dates
                              <span className="font-normal opacity-60">(must be assigned)</span>
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {(c.preferredDates ?? []).map((d) => (
                                <Badge key={d} variant="outline" className="gap-1 text-xs border-emerald-500/40 text-emerald-700 bg-emerald-50/50 dark:bg-emerald-900/10">
                                  <CheckCircle2 className="h-3 w-3" />
                                  {d}
                                  <button
                                    onClick={() =>
                                      setPersonConstraint(
                                        name,
                                        "preferredDates",
                                        (c.preferredDates ?? []).filter((x) => x !== d)
                                      )
                                    }
                                    className="ml-0.5 hover:text-emerald-900"
                                  >
                                    <X className="h-2.5 w-2.5" />
                                  </button>
                                </Badge>
                              ))}
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button size="sm" variant="outline" className="h-6 gap-1 text-xs border-emerald-500/40 text-emerald-700 hover:border-emerald-500 hover:bg-emerald-50/50">
                                    <Plus className="h-3 w-3" /> Add date
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="multiple"
                                    selected={(c.preferredDates ?? []).map((d) => new Date(d + "T12:00:00"))}
                                    onSelect={(dates) => {
                                      const formatted = (dates ?? []).map((d) => format(d, "yyyy-MM-dd"));
                                      setPersonConstraint(name, "preferredDates", formatted);
                                    }}
                                    className="p-3 pointer-events-auto"
                                  />
                                </PopoverContent>
                              </Popover>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Config ── */}
        <div className="grid gap-6 md:grid-cols-2">

          {/* Date range */}
          <Card>
            <CardHeader><CardTitle className="text-base">Date Range</CardTitle></CardHeader>
            <CardContent>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal", !dateRange && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from
                      ? dateRange.to
                        ? `${format(dateRange.from, "dd/MM/yyyy")} — ${format(dateRange.to, "dd/MM/yyyy")}`
                        : format(dateRange.from, "dd/MM/yyyy")
                      : "Pick date range"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              {days.length > 0 && (
                <p className="mt-2 text-xs text-muted-foreground">{days.length} days selected</p>
              )}
            </CardContent>
          </Card>

          {/* Daily pattern */}
          <Card>
            <CardHeader><CardTitle className="text-base">Daily Pattern</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground">
                How many persons per day. Pattern repeats. Use <strong>0</strong> for a rest day.
              </p>

              {/* Preset suggestions */}
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground">Quick presets</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {PATTERN_PRESETS.map((preset) => {
                    const isActive =
                      slots.length === preset.slots.length &&
                      slots.every((s, i) => s.count === preset.slots[i].count);
                    return (
                      <button
                        key={preset.label}
                        onClick={() => setSlots(preset.slots)}
                        aria-label={preset.description}
                        className={cn(
                          "rounded-md border px-2.5 py-1.5 text-left text-xs transition-colors",
                          isActive
                            ? "border-primary bg-primary/10 font-medium text-primary"
                            : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground"
                        )}
                      >
                        <span className="font-medium">{preset.label}</span>
                        <span className="ml-1 opacity-60">— {preset.description}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="border-t pt-3 space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Custom pattern</p>
                {slots.map((slot, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <span className="w-16 shrink-0 text-xs text-muted-foreground">Day {idx + 1}</span>
                    <Input
                      type="number" min={0} max={50} value={slot.count}
                      onChange={(e) => updateSlotCount(idx, parseInt(e.target.value) || 0)}
                      className="w-20"
                    />
                    <span className="text-xs text-muted-foreground">
                      {slot.count === 0 ? "REST" : `${slot.count} person${slot.count !== 1 ? "s" : ""}`}
                    </span>
                    {slots.length > 1 && (
                      <button
                        onClick={() => removeSlot(idx)}
                        className="ml-auto text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <Button size="sm" variant="outline" onClick={addSlot} className="gap-1">
                <Plus className="h-4 w-4" /> Add Day
              </Button>
              <div className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Pattern: </span>
                {patternPreview}{slots.length > 1 && " → repeat"}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Actions ── */}
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={generate} disabled={names.length === 0 || days.length === 0}>
            <Sparkles className="mr-2 h-4 w-4" /> Generate Schedule
          </Button>
          {schedule && (
            <>
              <Button variant="outline" onClick={downloadCSV}>
                <Download className="mr-2 h-4 w-4" /> Download CSV
              </Button>
              <Button variant="outline" onClick={downloadCalendar}>
                <CalendarIcon className="mr-2 h-4 w-4" /> Download Calendar
              </Button>
            </>
          )}
          {names.length > 0 && (
            <Button variant="secondary" onClick={() => navigate("/epiloxas", { state: { names } })}>
              <Send className="mr-2 h-4 w-4" /> Send to Επιλοχίας
            </Button>
          )}
        </div>

        {/* ── Warnings ── */}
        {scheduleWarnings.length > 0 && (
          <Card className="border-amber-500/40 bg-amber-50/50 dark:bg-amber-900/10">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400">
                <AlertTriangle className="h-4 w-4" /> Scheduling Warnings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1">
                {scheduleWarnings.map((w, i) => (
                  <li key={i} className="text-xs text-amber-700 dark:text-amber-400">{w}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* ── Schedule output ── */}
        {schedule && shiftCounts && (
          <div className="grid gap-6 lg:grid-cols-[280px_1fr]">

            {/* Shift count panel */}
            <Card className="h-fit lg:sticky lg:top-6">
              <CardHeader>
                <CardTitle className="text-base">Shifts per Person</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {names.map((name) => {
                    const count = shiftCounts[name] ?? 0;
                    const pct = Math.round((count / maxShifts) * 100);
                    const c = getConstraints(name);
                    const atMax = c.maxShifts !== undefined && count >= c.maxShifts;
                    const atZero = count === 0;

                    return (
                      <div key={name} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="truncate text-foreground">{name}</span>
                          <div className="ml-2 flex shrink-0 items-center gap-1.5">
                            {atZero && (
                              <AlertTriangle className="h-3 w-3 text-amber-500" aria-label="No shifts assigned" />
                            )}
                            {atMax && (
                              <Shield className="h-3 w-3 text-amber-500" aria-label="At maximum shifts" />
                            )}
                            <span
                              className={cn(
                                "font-bold tabular-nums",
                                atZero ? "text-amber-500" : atMax ? "text-amber-600" : "text-primary"
                              )}
                            >
                              {count}
                              {c.maxShifts !== undefined && (
                                <span className="ml-0.5 font-normal text-muted-foreground">/{c.maxShifts}</span>
                              )}
                            </span>
                            <button
                              onClick={() => setViewingPattern(viewingPattern === name ? null : name)}
                              aria-label="View shift pattern"
                              className={cn(
                                "rounded p-0.5 transition-colors",
                                viewingPattern === name
                                  ? "text-primary"
                                  : "text-muted-foreground hover:text-primary"
                              )}
                            >
                              <BarChart2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all duration-300",
                              atMax ? "bg-amber-500" : atZero ? "bg-muted-foreground/30" : "bg-primary"
                            )}
                            style={{ width: `${pct}%` }}
                          />
                        </div>

                        {/* Inline pattern view */}
                        {viewingPattern === name && (() => {
                          const { pattern, workDays, restDays } = buildPersonPattern(schedule, name, days);
                          const compressed = compressPattern(pattern);
                          return (
                            <div className="mt-1 rounded-md border bg-muted/40 px-3 py-2.5 text-xs space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-foreground">Shift pattern</span>
                                <div className="flex gap-2">
                                  <span className="text-green-600 font-medium">{workDays} on</span>
                                  <span className="text-muted-foreground">/</span>
                                  <span className="text-muted-foreground">{restDays} off</span>
                                </div>
                              </div>
                              <p className="text-muted-foreground leading-relaxed">{compressed}</p>
                              {/* Visual dot strip — max 60 dots before wrapping */}
                              <div className="flex flex-wrap gap-0.5">
                                {pattern.map((p, i) => (
                                  <div
                                    key={i}
                                    aria-label={format(days[i], "dd/MM EEE") + " — " + p}
                                    className={cn(
                                      "h-2.5 w-2.5 rounded-sm",
                                      p === "on" ? "bg-primary" : "bg-muted-foreground/20"
                                    )}
                                  />
                                ))}
                              </div>
                              <p className="text-[10px] text-muted-foreground">
                                ■ on &nbsp; □ off &nbsp;— hover dots for date
                              </p>
                            </div>
                          );
                        })()}
                      </div>
                    );
                  })}
                </div>

                {/* Summary stats */}
                <div className="mt-4 space-y-1.5 rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Total shifts</span>
                    <strong>{Object.values(shiftCounts).reduce((a, b) => a + b, 0)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Fairness gap</span>
                    <span
                      className={cn(
                        "font-bold",
                        fairnessGap === 0 ? "text-green-600" : fairnessGap === 1 ? "text-primary" : "text-amber-500"
                      )}
                    >
                      {fairnessGap === 0 ? (
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Perfect
                        </span>
                      ) : (
                        `±${fairnessGap} shifts`
                      )}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Schedule table */}
            <Card>
              <CardHeader><CardTitle className="text-base">Schedule Calendar</CardTitle></CardHeader>
              <CardContent>
                <p className="mb-3 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Click</span> any name to change it.{" "}
                  Drag & drop still works for swapping.{" "}
                  <span className="text-destructive">Red</span> = constraint violation.
                </p>
                <div className="overflow-auto rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-28">Date</TableHead>
                        <TableHead className="w-16">Day</TableHead>
                        <TableHead>Assigned</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {days.map((d) => {
                        const key = format(d, "yyyy-MM-dd");
                        const assigned = schedule[key] || [];
                        const isRest = assigned[0] === "REST";
                        const isWeekend = d.getDay() === 0 || d.getDay() === 6;

                        return (
                          <TableRow
                            key={key}
                            className={cn(isWeekend && "bg-muted/50", isRest && "opacity-60")}
                          >
                            <TableCell className="text-sm font-medium">{format(d, "dd/MM/yyyy")}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{format(d, "EEE")}</TableCell>
                            <TableCell>
                              {isRest ? (
                                <Badge variant="outline" className="text-xs text-muted-foreground">REST</Badge>
                              ) : (
                                <div className="flex flex-wrap gap-2">
                                  {assigned.map((name, i) => {
                                    const violation = name !== "—" && isViolation(name, key);
                                    const isPreferred = name !== "—" && (() => {
                                      const c = getConstraints(name);
                                      return (c.preferredDates ?? []).includes(key);
                                    })();
                                    const isEditing = editingCell?.date === key && editingCell?.index === i;

                                    return (
                                      <div key={i} className="relative">
                                        {/* The badge / trigger */}
                                        <div
                                          draggable={!isEditing}
                                          onDragStart={() => !isEditing && handleDragStart(key, i)}
                                          onDragOver={(e) => e.preventDefault()}
                                          onDrop={() => handleDrop(key, i)}
                                          onClick={() => setEditingCell(isEditing ? null : { date: key, index: i })}
                                          className={cn(
                                            "flex cursor-pointer select-none items-center gap-1.5 rounded-md border px-2 py-1 text-sm transition-colors",
                                            isEditing
                                              ? "border-primary bg-primary/20 text-primary ring-1 ring-primary"
                                              : violation
                                              ? "border-destructive/40 bg-destructive/10 text-destructive hover:border-destructive/60"
                                              : isPreferred
                                              ? "border-emerald-500/40 bg-emerald-50/80 text-emerald-700 hover:border-emerald-500/60 dark:bg-emerald-900/20 dark:text-emerald-400"
                                              : "border-transparent bg-primary/10 text-primary hover:border-primary/30 hover:bg-primary/15"
                                          )}
                                          aria-label={violation ? "⚠ Constraint violation" : isPreferred ? "✓ Pre-arranged shift" : "Click to change"}
                                        >
                                          <GripVertical className="h-3 w-3 opacity-50" />
                                          {name}
                                          {violation && <AlertTriangle className="h-3 w-3" />}
                                          {isPreferred && !violation && <CheckCircle2 className="h-3 w-3" />}
                                        </div>

                                        {/* Dropdown */}
                                        {isEditing && (
                                          <div
                                            className="editing-dropdown absolute left-0 top-full z-50 mt-1 min-w-[180px] rounded-lg border bg-popover shadow-lg"
                                            onMouseDown={(e) => e.stopPropagation()}
                                          >
                                            <div className="border-b px-3 py-2 text-xs font-medium text-muted-foreground">
                                              Replace with…
                                            </div>
                                            <div className="max-h-52 overflow-y-auto py-1">
                                              {names.map((n) => {
                                                const isCurrent = n === name;
                                                const alreadyOnDay = assigned.includes(n) && !isCurrent;
                                                return (
                                                  <button
                                                    key={n}
                                                    disabled={alreadyOnDay}
                                                    onClick={() => replaceAssignment(key, i, n)}
                                                    className={cn(
                                                      "flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm transition-colors",
                                                      isCurrent
                                                        ? "bg-primary/10 font-medium text-primary"
                                                        : alreadyOnDay
                                                        ? "cursor-not-allowed opacity-40"
                                                        : "hover:bg-muted text-foreground"
                                                    )}
                                                  >
                                                    {isCurrent && <CheckCircle2 className="h-3 w-3 shrink-0" />}
                                                    {!isCurrent && <span className="h-3 w-3 shrink-0" />}
                                                    {n}
                                                    {alreadyOnDay && (
                                                      <span className="ml-auto text-xs text-muted-foreground">already on</span>
                                                    )}
                                                  </button>
                                                );
                                              })}
                                            </div>
                                            <div className="border-t py-1">
                                              <button
                                                onClick={() => setEditingCell(null)}
                                                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-muted-foreground hover:bg-muted"
                                              >
                                                <X className="h-3 w-3" /> Cancel
                                              </button>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

          </div>
        )}
      </main>
    </div>
  );
};

export default SecondOffice;
