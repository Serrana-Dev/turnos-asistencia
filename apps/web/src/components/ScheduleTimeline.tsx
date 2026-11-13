import { CheckCircle2, Coffee, LogIn, LogOut } from "lucide-react";
import { MS_MIN, localDateKey, type PlannedShift } from "@turnos/core";
import { segmentState } from "../lib/dayStatus";
import { formatMinutes, formatTime } from "../lib/format";

interface Shift extends PlannedShift {
  status?: "DRAFT" | "PUBLISHED";
}

interface Props<T extends Shift> {
  shifts: readonly T[];
  tz: number;
  /** Con `now`, el tramo en curso se resalta con su avance y los ya cumplidos se marcan con ✓. */
  now?: number;
  /** Para el dueño: tocar un tramo abre quitar/cancelar. */
  onOpenShift?: (shift: T) => void;
}

/**
 * Horario de un día como línea de tiempo: Entrada → duración → Salida, y la pausa entre tramos si es
 * cortado. Cada hora lleva ícono y texto, así no depende solo del color.
 */
export function ScheduleTimeline<T extends Shift>({ shifts, tz, now, onOpenShift }: Props<T>) {
  const sorted = [...shifts].sort((a, b) => a.start - b.start);
  return (
    <ol className="timeline">
      {sorted.map((s, i) => {
        const prev = sorted[i - 1];
        const state = now === undefined ? null : segmentState(s, now);
        const nextDay = localDateKey(s.end, tz) !== localDateKey(s.start, tz);
        // "Ya pasó" habla del horario, no de la asistencia: si fichó o no se ve en "Marcado".
        const progress = state === "now" ? Math.min(1, (now! - s.start) / (s.end - s.start)) : 0;
        const segment = (
          <>
            {state === "now" && <span className="tl-now">Ahora</span>}
            {state === "done" && (
              <span className="tl-done">
                <CheckCircle2 size={14} aria-hidden="true" />
                Ya pasó
              </span>
            )}
            <span className="tl-row tl-in">
              <span className="tl-icon" aria-hidden="true">
                <LogIn size={16} />
              </span>
              <span className="tl-label">Entrada</span>
              <span className="tl-time">{formatTime(s.start, tz)}</span>
            </span>
            <span className="tl-dur">
              {formatMinutes(Math.round((s.end - s.start) / MS_MIN))}
              {s.status === "DRAFT" && <span className="chip-tag"> · Borrador</span>}
              {state === "now" && (
                <span
                  className="tl-progress"
                  role="progressbar"
                  aria-label="Avance del tramo"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(progress * 100)}
                >
                  <span style={{ width: `${progress * 100}%` }} />
                </span>
              )}
            </span>
            <span className="tl-row tl-out">
              <span className="tl-icon" aria-hidden="true">
                <LogOut size={16} />
              </span>
              <span className="tl-label">Salida{nextDay && " (día siguiente)"}</span>
              <span className="tl-time">{formatTime(s.end, tz)}</span>
            </span>
          </>
        );
        return (
          <li key={s.id} className={`tl-segment ${s.status === "DRAFT" ? "draft" : ""} ${state ? `is-${state}` : ""}`}>
            {prev && (
              <span className="tl-break">
                <Coffee size={14} aria-hidden="true" />
                Pausa de {formatMinutes(Math.round((s.start - prev.end) / MS_MIN))}
              </span>
            )}
            {onOpenShift ? (
              <button
                type="button"
                className="tl-card tl-button"
                onClick={() => onOpenShift(s)}
                aria-label={`Entrada ${formatTime(s.start, tz)}, salida ${formatTime(s.end, tz)}${s.status === "DRAFT" ? ", borrador" : ""}. Ver o quitar`}
              >
                {segment}
              </button>
            ) : (
              <span className="tl-card">{segment}</span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
