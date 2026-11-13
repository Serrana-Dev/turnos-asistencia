import type { ReactNode } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { BookOpen, CalendarDays, CircleHelp, Clock, Home, Smartphone } from "lucide-react";
import { DEMO_MODE } from "../lib/api";
import { DEMO_EMPLOYEES, DEMO_MAIN_EMPLOYEE } from "../demo";

interface Props {
  /** A qué sección del manual lleva el botón de ayuda. Siempre en el mismo lugar (arriba a la derecha). */
  helpHref?: string;
  children: ReactNode;
}

export function AppShell({ helpHref = "/ayuda", children }: Props) {
  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <Link to="/" className="brand">
            <span className="brand-mark" aria-hidden="true">
              <Clock size={18} strokeWidth={2.25} />
            </span>
            Turnos
          </Link>
          <Link to={helpHref} className="btn ghost">
            <CircleHelp size={20} aria-hidden="true" />
            Ayuda
          </Link>
        </div>
      </header>
      {/*
        Con datos de ejemplo se puede saltar entre dueño y empleados. En uso real cada uno entra por su enlace.
        Va fuera del encabezado fijo: en pantallas bajas no tapa el contenido.
      */}
      {DEMO_MODE && <DemoNav />}
      <main className="page">{children}</main>
    </>
  );
}

function DemoNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const others = DEMO_EMPLOYEES.filter((e) => e.id !== DEMO_MAIN_EMPLOYEE.id);
  const current = others.find((e) => pathname === `/e/${e.id}`);
  const items = [
    { to: "/", label: "Inicio", icon: Home, end: true },
    { to: "/dueno", label: "Dueño", icon: CalendarDays },
    { to: `/e/${DEMO_MAIN_EMPLOYEE.id}`, label: DEMO_MAIN_EMPLOYEE.name, icon: Smartphone },
  ];
  return (
    <nav className="demo-nav" aria-label="Ver el sistema como">
      <div className="demo-nav-inner">
        <span className="demo-nav-label">Ver como:</span>
        {items.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className="demo-nav-link">
            <Icon size={16} aria-hidden="true" />
            {label}
          </NavLink>
        ))}
        <label className="visually-hidden" htmlFor="demo-other">
          Ver como otro usuario
        </label>
        <select
          id="demo-other"
          className={`demo-nav-select ${current ? "active" : ""}`}
          value={current?.id ?? ""}
          onChange={(e) => e.target.value && navigate(`/e/${e.target.value}`)}
        >
          <option value="">Otro usuario…</option>
          {others.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </select>
        <NavLink to="/ayuda" className="demo-nav-link">
          <BookOpen size={16} aria-hidden="true" />
          Manual
        </NavLink>
      </div>
    </nav>
  );
}
