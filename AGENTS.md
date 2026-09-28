# Cancún Cero Cáncer — guía para Codex (y cualquier agente que trabaje aquí)

Este repositorio es el sitio de **cancuncerocancer.com**. Lo diseña y mantiene
Claude (estructura, textos, código); Codex se encarga de **desplegarlo** en el
VPS/hosting de Carlos y en Cloudflare, y de tareas puntuales que pidan uso de
SSH o de las cuentas de Cloudflare/GitHub que Claude no tiene a mano.

No re-diseñes ni reestructures el sitio por tu cuenta: si algo se ve mal o
falta, repórtalo o pide que Claude lo ajuste en el repo. Tu trabajo aquí es
desplegar, conectar servicios y ejecutar lo que ya está escrito.

## Qué hay en este repositorio

```
public/     → el sitio estático completo (esto es lo que se sube al hosting)
worker/     → la API en Cloudflare Workers + D1 (registro, acceso, biblioteca)
docs/       → documentos de referencia (diseño, prompts de imágenes, campaña Meta)
deploy/     → scripts/ayudas de despliegue (agrega aquí lo que necesites)
```

- El sitio (`public/`) NO tiene build ni dependencias: es HTML/CSS/JS plano.
  Se sube tal cual a cualquier hosting con archivos estáticos (Apache, Nginx,
  Cloudflare Pages, etc.).
- Todo el contenido visible (textos, datos del taller, imágenes) vive en
  **`public/content/sitio.json`**. No hace falta tocar el HTML para cambiar
  fechas, precios o textos.
- Las imágenes van en `public/assets/img/` con los nombres exactos que pide
  `docs/02-imagenes-codex.md`. Mientras un archivo no exista, el sitio
  muestra automáticamente un espacio de color con el nombre de la imagen
  encima — no rompe nada, solo avisa qué falta.
- El backend (`worker/`) es un Cloudflare Worker con una base de datos D1.
  Guarda los registros del formulario, genera el acceso a la biblioteca y
  sirve el contenido privado de `worker/content/biblioteca.json`.

## Flujo de trabajo con Claude

1. Claude hace cambios de diseño/estructura/contenido y los sube a este
   repositorio (rama `main`).
2. Te avisan que hay cambios nuevos. Tu trabajo:
   - `git pull` en el repo en el VPS.
   - Copiar/sincronizar `public/` a la carpeta pública del hosting.
   - Si `worker/` cambió, desplegar el Worker (`wrangler deploy`).
   - Si hace falta, generar y subir las imágenes que pide `docs/02-imagenes-codex.md`
     a `public/assets/img/`.
3. Reporta a Carlos con una línea de qué se desplegó y el enlace para revisar.

No necesitas pedir aprobación para desplegar cambios que ya están en `main`;
si algo falla en el despliegue, repórtalo con el error exacto en vez de
improvisar una solución distinta a la documentada aquí.

## Documentos de referencia

- `docs/01-estructura-y-diseno.md` — mapa del sitio, paleta, contenido de cada sección.
- `docs/02-imagenes-codex.md` — lista de las 16 imágenes con prompt, tamaño y dónde va cada una.
- `docs/03-campana-meta.md` — brief para la campaña de Meta Ads (no requiere despliegue, es para Carlos).
- `DEPLOY.md` — pasos exactos de despliegue del sitio y del Worker.

## Convenciones del código

- Todo el código y los comentarios están en **español**, porque Carlos y su
  equipo trabajan en español. Mantén ese idioma en cualquier cambio o script
  que agregues.
- Nombres de archivo de imágenes: siempre en minúsculas, con guiones, sin
  espacios ni acentos (ya están definidos en `docs/02-imagenes-codex.md` y en
  `public/content/sitio.json` → no inventes nombres nuevos sin avisar).
- No agregues frameworks de frontend (React, Vue, build tools). El sitio es
  intencionalmente HTML/CSS/JS plano para que sea fácil de editar y de alojar
  en cualquier lado.
- El Worker no tiene dependencias de npm más allá de `wrangler` (dev only).
  No agregues librerías innecesarias.

## Cosas que SÍ puedes decidir tú (no requieren avisar a Claude)

- Detalles de infraestructura: cómo sincronizar archivos al VPS (rsync, git
  pull + symlink, CI, lo que ya uses en otros proyectos de Carlos), certificado
  SSL, configuración de Nginx/Apache.
- Crear los recursos de Cloudflare (D1, el Worker) la primera vez.
- Generar las imágenes con IA a partir de `docs/02-imagenes-codex.md` y
  subirlas a `public/assets/img/`.

## Cosas que NO debes cambiar sin avisar

- Textos, estructura de secciones, colores, tipografía → eso es diseño y vive
  en `sitio.json` / `styles.css`, que mantiene Claude.
- El esquema de la base de datos (`worker/schema.sql`) — si necesitas un campo
  nuevo, repórtalo en vez de migrarlo tú mismo, porque afecta el CSV de
  exportación y el formulario del sitio.
