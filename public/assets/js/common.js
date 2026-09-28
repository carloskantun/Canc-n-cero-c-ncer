/* Cancún Cero Cáncer — utilidades compartidas por todas las páginas.
   Pinta encabezado, pie y botón de WhatsApp; carga el contenido; Pixel de Meta;
   guarda la atribución (UTM / fbclid) para el registro. */
(function () {
  "use strict";
  var CFG = window.CCC_CONFIG || {};
  var CCC = (window.CCC = {});

  /* ---------- Utilidades ---------- */
  CCC.esc = function (s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  };
  CCC.$ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  CCC.$$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };
  CCC.api = function (ruta) { return (CFG.apiBase || "/api").replace(/\/$/, "") + ruta; };

  CCC.guardar = function (tipo, clave, valor) {
    try { window[tipo].setItem(clave, JSON.stringify(valor)); } catch (e) {}
  };
  CCC.leer = function (tipo, clave) {
    try { return JSON.parse(window[tipo].getItem(clave) || "null"); } catch (e) { return null; }
  };
  CCC.borrar = function (tipo, clave) { try { window[tipo].removeItem(clave); } catch (e) {} };

  CCC.primerNombre = function (n) { return String(n || "").trim().split(/\s+/)[0] || ""; };

  CCC.linkWhatsApp = function (numero, mensaje) {
    var n = String(numero || "").replace(/\D/g, "");
    var base = n ? "https://wa.me/" + n : "https://wa.me/";
    return base + "?text=" + encodeURIComponent(mensaje || "");
  };

  /* ---------- Iconos (trazo redondeado, estilo Lucide) ---------- */
  var I = {
    movimiento: '<path d="M13 4a2 2 0 1 0 4 0a2 2 0 1 0-4 0"/><path d="m7 21 3-6 3 2v5"/><path d="m6 12 2-3 4-1 3 3 3 1"/><path d="m10 15-1-5"/>',
    nutricion: '<path d="M12 21c-4.4 0-8-3.6-8-8 0-2 .7-3.8 2-5.2L8 6h8l2 1.8c1.3 1.4 2 3.2 2 5.2 0 4.4-3.6 8-8 8Z"/><path d="M12 6V3"/><path d="M15 3c-1.5 0-3 1-3 3"/>',
    prevencion: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/>',
    candado: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    correo: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    buscar: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
    whatsapp: '<path fill="currentColor" stroke="none" d="M19.1 4.9A9.9 9.9 0 0 0 3.5 16.8L2 22l5.4-1.4a9.9 9.9 0 0 0 4.7 1.2h.1a9.9 9.9 0 0 0 7-16.9ZM12.1 20.1a8.2 8.2 0 0 1-4.2-1.1l-.3-.2-3.2.8.9-3.1-.2-.3a8.2 8.2 0 1 1 7 3.9Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a.9.9 0 0 0-.7.3 2.8 2.8 0 0 0-.9 2.1 4.9 4.9 0 0 0 1 2.6 11.2 11.2 0 0 0 4.3 3.8c1.6.7 2.2.7 3 .6a2.6 2.6 0 0 0 1.7-1.2 2.1 2.1 0 0 0 .1-1.2c0-.2-.2-.2-.4-.3Z"/>'
  };
  CCC.icono = function (nombre) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (I[nombre] || "") + "</svg>";
  };

  /* ---------- Contenido ---------- */
  var promesa = null;
  CCC.contenido = function () {
    if (!promesa) {
      promesa = fetch(CFG.contenido || "/content/sitio.json", { cache: "no-cache" })
        .then(function (r) { if (!r.ok) throw new Error("contenido " + r.status); return r.json(); });
    }
    return promesa;
  };

  /* ---------- Imágenes con placeholder ---------- */
  // Devuelve el HTML de una imagen por id. Si el archivo no existe, queda el
  // espacio de color con la etiqueta del id (para saber qué foto va ahí).
  CCC.imagen = function (sitio, id, clases, opciones) {
    opciones = opciones || {};
    var imgs = (sitio && sitio.imagenes) || {};
    var def = imgs[id] || {};
    var etiqueta = imgs.mostrarEtiquetas ? '<span class="media__etiqueta">' + CCC.esc(id) + "</span>" : "";
    var carga = opciones.prioridad ? 'fetchpriority="high"' : 'loading="lazy"';
    var html = '<div class="media media--vacia ' + (clases || "") + '" data-img="' + CCC.esc(id) + '">';
    if (def.src) {
      html += "<picture>";
      if (def.srcMobile) html += '<source media="(max-width: 767px)" srcset="' + CCC.esc(def.srcMobile) + '">';
      html += '<img src="' + CCC.esc(def.src) + '" alt="' + CCC.esc(def.alt || "") + '" ' + carga + ' decoding="async" hidden>';
      html += "</picture>";
    }
    return html + etiqueta + "</div>";
  };
  // Activa las imágenes: si cargan se muestran, si fallan se deja el placeholder.
  CCC.activarImagenes = function (ctx) {
    CCC.$$(".media img", ctx).forEach(function (img) {
      var caja = img.closest(".media");
      var ok = function () {
        img.hidden = false;
        caja.classList.remove("media--vacia");
        var et = caja.querySelector(".media__etiqueta");
        if (et) et.remove();
      };
      var mal = function () { var p = img.closest("picture"); if (p) p.remove(); };
      if (img.complete && img.naturalWidth) ok();
      else { img.addEventListener("load", ok); img.addEventListener("error", mal); }
    });
  };

  /* ---------- Video de YouTube (carga al tocar) ---------- */
  CCC.video = function (v, extraMeta) {
    var marco;
    if (v.youtubeId) {
      marco = '<button class="video__play" type="button" data-yt="' + CCC.esc(v.youtubeId) + '" data-titulo="' + CCC.esc(v.titulo) +
        '" style="background-image:url(https://i.ytimg.com/vi/' + encodeURIComponent(v.youtubeId) + '/hqdefault.jpg)" aria-label="Reproducir: ' + CCC.esc(v.titulo) + '"></button>';
    } else {
      marco = '<div class="video__pendiente">Video próximamente</div>';
    }
    var meta = [];
    if (v.duracion) meta.push("<li>" + CCC.esc(v.duracion) + "</li>");
    if (v.nivel) meta.push("<li>" + CCC.esc(v.nivel) + "</li>");
    if (v.material) meta.push('<li class="meta--coral">' + CCC.esc(v.material) + "</li>");
    if (extraMeta) meta.push(extraMeta);
    return '<article class="video"><div class="video__marco">' + marco + '</div><div class="video__cuerpo"><h3>' +
      CCC.esc(v.titulo) + "</h3>" + (v.descripcion ? "<p>" + CCC.esc(v.descripcion) + "</p>" : "") +
      '<ul class="meta">' + meta.join("") + "</ul></div></article>";
  };
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest(".video__play");
    if (!b) return;
    var f = document.createElement("iframe");
    f.src = "https://www.youtube-nocookie.com/embed/" + encodeURIComponent(b.dataset.yt) + "?autoplay=1&rel=0&modestbranding=1";
    f.title = b.dataset.titulo || "Video";
    f.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
    f.allowFullscreen = true;
    b.replaceWith(f);
  });

  /* ---------- Atribución (UTM / fbclid) ---------- */
  (function capturarAtribucion() {
    var p = new URLSearchParams(location.search);
    var claves = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid"];
    var nueva = {};
    var hay = false;
    claves.forEach(function (k) { if (p.get(k)) { nueva[k] = p.get(k).slice(0, 200); hay = true; } });
    if (hay || !CCC.leer("localStorage", "ccc_attr")) {
      nueva.landing = location.pathname + location.search;
      nueva.referrer = document.referrer || "";
      nueva.fecha = new Date().toISOString();
      CCC.guardar("localStorage", "ccc_attr", nueva);
    }
  })();
  CCC.atribucion = function () { return CCC.leer("localStorage", "ccc_attr") || {}; };
  CCC.cookie = function (nombre) {
    var m = document.cookie.match(new RegExp("(?:^|; )" + nombre + "=([^;]*)"));
    return m ? decodeURIComponent(m[1]) : "";
  };

  /* ---------- Pixel de Meta ---------- */
  CCC.pixel = function () {
    if (!CFG.metaPixelId || window.fbq) return;
    /* eslint-disable */
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
    n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
    document,'script','https://connect.facebook.net/en_US/fbevents.js');
    /* eslint-enable */
    window.fbq("init", CFG.metaPixelId);
    window.fbq("track", "PageView");
  };
  CCC.evento = function (nombre, datos, eventId) {
    if (window.fbq) window.fbq("track", nombre, datos || {}, eventId ? { eventID: eventId } : undefined);
  };
  CCC.pixel();

  /* ---------- Encabezado, pie y WhatsApp ---------- */
  function marca(blanca) {
    return '<a class="marca' + (blanca ? " marca--blanca" : "") + '" href="/" aria-label="Cancún Cero Cáncer, inicio">' +
      '<span class="marca__sello" aria-hidden="true"></span><span>Cancún <b>Cero</b> Cáncer</span></a>';
  }
  CCC.marca = marca;

  CCC.pintarMarco = function (sitio) {
    var header = CCC.$("#header");
    if (header) {
      var nav = (sitio.menu || []).map(function (m) {
        return '<a href="' + CCC.esc(m.enlace) + '">' + CCC.esc(m.texto) + "</a>";
      }).join("");
      header.className = "header";
      header.innerHTML = '<div class="contenedor header__fila">' + marca() +
        '<nav class="nav" aria-label="Principal">' + nav + "</nav>" +
        '<a class="btn btn--primario btn--sm" href="/#registro">Regístrate</a></div>';
      var sombra = function () { header.classList.toggle("con-sombra", window.scrollY > 8); };
      window.addEventListener("scroll", sombra, { passive: true });
      sombra();
    }

    var pie = CCC.$("#pie");
    if (pie) {
      var c = sitio.contacto || {};
      var r = c.redes || {};
      var redes = ["facebook", "instagram", "tiktok", "youtube"].filter(function (k) { return r[k]; }).map(function (k) {
        return '<li><a href="' + CCC.esc(r[k]) + '" target="_blank" rel="noopener">' + k.charAt(0).toUpperCase() + k.slice(1) + "</a></li>";
      }).join("");
      var contacto = "";
      if (c.whatsapp) contacto += '<li><a href="' + CCC.linkWhatsApp(c.whatsapp, c.mensajeWhatsapp) + '" target="_blank" rel="noopener">WhatsApp</a></li>';
      if (c.correo) contacto += '<li><a href="mailto:' + CCC.esc(c.correo) + '">' + CCC.esc(c.correo) + "</a></li>";
      pie.className = "pie";
      pie.innerHTML = '<div class="contenedor"><div class="pie__rejilla"><div>' + marca(true) +
        '<p style="margin-top:16px;max-width:360px">' + CCC.esc((sitio.marca || {}).descripcion) + "</p></div>" +
        "<div><h4>Sitio</h4><ul>" + (sitio.menu || []).map(function (m) {
          return '<li><a href="' + CCC.esc(m.enlace) + '">' + CCC.esc(m.texto) + "</a></li>";
        }).join("") + '<li><a href="/aviso-de-privacidad/">Aviso de privacidad</a></li></ul></div>' +
        "<div><h4>Contacto</h4><ul>" + contacto + redes + "</ul></div></div>" +
        '<div class="pie__legal">© ' + new Date().getFullYear() + " " + CCC.esc((sitio.marca || {}).nombre) + ". " +
        CCC.esc((sitio.pie || {}).leyenda) + "</div></div>";
    }

    var c2 = sitio.contacto || {};
    if (c2.whatsapp && !CCC.$(".wa-flotante")) {
      var a = document.createElement("a");
      a.className = "wa-flotante";
      a.href = CCC.linkWhatsApp(c2.whatsapp, c2.mensajeWhatsapp);
      a.target = "_blank";
      a.rel = "noopener";
      a.setAttribute("aria-label", "Escríbenos por WhatsApp");
      a.innerHTML = CCC.icono("whatsapp");
      document.body.appendChild(a);
    }
  };
})();
