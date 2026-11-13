import { BrowserRouter, Link, Route, Routes } from "react-router-dom";
import { BookOpen, CalendarDays, Smartphone } from "lucide-react";
import { AppShell } from "./components/AppShell";
import { DEMO_EMPLOYEES, DEMO_MAIN_EMPLOYEE } from "./demo";
import { DEMO_MODE } from "./lib/api";
import { EmployeeView } from "./views/EmployeeView";
import { HelpView } from "./views/HelpView";
import { OwnerView } from "./views/OwnerView";

function Home() {
  const ownerHref = DEMO_MODE ? "/dueno" : "/dueno/dueno";
  return (
    <AppShell>
      <header className="page-head">
        <h1>Turnos y Asistencia</h1>
        <p className="muted">Horarios, fichaje y horas trabajadas, a la vista del dueño y de cada empleado.</p>
      </header>

      {DEMO_MODE && (
        <p className="callout info small">
          Versión de prueba con el equipo y los horarios de noviembre. Lo que cambies se guarda solo en este navegador
          y vuelve a como estaba al recargar.
        </p>
      )}

      <div className="role-cards">
        <section className="card" aria-labelledby="role-emp">
          <span className="role-icon" aria-hidden="true">
            <Smartphone size={22} />
          </span>
          <h2 id="role-emp">Soy empleado/a</h2>
          <p className="muted">
            Entrás con el enlace personal que te manda el dueño. Ahí marcás entrada y salida, ves tus turnos y tus horas.
          </p>
          {DEMO_MODE && (
            <div className="stack">
              <Link to={`/e/${DEMO_MAIN_EMPLOYEE.id}`} className="btn primary">
                Entrar como {DEMO_MAIN_EMPLOYEE.name}
              </Link>
              <p className="muted small">
                O como:{" "}
                {DEMO_EMPLOYEES.filter((e) => e.id !== DEMO_MAIN_EMPLOYEE.id).map((e, i, list) => (
                  <span key={e.id}>
                    <Link to={`/e/${e.id}`}>{e.name}</Link>
                    {i < list.length - 1 ? " · " : ""}
                  </span>
                ))}
              </p>
            </div>
          )}
        </section>

        <section className="card" aria-labelledby="role-owner">
          <span className="role-icon" aria-hidden="true">
            <CalendarDays size={22} />
          </span>
          <h2 id="role-owner">Soy el dueño</h2>
          <p className="muted">Armás los horarios de la semana, los publicás y ves las horas de todo el equipo.</p>
          {DEMO_MODE && (
            <div className="actions">
              <Link to={ownerHref} className="btn">
                Abrir el panel
              </Link>
            </div>
          )}
        </section>
      </div>

      <Link to="/ayuda" className="card help-teaser">
        <BookOpen size={22} aria-hidden="true" />
        <span>
          <strong>¿Primera vez?</strong>
          <span className="muted"> Leé cómo se usa (2 minutos).</span>
        </span>
      </Link>
    </AppShell>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/ayuda" element={<HelpView />} />
        <Route path="/dueno/:token?" element={<OwnerView />} />
        {/* Enlace personal del empleado (sin contraseña). */}
        <Route path="/e/:token" element={<EmployeeView />} />
      </Routes>
    </BrowserRouter>
  );
}
