/* Cuenta compartida; talleres y biblioteca tienen recorridos independientes. */
(async function(){
 'use strict';
 const C=window.CCC, raiz=document.getElementById('cuenta');
 const guardado=C.leer('localStorage','ccc_acceso')||{},token=C.tokenUrl||guardado.token;
 if(!token){location.replace('/acceso/');return;}
 try{
  const s=await C.contenido();C.pintarMarco(s);
  const r=await fetch(C.api('/tickets'),{headers:{Authorization:'Bearer '+token},cache:'no-store'});
  if(r.status===401){C.borrar('localStorage','ccc_acceso');location.replace('/acceso/?expirado=1');return;}
  if(!r.ok)throw new Error();
  const d=await r.json();C.guardar('localStorage','ccc_acceso',{token,nombre:d.nombre});C.pintarMarco(s);
  const disponible=d.sesiones.some(x=>x.abierta && x.disponibles>0 && !x.bloqueada);
  raiz.innerHTML='<div class="contenedor"><span class="antetitulo">Mi cuenta</span><h1>Hola, '+C.esc(C.primerNombre(d.nombre))+'</h1><p>Elige qué quieres consultar.</p><div class="rejilla rejilla--2"><article class="guia"><span class="antetitulo">Taller gratuito</span><h2>Experiencia en Hospital Galenia</h2><p>'+C.esc(s.taller.datos.fechas)+'</p><p>'+(d.ticket?'Tienes un asiento confirmado. Consulta o descarga tu ticket.':disponible?'Todavía puedes elegir fecha, horario y asiento.':'Consulta las sesiones y su disponibilidad.')+'</p><a class="btn btn--primario" href="/talleres/">'+(d.ticket?'Ver mi ticket':'Ver taller y reservar')+'</a></article><article class="guia"><span class="antetitulo">Biblioteca</span><h2>Ejercicios y guías</h2><p>Consulta tus materiales cuando quieras. No necesitas reservar un taller para abrir la biblioteca.</p><a class="btn btn--contorno" href="/biblioteca/">Abrir biblioteca</a></article></div><p><button id="salir-cuenta" class="btn btn--contorno">Cerrar sesión</button></p></div>';
  document.getElementById('salir-cuenta').onclick=()=>{C.borrar('localStorage','ccc_acceso');C.borrar('sessionStorage','ccc_lead');location.replace('/acceso/');};
 }catch(_){raiz.innerHTML='<div class="contenedor"><p>No pudimos abrir tu cuenta. Intenta de nuevo.</p><button class="btn btn--primario" onclick="location.reload()">Reintentar</button></div>';}
})();
