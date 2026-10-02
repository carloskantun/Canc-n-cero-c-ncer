# Instrucciones para Codex — Imágenes de Cancún Cero Cáncer

## Identidad visual exacta para nuevas piezas

Verificada contra el CSS del sitio el 2-oct-2026. Principal turquesa
`#0E9AA7`, secundario verde `#3DBE8B`, rosa coral `#EF6F8E`.
Fondos blanco `#FFFFFF` y arena `#F7F1E8`; texto carbón `#1F2A2E`.
Títulos y marca: **Montserrat 700/800**. Texto: **Nunito 400/600/700**.
No se usa Poppins. Los hex se aplican exactamente al componer gráficos;
las fotos de IA solo toman la paleta como referencia. Generar fotos sin letras
y añadir tipografía y marca en un editor, respetando la regla de abajo.

La guía completa de formatos, calendario, copys y campaña está en
[05-guia-marca-contenidos-campana.md](05-guia-marca-contenidos-campana.md).
El destino de registro es `https://cancuncerocancer.com/#registro`.

## Contexto
Cancún Cero Cáncer es un movimiento para que las mujeres de Cancún reduzcan su riesgo de cáncer con actividad física en casa (ligas, botellas de agua, peso corporal), nutrición y prevención. El sitio (cancuncerocancer.com) es estático, móvil primero, con el contenido en `content.json`. La estructura completa está en `ccc-01-estructura-y-diseno.md`.

## Tu tarea
1. Genera cada imagen de la lista de abajo con su prompt. Genera **al menos 2 variantes** por imagen y elige la mejor con la lista de revisión.
2. Exporta en **WebP (calidad 80)** con el nombre y tamaño indicados en `/assets/img/`. Las variantes descartadas van en `/assets/img/_variantes/` (no se publican).
3. Registra cada imagen en `content.json` bajo `images.<id>`:
   ```json
   "images": {
     "hero-principal": {
       "src": "/assets/img/hero-principal-desktop.webp",
       "srcMobile": "/assets/img/hero-principal-mobile.webp",
       "alt": "Tres mujeres de distintas edades entrenando con ligas en un parque de Cancún",
       "width": 1920, "height": 1080
     }
   }
   ```
4. Si el HTML ya existe, coloca cada imagen en la sección indicada usando `<picture>` / `srcset`, `loading="lazy"` (excepto el hero) y el `alt` en español.
5. No pongas texto dentro de las imágenes generadas. La única imagen con texto es `og-image` y ese texto se compone **con código** (Sharp o Pillow), no con IA.

## Bloque de estilo (agrégalo al inicio de TODOS los prompts)
```
Photorealistic editorial lifestyle photography, natural warm light, soft Caribbean
color palette (turquoise, sea green, warm sand, small touches of coral pink).
Mexican and Latin American women with diverse ages, body types and skin tones,
genuine relaxed smiles, everyday athletic clothing (leggings, t-shirts, tank tops,
sneakers). Shot on 35mm, shallow depth of field, clean uncluttered background,
generous negative space. No text, no logos, no brand names, no watermarks.
```

## Prohibido en cualquier imagen
- Hospitales, batas, agujas, equipo médico, pacientes.
- Calvicie por quimioterapia, tristeza, miedo, dolor.
- Cintas rosas gigantes o simbolismo de cáncer explícito.
- Cuerpos "antes y después", abdomen marcado, poses de fisicoculturismo.
- Gimnasios con máquinas o pesas profesionales.

## Lista de revisión (cada imagen debe pasarla)
- [ ] Manos con 5 dedos, sin deformaciones.
- [ ] La liga es continua, tensa y sujeta correctamente (no atraviesa el cuerpo ni se funde con la ropa).
- [ ] Las botellas se sostienen de forma natural, tapa hacia arriba, sin etiquetas legibles.
- [ ] Postura segura: espalda neutra, rodillas alineadas con los pies, hombros relajados.
- [ ] Sin texto, logos ni marcas en ropa, botellas o fondo.
- [ ] Hay espacio libre donde el diseño pondrá el texto.

---

## Lista de imágenes

### 1. `hero-principal` — Portada
- **Archivos:** `hero-principal-desktop.webp` (1920×1080, 16:9) y `hero-principal-mobile.webp` (1080×1350, 4:5)
- **Prompt escritorio:** Three Mexican women of different ages (around 30, 45 and 60) doing a standing resistance band row together in a sunny open park near the Caribbean coast of Cancún, palm trees and turquoise sea softly blurred behind them, early morning golden light, smiling and focused, sense of friendship and energy. Subjects on the right two thirds, left third calm and empty for a headline.
- **Prompt móvil:** Same scene, vertical composition, women in the lower two thirds of the frame, the upper third is soft sky and palm trees, empty for a headline.
- **Alt:** Tres mujeres de distintas edades entrenando con ligas en un parque de Cancún.

### 2. `pilar-movimiento` — Tres pilares
- **Archivo:** `pilar-movimiento.webp` (1080×1080)
- **Prompt:** A Mexican woman around 40 doing bicep curls with two 1-liter water bottles in a bright, simple living room with plants and natural light from a window, feet shoulder-width apart, confident smile.
- **Alt:** Mujer haciendo ejercicio con botellas de agua en su sala.

### 3. `pilar-nutricion` — Tres pilares
- **Archivo:** `pilar-nutricion.webp` (1080×1080)
- **Prompt:** Overhead shot of a colorful healthy Mexican plate on a rustic wooden table: grilled fish, black beans, nopales, jicama, tomato and avocado salad, papaya slices, a woman's hands serving it, fresh herbs and limes around.
- **Alt:** Plato saludable con ingredientes locales: pescado, frijoles, nopales y fruta.

