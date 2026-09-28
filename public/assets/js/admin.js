/* Panel privado: sin Pixel ni almacenamiento de claves. WhatsApp se abre solo por acción manual. */
(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  let clave = "", contactos = [], generacion = 0, ocupado = false;
  const origenes = { fb: "Facebook", ig: "Instagram", organico: "Orgánico" };
  function mensaje(texto) { $("mensaje").textContent = texto; }
  function salir() {
    generacion++; clave = ""; contactos = []; ocupado = false;
    $("clave").value = ""; $("filas").replaceChildren(); $("total").textContent = "";
    $("buscar").value = ""; $("origen").value = "";
    $("panel").hidden = true; $("entrada").hidden = false;
    document.querySelectorAll("button").forEach(b => b.disabled = false);
    mensaje(""); $("clave").focus();
  }
  function renderizar() {
    const busqueda = $("buscar").value.toLocaleLowerCase("es").trim();
    const visibles = contactos.filter(r => (!$("origen").value || r.origen === $("origen").value) &&
      [r.nombre, r.email, r.whatsapp].some(v => String(v || "").toLocaleLowerCase("es").includes(busqueda)));
    $("total").textContent = `${visibles.length} de ${contactos.length} contactos`;
    const fragmento = document.createDocumentFragment();
    for (const r of visibles) {
      const fila = document.createElement("tr");
      const acciones = document.createElement("td");
      acciones.className = "acciones-contacto";
      const telefono = String(r.whatsapp || "").replace(/\D/g, "");
      const numero = telefono.length === 10 ? `52${telefono}` : /^52\d{10}$/.test(telefono) ? telefono : "";
      function enlaceWhatsApp(etiqueta, ruta, texto) {
        const enlace = document.createElement("a");
        enlace.className = "boton-contacto";
        enlace.textContent = etiqueta;
        enlace.setAttribute("aria-label", `${etiqueta}: ${r.nombre || "contacto"}`);
        enlace.href = `https://wa.me/${ruta}?text=${encodeURIComponent(texto)}`;
        enlace.target = "_blank"; enlace.rel = "noopener noreferrer";
        acciones.append(enlace);
      }
      if (numero) enlaceWhatsApp("Escribir por WhatsApp", numero,
        `Hola ${r.nombre || ""}, somos el equipo de Cancún Cero Cáncer. Recibimos tu registro y queremos compartirte información del taller. ¿Te gustaría que te contemos los detalles?`);
      enlaceWhatsApp("Compartir con el doctor", "",
        `Contacto registrado en Cancún Cero Cáncer\nNombre: ${r.nombre || "—"}\nWhatsApp: ${r.whatsapp || "—"}${numero ? `\nAbrir conversación: https://wa.me/${numero}` : ""}\nPara dar seguimiento e invitar al taller.`);
      fila.append(acciones);
      for (const valor of [r.nombre, r.whatsapp, r.email, origenes[r.origen] || r.origen, r.created_at]) {
        const celda = document.createElement("td"); celda.textContent = valor || "—"; fila.append(celda);
      }
      fragmento.append(fila);
    }
    $("filas").replaceChildren(fragmento);
  }
  async function cargar(csv = false) {
    if (ocupado) return;
    ocupado = true; const turno = generacion;
    document.querySelectorAll("button:not(#salir)").forEach(b => b.disabled = true);
    mensaje(csv ? "Preparando descarga…" : "Cargando contactos…");
    try {
      const respuesta = await fetch(`${window.CCC_CONFIG.apiBase}/leads${csv ? "?format=csv" : ""}`, {
        headers: { Authorization: `Bearer ${clave}` }, cache: "no-store", referrerPolicy: "no-referrer",
        signal: AbortSignal.timeout(20000)
      });
      if (turno !== generacion) return;
      if (respuesta.status === 401) { salir(); throw new Error("La clave no es válida."); }
      if (!respuesta.ok) throw new Error("No fue posible cargar los contactos. Intenta de nuevo.");
      if (csv) {
        const archivo = await respuesta.blob(); if (turno !== generacion) return;
        const url = URL.createObjectURL(archivo), enlace = document.createElement("a");
        enlace.href = url; enlace.download = "cancuncerocancer-contactos.csv"; enlace.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000); mensaje("CSV descargado.");
      } else {
        const datos = await respuesta.json(); if (turno !== generacion) return;
        contactos = datos.leads.slice().reverse(); $("entrada").hidden = true; $("panel").hidden = false;
        $("clave").value = ""; renderizar(); mensaje(contactos.length ? "Contactos actualizados." : "Todavía no hay contactos registrados.");
      }
    } catch (error) {
      if (turno === generacion || error.message === "La clave no es válida.") mensaje(error.name === "TimeoutError" ? "La conexión tardó demasiado. Intenta de nuevo." : error.message);
    } finally {
      if (turno === generacion) { ocupado = false; document.querySelectorAll("button").forEach(b => b.disabled = false); }
    }
  }
  $("entrada").addEventListener("submit", e => { e.preventDefault(); clave = $("clave").value.trim(); cargar(); });
  $("actualizar").addEventListener("click", () => cargar());
  $("exportar").addEventListener("click", () => cargar(true));
  $("salir").addEventListener("click", salir);
  $("buscar").addEventListener("input", renderizar); $("origen").addEventListener("change", renderizar);
  window.addEventListener("pagehide", salir);
})();
