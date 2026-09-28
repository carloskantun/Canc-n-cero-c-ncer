import { postAcceso } from "./acceso.js";
import { json, texto, esEmailValido, normalizarWhatsApp, crearToken, idAleatorio, limitarPorIp } from "../util.js";
import { enviarCorreo, correoBienvenida } from "../correo.js";
import { enviarEventoLead } from "../meta.js";

export async function postRegistro(request, env, ctx) {
  let cuerpo;
  try { cuerpo = await request.json(); } catch { return json({ ok: false, mensaje: "Datos inválidos." }, 400); }

  // Honeypot: un campo oculto que las personas nunca llenan, pero los bots sí.
  if (texto(cuerpo.empresa)) return json({ ok: true }); // se responde éxito falso para no delatar el filtro

  if (!(await limitarPorIp(request, "registro", 8, 3600))) {
    return json({ ok: false, mensaje: "Demasiados intentos. Intenta de nuevo en un rato." }, 429);
  }

  const nombre = texto(cuerpo.nombre, 80);
  const email = texto(cuerpo.email, 120).toLowerCase();
  const whatsapp = normalizarWhatsApp(cuerpo.whatsapp);
  const edad = parseInt(cuerpo.edad, 10);

  const errores = {};
  if (nombre.length < 2) errores.nombre = "Escribe tu nombre.";
  if (!esEmailValido(email)) errores.email = "Escribe un correo válido.";
  if (whatsapp.length !== 10) errores.whatsapp = "El WhatsApp debe tener 10 dígitos.";
  if (!(edad >= 18 && edad <= 99)) errores.edad = "La edad debe estar entre 18 y 99.";
  if (!cuerpo.consentimiento) errores.consentimiento = "Debes aceptar el aviso de privacidad.";
  if (Object.keys(errores).length) return json({ ok: false, mensaje: "Revisa los datos del formulario.", errores }, 400);

  const yaExiste = await env.DB.prepare("SELECT id, token FROM registros WHERE email = ?").bind(email).first();

  let idRegistro, token;
  if (yaExiste) {
    // Un formulario público no acredita ser dueña de un correo existente.
    // Enviar acceso al correo original sin modificar datos ni entregar su token.
    const respuesta = await postAcceso(new Request(request.url, {
      method: "POST", headers: request.headers, body: JSON.stringify({ email })
    }), env, ctx);
    return respuesta;
  } else {
    token = idAleatorio(24);
    const ip = request.headers.get("cf-connecting-ip") || "";
    const ua = texto(request.headers.get("user-agent") || "", 300);
    const res = await env.DB.prepare(
      `INSERT INTO registros
       (nombre, email, whatsapp, edad, consentimiento, token, token_creado,
        utm_source, utm_medium, utm_campaign, utm_content, utm_term, fbclid, fbp, fbc,
        landing, referrer, event_id, ip, user_agent, taller)
       VALUES (?,?,?,?,1,?,datetime('now'),?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
    ).bind(
      nombre, email, whatsapp, edad, token,
      texto(cuerpo.utm_source, 100), texto(cuerpo.utm_medium, 100), texto(cuerpo.utm_campaign, 100),
      texto(cuerpo.utm_content, 100), texto(cuerpo.utm_term, 100), texto(cuerpo.fbclid, 200),
      texto(cuerpo.fbp, 100), texto(cuerpo.fbc, 100), texto(cuerpo.landing, 300), texto(cuerpo.referrer, 300),
      texto(cuerpo.eventId, 100), ip, ua, env.TALLER_ACTUAL || "taller-1"
    ).run();
    idRegistro = res.meta.last_row_id;
  }

  const tokenAcceso = await crearToken(env.TOKEN_SECRETO, idRegistro);
  const enlaceBiblioteca = `${env.SITE_URL}/biblioteca/?t=${tokenAcceso}`;

  // El correo se manda sin bloquear la respuesta al navegador (más rápido para quien se registra).
  const registroParaMeta = { email, whatsapp, eventId: cuerpo.eventId, fbp: cuerpo.fbp, fbc: cuerpo.fbc,
    pagina: cuerpo.pagina, utm_source: cuerpo.utm_source, utm_campaign: cuerpo.utm_campaign };
  const tareas = Promise.all([
    enviarCorreo(env, { para: email, asunto: "Tu acceso a Cancún Cero Cáncer", html: correoBienvenida({ nombre, enlaceBiblioteca, siteUrl: env.SITE_URL }) })
      .then((resultado) => resultado.enviado ? env.DB.prepare("INSERT INTO envios (registro_id, tipo) VALUES (?, 'bienvenida')").bind(idRegistro).run() : undefined)
      .catch((e) => console.error("[registro] error de correo:", e)),
    enviarEventoLead(env, registroParaMeta, request).catch((e) => console.error("[registro] error de CAPI:", e))
  ]);
  if (ctx?.waitUntil) ctx.waitUntil(tareas); else await tareas;

  return json({ ok: true, token: tokenAcceso, correoHabilitado: !!env.RESEND_API_KEY });
}
