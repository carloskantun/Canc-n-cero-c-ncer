import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {crearToken} from '../src/util.js';
import {getTickets,postTicket,cancelarTicket,adminTickets,reintentarCorreoTicket} from '../src/rutas/tickets.js';

function entorno() {
 const db=new DatabaseSync(':memory:');
 db.exec(readFileSync(new URL('../schema.sql',import.meta.url),'utf8'));
 // Fechas futuras para que la prueba no caduque junto con el evento real.
 db.exec("UPDATE sesiones SET inicio='2099'||substr(inicio,5),fin='2099'||substr(fin,5)");
 for(let i=1;i<=30;i++)db.prepare('INSERT INTO registros(nombre,email,whatsapp,token,token_creado) VALUES(?,?,?,?,?)').run('Persona '+i,i+'@example.invalid','9981234567','local-'+i,'2026-10-22');
 const env={TOKEN_SECRETO:'solo-pruebas',ADMIN_KEY:'admin-pruebas',DB:{prepare(sql){return {bind(...args){return {all:async()=>({results:db.prepare(sql).all(...args)}),first:async()=>db.prepare(sql).get(...args)||null,run:async()=>({meta:db.prepare(sql).run(...args)})};},all:async()=>({results:db.prepare(sql).all()})};}}};
 return {db,env};
}
async function solicitud(env,id,cuerpo,ruta='/tickets') {
 return new Request('https://example.invalid/api'+ruta,{method:cuerpo?'POST':'GET',headers:{Authorization:'Bearer '+await crearToken(env.TOKEN_SECRETO,id),'Content-Type':'application/json'},body:cuerpo?JSON.stringify(cuerpo):undefined});
}
test('tickets: autenticación, identidad, reintentos, concurrencia y cancelación propia',async()=>{
 const {db,env}=entorno();
 assert.equal((await getTickets(new Request('https://example.invalid'),env)).status,401);
 assert.equal((await adminTickets(new Request('https://example.invalid'),env)).status,401);
 const req=()=>solicitud(env,1,{sesion_id:'nov16-manana',asiento:1,registro_id:2});
 const respuesta=await postTicket(await req(),env);assert.equal(respuesta.status,201);
 const ticket=(await respuesta.json()).ticket;
 assert.equal(db.prepare('SELECT registro_id FROM tickets').get().registro_id,1);
 assert.equal((await postTicket(await req(),env)).status,200);
 assert.equal(db.prepare('SELECT count(*) n FROM tickets').get().n,1);
 assert.equal((await postTicket(await solicitud(env,1,{sesion_id:'nov17-manana',asiento:2}),env)).status,409);
 assert.equal((await cancelarTicket(await solicitud(env,2,{id:ticket.id}),env)).status,409);
 assert.equal((await cancelarTicket(await solicitud(env,1,{id:ticket.id}),env)).status,200);
 const trasCancelar=await (await getTickets(await solicitud(env,1),env)).json();
 assert.equal(trasCancelar.sesiones.find(s=>s.id==='nov16-manana').bloqueada,1);
 assert.equal(trasCancelar.sesiones.find(s=>s.id==='nov16-tarde').bloqueada,0);
 assert.equal((await postTicket(await req(),env)).status,409);
 assert.equal((await postTicket(await solicitud(env,1,{sesion_id:'nov16-tarde',asiento:5}),env)).status,201);
 assert.equal((await postTicket(await solicitud(env,1,{sesion_id:'nov17-manana',asiento:5}),env)).status,409);
 const peticiones=await Promise.all([2,3].map(id=>solicitud(env,id,{sesion_id:'nov16-manana',asiento:1})));
 const resultados=await Promise.all(peticiones.map(r=>postTicket(r,env)));
 assert.deepEqual(resultados.map(r=>r.status).sort(),[201,409]);
 const estado=await (await getTickets(await solicitud(env,4),env)).json();
 assert.equal(estado.sesiones.length,8);assert.deepEqual(estado.sesiones[0].ocupados,[1]);
 assert.equal(estado.sesiones[0].disponibles,24);
 assert.throws(()=>db.prepare("UPDATE tickets SET estado='confirmado' WHERE id=?").run(ticket.id),/TICKET_INMUTABLE/);
 db.close();
});
test('tickets: cupo de 25, asiento válido y sesión cerrada; exportación administrativa',async()=>{
 const {db,env}=entorno();
 for(let id=1;id<=25;id++)assert.equal((await postTicket(await solicitud(env,id,{sesion_id:'nov16-manana',asiento:id}),env)).status,201);
 assert.equal((await postTicket(await solicitud(env,26,{sesion_id:'nov16-manana',asiento:1}),env)).status,409);
 assert.equal((await postTicket(await solicitud(env,26,{sesion_id:'nov17-manana',asiento:26}),env)).status,400);
 db.exec("UPDATE sesiones SET activa=0 WHERE id='nov17-manana'");
 assert.equal((await postTicket(await solicitud(env,26,{sesion_id:'nov17-manana',asiento:1}),env)).status,409);
 const csv=await adminTickets(new Request('https://example.invalid/api/admin/tickets?format=csv',{headers:{Authorization:'Bearer '+env.ADMIN_KEY}}),env);
 assert.equal(csv.status,200);assert.match(await csv.text(),/"E5"/);
 assert.equal(db.prepare('SELECT count(*) n FROM registros').get().n,30);
 assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(),[]);
 db.close();
});

test('correo del ticket: fallo no pierde asiento, reintento entrega una sola vez y admin conserva fechas',async()=>{
 const {db,env}=entorno();env.RESEND_API_KEY='solo-test';env.SITE_URL='https://example.invalid';
 const original=globalThis.fetch;let llamadas=0,fallar=true;
 globalThis.fetch=async(url,op)=>{llamadas++;assert.equal(url,'https://api.resend.com/emails');assert.match(op.headers['Idempotency-Key'],/^ticket\/CCC-/);const cuerpo=JSON.parse(op.body);assert.deepEqual(cuerpo.to,['1@example.invalid']);assert.match(cuerpo.html,/Asiento/);return new Response('{}',{status:fallar?503:200});};
 try{
  let r=await postTicket(await solicitud(env,1,{sesion_id:'nov16-manana',asiento:3}),env);assert.equal(r.status,201);
  let estado=await r.json();assert.equal(estado.ticket.correo.enviado_en,null);assert.equal(estado.sesiones[0].disponibles,24);
  fallar=false;r=await reintentarCorreoTicket(await solicitud(env,1,{}),env);estado=await r.json();assert.ok(estado.ticket.correo.enviado_en);
  await reintentarCorreoTicket(await solicitud(env,1,{}),env);assert.equal(llamadas,2);
  const admin=await (await adminTickets(new Request('https://example.invalid/api/admin/tickets',{headers:{Authorization:'Bearer '+env.ADMIN_KEY}}),env)).json();
  assert.ok(admin.tickets[0].registro_creado_en);assert.ok(admin.tickets[0].correo_enviado_en);assert.equal(admin.tickets[0].asiento,'A3');
 }finally{globalThis.fetch=original;db.close();}
});
