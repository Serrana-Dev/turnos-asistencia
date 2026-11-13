import { MS_MIN, type PlannedShift } from "@turnos/core";

export type SegmentState = "done" | "now" | "next";

export type DayStatus =
  | { kind: "before"; minutes: number; at: number }
  | { kind: "working"; minutes: number; at: number; progress: number }
  | { kind: "break"; minutes: number; at: number }
  | { kind: "done" };

/** Estado de cada tramo respecto de `now`: ya pasó, está en curso o viene. */
export function segmentState(s: PlannedShift, now: number): SegmentState {
  if (now >= s.end) return "done";
  if (now >= s.start) return "now";
  return "next";
}

/**
 * Qué está pasando ahora con el horario del día: falta para entrar, está trabajando (con cuánto falta para
 * salir y el avance del tramo), está en la pausa de un cortado, o ya terminó.
 */
export function dayStatus(shifts: readonly PlannedShift[], now: number): DayStatus {
  const sorted = [...shifts].sort((a, b) => a.start - b.start);
  const current = sorted.find((s) => now >= s.start && now < s.end);
  if (current) {
    return {
      kind: "working",
      minutes: Math.ceil((current.end - now) / MS_MIN),
      at: current.end,
      progress: (now - current.start) / (current.end - current.start),
    };
  }
  const next = sorted.find((s) => s.start > now);
  if (!next) return { kind: "done" };
  const minutes = Math.ceil((next.start - now) / MS_MIN);
  return sorted.some((s) => s.end <= now) ? { kind: "break", minutes, at: next.start } : { kind: "before", minutes, at: next.start };
}
