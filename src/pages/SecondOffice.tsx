import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, Sparkles, Download, GripVertical, X, Users, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { format, eachDayOfInterval, addDays } from "date-fns";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";

interface PatternConfig {
  workDays: number;
  restDays: number;
  label: string;
}

const PATTERNS: PatternConfig[] = [
  { workDays: 2, restDays: 1, label: "2 on / 1 off" },
  { workDays: 1, restDays: 1, label: "1 on / 1 off" },
  { workDays: 3, restDays: 1, label: "3 on / 1 off" },
  { workDays: 5, restDays: 2, label: "5 on / 2 off" },
  { workDays: 2, restDays: 2, label: "2 on / 2 off" },
];

const DEMO_NAMES = [
  "Παπαδόπουλος Γ.",
  "Κωνσταντίνου Α.",
  "Νικολάου Δ.",
  "Αθανασίου Κ.",
  "Δημητρίου Ε.",
  "Γεωργίου Μ.",
  "Ιωάννου Π.",
  "Βασιλείου Σ.",
  "Χριστοδούλου Ν.",
  "Μιχαηλίδης Θ.",
  "Παναγιώτου Λ.",
  "Σωτηρίου Φ.",
];

const SecondOffice = () => {
  const navigate = useNavigate();
  const [names, setNames] = useState<string[]>([]);
  const [nameInput, setNameInput] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [pattern, setPattern] = useState<PatternConfig>(PATTERNS[0]);
  const [personsPerDay, setPersonsPerDay] = useState(2);
  const [schedule, setSchedule] = useState<Record<string, string[]> | null>(null);
  const [dragItem, setDragItem] = useState<{ date: string; index: number } | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const parsed = text.split("\n").map((l) => l.trim()).filter(Boolean);
      // Skip header if it looks like one
      const list = parsed[0]?.toLowerCase().includes("name") ? parsed.slice(1) : parsed;
      setNames(list);
      setSchedule(null);
      toast.success(`${list.length} names loaded`);
    };
    reader.readAsText(file);
  };

  const addName = () => {
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    setNames((prev) => [...prev, trimmed]);
    setNameInput("");
  };

  const removeName = (idx: number) => setNames((prev) => prev.filter((_, i) => i !== idx));

  const days = useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) return [];
    return eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
  }, [dateRange]);

  const generate = () => {
    if (names.length === 0) { toast.error("Add at least one name"); return; }
    if (days.length === 0) { toast.error("Select a date range"); return; }

    const result: Record<string, string[]> = {};
    let nameIdx = 0;
    let isWorkPhase = true;
    let phaseCounter = 0;

    for (const day of days) {
      const key = format(day, "yyyy-MM-dd");
      if (isWorkPhase) {
        const assigned: string[] = [];
        for (let p = 0; p < personsPerDay; p++) {
          assigned.push(names[nameIdx % names.length]);
          nameIdx++;
        }
        result[key] = assigned;
      } else {
        result[key] = ["REST"];
      }
      phaseCounter++;

      const phaseLength = isWorkPhase ? pattern.workDays : pattern.restDays;
      if (phaseCounter >= phaseLength) {
        isWorkPhase = !isWorkPhase;
        phaseCounter = 0;
      }
    }

    setSchedule(result);
    toast.success("Calendar schedule generated!");
  };

  const handleDragStart = (date: string, index: number) => setDragItem({ date, index });

  const handleDrop = (targetDate: string, targetIndex: number) => {
    if (!dragItem || !schedule) return;
    const newSchedule = { ...schedule };
    const srcNames = [...(newSchedule[dragItem.date] || [])];
    const tgtNames = [...(newSchedule[targetDate] || [])];
    const temp = srcNames[dragItem.index];
    srcNames[dragItem.index] = tgtNames[targetIndex];
    tgtNames[targetIndex] = temp;
    newSchedule[dragItem.date] = srcNames;
    newSchedule[targetDate] = tgtNames;
    setSchedule(newSchedule);
    setDragItem(null);
    toast.info("Assignment swapped");
  };

  const downloadCSV = () => {
    if (!schedule) return;
    let csv = "Date,Day,Assigned\n";
    days.forEach((d) => {
      const key = format(d, "yyyy-MM-dd");
      const assigned = schedule[key]?.join("; ") || "";
      csv += `${key},${format(d, "EEE")},${assigned}\n`;
    });
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "schedule_2og.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

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
        {/* Names */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Personnel</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border-2 border-dashed border-border px-6 py-3 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary">
                <Upload className="h-4 w-4" />
                Upload CSV
                <input type="file" accept=".csv,.txt" className="hidden" onChange={handleFileUpload} />
              </label>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setNames(DEMO_NAMES);
                  setSchedule(null);
                  toast.success(`${DEMO_NAMES.length} demo names loaded`);
                }}
              >
                <Users className="mr-1 h-4 w-4" />
                Load Demo
              </Button>
              <span className="text-xs text-muted-foreground">or add manually:</span>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Enter name"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addName()}
                  className="w-48"
                />
                <Button size="sm" variant="secondary" onClick={addName}>Add</Button>
              </div>
            </div>
            {names.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {names.map((n, i) => (
                  <Badge key={i} variant="secondary" className="gap-1 pr-1">
                    {n}
                    <button onClick={() => removeName(i)} className="ml-1 rounded-full p-0.5 hover:bg-foreground/10">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Config */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Date Range</CardTitle>
            </CardHeader>
            <CardContent>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !dateRange && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to
                        ? `${format(dateRange.from, "dd/MM/yyyy")} — ${format(dateRange.to, "dd/MM/yyyy")}`
                        : format(dateRange.from, "dd/MM/yyyy")
                    ) : (
                      "Pick date range"
                    )}
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
              {days.length > 0 && <p className="mt-2 text-xs text-muted-foreground">{days.length} days selected</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Rotation Pattern</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Select
                value={`${pattern.workDays}-${pattern.restDays}`}
                onValueChange={(v) => {
                  const [w, r] = v.split("-").map(Number);
                  setPattern(PATTERNS.find((p) => p.workDays === w && p.restDays === r) || PATTERNS[0]);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PATTERNS.map((p) => (
                    <SelectItem key={`${p.workDays}-${p.restDays}`} value={`${p.workDays}-${p.restDays}`}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {pattern.workDays} working day(s) followed by {pattern.restDays} rest day(s)
              </p>
              <div className="mt-4">
                <Label htmlFor="personsPerDay">Persons needed per day</Label>
                <Input
                  id="personsPerDay"
                  type="number"
                  min={1}
                  max={20}
                  value={personsPerDay}
                  onChange={(e) => setPersonsPerDay(Math.max(1, parseInt(e.target.value) || 1))}
                  className="mt-1 w-24"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Generate */}
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={generate} disabled={names.length === 0 || days.length === 0}>
            <Sparkles className="mr-2 h-4 w-4" />
            Generate Schedule
          </Button>
          {schedule && (
            <Button variant="outline" onClick={downloadCSV}>
              <Download className="mr-2 h-4 w-4" />
              Download CSV
            </Button>
          )}
          {names.length > 0 && (
            <Button
              variant="secondary"
              onClick={() => navigate("/epiloxas", { state: { names } })}
            >
              <Send className="mr-2 h-4 w-4" />
              Send to Επιλοχίας
            </Button>
          )}
        </div>

        {/* Calendar Table */}
        {schedule && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Schedule Calendar</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-3 text-xs text-muted-foreground">Drag & drop to swap assignments between days.</p>
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
                        <TableRow key={key} className={cn(isWeekend && "bg-muted/50", isRest && "opacity-60")}>
                          <TableCell className="text-sm font-medium">{format(d, "dd/MM/yyyy")}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{format(d, "EEE")}</TableCell>
                          <TableCell>
                            {isRest ? (
                              <Badge variant="outline" className="text-xs text-muted-foreground">REST</Badge>
                            ) : (
                              <div className="flex flex-wrap gap-2">
                                {assigned.map((name, i) => (
                                  <div
                                    key={i}
                                    draggable
                                    onDragStart={() => handleDragStart(key, i)}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={() => handleDrop(key, i)}
                                    className="flex cursor-grab items-center gap-1.5 rounded-md border border-transparent bg-primary/10 px-2 py-1 text-sm text-primary hover:border-primary/30 active:cursor-grabbing"
                                  >
                                    <GripVertical className="h-3 w-3" />
                                    {name}
                                  </div>
                                ))}
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
        )}
      </main>
    </div>
  );
};

export default SecondOffice;
