import { json } from "../util.js";

// Todas las rutas /api/admin/* piden el encabezado:
//   Authorization: Bearer TU_ADMIN_TOKEN   (configurado con: wrangler secret put ADMIN_TOKEN)
export function autorizado(request, env) {
  const auth = request.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  return !!env.ADMIN_TOKEN && token === env.ADMIN_TOKEN;
}

// GET /api/admin/registros — lista en JSON (para revisar rápido o para tu propia herramienta)
export async function getRegistros(request, env) {
  const url = new URL(request.url);
  const limite = Math.min(parseInt(url.searchParams.get("limite") || "200", 10) || 200, 1000);
  const { results } = await env.DB.prepare(
    `SELECT id, nombre, email, whatsapp, edad, utm_source, utm_medium, utm_campaign, utm_content,
            fbclid, landing, taller, creado_en, ultimo_acceso
     FROM registros ORDER BY id DESC LIMIT ?`
  ).bind(limite).all();
  return json({ ok: true, total: results.length, registros: results });
}

// GET /api/admin/exportar.csv — para abrir en Excel/Sheets
export async function getExportarCsv(request, env) {
  const { results } = await env.DB.prepare(
    `SELECT id, nombre, email, whatsapp, edad, utm_source, utm_medium, utm_campaign, utm_content, utm_term,
            fbclid, landing, referrer, taller, creado_en, ultimo_acceso
     FROM registros ORDER BY id ASC`
  ).all();

  const columnas = ["id", "nombre", "email", "whatsapp", "edad", "utm_source", "utm_medium", "utm_campaign",
    "utm_content", "utm_term", "fbclid", "landing", "referrer", "taller", "creado_en", "ultimo_acceso"];
  const escapar = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const filas = [columnas.join(",")].concat(
    results.map((r) => columnas.map((c) => escapar(r[c])).join(","))
  );
  const csv = "﻿" + filas.join("\r\n"); // BOM para que Excel muestre bien los acentos

  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="cancuncerocancer-registros.csv"`,
      "access-control-allow-origin": "*"
    }
  });
}
