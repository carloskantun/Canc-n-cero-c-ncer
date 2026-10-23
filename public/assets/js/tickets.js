/* Reserva autenticada. El asiento se confirma en el servidor, nunca en el navegador. */
(function () {
 'use strict';
 var C=window.CCC, raiz=document.getElementById('mis-tickets');
 if (!raiz) return;
 var acceso=C.leer('localStorage','ccc_acceso') || {};
 var token=C.tokenUrl || acceso.token;
 var datos, seleccion='', asiento=0, ocupado=false;
 var e=C.esc;
 function etiqueta(n){return String.fromCharCode(65+Math.floor((n-1)/5))+((n-1)%5+1);}
 function fecha(v){return new Intl.DateTimeFormat('es-MX',{timeZone:'America/Cancun',weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(new Date(v));}
 function hora(v){return new Intl.DateTimeFormat('es-MX',{timeZone:'America/Cancun',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date(v));}
 function aviso(t){document.getElementById('ticket-aviso').textContent=t;}
 async function api(ruta,cuerpo){
  var r=await fetch(C.api(ruta),{method:cuerpo?'POST':'GET',headers:{Authorization:'Bearer '+token,...(cuerpo?{'Content-Type':'application/json'}:{})},body:cuerpo?JSON.stringify(cuerpo):undefined,cache:'no-store',signal:AbortSignal.timeout(20000)});
  var j=await r.json();
  if(!r.ok){var error=new Error(j.mensaje || 'No pudimos completar la solicitud.');error.status=r.status;throw error;}
  return j;
 }
 function pintar(){
  raiz.innerHTML='<div class="contenedor"><div class="tickets-cabecera"><span class="antetitulo">Tu experiencia en Cancún</span><h2>Elige tu fecha y asiento</h2><p>Auditorio del Hospital Galenia Cancún. Un lugar por persona, con asiento numerado. Todos los horarios son de Cancún.</p></div><p id="ticket-aviso" role="status" aria-live="polite"></p><div id="ticket-contenido"></div></div>';
  var caja=document.getElementById('ticket-contenido');
  if(datos.ticket){
   var t=datos.ticket;
   caja.innerHTML='<article class="ticket-confirmado"><span class="antetitulo">Reserva confirmada</span><h3>'+e(datos.nombre)+'</h3><p>'+e(fecha(t.inicio))+'<br><strong>'+hora(t.inicio)+'–'+hora(t.fin)+' · Asiento '+etiqueta(t.asiento)+'</strong><br>'+e(t.lugar)+'</p><p class="ticket-folio">Folio: '+e(t.id)+'</p><p>Guarda tu ticket y preséntalo al llegar. El asiento pertenece a esta fecha y horario.</p><div class="botones"><button class="btn btn--primario" id="ticket-descargar">Guardar ticket</button><button class="btn btn--contorno" id="ticket-cancelar">Cancelar reserva</button><a class="btn btn--contorno" href="/biblioteca/#biblioteca">Ver biblioteca</a></div><p id="ticket-confirmacion" hidden>¿Deseas liberar tu asiento? Al cancelar liberas tu asiento y no podrás reservar nuevamente ese mismo día, en ninguno de sus horarios. Podrás elegir otra fecha según disponibilidad. <button class="btn btn--contorno btn--sm" id="ticket-cancelar-si">Sí, cancelar</button> <button class="btn btn--contorno btn--sm" id="ticket-cancelar-no">Conservar mi reserva</button></p></article>';
   document.getElementById('ticket-descargar').onclick=function(){window.CCCTicket.mostrar(t,datos.nombre);};
   var correo=document.createElement('p');correo.textContent=t.correo && t.correo.enviado_en?'Ticket enviado al correo de tu registro. Revisa también spam.':'Tu asiento está guardado, pero el correo del ticket no se ha confirmado.';caja.append(correo);
   if(!t.correo || !t.correo.enviado_en){var reenvio=document.createElement('button');reenvio.className='btn btn--contorno';reenvio.textContent='Reintentar envío al correo';reenvio.onclick=function(){mutar('/tickets/correo',{},'Estado del envío actualizado.');};caja.append(reenvio);}
   document.getElementById('ticket-cancelar').onclick=function(){document.getElementById('ticket-confirmacion').hidden=false;};
   document.getElementById('ticket-cancelar-no').onclick=function(){document.getElementById('ticket-confirmacion').hidden=true;};
   document.getElementById('ticket-cancelar-si').onclick=function(){mutar('/tickets/cancelar',{id:t.id},'Tu reserva fue cancelada. Puedes elegir otra fecha, excepto el día que cancelaste.');};
   return;
  }
  caja.innerHTML='<label for="ticket-sesion"><strong>1. Fecha y horario</strong></label><select id="ticket-sesion"><option value="">Selecciona una sesión</option>'+datos.sesiones.map(function(s){return '<option value="'+e(s.id)+'" '+(!s.abierta || s.disponibles===0 || s.bloqueada?'disabled':'')+'>'+e(fecha(s.inicio))+' · '+hora(s.inicio)+'–'+hora(s.fin)+' · '+(s.bloqueada?'No disponible: cancelaste esta fecha':s.abierta?s.disponibles+' lugares':'Cerrada')+'</option>';}).join('')+'</select><div id="ticket-plano"></div><div class="botones"><button class="btn btn--contorno btn--sm" id="ticket-actualizar">Actualizar lugares</button></div>';
  var selector=document.getElementById('ticket-sesion');
  if(datos.sesiones.some(function(s){return s.id===seleccion && s.abierta && s.disponibles>0 && !s.bloqueada;}))selector.value=seleccion;else {seleccion="";asiento=0;}
  selector.onchange=function(){seleccion=selector.value;asiento=0;plano();};
  document.getElementById('ticket-actualizar').onclick=function(){cargar();};
  plano();
 }
 function plano(){
  var caja=document.getElementById('ticket-plano'),s=datos.sesiones.find(function(s){return s.id===seleccion;});
  if(!s){caja.innerHTML='';return;}
  if(s.ocupados.includes(asiento))asiento=0;
  caja.innerHTML='<fieldset class="asientos"><legend>2. Elige tu asiento</legend><div class="escenario">Frente del auditorio</div><p class="micro">Cinco filas, A–E, y cinco asientos por fila. Los ocupados no se pueden seleccionar.</p><div class="asientos-rejilla">'+Array.from({length:25},function(_,i){var n=i+1,bloqueado=s.ocupados.includes(n);return '<label class="asiento '+(bloqueado?'asiento-ocupado':'')+'"><input type="radio" name="asiento" value="'+n+'" '+(bloqueado?'disabled':'')+' '+(asiento===n?'checked':'')+'><span>'+etiqueta(n)+(bloqueado?'<small>Ocupado</small>':'')+'</span></label>';}).join('')+'</div></fieldset><p id="ticket-resumen" aria-live="polite"></p><button id="ticket-reservar" class="btn btn--primario" disabled>Confirmar mi lugar</button><p class="micro">El lugar queda reservado únicamente al recibir tu ticket confirmado.</p>';
  caja.querySelectorAll('input').forEach(function(input){input.onchange=function(){asiento=Number(input.value);resumen();};});
  function resumen(){document.getElementById('ticket-resumen').textContent=asiento?fecha(s.inicio)+' · '+hora(s.inicio)+'–'+hora(s.fin)+' · Asiento '+etiqueta(asiento):'Selecciona uno de los asientos disponibles.';document.getElementById('ticket-reservar').disabled=!asiento;}
  resumen();
  document.getElementById('ticket-reservar').onclick=function(){mutar('/tickets',{sesion_id:seleccion,asiento:asiento},'Tu reserva está confirmada. Guarda tu ticket.');};
 }
 async function mutar(ruta,cuerpo,texto){
  if(ocupado)return;ocupado=true;
  raiz.querySelectorAll('button,input,select').forEach(function(x){x.disabled=true;});aviso('Procesando…');
  try{datos=await api(ruta,cuerpo);seleccion='';asiento=0;pintar();aviso(texto);if(ruta==='/tickets' && datos.ticket)window.CCCTicket.mostrar(datos.ticket,datos.nombre);}
  catch(err){
   // Ante respuesta perdida consultar el servidor antes de permitir otro intento.
   try{datos=await api('/tickets');pintar();aviso(datos.ticket?'Tu reserva está confirmada; aquí está tu ticket.':err.message);if(ruta==='/tickets' && datos.ticket)window.CCCTicket.mostrar(datos.ticket,datos.nombre);}
   catch(_){raiz.innerHTML='<div class="contenedor"><p role="alert">No pudimos confirmar el resultado. Actualiza para consultar tu reserva antes de intentarlo otra vez.</p><button class="btn btn--contorno" id="ticket-reintentar">Consultar mi reserva</button></div>';document.getElementById('ticket-reintentar').onclick=cargar;}
  }finally{ocupado=false;}
 }
 async function cargar(){
  raiz.innerHTML='<div class="contenedor"><p role="status">Consultando tus tickets y los lugares disponibles…</p></div>';
  if(!token){raiz.innerHTML='<div class="contenedor"><h2>Reserva tu lugar</h2><p>Ingresa con tu enlace de correo para elegir fecha, horario y asiento.</p><a class="btn btn--primario" href="/acceso/">Ingresar</a></div>';return;}
  try{datos=await api('/tickets');C.guardar('localStorage','ccc_acceso',{token:token,nombre:datos.nombre});pintar();}
  catch(err){raiz.innerHTML='<div class="contenedor"><p role="alert">'+e(err.message)+'</p>'+(err.status===401?'<a class="btn btn--primario" href="/acceso/?expirado=1">Solicitar acceso</a>':'<button class="btn btn--contorno" id="ticket-reintentar">Reintentar</button>')+'</div>';var b=document.getElementById('ticket-reintentar');if(b)b.onclick=cargar;}
 }
 // Actualizar lugares al volver a la pestaña, sin interrumpir una confirmación.
 document.addEventListener('visibilitychange',function(){if(!document.hidden && !ocupado)cargar();});
 cargar();
})();
