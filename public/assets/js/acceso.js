/* Acceso a la biblioteca: la usuaria escribe su correo y recibe un enlace. */
(function () {
  "use strict";
  var C = window.CCC;

  C.contenido().then(function (s) {
    C.pintarMarco(s);
    var caja = C.$("#caja-acceso");
    var guardado = C.leer("localStorage", "ccc_acceso");
    var expirado = new URLSearchParams(location.search).get("expirado");
    var c = s.contacto || {};

    var yaTiene = guardado && guardado.token && !expirado
      ? '<div class="aviso-form aviso-form--ok visible">Ya tienes acceso en este dispositivo. <a href="/biblioteca/">Entrar a la biblioteca</a></div>'
      : "";
    var aviso = expirado
      ? '<div class="aviso-form aviso-form--error visible">Tu enlace ya no es válido. Pide uno nuevo con tu correo.</div>'
      : "";

    caja.innerHTML =
      '<div class="caja__icono" style="background:var(--turquesa-claro);color:var(--turquesa)">' + C.icono("correo") + "</div>" +
      '<h1 style="font-size:clamp(1.8rem,6vw,2.4rem)">Entra a tu biblioteca</h1>' +
      '<p class="lead">Escribe el correo con el que te registraste y te enviamos tu enlace de acceso. Sin contraseñas.</p>' +
      yaTiene + aviso + (window.CCC_CONFIG.correoHabilitado === false ? '<div class="aviso-form aviso-form--error visible">El envío de enlaces por correo no está disponible por ahora. Usa el dispositivo donde te registraste para acceder.</div>' : "") +
      '<form id="form-acceso" novalidate>' +
      '<div class="aviso-form" id="acceso-msg" role="status"></div>' +
      '<div class="campo"><label for="a-email">Correo electrónico</label>' +
      '<input id="a-email" name="email" type="email" inputmode="email" autocomplete="email" required>' +
      '<p class="campo__error">Escribe un correo válido.</p></div>' +
      '<button class="btn btn--primario btn--bloque" type="submit">Enviarme mi enlace</button>' +
      "</form>" +
      '<p class="micro">¿Aún no te registras? <a href="/#registro">Regístrate aquí</a>' +
      (c.whatsapp ? ' · <a href="' + C.linkWhatsApp(c.whatsapp, "Hola, necesito ayuda para entrar a la biblioteca de Cancún Cero Cáncer.") + '" target="_blank" rel="noopener">Ayuda por WhatsApp</a>' : "") +
      "</p>";

    var form = C.$("#form-acceso");
    var msg = C.$("#acceso-msg");
    var boton = form.querySelector("button");
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var input = form.email;
      var email = input.value.trim().toLowerCase();
      var ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
      input.setAttribute("aria-invalid", ok ? "false" : "true");
      if (!ok) { input.focus(); return; }
      boton.disabled = true;
      boton.textContent = "Enviando…";
      fetch(C.api("/acceso"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email })
      }).then(function (r) { if (!r.ok) throw new Error(); return r.json(); })
        .then(function () {
          msg.className = "aviso-form aviso-form--ok visible";
          msg.textContent = "Listo. Si tu correo está registrado, en unos minutos te llega tu enlace. Revisa también spam.";
          form.reset();
        })
        .catch(function () {
          msg.className = "aviso-form aviso-form--error visible";
          msg.textContent = "No pudimos enviar tu enlace en este momento. Intenta de nuevo en unos minutos.";
        })
        .then(function () { boton.disabled = false; boton.textContent = "Enviarme mi enlace"; });
    });
  }).catch(function (e) { console.error(e); });
})();
