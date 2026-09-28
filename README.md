# Cancún Cero Cáncer

Sitio de **cancuncerocancer.com**: movimiento para que las mujeres de Cancún
reduzcan su riesgo de cáncer con actividad física en casa, nutrición y
prevención. La página es la fuente permanente de referencia del taller: antes,
durante y después de tomarlo.

- **`public/`** — el sitio (HTML/CSS/JS estático, sin build). Todo el
  contenido visible se edita en `public/content/sitio.json`.
- **`worker/`** — la API (Cloudflare Worker + D1): registro al taller, acceso
  a la biblioteca por enlace (sin contraseñas) y el contenido privado de
  `worker/content/biblioteca.json`.
- **`docs/`** — estructura y diseño, prompts de imágenes para generarlas con
  IA, y el brief de la campaña de Meta Ads.
- **`AGENTS.md`** — guía para quien despliegue el sitio (pensada para Codex).
- **`DEPLOY.md`** — pasos exactos de despliegue.

## Para desplegar

Ver `DEPLOY.md`.

## Para editar textos, fechas o precios del taller

Editar `public/content/sitio.json`. No requiere tocar código ni desplegar el
Worker, solo volver a subir el sitio.

## Para agregar videos o abrir una nueva semana de la biblioteca

Editar `worker/content/biblioteca.json` y desplegar el Worker (`cd worker && npm run deploy`).
