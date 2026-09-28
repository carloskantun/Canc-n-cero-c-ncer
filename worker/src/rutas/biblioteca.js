import { json, verificarToken } from "../util.js";
import contenidoBiblioteca from "../../content/biblioteca.json";

// GET /api/biblioteca?t=TOKEN
export async function getBiblioteca(request, env) {
  const url = new URL(request.url);
  const token = url.searchParams.get("t") || "";
  const datos = await verificarToken(env.TOKEN_SECRETO, token);
  if (!datos) return json({ ok: false, mensaje: "Tu enlace ya no es válido." }, 401);

  const registro = await env.DB.prepare("SELECT id, nombre FROM registros WHERE id = ?").bind(datos.idRegistro).first();
  if (!registro) return json({ ok: false, mensaje: "No encontramos tu registro." }, 403);

  await env.DB.prepare("UPDATE registros SET ultimo_acceso = datetime('now') WHERE id = ?").bind(registro.id).run();

  return json({
    ok: true,
    nombre: registro.nombre,
    categorias: contenidoBiblioteca.categorias,
    semanas: contenidoBiblioteca.semanas,
    // Solo se mandan videos y guías de semanas activas: si alguien inspecciona
    // la respuesta de la API no puede adelantarse al contenido bloqueado.
    videos: contenidoBiblioteca.videos.filter((v) => estaActiva(v.semana)),
    guias: contenidoBiblioteca.guias.filter((g) => estaActiva(g.semana))
  });

  function estaActiva(numeroSemana) {
    const semana = contenidoBiblioteca.semanas.find((s) => s.numero === numeroSemana);
    return !!semana?.activa;
  }
}
