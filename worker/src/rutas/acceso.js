import { json, texto, esEmailValido, crearToken, limitarPorIp } from "../util.js";
import { enviarCorreo, correoAcceso } from "../correo.js";

// POST /api/acceso  { email }
// Siempre responde "ok" exista o no el correo, para no revelar quién está
// registrado (evita que alguien use este formulario para buscar personas).
export async function postAcceso(request, env, ctx) {
  let cuerpo;
  try { cuerpo = await request.json(); } catch { return json({ ok: false }, 400); }

  const email = texto(cuerpo.email, 120).toLowerCase();
  if (!esEmailValido(email)) return json({ ok: false, mensaje: "Escribe un correo válido." }, 400);

  if (!(await limitarPorIp(request, "acceso", 6, 1800))) {
    return json({ ok: false, mensaje: "Demasiados intentos. Intenta de nuevo en un rato." }, 429);
  }

  if (!env.RESEND_API_KEY) {
    return json({ ok: false, mensaje: "El envío de enlaces por correo aún no está disponible. Si ya te registraste, usa el dispositivo donde lo hiciste." }, 503);
  }

  const registro = await env.DB.prepare("SELECT id, nombre FROM registros WHERE email = ?").bind(email).first();

  const enviar = async () => {
    if (!registro) return; // correo no encontrado: no se hace nada, pero se responde ok igual
    const tokenAcceso = await crearToken(env.TOKEN_SECRETO, registro.id);
    const enlaceBiblioteca = `${env.SITE_URL}/biblioteca/?t=${tokenAcceso}`;
    const resultado = await enviarCorreo(env, {
      para: email,
      asunto: "Tu enlace a la biblioteca de Cancún Cero Cáncer",
      html: correoAcceso({ nombre: registro.nombre, enlaceBiblioteca, siteUrl: env.SITE_URL })
    });
    if (resultado.enviado) await env.DB.prepare("INSERT INTO envios (registro_id, tipo) VALUES (?, 'acceso')").bind(registro.id).run();
  };

  if (ctx?.waitUntil) ctx.waitUntil(enviar().catch((e) => console.error("[acceso] error:", e)));
  else await enviar().catch((e) => console.error("[acceso] error:", e));

  return json({ ok: true });
}
