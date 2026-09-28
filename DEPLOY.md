> **Producción desde 28-sep-2026:** consultar `deploy/OPERACION.md` antes de desplegar.
> El sitio vive en `/home/cancuncerocancer/public_html` (VPS-KANTUN), la API en
> `https://cancuncerocancer-api.carloskantun.workers.dev/api` y D1 ya está creada.
> El DNS sigue en el VPS. No repetir la creación de D1 ni restaurar WordPress.
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

Requiere una cuenta de Cloudflare con el dominio `cancuncerocancer.com` ya
apuntando a Cloudflare (DNS en modo proxy/naranja) — igual que otros proyectos
de Carlos. Si el dominio NO está en Cloudflare todavía, ver la sección
"Alternativa sin Cloudflare Workers" al final.

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

Wrangler crea automáticamente la ruta `cancuncerocancer.com/api/*` definida en
`wrangler.toml` (bloque `[[routes]]`). Si el despliegue avisa que no pudo
crear la ruta, entrar al dashboard de Cloudflare → el dominio → **Workers
Routes** → agregar `cancuncerocancer.com/api/*` apuntando al Worker
`cancuncerocancer-api`.

**Checklist después de desplegar el Worker:**
```bash
curl https://cancuncerocancer.com/api/salud
# debe responder: {"ok":true,"servicio":"cancuncerocancer-api"}
```
- [ ] Llenar el formulario de la landing de verdad y confirmar que llega el registro:
      `curl -H "authorization: Bearer TU_ADMIN_TOKEN" https://cancuncerocancer.com/api/admin/registros`
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
https://cancuncerocancer.com/api/admin/exportar.csv
```
con el encabezado `Authorization: Bearer TU_ADMIN_TOKEN` (usar una extensión
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

En `public/assets/js/config.js` está `metaPixelId` (el ID del Pixel, para el
navegador) y `apiBase` (dónde vive la API — normalmente `/api`, no hace falta
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

Si por alguna razón el dominio no puede pasar por Cloudflare, la alternativa
es un backend PHP + MySQL/SQLite en el mismo VPS, replicando las mismas tres
rutas (`/api/registro`, `/api/acceso`, `/api/biblioteca`) con la misma forma
de entrada y salida que usa `worker/src/`. Avisar a Carlos antes de tomar ese
camino: implica escribir ese backend PHP y ajustar `apiBase` en `config.js`.
