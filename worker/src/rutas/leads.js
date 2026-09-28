import { json, cors } from "../util.js";
import { autorizado } from "./admin.js";

// ADMIN_KEY es una clave separada de exportación. Preferir Authorization sobre ?key=.
export function autorizadoLeads(request, env) {
  if (autorizado(request, env)) return true;
  const url = new URL(request.url);
  const bearer = (request.headers.get("authorization") || "").replace(/^Bearer /, "");
  const clave = url.searchParams.get("key") || bearer;
  return !!env.ADMIN_KEY && clave === env.ADMIN_KEY;
}

export async function getLeads(request, env) {
  if (!autorizadoLeads(request, env)) return json({ ok: false, mensaje: "No autorizado." }, 401);
  const url = new URL(request.url);
  const formato = url.searchParams.get("formato") || url.searchParams.get("format") || "json";
  if (!["csv", "json"].includes(formato)) return json({ ok: false, mensaje: "Formato inválido." }, 400);
  const columnas = ["id", "nombre", "whatsapp", "email", "origen", "created_at", "evento_id"];
  const { results } = await env.DB.prepare(`SELECT ${columnas.join(",")} FROM leads ORDER BY id ASC`).all();
  if (formato === "json") return json({ ok: true, total: results.length, leads: results });
  // Evitar fórmulas ejecutables al abrir datos introducidos por visitantes en Excel.
  const escapar = (v) => {
    let s = String(v ?? "");
    if (/^[\s]*[=+@-]/.test(s) || /^[\t\r\n]/.test(s)) s = "'" + s;
    return `"${s.replace(/"/g, '""')}"`;
  };
  const csv = "\uFEFF" + [columnas.join(","), ...results.map(r => columnas.map(c => escapar(r[c])).join(","))].join("\r\n");
  return new Response(csv, { headers: {
    ...cors(), "content-type": "text/csv; charset=utf-8",
    "content-disposition": 'attachment; filename="cancuncerocancer-leads.csv"',
    "cache-control": "no-store", "x-content-type-options": "nosniff", "referrer-policy": "no-referrer"
  } });
}
