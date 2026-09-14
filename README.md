# Volaganga — chollos de viajes + planificador de itinerarios

## Qué tienes ya funcionando

Una web estática (HTML/CSS/JS, sin frameworks, sin instalación) con:

- **Home** (`index.html`): tablón de chollos, buscador, grid de vuelos/hoteles con filtros, y 2 huecos de anuncios.
- **Itinerarios** (`itinerarios.html`): elige destino + nº de días y genera un plan día a día con botones "Reservar".
- **`config.js`**: el único archivo donde pones tus IDs reales (Travelpayouts, AdSense, Civitatis).
- Modal de "avísame de bajadas de precio" (de momento solo guarda en consola, ver más abajo).

Ahora mismo los datos de chollos y actividades son **de ejemplo** (`MOCK_DEALS`, `MOCK_ACTIVITIES` en `assets/js/`), para que puedas ver y probar la web ya mismo. Ábrela haciendo doble clic en `index.html`, o sirviéndola con cualquier servidor estático.

## Lo que TÚ tienes que rellenar (5 min)

Abre `config.js` y sustituye:

1. `travelpayouts.marker` → tu ID de partner de Travelpayouts.
2. `adsense.publisherId` y los `slots` → de tu panel de AdSense.
3. `civitatis.affiliateId` → cuando tengas aprobado el programa de afiliados de Civitatis.

Con eso puedes ya publicar la web (por ejemplo en GitHub Pages, Netlify o Vercel, gratis) y empezar a cobrar por AdSense.

## Lo que falta para que sea 100% automático (esto sí requiere backend)

Una web estática **no puede por sí sola**:
- Consultar precios de vuelos/hoteles en tiempo real y guardarlos.
- Detectar cuándo un precio "baja lo suficiente" para ser chollo.
- Mandar notificaciones push o emails de forma automática.

Para eso hace falta un pequeño servidor (esto es coste aparte, aunque hay opciones gratuitas para empezar):

| Pieza | Qué hace | Opción sencilla |
|---|---|---|
| Job programado (cron) | Llama cada hora a la API de Travelpayouts, compara precios, guarda "chollos" | Función programada en Vercel/Supabase/Cloudflare Workers (capa gratuita) |
| Base de datos | Guarda histórico de precios y alertas de usuarios | Supabase o Firebase (capa gratuita) |
| Notificaciones | Envía el aviso cuando hay chollo | Email con Resend/SendGrid (fácil) o push con Firebase Cloud Messaging (más trabajo) |
| Endpoint API | La web pide `/api/deals` en vez de usar `MOCK_DEALS` | Función serverless que lee de la base de datos |

**Recomendación de orden:** publica primero esta versión estática con AdSense y los enlaces de afiliado funcionando (monetización ya activa desde el día 1), y en paralelo montamos el backend de automatización como "fase 2". Si quieres, puedo ayudarte a construir esa fase 2 (te seguiré necesitando para crear las cuentas gratuitas de Supabase/Vercel y pegarme las claves).

## Conectar datos reales de Travelpayouts

Travelpayouts ofrece:
- **Widgets** (iframe con buscador de vuelos/hoteles ya con tu marker) — la opción más rápida, cero backend.
- **API de datos de precios** (`api.travelpayouts.com`) — para construir tú el algoritmo de "chollo", requiere el backend descrito arriba.

En `assets/js/deals.js`, la función `getDeals()` es el único sitio que hay que tocar: hoy devuelve `MOCK_DEALS`, mañana hará `fetch('/api/deals')`.

## Conectar Civitatis

En `assets/js/itinerary.js`, `getActivitiesForDestination()` es el punto a sustituir por una llamada real a Civitatis. Los enlaces de reserva ya están generados correctamente vía `buildCivitatisLink()` en `config.js` — solo falta rellenar tu `affiliateId` cuando Civitatis te lo dé.

## Aviso legal importante

Antes de publicar, añade una página de Aviso Legal / Política de Privacidad y un texto de "esta web contiene enlaces de afiliado" — es obligatorio (LSSI/RGPD en España) cuando monetizas con afiliación y AdSense, y AdSense también lo exige en sus políticas.

---

## FASE 2 — Barrido automático de precios y notificaciones

Esto añade lo que faltaba: detección automática de chollos (comparando cada precio con la media histórica de esa ruta) y avisos automáticos por email y por notificación push, sin que tengas que hacer nada manualmente día a día.

### Cómo funciona

