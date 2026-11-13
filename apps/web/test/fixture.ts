import type { Employee, PunchGeo, PunchRecord, ScheduledShift, Snapshot, Workplace } from "@turnos/contract";
import { MS_MIN, addDays, shiftInstants, type Punch } from "@turnos/core";

/** Datos fijos de octubre 2026 (Ana y Bruno) para los tests. No cambian con la demo. */

const OFFSET = -180;
/** Hora local de Argentina -> epoch ms. */
const at = (date: string, hhmm: string): number => {
  const [y, mo, d] = date.split("-").map(Number) as [number, number, number];
  const [h, mi] = hhmm.split(":").map(Number) as [number, number];
  return Date.UTC(y, mo - 1, d, h, mi) - OFFSET * MS_MIN;
};

let seq = 0;
const INSIDE: PunchGeo = { status: "INSIDE", distanceM: 20, accuracyM: 12 };
const p = (
  employeeId: string,
  type: Punch["type"],
  date: string,
  hhmm: string,
  geo: PunchGeo = INSIDE,
): PunchRecord => ({ id: `demo-${++seq}`, employeeId, type, at: at(date, hhmm), geo });
const shift = (
  employeeId: string,
  date: string,
  from: string,
  to: string,
  status: ScheduledShift["status"] = "PUBLISHED",
): ScheduledShift => ({ id: `shift-${employeeId}-${date}`, employeeId, start: at(date, from), end: at(date, to), status });

const employees: Employee[] = [
  { id: "e1", name: "Ana López" },
  { id: "e2", name: "Bruno Díaz" },
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

// Plaza San Martín, Córdoba. El dueño lo cambia desde la pestaña Local.
const workplaces: Workplace[] = [{ id: "w1", name: "Local centro", lat: -31.4167, lng: -64.1837, radiusM: 100 }];

const shifts: ScheduledShift[] = [
  ...["2026-10-26", "2026-10-27", "2026-10-28", "2026-10-29"].map((d) => shift("e1", d, "09:00", "17:00")),
  ...["2026-10-26", "2026-10-27", "2026-10-28"].map((d) => shift("e2", d, "14:00", "22:00")),
  // Horario cortado: dos tramos el mismo día.
  { ...shift("e2", "2026-10-29", "10:00", "14:00"), id: "shift-e2-2026-10-29-a" },
  { ...shift("e2", "2026-10-29", "18:00", "22:00"), id: "shift-e2-2026-10-29-b" },
  shift("e2", "2026-10-30", "14:00", "22:00"),
  shift("e1", "2026-10-31", "09:00", "17:00", "DRAFT"),
];

const punches: PunchRecord[] = [
  p("e1", "IN", "2026-10-26", "09:02"),
  p("e1", "OUT", "2026-10-26", "17:05"),
  // Marcó lejos del local: queda para revisar.
  p("e1", "IN", "2026-10-27", "09:20", { status: "OUTSIDE", distanceM: 850, accuracyM: 25 }),
  p("e1", "OUT", "2026-10-27", "17:00"),
  p("e1", "IN", "2026-10-28", "09:00"),
  p("e1", "OUT", "2026-10-28", "19:00"),
  p("e1", "IN", "2026-10-29", "09:00"),
  p("e2", "IN", "2026-10-26", "14:00"),
  p("e2", "OUT", "2026-10-26", "22:30"),
  // No compartió la ubicación.
  p("e2", "OUT", "2026-10-28", "22:00", { status: "NONE" }),
  p("e2", "IN", "2026-10-29", "10:00"),
  p("e2", "OUT", "2026-10-29", "14:05"),
  p("e2", "IN", "2026-10-29", "18:00"),
  p("e2", "OUT", "2026-10-29", "22:40"),
];

/** Snapshot de un mes con los datos de octubre: solo turnos publicados. */
export function fixtureSnapshot(month = "2026-10"): Snapshot {
  const [y, m] = month.split("-").map(Number) as [number, number];
  const last = new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10);
  const { from, to } = datesRange(`${month}-01`, last);
  return {
    month,
    business,
    employees,
    punches: punches.filter((p) => p.at >= from && p.at < to),
    planned: shifts
      .filter((s) => s.status === "PUBLISHED" && s.start >= from && s.start < to)
      .map(({ id, employeeId, start, end }) => ({ id, employeeId, start, end })),
    workplaces,
    daysOff: [],
  };
}

function datesRange(first: string, last: string) {
  return { from: shiftInstants(first, 0, 1, OFFSET).start, to: shiftInstants(addDays(last, 1), 0, 1, OFFSET).start };
}

