import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

/**
 * Ruta base donde se publica. En GitHub Pages es "/turnos-asistencia/" (lo pasa el workflow con BASE_PATH);
 * en desarrollo y en un dominio propio, "/".
 */
const base = process.env.BASE_PATH ?? "/";

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icon.svg"],
      manifest: {
        name: "Turnos y Asistencia",
        short_name: "Turnos",
        description: "Horario, fichaje y registro de horas",
        lang: "es-AR",
        start_url: base,
        scope: base,
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#1f6f5c",
        icons: [{ src: "icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
      },
      workbox: {
        // La app abre sin señal; las marcas viajan por la cola de src/lib/punchQueue.ts, no por el SW.
        navigateFallback: `${base}index.html`,
        // Las fuentes van empaquetadas; sin esto la app sin señal caería a la fuente del sistema.
        globPatterns: ["**/*.{js,css,html,svg,woff2}"],
      },
    }),
  ],
});
