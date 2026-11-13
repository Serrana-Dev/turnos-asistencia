import { useEffect, useRef, type ReactNode } from "react";
import { AlertTriangle, ChevronLeft, ChevronRight, LogIn, LogOut, MapPin, TrendingUp } from "lucide-react";
import type { Employee, ScheduledShift } from "@turnos/contract";
import type { DayEntry } from "../lib/calendar";
import {
  ANOMALY_HINT,
  ANOMALY_LABEL,
  describeLocationFlag,
  formatLongDate,
  formatMinutes,
  formatTime,
  initials,
  DAY_OFF_LABEL,
} from "../lib/format";
import { ScheduleTimeline } from "./ScheduleTimeline";
import { AttendanceBadge } from "./TimesheetView";

interface Props {
  date: string;
  today: string;
  tz: number;
  isHoliday: boolean;
  entries: DayEntry[];
  employees: Map<string, Employee>;
  colors: Map<string, number>;
  audience: "employee" | "owner";
  /** Solo el dueño: tocar un turno para quitarlo/cancelarlo. */
  onOpenShift?: (shift: ScheduledShift) => void;
  /** Acciones al pie (ej. "Asignar turno"). */
  actions?: ReactNode;
  emptyText: string;
  /** Flechas para pasar al día anterior / siguiente sin volver al calendario. */
  onPrev?: () => void;
  onNext?: () => void;
}

/** Detalle del día elegido: por empleado, turno asignado, lo marcado, horas y extra. */
export function DayDetail({
  date,
  today,
  tz,
  isHoliday,
  entries,
  employees,
  colors,
  audience,
  onOpenShift,
  actions,
  emptyText,
  onPrev,
  onNext,
}: Props) {
  const ref = useRef<HTMLElement>(null);
  const firstRender = useRef(true);

  // Al elegir otro día, si el detalle quedó fuera de la pantalla (celular), se acerca solo.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (r.top < 0 || r.top > window.innerHeight - 120) {
      const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      el.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "start" });
    }
  }, [date]);

  const visible = entries.filter(
    (e) => e.shifts.length || e.intervals.length || e.anomalies.length || e.locationFlags.length || e.dayOff,
  );

  return (
    <section ref={ref} className="card day-detail" aria-labelledby="day-detail-title" aria-live="polite">
      <div className="day-head">
        {onPrev && (
          <button type="button" className="btn ghost icon-btn day-arrow" aria-label="Día anterior" onClick={onPrev}>
            <ChevronLeft size={20} aria-hidden="true" />
          </button>
        )}
        <div className="day-title">
          <h2 id="day-detail-title" className="cap">
            {formatLongDate(date)}
          </h2>
          {date === today && <span className="badge ok">Hoy</span>}
          {isHoliday && <span className="badge warn">Feriado</span>}
        </div>
        {onNext && (
          <button type="button" className="btn ghost icon-btn day-arrow" aria-label="Día siguiente" onClick={onNext}>
            <ChevronRight size={20} aria-hidden="true" />
          </button>
        )}
      </div>
      <div key={date} className="day-body">

      {visible.length === 0 ? (
        <p className="muted">{emptyText}</p>
      ) : (
        <ul className="entries">
          {visible.map((e) => {
            const emp = employees.get(e.employeeId);
            const overPlan = e.plannedMin > 0 && e.workedMin > e.plannedMin ? e.workedMin - e.plannedMin : 0;
            // Día libre sin nada más que mostrar: una línea.
            if (e.dayOff && !e.shifts.length && !e.intervals.length && !e.anomalies.length && !e.locationFlags.length) {
              return (
                <li key={e.employeeId} className={`entry off emp-c${colors.get(e.employeeId) ?? 0}`}>
                  <div className="entry-head">
                    {audience === "owner" && (
                      <>
                        <span className="avatar sm emp-avatar" aria-hidden="true">
                          {initials(emp?.name ?? "?")}
                        </span>
                        <strong>{emp?.name}</strong>
                      </>
                    )}
                    <span className="badge neutral">{DAY_OFF_LABEL[e.dayOff]}</span>
                  </div>
                </li>
              );
            }
            return (
              <li key={e.employeeId} className={`entry emp-c${colors.get(e.employeeId) ?? 0}`}>
                {audience === "owner" && (
                  <div className="entry-head">
                    <span className="avatar sm emp-avatar" aria-hidden="true">
                      {initials(emp?.name ?? "?")}
                    </span>
                    <strong>{emp?.name}</strong>
                  </div>
                )}

                <dl className="entry-grid">
                  <div className="full">
                    <dt>Horario</dt>
                    <dd>
                      {e.shifts.length === 0 ? (
                        <span className="muted">Sin turno asignado</span>
                      ) : (
                        <ScheduleTimeline shifts={e.shifts} tz={tz} onOpenShift={onOpenShift} />
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt>Marcado</dt>
                    <dd>
                      {e.intervals.length ? (
                        <span className="marked">
                          {e.intervals.map((iv) => (
                            <span key={iv.start} className="marked-pair">
                              <span className="io in">
                                <LogIn size={14} aria-hidden="true" />
                                <span className="visually-hidden">Entró</span>
                                {formatTime(iv.start, tz)}
                              </span>
                              <span className="io out">
                                <LogOut size={14} aria-hidden="true" />
                                <span className="visually-hidden">Salió</span>
                                {formatTime(iv.end, tz)}
                              </span>
                            </span>
                          ))}
                        </span>
                      ) : (
                        <span className="muted">{date > today ? "—" : "Sin marcas completas"}</span>
                      )}
                    </dd>
                  </div>
                  {e.workedMin > 0 && (
                    <div>
                      <dt>Trabajado</dt>
                      <dd className="num">{formatMinutes(e.workedMin)}</dd>
                    </div>
                  )}
                </dl>

                {(e.extraMin > 0 || overPlan > 0 || e.attendance.length > 0) && (
                  <div className="actions">
                    {e.attendance
                      .filter((a, i, list) => list.findIndex((b) => b.status === a.status) === i)
                      .map((a) => (
                        <AttendanceBadge key={a.shiftId} result={a} />
                      ))}
                    {e.extraMin > 0 && (
                      <span className="badge warn">
                        <TrendingUp size={14} aria-hidden="true" />
                        {formatMinutes(e.extraMin)} extra
                      </span>
                    )}
                    {overPlan > 0 && (
                      <span className="badge neutral">{formatMinutes(overPlan)} más que el turno</span>
                    )}
                  </div>
                )}

                {e.locationFlags.map((f) => (
                  <p key={f.punchId} className="entry-warn small">
                    <MapPin size={16} aria-hidden="true" />
                    <span>{describeLocationFlag(f, tz)}</span>
                  </p>
                ))}

                {e.anomalies.map((a) => (
                  <p key={`${a.kind}-${a.at}`} className="entry-warn small">
                    <AlertTriangle size={16} aria-hidden="true" />
                    <span>
                      <strong>{ANOMALY_LABEL[a.kind]}.</strong> {ANOMALY_HINT[a.kind][audience]}
                    </span>
                  </p>
                ))}
              </li>
            );
          })}
        </ul>
      )}
      </div>
      {actions && <div className="actions">{actions}</div>}
    </section>
  );
}
