import { useEffect, useState } from "react";

/** Hora actual que se actualiza sola (default cada 30 s), para lo que se muestra "en vivo". */
export function useNow(everyMs = 30_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), everyMs);
    return () => window.clearInterval(id);
  }, [everyMs]);
  return now;
}
