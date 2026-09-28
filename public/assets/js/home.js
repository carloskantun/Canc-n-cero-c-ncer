/* Landing: pinta todas las secciones desde /content/sitio.json y maneja el registro. */
(function () {
  "use strict";
  var C = window.CCC;
  var e = C.esc;

  C.contenido().then(pintar).catch(function (err) {
    console.error(err);
  });

  function pintar(s) {
    C.pintarMarco(s);
    var h = s.hero, p = s.pilares, t = s.taller, ej = s.ejercicios, n = s.nutricion, f = s.faq, r = s.registro;
    var td = t.datos || {};

    var chips = [
      (t.semanas || []).length ? (t.semanas.length + " semanas") : "",
      td.formato, "Cancún",
      td.costo && td.costo !== "Por confirmar" ? td.costo : ""
    ].filter(Boolean).map(function (x) { return '<li class="chip">' + e(x) + "</li>"; }).join("");

    var html = "";

    /* --- Hero --- */
    html += '<section class="hero" id="inicio">' +
      C.imagen(s, h.imagen, "hero__fondo", { prioridad: true }) +
      '<div class="contenedor"><div class="hero__contenido">' +
      "<h1>" + e(h.titulo) + "</h1>" +
      '<p class="hero__sub">' + e(h.subtitulo) + "</p>" +
      '<ul class="chips">' + chips + "</ul>" +
      '<div class="botones"><a class="btn btn--coral" href="#registro">' + e(h.botonPrincipal) + "</a>" +
      '<a class="btn btn--contorno-blanco" href="#ejercicios">' + e(h.botonSecundario) + "</a></div>" +
      "</div></div></section>";

    /* --- Pilares --- */
    html += '<section class="seccion" id="mision"><div class="contenedor">' +
      '<div class="seccion__cabeza seccion__cabeza--centro"><span class="antetitulo">' + e(p.antetitulo) + "</span>" +
      "<h2>" + e(p.titulo) + '</h2><p class="lead">' + e(p.texto) + "</p></div>" +
      '<div class="rejilla rejilla--3">' + (p.items || []).map(function (it) {
        return '<article class="tarjeta tarjeta--' + e(it.color) + '">' + C.imagen(s, it.imagen, "r-4x3") +
          '<div class="tarjeta__cuerpo"><div class="tarjeta__icono">' + C.icono(it.icono) + "</div>" +
          "<h3>" + e(it.titulo) + "</h3><p>" + e(it.texto) + "</p></div></article>";
      }).join("") + "</div></div></section>";

    /* --- Dato --- */
    if (s.dato && s.dato.visible) {
      html += '<section class="franja" aria-label="Por qué moverse"><div class="contenedor">' +
        '<p class="franja__texto">' + e(s.dato.texto) + "</p>" +
        (s.dato.fuente ? '<p class="franja__fuente">' + e(s.dato.fuente) + "</p>" : "") +
        "</div></section>";
    }

    /* --- Taller --- */
    var etiquetas = { fechas: "Fechas", horario: "Horario", lugar: "Lugar", formato: "Formato", cupo: "Cupo", costo: "Costo" };
    html += '<section class="seccion seccion--arena" id="taller"><div class="contenedor"><div class="taller">' +
      "<div>" + C.imagen(s, t.imagen, "r-3x2") + "</div>" +
      '<div><span class="antetitulo">' + e(t.antetitulo) + "</span><h2>" + e(t.titulo) + "</h2>" +
      '<p class="lead">' + e(t.texto) + "</p>" +
      '<ul class="datos">' + Object.keys(etiquetas).filter(function (k) { return td[k]; }).map(function (k) {
        return '<li class="dato"><span class="dato__etiqueta">' + etiquetas[k] + '</span><span class="dato__valor">' + e(td[k]) + "</span></li>";
      }).join("") + "</ul>" +
      (t.respaldo ? '<p class="respaldo">' + e(t.respaldo) + "</p>" : "") +
      '<h3>Semana a semana</h3><ol class="linea-tiempo">' + (t.semanas || []).map(function (w) {
        return "<li><strong>" + e(w.titulo) + "</strong><span>" + e(w.texto) + "</span></li>";
      }).join("") + "</ol>" +
      '<a class="btn btn--primario" href="#registro">' + e(t.boton) + "</a>" +
      "</div></div></div></section>";

    /* --- Ejercicios --- */
    var cats = ej.categorias || [];
    html += '<section class="seccion" id="ejercicios"><div class="contenedor">' +
      '<div class="seccion__cabeza"><span class="antetitulo">' + e(ej.antetitulo) + "</span><h2>" + e(ej.titulo) +
      '</h2><p class="lead">' + e(ej.texto) + "</p></div>" +
      '<div class="categorias">' + cats.map(function (c) {
        return '<a class="categoria" href="#videos" data-cat="' + e(c.id) + '">' + C.imagen(s, c.imagen) +
          '<span class="categoria__nombre">' + e(c.nombre) + "<small>" + e(c.detalle) + "</small></span></a>";
      }).join("") + "</div>" +
      '<div id="videos"><div class="filtros" role="group" aria-label="Filtrar por tipo">' +
      '<button class="filtro" type="button" data-cat="" aria-pressed="true">Todos</button>' +
      cats.map(function (c) {
        return '<button class="filtro" type="button" data-cat="' + e(c.id) + '" aria-pressed="false">' + e(c.nombre) + "</button>";
      }).join("") + "</div>" +
      '<div class="videos" id="lista-videos"></div></div>' +
      "</div></section>";

    /* --- Nutrición --- */
    html += '<section class="seccion seccion--arena" id="nutricion"><div class="contenedor">' +
      '<div class="seccion__cabeza"><span class="antetitulo">' + e(n.antetitulo) + "</span><h2>" + e(n.titulo) +
      '</h2><p class="lead">' + e(n.texto) + "</p></div>" +
      '<div class="rejilla rejilla--3">' + (n.items || []).map(function (it) {
        return '<article class="tarjeta">' + C.imagen(s, it.imagen, "r-4x3") +
          '<div class="tarjeta__cuerpo"><h3>' + e(it.titulo) + "</h3><p>" + e(it.texto) + "</p></div></article>";
      }).join("") + "</div>" +
      '<p class="centro" style="margin-top:32px"><a class="btn btn--contorno" href="/biblioteca/">Ver guías completas</a></p>' +
      "</div></section>";

    /* --- FAQ --- */
    html += '<section class="seccion" id="preguntas"><div class="contenedor">' +
      '<div class="seccion__cabeza seccion__cabeza--centro"><h2>' + e(f.titulo) + "</h2></div>" +
      '<div class="faq">' + (f.items || []).map(function (q) {
        return "<details><summary>" + e(q.pregunta) + "</summary><div>" + e(q.respuesta) + "</div></details>";
      }).join("") + "</div></div></section>";

    /* --- Registro --- */
    html += '<section class="seccion seccion--arena" id="registro"><div class="contenedor"><div class="registro">' +
      '<div class="registro__imagen">' + C.imagen(s, r.imagen) + "</div>" +
      '<div class="registro__form"><span class="antetitulo">' + e(r.antetitulo) + "</span>" +
      "<h2>" + e(r.titulo) + '</h2><p class="lead">' + e(r.texto) + "</p>" +
      '<form id="form-registro" novalidate>' +
      '<div class="aviso-form aviso-form--error" id="form-aviso" role="alert"></div>' +
      campo("nombre", "Nombre completo", "text", 'autocomplete="name" maxlength="80"', "Escribe tu nombre.") +
      campo("email", "Correo electrónico", "email", 'autocomplete="email" inputmode="email" maxlength="120"', "Escribe un correo válido.", "Será tu llave para entrar a la biblioteca.") +
      '<div class="fila-2">' +
      '<div class="campo"><label for="f-whatsapp">WhatsApp</label><div class="prefijo"><span>+52</span>' +
      '<input id="f-whatsapp" name="whatsapp" type="tel" inputmode="numeric" autocomplete="tel-national" maxlength="14" placeholder="10 dígitos" required></div>' +
      '<p class="campo__error" style="display:none" id="err-whatsapp">Escribe tu WhatsApp a 10 dígitos.</p></div>' +
      campo("edad", "Edad", "number", 'inputmode="numeric" min="18" max="99"', "Escribe una edad entre 18 y 99.") +
      "</div>" +
      '<div class="trampa" aria-hidden="true"><label>Empresa <input name="empresa" tabindex="-1" autocomplete="off"></label></div>' +
      '<label class="check" id="check-consentimiento"><input type="checkbox" name="consentimiento" required> <span>' +
      e(r.consentimiento).replace("aviso de privacidad", '<a href="/aviso-de-privacidad/" target="_blank">aviso de privacidad</a>') +
      "</span></label>" +
      '<button class="btn btn--coral btn--bloque" type="submit">' + e(r.boton) + "</button>" +
      '<p class="micro">' + e(r.micro) + "</p>" +
      "</form></div></div></div></section>";

    C.$("#contenido").innerHTML = html;
    C.activarImagenes(C.$("#contenido"));

    pintarVideos(s, "");
    activarFiltros(s);
    activarFormulario(s);

    if (location.hash) {
      var destino = document.getElementById(location.hash.slice(1));
      if (destino) destino.scrollIntoView();
    }
  }

  function campo(nombre, etiqueta, tipo, extra, error, ayuda) {
    return '<div class="campo"><label for="f-' + nombre + '">' + etiqueta + "</label>" +
      '<input id="f-' + nombre + '" name="' + nombre + '" type="' + tipo + '" ' + extra + " required>" +
      '<p class="campo__error">' + error + "</p>" + (ayuda ? "<small>" + ayuda + "</small>" : "") + "</div>";
  }

  /* --- Videos de muestra + tarjeta con candado --- */
  function pintarVideos(s, cat) {
    var ej = s.ejercicios;
    var nombres = {};
    (ej.categorias || []).forEach(function (c) { nombres[c.id] = c.nombre; });
    var lista = (ej.muestra || []).filter(function (v) { return !cat || v.categoria === cat; });
    var html = lista.map(function (v) {
      return C.video(v, nombres[v.categoria] ? '<li class="meta--coral">' + C.esc(nombres[v.categoria]) + "</li>" : "");
    }).join("");
    var k = ej.candado || {};
    html += '<article class="video video--candado">' + C.icono("candado") +
      "<h3>" + C.esc(k.titulo) + "</h3><p>" + C.esc(k.texto) + "</p>" +
      '<a class="btn btn--blanco" href="#registro">' + C.esc(k.boton) + "</a></article>";
    C.$("#lista-videos").innerHTML = html;
  }

  function activarFiltros(s) {
    var elegir = function (cat) {
      C.$$(".filtro").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.cat === cat)); });
      pintarVideos(s, cat);
    };
    C.$$(".filtro").forEach(function (b) { b.addEventListener("click", function () { elegir(b.dataset.cat); }); });
    C.$$(".categoria").forEach(function (a) { a.addEventListener("click", function () { elegir(a.dataset.cat); }); });
  }

  /* --- Formulario de registro --- */
  function soloDigitos(v) { return String(v || "").replace(/\D/g, ""); }
  function normalizarWhatsApp(v) {
    var d = soloDigitos(v);
    if (d.length === 12 && d.indexOf("52") === 0) d = d.slice(2);
    if (d.length === 13 && d.indexOf("521") === 0) d = d.slice(3);
    return d;
  }

  function activarFormulario(s) {
    var form = C.$("#form-registro");
    var aviso = C.$("#form-aviso");
    var boton = form.querySelector('button[type="submit"]');

    function marcar(input, mal) {
      input.setAttribute("aria-invalid", mal ? "true" : "false");
      if (input.name === "whatsapp") C.$("#err-whatsapp").style.display = mal ? "block" : "none";
    }
    function validar() {
      var ok = true;
      var nombre = form.nombre, email = form.email, wa = form.whatsapp, edad = form.edad;
      var nOk = nombre.value.trim().length >= 2; marcar(nombre, !nOk); ok = ok && nOk;
      var eOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim()); marcar(email, !eOk); ok = ok && eOk;
      var wOk = normalizarWhatsApp(wa.value).length === 10; marcar(wa, !wOk); ok = ok && wOk;
      var ed = parseInt(edad.value, 10); var edOk = ed >= 18 && ed <= 99; marcar(edad, !edOk); ok = ok && edOk;
      var cOk = form.consentimiento.checked;
      C.$("#check-consentimiento").classList.toggle("invalido", !cOk); ok = ok && cOk;
      return ok;
    }
    form.addEventListener("input", function (ev) {
      if (ev.target.getAttribute("aria-invalid") === "true") validar();
    });

    function mostrarError(msg) {
      var c = s.contacto || {};
      aviso.innerHTML = C.esc(msg) + (c.whatsapp ? ' <a href="' + C.linkWhatsApp(c.whatsapp, c.mensajeWhatsapp) + '" target="_blank" rel="noopener">Escríbenos por WhatsApp</a>.' : "");
      aviso.classList.add("visible");
    }

    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      aviso.classList.remove("visible");
      if (!validar()) {
        var primero = form.querySelector('[aria-invalid="true"]');
        if (primero) primero.focus();
        else if (!form.consentimiento.checked) mostrarError("Para registrarte necesitas aceptar el aviso de privacidad.");
        return;
      }
      var eventId = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2);
      var a = C.atribucion();
      var datos = {
        nombre: form.nombre.value.trim(),
        email: form.email.value.trim().toLowerCase(),
        whatsapp: normalizarWhatsApp(form.whatsapp.value),
        edad: parseInt(form.edad.value, 10),
        consentimiento: true,
        empresa: form.empresa.value,
        eventId: eventId,
        utm_source: a.utm_source || "", utm_medium: a.utm_medium || "", utm_campaign: a.utm_campaign || "",
        utm_content: a.utm_content || "", utm_term: a.utm_term || "", fbclid: a.fbclid || "",
        landing: a.landing || "", referrer: a.referrer || "",
        fbp: C.cookie("_fbp"), fbc: C.cookie("_fbc"),
        pagina: location.href
      };
      boton.disabled = true;
      boton.textContent = "Enviando…";
      fetch(C.api("/registro"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos)
      }).then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, j: j }; });
      }).then(function (res) {
        if (!res.ok || !res.j.ok) throw new Error(res.j.mensaje || "No pudimos completar tu registro.");
        if (res.j.token) C.guardar("localStorage", "ccc_acceso", { token: res.j.token, nombre: datos.nombre });
        C.guardar("sessionStorage", "ccc_lead", { nombre: datos.nombre, eventId: eventId, pendienteEvento: true });
        location.href = "/gracias/";
      }).catch(function (err) {
        mostrarError(err.message && err.message.indexOf("Failed") === -1 ? err.message : "No pudimos completar tu registro en este momento.");
        boton.disabled = false;
        boton.textContent = (s.registro || {}).boton || "Registrarme";
      });
    });
  }
})();
