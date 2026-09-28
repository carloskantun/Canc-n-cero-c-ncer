> **Producción desde 28-sep-2026:** consultar `deploy/OPERACION.md` antes de desplegar.
> El sitio vive en `/home/cancuncerocancer/public_html` (VPS-KANTUN), la API en
> `https://cancuncerocancer-api.carloskantun.workers.dev/api` y D1 ya está creada.
> El dominio no está en modo proxy de Cloudflare: Apache redirige `/api/*` con
> **307** a `https://cancuncerocancer-api.carloskantun.workers.dev/api/*` mediante
> `deploy/site.htaccess`. No hay una Workers Route nativa; se conservaron DNS y correo
> existentes. El frontend usa directamente esa URL del Worker (`config.js`).
> No repetir la creación de D1 ni restaurar WordPress.
> Excluir siempre `assets/img/_variantes/` y `README.md` al publicar `public/`.

# Despliegue — Cancún Cero Cáncer

Dos piezas independientes:

1. **El sitio** (`public/`) — archivos estáticos, va al VPS (o a Cloudflare Pages).
2. **La API** (`worker/`) — Cloudflare Worker + D1, va a Cloudflare.

Se pueden desplegar por separado; el sitio funciona sin la API (el registro
simplemente mostraría un error de conexión hasta que la API esté arriba).

---

## 1. Desplegar el sitio (`public/`) al VPS

No necesita build. Es copiar la carpeta `public/` completa a la raíz pública
del dominio en el VPS de Cancún.

```bash
# En el VPS, dentro de una copia del repositorio:
git clone https://github.com/carloskantun/canc-n-cero-c-ncer.git
cd canc-n-cero-c-ncer
git pull   # en despliegues posteriores

# Sincroniza el contenido de public/ a la carpeta pública del dominio.
# Ajusta la ruta destino a como esté configurado el hosting de Carlos
# (la misma carpeta que usan sus otros sitios en este VPS).
rsync -av --delete public/ /var/www/cancuncerocancer.com/
```

Si el hosting sirve directo desde una copia del repo (sin rsync), basta con
que el document root del dominio apunte a `canc-n-cero-c-ncer/public/`.

