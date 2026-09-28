/* Páginas de texto simple (aviso de privacidad, 404): solo pintan encabezado y pie. */
(function () {
  "use strict";
  window.CCC.contenido().then(window.CCC.pintarMarco).catch(function (e) { console.error(e); });
})();
