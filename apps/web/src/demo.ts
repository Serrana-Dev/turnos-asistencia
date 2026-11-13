import type {
  DayOff,
  Employee,
  MonthSchedule,
  NewShiftsInput,
  PublishInput,
  PublishResult,
  PunchRecord,
  ScheduledShift,
  ShiftTemplate,
  Snapshot,
  Workplace,
  WorkplaceInput,
} from "@turnos/contract";
import { addDays, monthGridDates, shiftInstants } from "@turnos/core";

/**
 * Datos de la demo: el equipo y los horarios reales de noviembre 2026 que pasó el comercio.
 * Los cambios que se hagan en la app viven en memoria hasta recargar.
 */

const OFFSET = -180;

/** Mes en que abre la demo. */
export const DEMO_MONTH = "2026-11";

/** Enlace personal de cada empleado en la demo: /e/lau, /e/ceci, … */
export const DEMO_TOKENS: Record<string, string> = {
  lau: "lau",
  ceci: "ceci",
  eri: "eri",
  karen: "karen",
  emi: "emi",
  maca: "maca",
  pao: "pao",
  joha: "joha",
};

// Lau primero: es quien va a usar el sistema.
const employees: Employee[] = [
  { id: "lau", name: "Lau" },
  { id: "ceci", name: "Ceci" },
  { id: "eri", name: "Eri" },
  { id: "karen", name: "Karen" },
  { id: "emi", name: "Emi" },
  { id: "maca", name: "Maca" },
  { id: "pao", name: "Pao" },
  { id: "joha", name: "Joha" },
];

/** Lista de empleados para la navegación de la demo. */
export const DEMO_EMPLOYEES: readonly Employee[] = employees;
/** Quien va a usar el sistema: aparece primero en la navegación y en el inicio. */
export const DEMO_MAIN_EMPLOYEE: Employee = employees[0]!;

/** Horarios que más se repiten en la grilla del comercio. */
const templates: ShiftTemplate[] = [
  { id: "t1", name: "Mañana", startMin: 9 * 60 + 30, endMin: 13 * 60 + 30 },
  { id: "t2", name: "Mañana larga", startMin: 9 * 60 + 30, endMin: 14 * 60 },
  { id: "t3", name: "Tarde", startMin: 16 * 60, endMin: 21 * 60 },
  { id: "t4", name: "Tarde finde", startMin: 14 * 60, endMin: 22 * 60 },
];

const business: Snapshot["business"] = {
  tzOffsetMinutes: OFFSET,
  nightStartMin: 21 * 60,
  nightEndMin: 6 * 60,
  dailyNormalMin: 480,
  minRestMin: 720,
  graceMin: 5,
  holidays: [],
};

// Plaza San Martín, Córdoba, como ejemplo. El dueño carga el local real desde la pestaña Local.
const workplaces: Workplace[] = [{ id: "w1", name: "Local", lat: -31.4167, lng: -64.1837, radiusM: 100 }];

/**
 * Grilla tal como la mandó el comercio. Por día: horario de cada persona ("9:30-14 17-21" = cortado,
 * "10-16" = de corrido) o "F" = franco. Quien no figura ese día no trabaja.
 * Notas del original que el sistema todavía no guarda: Maca el 12 figura "(Haas)" y el 18 y del 21 al 23
 * "(Spell)".
 */
const GRID: Record<string, Record<string, string>> = {
  "2026-11-12": { lau: "9:30-14 17-21", ceci: "10-16", eri: "16-21", karen: "10-17", emi: "9:30-14 17-21", maca: "16-21", pao: "F", joha: "F" },
  "2026-11-13": { lau: "9:30-14 17-21:30", ceci: "10-16", pao: "16-21:30", joha: "10-17", maca: "16-21:30", emi: "9:30-14 17-21:30", karen: "F", eri: "F" },
  "2026-11-14": { pao: "9:30-13:30", maca: "10-14", lau: "14-22", eri: "16-22", joha: "9:30-14 18-22", emi: "10-18", karen: "16-22" },
  // Mismo horario que el sábado, pero "el domingo abrimos 10:30": quien entraba antes, entra 10:30.
  "2026-11-15": { pao: "10:30-13:30", maca: "10:30-14", lau: "14-22", eri: "16-22", joha: "10:30-14 18-22", emi: "10:30-18", karen: "16-22" },
  "2026-11-16": { lau: "9:30-13:30 17-21", eri: "16-21", joha: "9:30-13:30 16-21", karen: "10-14 17-21", emi: "F", pao: "F" },
  "2026-11-17": { lau: "9:30-13:30 17-21", pao: "16-21", emi: "10-14 17-21", joha: "9:30-13:30 16-21", eri: "F", karen: "F" },
  "2026-11-18": { pao: "9:30-13:30", eri: "16-21", maca: "17-21", karen: "16-21", emi: "10-14 17-21", joha: "9:30-13:30", lau: "F" },
  "2026-11-19": { pao: "9:30-13:30", lau: "16-21", eri: "17-21", karen: "9:30-13:30 16-21", emi: "10-14 17-21", joha: "F" },
  "2026-11-20": { pao: "9:30-14", eri: "16-21:30", lau: "14-21:30", emi: "9:30-13:30 17-21:30", joha: "16-22", karen: "10-16" },
  ...Object.fromEntries(
    ["2026-11-21", "2026-11-22", "2026-11-23"].map((d) => [
      d,
      { lau: "14-22", pao: "9:30-14", eri: "17-22", maca: "10-17", joha: "9:30-13:30 17-22", karen: "10-17", emi: "14-22" },
    ]),
  ),
  "2026-11-24": { lau: "16-21", pao: "9:30-13:30", maca: "17-21", joha: "9:30-13:30 16-21", karen: "10-14 17-21", eri: "F", emi: "F" },
  "2026-11-25": { lau: "16-21", eri: "17-21", maca: "9:30-13:30", emi: "10-14 17-21", joha: "9:30-13:30 16-21", pao: "F", karen: "F" },
  "2026-11-26": { pao: "9:30-13:30", eri: "16-21", maca: "17-21", emi: "9:30-13:30 16-21", karen: "10-14 17-21", lau: "F", joha: "F" },
  "2026-11-27": { lau: "14-21:30", pao: "9:30-14", eri: "16-21:30", emi: "9:30-13:30 17-21:30", karen: "10-16", joha: "16-22" },
  ...Object.fromEntries(
    ["2026-11-28", "2026-11-29"].map((d) => [
      d,
      { pao: "9:30-16:30", eri: "16:30-22", maca: "10-14 17-22", joha: "16:30-22", karen: "9:30-16:30", emi: "10-14 17-22" },
    ]),
  ),
  "2026-11-30": { lau: "9:30-13:30 17-21", eri: "16-21", joha: "9:30-13:30 16-21", karen: "10-14 17-21" },
};