**Checklist después de cada despliegue del sitio:**
- [ ] `https://cancuncerocancer.com/` carga y se ve el hero.
- [ ] `https://cancuncerocancer.com/content/sitio.json` responde 200 (si da 404, el `document root` no es el correcto).
- [ ] Las páginas `/gracias/`, `/acceso/`, `/biblioteca/`, `/aviso-de-privacidad/` cargan (son carpetas con `index.html`, necesitan URLs "limpias" — la mayoría de los hostings ya sirven `carpeta/` → `carpeta/index.html` sin configuración extra; si no, revisar la config de Nginx/Apache).
- [ ] HTTPS activo (Let's Encrypt o el que ya use el VPS para los otros dominios de Carlos).

---

## 2. Desplegar el Worker + base de datos (Cloudflare)

Requiere una cuenta de Cloudflare. En producción se usa `workers.dev`, por lo
que no hace falta mover el dominio a Cloudflare. Solo una futura Workers Route
nativa requiere una zona de Cloudflare con el dominio en modo proxy/naranja.
La base y los secretos de firma y administración ya existen; para actualizar,
usar la sección "Actualizar el Worker cuando haya cambios de código".

```bash
cd worker
npm install
npx wrangler login          # una sola vez, abre el navegador para autorizar

# 1) Crear la base de datos (solo la primera vez)
npx wrangler d1 create ccc_db
# Copia el "database_id" que devuelve y pégalo en wrangler.toml,
# reemplazando "REEMPLAZA_CON_TU_DATABASE_ID".

# 2) Crear las tablas
npm run db:init:remote

# 3) Configurar los secretos (te va a pedir el valor de cada uno; pégalo y Enter)
npx wrangler secret put TOKEN_SECRETO
#   → genera algo largo y aleatorio, por ejemplo con: openssl rand -hex 32
npx wrangler secret put ADMIN_TOKEN
#   → la "contraseña" para ver y exportar los registros desde /api/admin/*
npx wrangler secret put RESEND_API_KEY
#   → opcional, para que se envíen los correos de acceso (cuenta en resend.com)
npx wrangler secret put META_PIXEL_ID
#   → opcional, para la API de Conversiones de Meta
npx wrangler secret put META_ACCESS_TOKEN
#   → opcional, token de sistema de Meta para la API de Conversiones

# 4) Desplegar
npm run deploy
```

El `wrangler.toml` actual usa `workers_dev = true` y no contiene `[[routes]]`.
Apache mantiene la redirección 307 descrita arriba. Si se migra el dominio al
proxy de Cloudflare, se podrá configurar entonces una Workers Route nativa
`cancuncerocancer.com/api/*` hacia `cancuncerocancer-api`.

**Checklist después de desplegar el Worker:**
```bash
curl https://cancuncerocancer-api.carloskantun.workers.dev/api/salud
# debe responder: {"ok":true,"servicio":"cancuncerocancer-api"}
```
- [ ] Llenar el formulario de la landing de verdad y confirmar que llega el registro:
      `curl -H "authorization: Bearer TU_ADMIN_TOKEN" https://cancuncerocancer-api.carloskantun.workers.dev/api/admin/registros`
- [ ] Si se configuró `RESEND_API_KEY`, confirmar que llegó el correo de bienvenida.
- [ ] Probar `/acceso/` con ese mismo correo y confirmar que llega el correo de acceso.
- [ ] Entrar a `/biblioteca/` con el enlace del correo y confirmar que carga el contenido de la Semana 1.

### Actualizar el Worker cuando haya cambios de código

```bash
cd worker
git pull
npm run deploy
```

No hace falta repetir `db:init:remote` salvo que `schema.sql` haya cambiado
(en ese caso, avisar a Carlos antes: una migración mal hecha puede perder datos).

### Activar una nueva semana del taller

El contenido de la biblioteca vive en `worker/content/biblioteca.json` (no en
`public/`, porque es contenido privado). Para desbloquear la Semana 2, por
ejemplo:

```jsonc
{ "numero": 2, "titulo": "Fuerza con ligas", "activa": true, "disponibleDesde": "" }
```

Y agregar los `youtubeId` de los videos de esa semana. Después:

```bash
cd worker && npm run deploy
```

### Exportar los registros a Excel/Sheets

```
https://cancuncerocancer-api.carloskantun.workers.dev/api/admin/exportar.csv
```
Usar directamente el Worker: los clientes pueden retirar `Authorization` al
seguir una redirección entre dominios. Consultar con el encabezado
`Authorization: Bearer TU_ADMIN_TOKEN` (usar una extensión
de navegador tipo "ModHeader", Postman, o `curl -O -H "authorization: Bearer ..." URL`).

---

## Variables y secretos — resumen

| Nombre | Tipo | Dónde se define | Obligatorio |
|---|---|---|---|
| `SITE_URL` | variable | `wrangler.toml` → `[vars]` | Sí |
| `TALLER_ACTUAL` | variable | `wrangler.toml` → `[vars]` | Sí |
| `CORREO_REMITENTE` | variable | `wrangler.toml` → `[vars]` | Sí (si se usa correo) |
| `TOKEN_SECRETO` | secreto | `wrangler secret put` | Sí |
| `ADMIN_TOKEN` | secreto | `wrangler secret put` | Sí |
| `RESEND_API_KEY` | secreto | `wrangler secret put` | No (sin esto, no se envían correos) |
| `META_PIXEL_ID` | secreto | `wrangler secret put` | No (sin esto, no hay API de Conversiones server-side) |
| `META_ACCESS_TOKEN` | secreto | `wrangler secret put` | No |

En `public/content/sitio.json` está `meta.pixel_id` (el ID del Pixel, para el
navegador). En `public/assets/js/config.js` está `apiBase` (dónde vive la API — normalmente `/api`, no hace falta
tocarlo si el Worker usa la ruta `cancuncerocancer.com/api/*`).

---

## Probar todo localmente antes de tocar producción

```bash
# Sitio (en una terminal)
cd public && python3 -m http.server 8080

# API (en otra terminal)
cd worker
npm install
echo "TOKEN_SECRETO=prueba-local" > .dev.vars
echo "ADMIN_TOKEN=admin-local" >> .dev.vars
npx wrangler d1 execute ccc_db --local --file=./schema.sql
npx wrangler dev --local --port 8787
```

Para que el sitio local hable con la API local, cambia temporalmente en
`public/assets/js/config.js`:
```js
apiBase: "http://127.0.0.1:8787/api",
```
y revierte ese cambio antes de subir a producción (no debe quedar en el commit).

---

## Alternativa sin Cloudflare Workers

No es necesaria en el despliegue actual: el Worker funciona mediante
`workers.dev` sin cambiar el DNS del dominio. Si se decide prescindir de
Workers por completo, una alternativa sería un backend PHP + MySQL/SQLite
en el mismo VPS, replicando las mismas tres
rutas (`/api/registro`, `/api/acceso`, `/api/biblioteca`) con la misma forma
de entrada y salida que usa `worker/src/`. Avisar a Carlos antes de tomar ese
camino: implica escribir ese backend PHP y ajustar `apiBase` en `config.js`.

## Meta Pixel, CAPI y exportación de leads

El frontend sigue siendo HTML/CSS/JS sin build ni React. `npm` se usa solo en
`worker/` para Wrangler y las pruebas (`npm test`, `npm run deploy`).

- Poner el ID público en `public/content/sitio.json` → `meta.pixel_id`. Vacío
  desactiva el Pixel. `common.js`, incluido en todas las páginas, lo carga una
  vez y emite PageView; ViewContent solo en `/` o `/index.html`.
- `window.fbqLead(eventoId)` emite Lead una sola vez por ID en esa página. El
  formulario guarda el ID confirmado por el servidor y `/gracias/` lo emite
  solo para registros nuevos, no al recuperar acceso ni al recargar.
- `FB_PIXEL_ID` ya está en `[vars]` de `worker/wrangler.toml` con el mismo ID
  público de `sitio.json`. Configurar `FB_CAPI_TOKEN` con `wrangler secret put`
  en `worker/`. Los nombres anteriores `META_PIXEL_ID`
  y `META_ACCESS_TOKEN` siguen admitidos; los `FB_*` tienen prioridad.
- CAPI usa el mismo `evento_id` que el Pixel; envía email/teléfono con SHA-256,
  IP, user agent y cookies de atribución. No envía nombres, edades, tokens de
  biblioteca, consultas de URL, nombres de campaña ni información médica.
  No activar la coincidencia avanzada automática desde Events Manager sin
  revisar qué datos recopilaría. Revisar allí las restricciones que Meta
  aplique a esta fuente de datos antes de lanzar campañas.
- `FB_API_VERSION` fija la versión de Graph API. Para comprobar deduplicación
  en Events Manager se puede configurar temporalmente `FB_TEST_EVENT_CODE`;
  eliminar ese secreto después de la prueba. Sin credenciales, registrar
  personas sigue funcionando y no se envían eventos a Meta.

La tabla `leads` tiene `id, nombre, whatsapp, email, origen, created_at,
evento_id`. Es una proyección sincronizada de `registros` mediante triggers:
no es un segundo formulario ni cambia los IDs o el acceso a la biblioteca.
La migración incorpora los registros anteriores sin enviar Leads históricos.
`origen` se deriva de `utm_source`: fb/facebook → fb, ig/instagram → ig,
cualquier otro valor → organico (los UTM originales se conservan en registros).
En las campañas usar `utm_source={{site_source_name}}` para distinguir fb/ig.

Antes de actualizar una instalación existente, respaldar D1 fuera del repo y
aplicar una vez la migración aditiva:

```bash
cd worker
wrangler d1 export ccc_db --remote --output /RUTA_PRIVADA/ccc-pre-leads.sql
wrangler d1 execute ccc_db --remote --file migrations/0001_leads.sql
npm test
npm run deploy
```

Para instalaciones nuevas, `schema.sql` ya incluye esa tabla y sus triggers.
`worker/content/biblioteca.json` no se modifica.

`GET /api/leads` devuelve JSON; `?format=csv` devuelve CSV para Excel. Usar la
URL directa `https://cancuncerocancer-api.carloskantun.workers.dev/api/leads`
y `Authorization: Bearer ADMIN_TOKEN` o `Authorization: Bearer ADMIN_KEY`.
También se admite `?key=ADMIN_KEY` como se solicitó, pero esa clave puede
quedar en historial y registros del servidor: no publicar ni compartir ese
enlace. La clave es un secreto separado, configurado con
`wrangler secret put ADMIN_KEY`. Respuestas de exportación: `no-store`.
