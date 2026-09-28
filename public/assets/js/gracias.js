/* Página de gracias: confirma el registro, dispara el evento Lead (una sola vez)
   y ofrece confirmar por WhatsApp e ir a la biblioteca. */
(function () {
  "use strict";
  var C = window.CCC;

  C.contenido().then(function (s) {
    C.pintarMarco(s);
    var lead = C.leer("sessionStorage", "ccc_lead") || {};
    var acceso = C.leer("localStorage", "ccc_acceso");
    var g = s.gracias || {};
    var c = s.contacto || {};
    var nombre = C.primerNombre(lead.nombre || (acceso && acceso.nombre));

    var titulo = nombre ? g.titulo.replace("{nombre}", nombre) : "¡Registro recibido!";
    var mensaje = (g.mensajeWhatsapp || "").replace("{nombre}", lead.nombre || nombre || "");

    var botones = "";
    if (c.whatsapp) {
      botones += '<a class="btn btn--whatsapp btn--bloque" href="' + C.linkWhatsApp(c.whatsapp, mensaje) +
        '" target="_blank" rel="noopener">' + C.icono("whatsapp") + "Confirmar por WhatsApp</a>";
    }
    botones += '<a class="btn btn--primario btn--bloque" href="/biblioteca/">Ir a mi biblioteca</a>';

    C.$("#caja-gracias").innerHTML =
      '<div class="caja__icono">' + C.icono("check") + "</div>" +
      '<h1 style="font-size:clamp(1.8rem,6vw,2.4rem)">' + C.esc(titulo) + "</h1>" +
      '<p class="lead">' + C.esc(g.texto) + "</p>" +
      '<div class="botones">' + botones + "</div>" +
      '<p class="micro">También te enviamos tu enlace de acceso por correo. Revisa tu bandeja de spam si no lo ves.</p>';

    // Evento de conversión: solo una vez por registro (mismo eventId que manda el Worker por la API de Conversiones).
    if (lead.pendienteEvento && lead.eventId) {
      C.evento("Lead", { content_name: "Registro taller" }, lead.eventId);
      lead.pendienteEvento = false;
      C.guardar("sessionStorage", "ccc_lead", lead);
    }
  }).catch(function (e) { console.error(e); });
})();