1. **Cada 4 horas**, un robot (GitHub Actions, gratis) pregunta a Travelpayouts el precio más barato de cada ruta vigilada y lo guarda en una base de datos (Supabase, gratis).
2. Compara ese precio con la **media de los últimos 90 días** de esa misma ruta. Si está un 30% o más por debajo, lo marca como "chollo".
3. **Una vez al día**, otro robot revisa los chollos nuevos y manda: un email a quien se haya suscrito por correo, y una notificación push a quien la haya activado en el navegador.
4. La web (`index.html`) ahora intenta leer los chollos reales de la base de datos; si todavía no la has configurado, sigue mostrando los de ejemplo para que nunca se vea vacía.

### Cuentas que necesitas crear (todas tienen capa gratuita)

| Servicio | Para qué | Dónde |
|---|---|---|
| Supabase | Base de datos de precios/chollos/suscriptores | supabase.com |
| Resend | Enviar los emails de aviso | resend.com |
| (Ya tienes) Travelpayouts | Consultar precios | — |

### Pasos para activarlo

1. **Crear el proyecto en Supabase** → New project → cuando esté listo, ve a "SQL Editor" → pega todo el contenido de `backend/schema.sql` → Run. Esto crea las tablas y mete 4 rutas de ejemplo.
2. **Copiar tus claves de Supabase**: en "Project Settings → API" verás:
   - `Project URL` y `anon public key` → pégalos en `config.js` (`supabase.url` y `supabase.anonKey`). Esta clave es segura de exponer en el navegador, está diseñada para ello y las políticas de seguridad (RLS) ya están limitadas a solo lectura de chollos + inserción de suscripciones.
   - `service_role key` → **NUNCA la pongas en config.js ni la subas al repositorio**. Es secreta y solo se usa en el backend (paso 4).
3. **Crear cuenta en Resend** → Verifica un dominio o usa su dominio de pruebas → copia tu `API key`.
4. **Generar las claves VAPID (para las notificaciones push)**, ejecuta esto una sola vez en tu ordenador (necesitas Node.js instalado):
   ```
   npx web-push generate-vapid-keys
   ```
   Te da una clave pública y una privada. La pública va en `config.js` (`push.vapidPublicKey`); ambas también como secreto en GitHub (paso 5).
5. **Añadir los "Secrets" en GitHub**: en tu repositorio → Settings → Secrets and variables → Actions → New repository secret. Crea uno por cada uno de estos:
   - `TRAVELPAYOUTS_TOKEN` (tu token de API, distinto del marker — está en Travelpayouts > Herramientas > API)
   - `TRAVELPAYOUTS_MARKER` → `776663`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `RESEND_API_KEY`
   - `FROM_EMAIL` (ej: `chollos@tudominio.com`, verificado en Resend)
   - `VAPID_PUBLIC_KEY`
   - `VAPID_PRIVATE_KEY`
6. **Subir esta carpeta actualizada a GitHub** (sustituye todo lo que ya tenías). Los workflows están en `.github/workflows/` y arrancarán solos según su horario, pero puedes lanzarlos ya a mano: pestaña "Actions" → elige "Barrido de precios" → "Run workflow".
7. Espera a que el barrido corra unas cuantas veces (necesita al menos 3 lecturas de precio por ruta para poder calcular una media fiable) y a partir de ahí empezará a detectar chollos solo.

### Notas importantes

- **RGPD / anti-spam**: antes de mandar emails a producción real, te recomiendo activar "doble opt-in" (mandar un email de confirmación antes de dar por válida la suscripción) — de momento el formulario da el alta directa (`confirmed: true`) para que puedas probarlo rápido.
- **Ajusta las rutas vigiladas** editando la tabla `routes` desde el propio panel de Supabase (Table editor), sin tocar código.
- **Ajusta el umbral de "chollo"** (30% por defecto) en `backend/sweep-prices.js`, constante `DISCOUNT_THRESHOLD_PCT`.
- El plan gratuito de GitHub Actions incluye 2.000 minutos/mes, de sobra para este uso.

## Estructura de archivos

```
volaganga/
├── index.html
├── itinerarios.html
├── config.js                    ← tus IDs y claves públicas van aquí
├── sw.js                        ← service worker (notificaciones push)
├── assets/
│   ├── css/style.css
│   └── js/
│       ├── deals.js             ← chollos: lee Supabase o usa ejemplo
│       ├── itinerary.js         ← planificador + enlaces Civitatis
│       └── subscribe.js         ← alta por email y por push
├── backend/
│   ├── schema.sql                ← estructura de la base de datos
│   ├── sweep-prices.js           ← barrido automático (Travelpayouts)
│   ├── send-daily-emails.js      ← email diario de chollos
│   ├── send-push.js              ← notificaciones push diarias
│   └── package.json
└── .github/workflows/
    ├── sweep.yml                 ← ejecuta el barrido cada 4h
    └── daily-digest.yml          ← ejecuta los avisos 1 vez al día
```
