import { json, verificarToken } from '../util.js';
import { enviarCorreo, correoTicket } from '../correo.js';
import { autorizadoLeads } from './leads.js';

async function participante(request, env) {
 const auth = request.headers.get('authorization') || '';
 if (!auth.startsWith('Bearer ')) return null;
 let datos;
 try { datos = await verificarToken(env.TOKEN_SECRETO, auth.slice(7)); } catch { return null; }
 if (!datos) return null;
 return env.DB.prepare('SELECT id,nombre,email FROM registros WHERE id=?').bind(datos.idRegistro).first();
}
const consultaTicket = `SELECT t.id,t.sesion_id,t.asiento,t.estado,t.creado_en,s.inicio,s.fin,s.lugar
 FROM tickets t JOIN sesiones s ON s.id=t.sesion_id WHERE t.registro_id=? AND t.estado='confirmado'`;
async function estado(env, persona) {
 const { results: sesiones } = await env.DB.prepare(`SELECT s.*,
 MAX(0,s.cupo-(SELECT COUNT(*) FROM tickets t WHERE t.sesion_id=s.id AND t.estado='confirmado')) AS disponibles,
 CASE WHEN EXISTS(SELECT 1 FROM tickets cancelado WHERE cancelado.registro_id=? AND cancelado.estado='cancelado' AND cancelado.sesion_id=s.id) THEN 1 ELSE 0 END AS bloqueada,
 CASE WHEN s.activa=1 AND julianday(s.inicio)>julianday('now') THEN 1 ELSE 0 END AS abierta
 FROM sesiones s ORDER BY s.inicio`).bind(persona.id).all();
 const {results:ocupados}=await env.DB.prepare("SELECT sesion_id,asiento FROM tickets WHERE estado='confirmado'").all();
 for (const sesion of sesiones) sesion.ocupados=ocupados.filter(t=>t.sesion_id===sesion.id).map(t=>t.asiento);
 const ticket = await env.DB.prepare(consultaTicket).bind(persona.id).first();
 if(ticket) ticket.correo=await env.DB.prepare('SELECT enviado_en,intentos,ultimo_error FROM tickets_correos WHERE ticket_id=?').bind(ticket.id).first();
 return {ok:true,nombre:persona.nombre,sesiones,ticket,zonaHoraria:'America/Cancun',limitePorPersona:1};
}
export async function getTickets(request, env) {
 const persona=await participante(request,env);
 if (!persona) return json({ok:false,mensaje:'Ingresa con tu enlace de acceso para reservar.'},401);
 return json(await estado(env,persona));
}
export async function postTicket(request, env) {
 const persona=await participante(request,env);
 if (!persona) return json({ok:false,mensaje:'Tu acceso no es válido. Solicita un enlace nuevo.'},401);
 let cuerpo; try { cuerpo=await request.json(); } catch {return json({ok:false,mensaje:'Solicitud inválida.'},400);}
 if (!cuerpo || typeof cuerpo.sesion_id!=='string' || !/^nov(16|17|18|21)-(manana|tarde)$/.test(cuerpo.sesion_id)) return json({ok:false,mensaje:'Selecciona una sesión válida.'},400);
 if (!Number.isInteger(cuerpo.asiento) || cuerpo.asiento<1 || cuerpo.asiento>25) return json({ok:false,mensaje:'Selecciona un asiento válido.'},400);
 const actual=await env.DB.prepare(consultaTicket).bind(persona.id).first();
 if (actual) {
  if(actual.sesion_id!==cuerpo.sesion_id || actual.asiento!==cuerpo.asiento) return json({ok:false,mensaje:'Ya tienes una reserva. Cancélala antes de elegir otra sesión.'},409);
  await enviarTicket(env,persona,actual);return json(await estado(env,persona));
 }
 try {
  await env.DB.prepare('INSERT INTO tickets(id,registro_id,sesion_id,asiento) VALUES(?,?,?,?)')
   .bind('CCC-'+crypto.randomUUID().replace(/-/g,'').toUpperCase(),persona.id,cuerpo.sesion_id,cuerpo.asiento).run();
 } catch(error) {
  // Un reintento concurrente debe devolver el mismo ticket, nunca ocupar otro lugar.
  const existente=await env.DB.prepare(consultaTicket).bind(persona.id).first();
  if (existente?.sesion_id===cuerpo.sesion_id && existente.asiento===cuerpo.asiento) {await enviarTicket(env,persona,existente);return json(await estado(env,persona));}
  if (/SESION_CANCELADA/.test(String(error))) return json({ok:false,mensaje:'Cancelaste esta sesión. Elige otro horario o fecha.'},409);
  if (existente || /SESION_NO_DISPONIBLE|UNIQUE constraint/.test(String(error))) return json({ok:false,mensaje:'No se pudo reservar: el asiento fue ocupado, el horario cerró o ya tienes un ticket. Actualiza la disponibilidad.'},409);
  throw error;
 }
 const nuevo=await env.DB.prepare(consultaTicket).bind(persona.id).first();
 await enviarTicket(env,persona,nuevo);
 return json(await estado(env,persona),201);
}
export async function cancelarTicket(request,env) {
 const persona=await participante(request,env);
 if (!persona) return json({ok:false,mensaje:'Tu acceso no es válido.'},401);
 let cuerpo; try { cuerpo=await request.json(); } catch { return json({ok:false},400); }
 if (!cuerpo || typeof cuerpo.id!=='string') return json({ok:false},400);
 const res=await env.DB.prepare(`UPDATE tickets SET estado='cancelado',cancelado_en=datetime('now')
 WHERE id=? AND registro_id=? AND estado='confirmado'
 AND EXISTS(SELECT 1 FROM sesiones s WHERE s.id=tickets.sesion_id AND julianday(s.inicio)>julianday('now'))`)
 .bind(cuerpo.id,persona.id).run();
 if (!res.meta.changes) return json({ok:false,mensaje:'No se pudo cancelar. Actualiza tus tickets; la sesión puede haber iniciado.'},409);
 return json(await estado(env,persona));
}
export async function adminTickets(request,env) {
 if (!autorizadoLeads(request,env)) return json({ok:false,mensaje:'No autorizado.'},401);
 const {results}=await env.DB.prepare(`SELECT t.id AS folio,char(65 + CAST((t.asiento-1)/5 AS INTEGER)) || ((t.asiento-1)%5+1) AS asiento,t.estado,r.nombre,r.whatsapp,r.email,s.inicio,s.fin,s.lugar,t.creado_en,t.cancelado_en,r.creado_en AS registro_creado_en,tc.enviado_en AS correo_enviado_en,tc.ultimo_error AS correo_error
 FROM tickets t JOIN registros r ON r.id=t.registro_id JOIN sesiones s ON s.id=t.sesion_id LEFT JOIN tickets_correos tc ON tc.ticket_id=t.id
 ORDER BY s.inicio,t.creado_en`).all();
 if (new URL(request.url).searchParams.get('format')==='csv') {
  const columnas=['folio','asiento','estado','nombre','whatsapp','email','inicio','fin','lugar','creado_en','registro_creado_en','cancelado_en','correo_enviado_en','correo_error'];
  const escapar=v=>'"'+String(v??'').replace(/^[\s]*[=+@-]|^[\t\r\n]/,x=>"'"+x).replace(/"/g,'""')+'"';
  return new Response('\uFEFF'+[columnas.join(','),...results.map(r=>columnas.map(c=>escapar(r[c])).join(','))].join('\r\n'),{headers:{'content-type':'text/csv; charset=utf-8','cache-control':'no-store','access-control-allow-origin':'*','content-disposition':'attachment; filename="ccc-tickets.csv"'}});
 }
 const {results:sesiones}=await env.DB.prepare(`SELECT s.id,s.inicio,s.fin,s.cupo,s.lugar,
 (SELECT COUNT(*) FROM tickets t WHERE t.sesion_id=s.id AND t.estado='confirmado') AS reservados FROM sesiones s ORDER BY s.inicio`).all();
 return json({ok:true,tickets:results,sesiones});
}

// La reserva ya está confirmada antes del correo. Un fallo de envío nunca libera el asiento.
async function enviarTicket(env,persona,ticket) {
 if(!ticket)return;
 try {
  await env.DB.prepare('INSERT OR IGNORE INTO tickets_correos(ticket_id) VALUES(?)').bind(ticket.id).run();
  const anterior=await env.DB.prepare('SELECT enviado_en FROM tickets_correos WHERE ticket_id=?').bind(ticket.id).first();
  if(anterior?.enviado_en)return;
  const resultado=await enviarCorreo(env,{para:persona.email,asunto:'Tu ticket · Cancún Cero Cáncer',html:correoTicket({nombre:persona.nombre,ticket,siteUrl:env.SITE_URL}),idempotencia:'ticket/'+ticket.id});
  await env.DB.prepare("UPDATE tickets_correos SET intentos=intentos+1,enviado_en=CASE WHEN ?=1 THEN datetime('now') ELSE enviado_en END,ultimo_error=? WHERE ticket_id=?")
   .bind(resultado.enviado?1:0,resultado.enviado?null:resultado.motivo,ticket.id).run();
 } catch (_) {
  console.error('[ticket] No se completó el envío del correo.');
  await env.DB.prepare("UPDATE tickets_correos SET intentos=intentos+1,ultimo_error='conexion' WHERE ticket_id=?").bind(ticket.id).run().catch(()=>{});
 }
}
export async function reintentarCorreoTicket(request,env) {
 const persona=await participante(request,env);
 if(!persona)return json({ok:false},401);
 const ticket=await env.DB.prepare(consultaTicket).bind(persona.id).first();
 if(!ticket)return json({ok:false,mensaje:'No tienes una reserva activa.'},409);
 await enviarTicket(env,persona,ticket);
 return json(await estado(env,persona));
}
