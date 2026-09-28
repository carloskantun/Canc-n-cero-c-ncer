// Utilidades compartidas por el Worker: respuestas JSON, CORS y validación.

export function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...cors(), ...extraHeaders }
  });
}

export function cors() {
  // El sitio y la API viven en el mismo dominio (cancuncerocancer.com/api/*),
  // así que no hace falta CORS entre ellos. Se deja abierto solo por si el
  // sitio se sirve alguna vez desde un subdominio distinto (por ejemplo, en pruebas).
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET, POST, OPTIONS",
    "access-control-allow-headers": "content-type, authorization"
  };
}

export function preflight() {
  return new Response(null, { status: 204, headers: cors() });
}

export function texto(s, max = 500) {
  return String(s ?? "").trim().slice(0, max);
}

export function esEmailValido(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
}

export function soloDigitos(v) {
  return String(v ?? "").replace(/\D/g, "");
}

export function normalizarWhatsApp(v) {
  let d = soloDigitos(v);
  if (d.length === 12 && d.startsWith("52")) d = d.slice(2);
  if (d.length === 13 && d.startsWith("521")) d = d.slice(3);
  return d;
}

export function idAleatorio(bytes = 20) {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}

// Token de acceso firmado con HMAC-SHA256: "<idRegistro>.<expira>.<firma>"
// No hace falta guardarlo en la base de datos: se valida solo con la firma.
async function claveHmac(secreto) {
  return crypto.subtle.importKey("raw", new TextEncoder().encode(secreto), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

export async function crearToken(secreto, idRegistro, diasValidez = 120) {
  const expira = Math.floor(Date.now() / 1000) + diasValidez * 86400;
  const base = `${idRegistro}.${expira}`;
  const clave = await claveHmac(secreto);
  const firma = await crypto.subtle.sign("HMAC", clave, new TextEncoder().encode(base));
  const firmaHex = Array.from(new Uint8Array(firma), (b) => b.toString(16).padStart(2, "0")).join("");
  return `${base}.${firmaHex}`;
}

export async function verificarToken(secreto, token) {
  if (!token || typeof token !== "string") return null;
  const partes = token.split(".");
  if (partes.length !== 3) return null;
  const [idStr, expiraStr, firmaHex] = partes;
  const base = `${idStr}.${expiraStr}`;
  const clave = await claveHmac(secreto);
  const firmaBytes = firmaHex.match(/.{1,2}/g)?.map((h) => parseInt(h, 16));
  if (!firmaBytes) return null;
  const ok = await crypto.subtle.verify("HMAC", clave, new Uint8Array(firmaBytes), new TextEncoder().encode(base));
  if (!ok) return null;
  const expira = parseInt(expiraStr, 10);
  if (!expira || expira < Math.floor(Date.now() / 1000)) return null;
  const id = parseInt(idStr, 10);
  if (!id) return null;
  return { idRegistro: id, expira };
}

// Limitador de intentos muy simple usando Cache API (evita golpear D1 en abusos).
// No es a prueba de balas (Cache API es por centro de datos), pero frena bots simples.
export async function limitarPorIp(request, clave, limite, ventanaSegundos) {
  const ip = request.headers.get("cf-connecting-ip") || "0.0.0.0";
  const cache = caches.default;
  const cacheKey = new Request(`https://limite.interno/${clave}/${ip}`);
  const actual = await cache.match(cacheKey);
  const cuenta = actual ? parseInt(await actual.text(), 10) : 0;
  if (cuenta >= limite) return false;
  await cache.put(cacheKey, new Response(String(cuenta + 1), { headers: { "cache-control": `max-age=${ventanaSegundos}` } }));
  return true;
}