/** "9:30" -> 570, "21" -> 1260. */
function toMin(t: string): number {
  const [h, m = "0"] = t.split(":");
  return Number(h) * 60 + Number(m);
}

const shifts: ScheduledShift[] = [];
const daysOff: DayOff[] = [];
for (const [date, people] of Object.entries(GRID)) {
  for (const [employeeId, spec] of Object.entries(people)) {
    if (spec === "F") {
      daysOff.push({ employeeId, date, kind: "FRANCO" });
      continue;
    }
    spec.split(" ").forEach((segment, i) => {
      const [from, to] = segment.split("-") as [string, string];
      shifts.push({
        id: `shift-${employeeId}-${date}-${i}`,
        employeeId,
        ...shiftInstants(date, toMin(from), toMin(to), OFFSET),
        status: "PUBLISHED",
      });
    });
  }
}
shifts.sort((a, b) => a.start - b.start);

/** Todavía no hay marcas reales: se van sumando a medida que fichan. */
const punches: PunchRecord[] = [];

let seq = 0;

function datesRange(first: string, last: string) {
  return { from: shiftInstants(first, 0, 1, OFFSET).start, to: shiftInstants(addDays(last, 1), 0, 1, OFFSET).start };
}

function monthBounds(month: string) {
  const [y, m] = month.split("-").map(Number) as [number, number];
  return { first: `${month}-01`, last: new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10) };
}

/** Lo que vería el empleado/dueño en un mes: solo turnos publicados. */
export function demoSnapshot(month = DEMO_MONTH): Snapshot {
  const { first, last } = monthBounds(month);
  const { from, to } = datesRange(first, last);
  return {
    month,
    business,
    employees,
    punches: punches.filter((p) => p.at >= from && p.at < to),
    planned: shifts
      .filter((s) => s.status === "PUBLISHED" && s.start >= from && s.start < to)
      .map(({ id, employeeId, start, end }) => ({ id, employeeId, start, end })),
    workplaces,
    daysOff: daysOff.filter((d) => d.date >= first && d.date <= last),
  };
}

export function demoSchedule(month?: string): MonthSchedule {
  const m = month ?? DEMO_MONTH;
  const dates = monthGridDates(m);
  const { from, to } = datesRange(dates[0]!, dates.at(-1)!);
  return {
    month: m,
    dates,
    business,
    employees,
    shifts: shifts.filter((s) => s.start >= from && s.start < to).sort((a, b) => a.start - b.start),
    punches: punches.filter((p) => p.at >= from && p.at < to),
    templates,
    daysOff: daysOff.filter((d) => d.date >= dates[0]! && d.date <= dates.at(-1)!),
  };
}

export function demoCreateShifts(input: NewShiftsInput): ScheduledShift[] {
  const created = [...input.dates].sort().flatMap((date) =>
    input.segments.map(
      (s): ScheduledShift => ({
        id: `demo-shift-${++seq}`,
        employeeId: input.employeeId,
        ...shiftInstants(date, s.startMin, s.endMin, OFFSET),
        status: "DRAFT",
      }),
    ),
  );
  shifts.push(...created);
  return created;
}

export function demoWorkplace(): Workplace | null {
  return workplaces[0] ?? null;
}

export function demoSaveWorkplace(input: WorkplaceInput): Workplace {
  const saved = { id: workplaces[0]?.id ?? "w1", ...input };
  workplaces.splice(0, workplaces.length, saved);
  return saved;
}

export function demoRemoveShift(id: string): "deleted" | "cancelled" {
  const i = shifts.findIndex((s) => s.id === id);
  if (i < 0) throw new Error("Turno inexistente");
  const wasDraft = shifts[i]!.status === "DRAFT";
  shifts.splice(i, 1);
  return wasDraft ? "deleted" : "cancelled";
}

export function demoPublish(input: PublishInput): PublishResult {
  const { from, to } = datesRange(input.from, input.to);
  let published = 0;
  for (const s of shifts) {
    if (s.status === "DRAFT" && s.start >= from && s.start < to) {
      s.status = "PUBLISHED";
      published++;
    }
  }
  return { published };
}
