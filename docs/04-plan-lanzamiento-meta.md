# Plan de lanzamiento — Meta Ads para Cancún Cero Cáncer

Ya tienes Página de Facebook, Business Manager y cuenta publicitaria. Falta
conectar el Pixel al sitio y decidir cómo lanzar sin tener aún fecha, horario
ni costo del taller. Este documento resuelve las dos cosas.

---

## 1. Conectar el Pixel (antes de gastar un peso en anuncios)

El sitio y el Worker ya tienen el código listo para el Pixel y para la API de
Conversiones (server-side); solo faltan dos IDs/tokens reales.

### 1.1 Obtener el Pixel

1. Administrador de eventos (Events Manager) → **Orígenes de datos** → si no
   existe uno para Cancún Cero Cáncer, crea un **Pixel de Meta** nuevo.
2. Vincúlalo a tu Business Manager y a la cuenta publicitaria que ya tienes.
3. Copia el **ID del Pixel** (número de 15-16 dígitos).

### 1.2 Generar el token para la API de Conversiones (server-side)

Esto es lo que hace que el registro se reporte a Meta aunque la persona tenga
bloqueadores de anuncios o el Pixel del navegador falle — ya está programado
en el Worker (`worker/src/meta.js`), solo falta activarlo.

1. En el Administrador de eventos, con el Pixel abierto → pestaña
   **Configuración** → **Conversions API** → **Generar token de acceso**
   (token de larga duración, específico de este Pixel).
2. Copia ese token.

### 1.3 Dónde va cada dato

| Dato | Dónde se pone | Quién lo hace |
|---|---|---|
| ID del Pixel | `public/assets/js/config.js` → `metaPixelId: "TU_ID_AQUI"` | Puedo editarlo yo en el repo en cuanto me des el ID |
| ID del Pixel (otra vez) | Secreto `META_PIXEL_ID` en el Worker | Codex, con `wrangler secret put META_PIXEL_ID` |
| Token de Conversions API | Secreto `META_ACCESS_TOKEN` en el Worker | Codex, con `wrangler secret put META_ACCESS_TOKEN` |

Dame el ID del Pixel y lo dejo puesto en el repo hoy mismo; el token de
Conversions API pásaselo directo a Codex (es un secreto, no debe viajar por
chat ni quedar en GitHub).

### 1.4 Verificar que quedó bien

- Instala la extensión **Meta Pixel Helper** en Chrome, abre
  cancuncerocancer.com y confirma que detecta `PageView`.
- Llena el formulario de registro de prueba y confirma que ves `Lead` en el
  Pixel Helper **y** en Events Manager con el badge "Servidor" (eso confirma
  que la API de Conversiones también está llegando, no solo el navegador).
- En Events Manager, la calidad de coincidencia (match quality) debería subir
  una vez que ambos coincidan, porque mandamos el mismo `eventId` desde los
  dos lados para que Meta los deduplique como un solo evento.

---

## 2. El problema de fondo: no hay fecha todavía

No puedes prometer una fecha en el anuncio que no tienes en la página, y
Meta rechaza (o penaliza el rendimiento de) anuncios que no coinciden con lo
que dice el sitio de destino. La solución es lanzar en dos fases en vez de
esperar a tener todo cerrado.

### Fase 0 — Ahora: validar mensaje y arrancar la base de datos (sin fecha)

**Objetivo de campaña:** Clientes potenciales, conversión en sitio web
(evento `Lead`), exactamente como ya está armado.

**Qué cambia respecto al brief original** (`docs/03-campana-meta.md`): quita
toda mención a fecha/cupo/cuenta regresiva. El ángulo ya no es "apúrate,
quedan lugares", sino **"sé de las primeras en enterarte"**:

