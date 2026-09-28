// Cancún Cero Cáncer — Worker de la API (/api/*)
// El sitio (HTML/CSS/JS) se sirve aparte, desde el hosting normal (VPS/Cloudflare Pages).
// Este Worker solo atiende las rutas que necesitan servidor: registro, acceso y biblioteca.

import { getLeads } from "./rutas/leads.js";
import { json, preflight } from "./util.js";
import { postRegistro } from "./rutas/registro.js";
import { postAcceso } from "./rutas/acceso.js";
import { getBiblioteca } from "./rutas/biblioteca.js";
import { autorizado, getRegistros, getExportarCsv } from "./rutas/admin.js";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const ruta = url.pathname.replace(/\/$/, "") || "/";
    const metodo = request.method;

    if (metodo === "OPTIONS") return preflight();

    try {
      if (ruta === "/api/leads" && metodo === "GET") return await getLeads(request, env);
      if (ruta === "/api/registro" && metodo === "POST") return await postRegistro(request, env, ctx);
      if (ruta === "/api/acceso" && metodo === "POST") return await postAcceso(request, env, ctx);
      if (ruta === "/api/biblioteca" && metodo === "GET") return await getBiblioteca(request, env);

      if (ruta.startsWith("/api/admin/")) {
        if (!autorizado(request, env)) return json({ ok: false, mensaje: "No autorizado." }, 401);
        if (ruta === "/api/admin/registros" && metodo === "GET") return await getRegistros(request, env);
        if (ruta === "/api/admin/exportar.csv" && metodo === "GET") return await getExportarCsv(request, env);
      }

      if (ruta === "/api/salud") return json({ ok: true, servicio: "cancuncerocancer-api" });

      return json({ ok: false, mensaje: "Ruta no encontrada." }, 404);
    } catch (err) {
      console.error("[worker] error no controlado:", err);
      return json({ ok: false, mensaje: "Ocurrió un error. Intenta de nuevo." }, 500);
    }
  }
};
