# Cancún Cero Cáncer — Estructura, diseño y contenido

**Sitio:** cancuncerocancer.com · **Versión:** 1 (septiembre 2026)
**Stack acordado:** sitio estático + Cloudflare Worker + D1 (registros) · videos en YouTube · todo el contenido editable en `content.json`

---

## 1. Concepto

La marca va al frente, no el taller ni el ponente. La página es la **fuente de la verdad** de Cancún Cero Cáncer:

- **Antes del taller:** conoce la marca y regístrate.
- **Durante el taller:** cada semana se activan los videos y guías que se vieron en la sesión.
- **Después del taller:** biblioteca permanente para repasar, y base de datos para los próximos talleres.

**Tono:** cercano, motivador, positivo. Se habla de *reducir el riesgo* y *crear hábitos*, nunca de curar, garantizar ni asustar.

**Público:** mujeres adultas de Cancún, de cualquier edad.

---

## 2. Mapa del sitio

| Ruta | Acceso | Para qué sirve |
|---|---|---|
| `/` | Público | Landing: marca, taller, muestra de ejercicios, registro |
| `/gracias` | Público | Confirmación de registro + botón WhatsApp + evento de conversión |
| `/acceso` | Público | La usuaria escribe su correo y recibe su enlace de acceso |
| `/biblioteca` | Con token | Todos los videos por semana y categoría + guías de nutrición |
| `/aviso-de-privacidad` | Público | Obligatorio (LFPDPPP) antes de lanzar |

---

## 3. Sistema visual

### Paleta

| Uso | Color | Hex |
|---|---|---|
| Principal (turquesa Caribe) | Turquesa | `#0E9AA7` |
| Secundario (energía) | Verde mar | `#3DBE8B` |
| Acento (prevención, CTA secundario) | Rosa coral | `#EF6F8E` |
| Fondo cálido | Arena | `#F7F1E8` |
| Fondo neutro | Blanco | `#FFFFFF` |
| Texto | Carbón | `#1F2A2E` |
| Texto suave | Gris | `#5B6B70` |

Botón principal en turquesa, botón de registro final en rosa coral para que destaque.

### Tipografía
- **Títulos:** Montserrat 700/800
- **Texto:** Nunito 400/600
- Tamaño base 18 px en móvil; títulos grandes y cortos.

### Estilo general
- Móvil primero (la mayoría llegará desde WhatsApp y anuncios de Meta).
- Mucho espacio en blanco, esquinas redondeadas (16–24 px), sombras suaves.
- Botones grandes (mínimo 48 px de alto), en forma de píldora.
- Iconos de línea redondeada (Lucide o Phosphor).
- Botón flotante de WhatsApp en todas las páginas.

### Fotografía (regla para todas las imágenes)
- Realista, luz natural cálida, ambientes de Cancún: casa, parque, playa, palapa, malecón.
- Mujeres mexicanas/latinas reales, de edades (25 a 65+), complexiones y tonos de piel diversos.
- Expresión de energía, bienestar y comunidad. **Nunca** de enfermedad.
- Evitar: hospitales, batas, agujas, calvicie por quimioterapia, cintas rosas gigantes, cuerpos "antes y después", poses de gimnasio profesional.
- Sin texto dentro de las fotos (el texto va en el HTML).

---

## 4. Landing (`/`), sección por sección

> Los textos entre corchetes `[ ]` son datos pendientes. Todo vive en `content.json`.

### 4.1 Encabezado fijo
- Logo (wordmark "Cancún Cero Cáncer") a la izquierda.
- Botón "Regístrate" a la derecha.
- Menú: Taller · Ejercicios · Nutrición · Biblioteca.

### 4.2 Portada (hero)
- **Imagen:** `hero-principal` (versión escritorio y móvil).
- **Título:** Muévete hoy, cuídate siempre.
- **Subtítulo:** Cancún Cero Cáncer es un movimiento para que las mujeres de Cancún reduzcan su riesgo de cáncer con actividad física, buena alimentación y prevención.
- **Chip de datos:** [N] semanas · [Presencial / En línea] · Cancún · [Gratuito / Costo]
- **Botón principal:** Quiero registrarme
- **Botón secundario:** Ver ejercicios

### 4.3 Tres pilares
**Título:** Tres hábitos que suman

| Pilar | Imagen | Texto |
|---|---|---|
| Movimiento | `pilar-movimiento` | Ejercicios sencillos con ligas, botellas de agua y tu propio peso. Sin gimnasio. |
| Nutrición | `pilar-nutricion` | Ideas prácticas para comer mejor con lo que encuentras en Cancún. |
| Prevención | `pilar-prevencion` | Información clara sobre revisiones y señales de alerta, para que actúes a tiempo. |

### 4.4 Por qué moverse (franja de dato)
- Fondo turquesa, texto blanco, una sola frase grande.
- **Texto:** La actividad física regular se asocia con menor riesgo de varios tipos de cáncer, entre ellos el de mama y el de colon.
- Fuente pequeña: [OMS / WCRF].
- ⚠️ **Validar redacción y fuente con el equipo médico antes de publicar.**