- Texto: *"Estamos armando el próximo taller de Cancún Cero Cáncer: ejercicios en casa con ligas y botellas de agua, nutrición y prevención para mujeres en Cancún. Regístrate y sé de las primeras en saber la fecha y el cupo."*
- Botón: Registrarte
- La landing ya dice "Por confirmar" en fecha/horario/costo, así que el
  mensaje del anuncio y el de la página coinciden — nada que ajustar ahí.

**Audiencias:** usa las mismas de `docs/03-campana-meta.md` (A, B, C), pero
arranca solo con **C (Advantage+, mujeres 25-65+ en Cancún)** una semana antes
de abrir A/B por separado. Con presupuesto bajo, Advantage+ aprende más rápido
con una sola audiencia amplia que dividiendo el gasto en tres desde el día uno.

**Presupuesto sugerido para esta fase:** bajo y por tiempo fijo, no por meta de
registros — el objetivo aquí es **aprender qué ángulo y qué creativo
convierten mejor**, no llenar el taller todavía.
- 7-10 días, el presupuesto diario mínimo que te deje Meta para "Clientes
  potenciales" en tu moneda (usualmente works con MX$100-150/día por
  conjunto de anuncios).
- Corre los 3 ángulos de texto del brief (Hábito sencillo / Comunidad /
  Información que sirve) como anuncios distintos dentro del mismo conjunto,
  y dejas que Meta reparta el gasto hacia el que mejor convierta.

**Qué NO hacer en esta fase:** no actives el conjunto de Retargeting (D)
todavía — necesitas tráfico acumulado primero (mínimo ~100 visitantes para
que la audiencia tenga tamaño útil).

### Fase 1 — Cuando ya tengas fecha, horario, costo y cupo

1. Actualiza `public/content/sitio.json` (fechas, horario, costo, cupo) —
   avísame y lo hago en el repo en minutos.
2. Recupera los textos y creativos con cuenta regresiva y cupo del brief
   original (`docs/03-campana-meta.md`, sección 5 y 6) — esos sí prometen
   una fecha real porque ya existirá en la página.
3. Sube el presupuesto y activa las 3 fases del calendario original
   (Lanzamiento → Cierre de cupo → Durante/Después), usando lo aprendido en
   la Fase 0: el ángulo y el creativo que mejor convirtieron pasan a ser los
   principales, no los tres a la vez.
4. Activa el conjunto de Retargeting (D) con la audiencia que ya se acumuló
   durante la Fase 0 — llega con ventaja en vez de empezar de cero.

---

## 3. Qué vigilar en la Fase 0 (para decidir cómo escalar)

| Métrica | Dónde verla | Qué te dice |
|---|---|---|
| Costo por registro (CPL) | Administrador de anuncios | Qué tan caro es cada lead con este mensaje |
| % que completa el formulario tras entrar al sitio | `/api/admin/registros` vs. clics del anuncio | Si el problema es el anuncio o la página |
| Ángulo con más registros | Comparar los 3 anuncios dentro del conjunto | Cuál mensaje escalar en la Fase 1 |
| Edad/zona con mejor conversión | Desglose por edad en Meta | Ajustar los conjuntos A/B para la Fase 1 |

---

## 4. Lo que puedes lanzar HOY (checklist)

- [ ] Pixel creado y vinculado a la cuenta publicitaria (paso 1.1)
- [ ] Token de Conversions API generado y entregado a Codex, no por chat (paso 1.2)
- [ ] Pixel ID pasado a Claude para meterlo en `config.js` (paso 1.3)
- [ ] Verificado con Pixel Helper + Events Manager que `PageView` y `Lead` llegan (paso 1.4)
- [ ] Campaña "Clientes potenciales" creada con audiencia Advantage+ (C) únicamente
- [ ] 3 anuncios (uno por ángulo de texto), mismo conjunto, sin mención de fecha/cupo
- [ ] Presupuesto bajo, 7-10 días, sin retargeting todavía
- [ ] Aviso de privacidad revisado por alguien con criterio legal antes de que corran los anuncios (sigue en borrador — ver `public/aviso-de-privacidad/`)
