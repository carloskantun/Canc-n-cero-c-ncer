/* Ticket visual local, sin datos ni credenciales en servicios externos. */
(function(){
 'use strict';
 const fecha=v=>new Intl.DateTimeFormat('es-MX',{timeZone:'America/Cancun',day:'numeric',month:'long',year:'numeric'}).format(new Date(v));
 const hora=v=>new Intl.DateTimeFormat('es-MX',{timeZone:'America/Cancun',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date(v));
 function asiento(v){return typeof v==='number'?String.fromCharCode(65+Math.floor((v-1)/5))+((v-1)%5+1):v;}
 function lienzo(t,nombre){
  const c=document.createElement('canvas');c.width=1000;c.height=1360;const x=c.getContext('2d');
  x.fillStyle='#f7f1e8';x.fillRect(0,0,1000,1360);x.fillStyle='#ffffff';x.fillRect(48,48,904,1264);
  x.fillStyle='#0a7580';x.fillRect(48,48,904,190);x.fillStyle='#ffffff';x.font='bold 42px sans-serif';x.fillText('Cancún Cero Cáncer',90,130);x.font='28px sans-serif';x.fillText('Experiencia · Hospital Galenia',90,188);
  function texto(s,y,tamano=32,color='#1f2a2e'){x.fillStyle=color;x.font=tamano+'px sans-serif';x.fillText(String(s),90,y,820);}
  texto(t.estado==='cancelado'?'TICKET CANCELADO':'RESERVA CONFIRMADA',310,32,'#0a7580');
  texto(nombre,390,40);texto(fecha(t.inicio),480,36);texto(hora(t.inicio)+'–'+hora(t.fin)+' · Hora de Cancún',540);
  texto('Hospital Galenia Cancún',635,36);texto('Auditorio',685);
  x.fillStyle='#e3f5f6';x.fillRect(90,740,820,170);texto('ASIENTO '+asiento(t.asiento),845,68,'#0a7580');
  texto('Entrada gratuita · Una persona',980);texto('Folio',1050,24);texto(t.id||t.folio,1095,25);
  texto('Presenta este ticket al llegar.',1190,28);texto('Si cancelas tu reserva, el ticket deja de ser válido.',1240,23);
  return c;
 }
 function descargar(t,nombre){lienzo(t,nombre).toBlob(function(blob){if(!blob)return;const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='ticket-'+(t.id||t.folio)+'.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);},'image/png');}
 function mostrar(t,nombre){
  const anterior=document.getElementById('modal-ticket');if(anterior)anterior.remove();
  const d=document.createElement('dialog');d.id='modal-ticket';d.className='modal-ticket';d.setAttribute('aria-labelledby','titulo-modal-ticket');
  d.innerHTML='<h2 id="titulo-modal-ticket">Descarga tu ticket</h2><p>'+(t.estado==='cancelado'?'Este ticket está cancelado y no permite el acceso.':'Tu reserva está guardada. Conserva esta imagen para presentarla al llegar.')+'</p><div class="ticket-vista"></div><div class="botones"><button class="btn btn--primario" id="descarga-ticket-modal">Descargar imagen</button><button class="btn btn--contorno" id="cerrar-ticket-modal">Cerrar</button></div>';
  const c=lienzo(t,nombre);c.setAttribute('role','img');c.setAttribute('aria-label','Ticket de '+nombre+', '+fecha(t.inicio)+', '+hora(t.inicio)+', asiento '+asiento(t.asiento)+', folio '+(t.id||t.folio));
  d.querySelector('.ticket-vista').append(c);document.body.append(d);
  d.querySelector('#descarga-ticket-modal').onclick=()=>descargar(t,nombre);d.querySelector('#cerrar-ticket-modal').onclick=()=>d.close();
  d.addEventListener('close',()=>d.remove());d.showModal();
 }
 window.CCCTicket={mostrar,descargar};
})();