### 4.5 El taller
- **Imagen:** `taller-grupo`
- **Título:** El taller: [N] semanas para crear el hábito
- **Datos:** Fechas [ ] · Horario [ ] · Lugar [ ] · Cupo [ ]
- **Línea de respaldo (pequeña, opcional):** Programa diseñado con asesoría médica del Dr. [Nombre] Ramos.
- **Línea de tiempo por semana** (editable en JSON, ejemplo):
  1. Movilidad y postura
  2. Fuerza con ligas
  3. Fuerza con botellas de agua
  4. Cardio suave y alimentación
  5. Prevención y plan para seguir en casa
- **Botón:** Aparta tu lugar

### 4.6 Ejercicios en casa (muestra pública)
- **Título:** Entrena en casa con lo que ya tienes
- **Filtros (chips):** Ligas · Botellas · Peso corporal · Movilidad · Cardio suave
- Portadas de categoría: `categoria-ligas`, `categoria-botellas`, `categoria-peso-corporal`, `categoria-movilidad`, `categoria-cardio`.
- **3 videos públicos** (YouTube embebido, miniatura grande, carga al tocar).
- **Tarjeta con candado:** Hay [N] videos más en la biblioteca. Regístrate para verlos.

### 4.7 Nutrición y prevención (adelanto)
**Título:** Comer bien también es prevenir

| Tarjeta | Imagen | Texto |
|---|---|---|
| Tu plato, en fácil | `nutricion-plato` | Mitad verduras, un cuarto proteína, un cuarto cereal integral. |
| Hidrátate con el calor de Cancún | `nutricion-hidratacion` | Ideas de agua natural y fresca, sin azúcar añadida. |
| Revisiones que no debes dejar pasar | `nutricion-revisiones` | Cuándo y cómo hablar con tu médico sobre tus revisiones. |

Las guías completas están en la biblioteca.

### 4.8 Preguntas frecuentes
- **¿Necesito experiencia?** No. Todos los ejercicios tienen versión fácil.
- **¿Qué material necesito?** Una liga de resistencia, dos botellas de agua (500 ml o 1 L) y ropa cómoda.
- **¿Tiene costo?** [ ]
- **¿Si ya tuve cáncer o estoy en tratamiento puedo participar?** Consulta primero con tu médico. El taller es de prevención y no sustituye ningún tratamiento.
- **¿Cómo vuelvo a ver los videos?** Entra a /acceso con el correo con el que te registraste.

### 4.9 Registro
- **Imagen:** `registro-lateral`
- **Título:** Aparta tu lugar
- **Campos:**
  - Nombre
  - Correo (será su llave de acceso a la biblioteca)
  - WhatsApp (10 dígitos, +52 fijo)
  - Edad (número, 18–99)
  - ☐ Acepto el [aviso de privacidad] y recibir información de Cancún Cero Cáncer por WhatsApp y correo.
- **Botón (rosa coral):** Registrarme
- **Microtexto:** Te enviaremos tu acceso a la biblioteca por correo.
- **Campos ocultos:** `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `fbclid`, página de origen, fecha.

### 4.10 Pie de página
- Logo, redes sociales, WhatsApp, aviso de privacidad.
- **Leyenda:** Contenido informativo. No sustituye la consulta médica.

---

## 5. Página `/gracias`
- **Título:** ¡Listo, [nombre]! Ya eres parte de Cancún Cero Cáncer.
- **Botón 1:** Confirmar por WhatsApp (mensaje prellenado: "Hola, me registré al taller de Cancún Cero Cáncer. Soy [nombre].")
- **Botón 2:** Ir a la biblioteca
- Aquí se dispara el evento **Lead** (Pixel + API de Conversiones).

## 6. Páginas `/acceso` y `/biblioteca`
- **/acceso:** un solo campo de correo → "Te enviamos tu enlace de acceso".
- **/biblioteca:**
  - Imagen de cabecera `biblioteca-hero` + saludo "Hola, [nombre]".
  - Filtros por **semana** y por **categoría**, y buscador.
  - Tarjeta de video: miniatura de YouTube, título, duración, nivel, material.
  - Semanas no activas: "Disponible el [fecha]" (se activan en el JSON cambiando `activa: true`).
  - Guías de nutrición como tarjetas descargables o de lectura.

---

## 7. Conversión y medición
- **Meta Pixel** en todas las páginas + **API de Conversiones** desde el Worker (con `event_id` para no duplicar).
- Eventos: `PageView`, `ViewContent` (biblioteca), `Lead` (registro).
- Los UTM y `fbclid` se guardan en D1 junto con cada registro → sabrás qué anuncio trajo a cada persona.
- Imagen para compartir (`og-image`): clave porque el enlace circulará por WhatsApp.
- Meta de velocidad: carga principal en menos de 2.5 s en móvil (imágenes WebP, videos cargan al tocar).

## 8. Pendientes para arrancar
- [ ] Fechas, horario, lugar, cupo y costo del taller
- [ ] Formato: presencial / en línea / mixto
- [ ] Logo (o se usa wordmark tipográfico mientras)
- [ ] Lista de videos de YouTube por categoría y semana
- [ ] Validación médica de los textos de la sección 4.4 y 4.7
- [ ] Aviso de privacidad (responsable, finalidades, derechos ARCO)
- [ ] Redes sociales y número de WhatsApp oficial
