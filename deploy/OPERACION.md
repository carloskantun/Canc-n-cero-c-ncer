# Operación de producción

Desplegado el 28 de septiembre de 2026 (corte 02:05:33 UTC, 27-sep 21:05 Cancún).
Origen: commit `5a746c8af8c6a0a100201df269c17d30a1bc8045` y ajustes de despliegue conservados en este repositorio local.

## Arquitectura vigente

- Web estática HTML/CSS/JS, sin compilación: `public/`.
- VPS: alias `VPS-KANTUN`, cuenta exclusiva `cancuncerocancer`, raíz `/home/cancuncerocancer/public_html`.
- API: `https://cancuncerocancer-api.carloskantun.workers.dev/api`.
- D1: `ccc_db`, ID `d18212bd-ef0f-4a44-b0cc-70d14d81f3d7`, esquema original sin modificaciones.
- DNS permanece en `ns1/ns2.serviciomultimedia.com`. No se movieron DNS, correo, cuentas ni otros dominios.
- `/api/*` en el VPS redirige con 307 al Worker. El frontend llama directamente al Worker. Para consultas administrativas usar directamente la URL del Worker: los clientes pueden retirar Authorization en redirecciones entre dominios.
- Secretos de firma y administración guardados en Cloudflare; no están en Git. La copia privada está fuera del repositorio, en la carpeta local de respaldo.
- SSL Let's Encrypt vigente hasta 6-nov-2026; se mantiene AutoSSL y una carpeta limpia `.well-known/acme-challenge`.

## Publicar la web

Preparar una carpeta nueva `/home/cancuncerocancer/.ccc-release-ID` con solo `public/`, excluyendo `README.md` y `assets/img/_variantes/`. Añadir `deploy/site.htaccess` como `.htaccess`. Establecer propietario `root:nobody`, directorios 755 y archivos 644. Mantener `.well-known/acme-challenge`.

Subir `deploy/replace-static.py` fuera del document root y ejecutarlo como root con la ruta de la carpeta preparada. Rechaza reemplazar WordPress o introducir scripts, enlaces simbólicos o archivos de secretos. Intercambia las carpetas atómicamente y conserva la versión limpia anterior en `/root/ccc-clean-releases/retired-FECHA`.

No sincronizar encima de una instalación WordPress ni usar el respaldo comprometido como origen de publicación. No publicar el repositorio completo, `worker/`, `deploy/`, variantes, `.git` o secretos.

Después comprobar `/`, `/content/sitio.json`, `/gracias/`, `/acceso/`, `/biblioteca/`, `/aviso-de-privacidad/`, `/api/salud`, redirecciones HTTP y www, respuesta 404 real y bloqueo de PHP/configuración. Revisar móvil y registro con datos sintéticos.

## Reversión segura

Se conserva `/root/ccc-clean-releases/site-20260928-final.tar.gz` con su archivo `.sha256`. Para revertir, verificar el hash, extraerlo en otra carpeta `.ccc-release-ID`, aplicar los permisos anteriores y ejecutar `replace-static.py`. También puede prepararse una copia de un directorio `retired-FECHA` creado por el mismo script.

La reversión solo afecta archivos estáticos. D1 y sus registros permanecen intactos. Nunca restaurar automáticamente el WordPress comprometido. `cutover-vps.py` documenta el corte inicial y deliberadamente no puede repetirse sobre la web estática.

## API y correo

Instalar dependencias mediante `npm ci` en `worker/`. Usar Wrangler 4 y `wrangler deploy` para cambios de API. La versión 4.142 instalada validó el paquete y las pruebas locales; la publicación se completó con la 4.105 disponible en el equipo porque el proceso de publicación de 4.142 quedó detenido sin salida. Worker inicial: versión `0fcc0e42-071b-4d1e-8ddf-6d655a59eae4`.

No volver a crear la base ni cambiar sus tablas sin revisar y respaldar datos. No cambiar `TOKEN_SECRETO` sin planificar la invalidación de los enlaces emitidos.

Pendiente: configurar Resend con remitente verificado. Introducir `RESEND_API_KEY` por entrada segura de Wrangler, comprobar un envío a un correo de prueba autorizado y luego poner `correoHabilitado: true` en `public/assets/js/config.js` y publicar la web. Actualmente los registros nuevos acceden desde el mismo dispositivo; la recuperación por correo devuelve 503 de forma explícita.

El registro duplicado ya no modifica los datos de otra persona ni entrega su token. Los correos escapan nombres, no registran direcciones en el mensaje de proveedor ausente y solo se anotan como enviados cuando el proveedor confirma. Las respuestas JSON privadas no se cachean.

## Imágenes

Se generaron 33 candidatos con ImageGen integrado, siguiendo `docs/02-imagenes-codex.md`; se seleccionaron 16 archivos WebP (incluidas las dos portadas), más `og-image.jpg` compuesto con Pillow, Montserrat 800 y Nunito 600. Todos los archivos WebP tienen los tamaños solicitados y calidad 80. La imagen social mide 1200×630 y ocupa 115.6 KB.

`deploy/generated-images.json` registra procedencia y selección. `export-images.py DIRECTORIO_PNG_ORIGINALES` reexporta los candidatos con Pillow. `compose-og.py DIRECTORIO_FUENTES` recompone la vista social con `ccc-montserrat.ttf` y `ccc-nunito.ttf` (fuentes oficiales de Google Fonts). Las variantes descartadas viven en `public/assets/img/_variantes/`, se excluyen de producción y tienen acceso denegado por precaución.

Las imágenes son ilustrativas generadas, no fotografías de participantes reales. El contenido y el diseño originales se preservaron; solo se ajustaron mensajes operativos para no prometer un correo no configurado.

## Contenido pendiente de la organización

Fechas, horario y costo del taller; WhatsApp y redes; videos de YouTube; validación médica señalada por el propio contenido. No se inventaron valores ni se desbloquearon semanas futuras.


## Actualización Meta — 28-sep-2026

Código `4c98485`: Pixel configurable en `sitio.json`, eventos deduplicados y
exportación `/api/leads`. Worker `de0b68dc-6775-40f1-abd0-b17437df229d`.
Migración `0001_leads.sql` aplicada después de exportar y verificar D1; los
registros anteriores permanecen intactos. Clave `ADMIN_KEY` creada como secreto.
La web se publicó por intercambio atómico; la versión anterior se conserva en
`/root/ccc-clean-releases/retired-20260928T045329414564Z`.

Pasaron las pruebas de Pixel/CAPI (proveedor simulado), autorización, CSV,
registro duplicado y migración. En producción se comprobaron JSON/CSV con
autorización y rechazo 401 sin ella. Los archivos frontend coinciden con Git.
Se intentó `npm run deploy` con Wrangler 4.142, pero quedó sin salida; se
completó mediante Wrangler 4.105, la alternativa documentada arriba.

Pixel del navegador configurado con el ID `1834326414233144`, recibido del
responsable del sitio. El mismo ID está en `FB_PIXEL_ID` del Worker. CAPI sigue
pendiente de `FB_CAPI_TOKEN`; la recepción final se revisa en Events Manager.

El encuadre de portada, Movimiento y Prevención se alinea arriba para conservar
los rostros; Cardio se centra sobre la persona. Se mantiene `object-fit: cover`
y las proporciones de las tarjetas. Revisado en escritorio y móvil de 390 px.