### 4. `pilar-prevencion` — Tres pilares
- **Archivo:** `pilar-prevencion.webp` (1080×1080)
- **Prompt:** Two women, around 55 and 30, like mother and daughter, walking and talking on a waterfront path at sunrise, relaxed and confident, turquoise water and mangroves in the soft background.
- **Alt:** Dos mujeres caminando y conversando junto al mar al amanecer.

### 5. `taller-grupo` — Sección del taller
- **Archivo:** `taller-grupo.webp` (1600×1067, 3:2)
- **Prompt:** A group of 8 to 10 women of mixed ages on colorful exercise mats inside a shaded open-air palapa, a female instructor in front demonstrating a squat with a resistance band, participants following and smiling, tropical plants around, warm afternoon light.
- **Alt:** Grupo de mujeres en una clase del taller bajo una palapa.

### 6. `categoria-ligas` — Ejercicios en casa
- **Archivo:** `categoria-ligas.webp` (1280×720, 16:9)
- **Prompt:** Medium shot of a woman around 35 doing a resistance band pull-apart at chest height in a bright home space, turquoise band clearly visible and taut, arms extended, good posture, determined smile.
- **Alt:** Mujer haciendo ejercicio de apertura con liga de resistencia.

### 7. `categoria-botellas` — Ejercicios en casa
- **Archivo:** `categoria-botellas.webp` (1280×720)
- **Prompt:** A woman around 55 seated on a sturdy chair doing an overhead press with two water bottles, straight back, in a cozy home with natural light, cheerful expression.
- **Alt:** Mujer sentada haciendo press de hombro con botellas de agua.

### 8. `categoria-peso-corporal` — Ejercicios en casa
- **Archivo:** `categoria-peso-corporal.webp` (1280×720)
- **Prompt:** A woman around 30 doing a bodyweight squat with arms extended forward on a yoga mat at home, knees aligned over feet, neutral back, focused and smiling, side view.
- **Alt:** Mujer haciendo sentadilla con su propio peso en casa.

### 9. `categoria-movilidad` — Ejercicios en casa
- **Archivo:** `categoria-movilidad.webp` (1280×720)
- **Prompt:** A woman around 60 doing a gentle standing side stretch on a terrace with plants, eyes relaxed, calm morning light, loose comfortable clothes.
- **Alt:** Mujer mayor estirando en una terraza por la mañana.

### 10. `categoria-cardio` — Ejercicios en casa
- **Archivo:** `categoria-cardio.webp` (1280×720)
- **Prompt:** A young woman around 28 jogging along a Caribbean waterfront boardwalk at sunrise, mangroves and turquoise lagoon beside her, motion and energy, slight motion blur in the background.
- **Alt:** Mujer corriendo junto a la laguna al amanecer.

### 11. `nutricion-plato` — Nutrición y prevención
- **Archivo:** `nutricion-plato.webp` (1200×900, 4:3)
- **Prompt:** Top-down view of a single dinner plate divided naturally: half colorful vegetables, a quarter grilled chicken, a quarter brown rice, on a light sand-colored table with a glass of water and a lime.
- **Alt:** Plato con mitad de verduras, un cuarto de proteína y un cuarto de arroz integral.

### 12. `nutricion-hidratacion` — Nutrición y prevención
- **Archivo:** `nutricion-hidratacion.webp` (1200×900)
- **Prompt:** Glass pitchers and jars of water infused with cucumber, lime, mint and pineapple slices on a sunny kitchen counter, a woman's hand pouring a glass, fresh and bright.
- **Alt:** Jarras de agua natural con pepino, limón y piña.

### 13. `nutricion-revisiones` — Nutrición y prevención
- **Archivo:** `nutricion-revisiones.webp` (1200×900)
- **Prompt:** A woman around 45 at her kitchen table with a cup of coffee, writing a reminder in a paper planner next to her phone, calm and organized, soft morning light. No medical elements.
- **Alt:** Mujer anotando un recordatorio en su agenda con un café.

### 14. `registro-lateral` — Formulario de registro
- **Archivo:** `registro-lateral.webp` (1080×1350, 4:5)
- **Prompt:** A woman around 35 sitting on a yoga mat after a workout, towel on her shoulder, a resistance band and a water bottle beside her, smiling while looking at her phone, bright home setting.
- **Alt:** Mujer descansando después de entrenar y revisando su teléfono.

### 15. `biblioteca-hero` — Cabecera de la biblioteca
- **Archivo:** `biblioteca-hero.webp` (1920×640, 3:1)
- **Prompt:** Flat lay of home workout gear on a warm sand-colored background: turquoise and coral resistance bands, two plain water bottles, a rolled mat, a small towel and white sneakers, arranged at the left and right edges, center left empty.
- **Alt:** Material de ejercicio en casa: ligas, botellas de agua, tapete y tenis.

### 16. `og-image` — Vista previa al compartir (WhatsApp, Facebook)
- **Archivo:** `og-image.jpg` (1200×630, JPG, menos de 300 KB)
- **Cómo:** NO generar con IA. Componer con código: recorte de `hero-principal-desktop`, degradado turquesa (`#0E9AA7`) de izquierda a derecha al 70%, y encima en blanco con Montserrat 800: "Cancún Cero Cáncer" y debajo, en Nunito 600: "Muévete hoy, cuídate siempre".
- Registrar en el `<head>` como `og:image` y `twitter:image`.

---

## Nota final
Estas imágenes son de arranque. En cuanto haya fotos reales del taller, deben reemplazar a las generadas, empezando por `hero-principal`, `taller-grupo` y `registro-lateral`: generan más confianza y funcionan mejor en anuncios.
