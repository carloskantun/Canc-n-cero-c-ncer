/* Biblioteca privada: valida el token con el Worker y pinta videos y guías
   por semana, con filtros por semana y categoría y buscador. */
(function () {
  "use strict";
  var C = window.CCC;
  var e = C.esc;

  var params = new URLSearchParams(location.search);
  var tokenUrl = C.tokenUrl || params.get("t");
  var guardado = C.leer("localStorage", "ccc_acceso") || {};
  var token = tokenUrl || guardado.token;

  // Quita el token de la barra de direcciones (para que no se comparta por error).
  if (tokenUrl && history.replaceState) history.replaceState(null, "", location.pathname);

  C.contenido().then(function (s) {
    C.pintarMarco(s);
    if (!token) { location.replace("/acceso/"); return; }

    fetch(C.api("/biblioteca?t=" + encodeURIComponent(token)), { cache: "no-store" })
      .then(function (r) {
        if (r.status === 401 || r.status === 403) {
          C.borrar("localStorage", "ccc_acceso");
          location.replace("/acceso/?expirado=1");
          throw new Error("sin acceso");
        }
        if (!r.ok) throw new Error("error " + r.status);
        return r.json();
      })
      .then(function (data) {
        C.guardar("localStorage", "ccc_acceso", { token: token, nombre: data.nombre || guardado.nombre || "" });
        pintar(s, data);
      })
      .catch(function (err) {
        if (err.message === "sin acceso") return;
        C.$("#biblioteca").innerHTML = '<section class="pagina-simple"><div class="contenedor"><div class="caja">' +
          "<h1 style=\"font-size:1.8rem\">No pudimos cargar la biblioteca</h1>" +
          '<p class="lead">Revisa tu conexión e intenta de nuevo.</p>' +
          '<div class="botones"><button class="btn btn--primario" onclick="location.reload()">Reintentar</button></div></div></div></section>';
      });
  }).catch(function (e2) { console.error(e2); });

  function pintar(s, data) {
    var cat = data.categorias || [];
    var semanas = data.semanas || [];
    var nombresCat = {};
    cat.forEach(function (c) { nombresCat[c.id] = c.nombre; });
    var estado = { semana: "", categoria: "", q: "" };

    var nombre = C.primerNombre(data.nombre);
    C.$("#biblioteca").innerHTML =
      '<section class="biblio-cabeza">' + C.imagen(s, "biblioteca-hero", "", { prioridad: true }) +
      '<div class="contenedor"><span class="antetitulo" style="color:#fff;opacity:.85">Biblioteca</span>' +
      '<h1 style="font-size:clamp(2rem,6vw,3rem)">Hola' + (nombre ? ", " + e(nombre) : "") + "</h1>" +
      '<p class="lead" style="color:#fff;opacity:.92;max-width:560px">Aquí están los ejercicios y guías del taller. Cada semana se desbloquea contenido nuevo.</p></div></section>' +
      '<section class="seccion" style="padding-top:32px"><div class="contenedor">' +
      '<div class="buscador">' + C.icono("buscar") + '<input id="b-buscar" type="search" placeholder="Buscar ejercicio o guía" aria-label="Buscar"></div>' +
      '<p class="filtros-titulo">Semana</p><div class="filtros" id="f-semana" role="group" aria-label="Filtrar por semana">' +
      boton("", "Todas", true) + semanas.map(function (w) { return boton(String(w.numero), "Semana " + w.numero); }).join("") + "</div>" +
      '<p class="filtros-titulo">Tipo</p><div class="filtros" id="f-cat" role="group" aria-label="Filtrar por tipo">' +
      boton("", "Todos", true) + cat.map(function (c) { return boton(c.id, c.nombre); }).join("") + "</div>" +
      '<div id="b-resultados"></div></div></section>';
    C.activarImagenes(C.$("#biblioteca"));

    function boton(valor, texto, activo) {
      return '<button class="filtro" type="button" data-v="' + e(valor) + '" aria-pressed="' + (activo ? "true" : "false") + '">' + e(texto) + "</button>";
    }

    function coincide(txt) { return !estado.q || String(txt || "").toLowerCase().indexOf(estado.q) !== -1; }

    function render() {
      var html = "";
      var algo = false;
      semanas.forEach(function (w) {
        if (estado.semana && String(w.numero) !== estado.semana) return;
        var cab = '<div class="semana-bloque__cabeza"><h2>Semana ' + w.numero + ": " + e(w.titulo) + "</h2>" +
          (w.activa ? "" : '<ul class="meta"><li class="meta--coral">Disponible: ' + e(w.disponibleDesde || "próximamente") + "</li></ul>") + "</div>";
        if (!w.activa) {
          if (estado.q || estado.categoria) return;
          html += '<div class="semana-bloque">' + cab + '<div class="semana-cerrada">' + C.icono("candado").replace("<svg", '<svg style="width:32px;height:32px;margin:0 auto 8px;display:block"') +
            "Esta semana se desbloquea durante el taller.</div></div>";
          algo = true;
          return;
        }
        var vids = (data.videos || []).filter(function (v) {
          return v.semana === w.numero && (!estado.categoria || v.categoria === estado.categoria) &&
            (coincide(v.titulo) || coincide(v.descripcion) || coincide(nombresCat[v.categoria]));
        });
        var guias = estado.categoria ? [] : (data.guias || []).filter(function (g) {
          return g.semana === w.numero && (coincide(g.titulo) || coincide(g.resumen) || coincide((g.puntos || []).join(" ")));
        });
        if (!vids.length && !guias.length) return;
        algo = true;
        html += '<div class="semana-bloque">' + cab;
        if (vids.length) {
          html += '<div class="videos">' + vids.map(function (v) {
            return C.video(v, nombresCat[v.categoria] ? '<li class="meta--coral">' + e(nombresCat[v.categoria]) + "</li>" : "");
          }).join("") + "</div>";
        }
        if (guias.length) {
          html += '<div class="rejilla rejilla--2" style="margin-top:20px">' + guias.map(function (g) {
            return '<article class="guia"><span class="antetitulo">Guía</span><h3>' + e(g.titulo) + "</h3>" +
              (g.resumen ? "<p>" + e(g.resumen) + "</p>" : "") +
              (g.puntos && g.puntos.length ? "<ul>" + g.puntos.map(function (p) { return "<li>" + e(p) + "</li>"; }).join("") + "</ul>" : "") +
              (g.pdf ? '<p style="margin:16px 0 0"><a class="btn btn--contorno btn--sm" href="' + e(g.pdf) + '" target="_blank" rel="noopener">Descargar PDF</a></p>' : "") +
              "</article>";
          }).join("") + "</div>";
        }
        html += "</div>";
      });
      C.$("#b-resultados").innerHTML = algo ? html : '<p class="vacio">No encontramos resultados con esos filtros.</p>';
    }

    function grupo(id, clave) {
      C.$$("#" + id + " .filtro").forEach(function (b) {
        b.addEventListener("click", function () {
          C.$$("#" + id + " .filtro").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
          estado[clave] = b.dataset.v;
          render();
        });
      });
    }
    grupo("f-semana", "semana");
    grupo("f-cat", "categoria");
    C.$("#b-buscar").addEventListener("input", function (ev) { estado.q = ev.target.value.trim().toLowerCase(); render(); });
    render();
  }
})();
