/**
 * CONFIGURACIÓN DE MONETIZACIÓN
 * ------------------------------------------------------------
 * Este es el ÚNICO archivo que necesitas editar para conectar
 * tus cuentas de afiliado. Sustituye los valores de ejemplo
 * por los tuyos reales.
 * ------------------------------------------------------------
 */

const SITE_CONFIG = {

  // 1) TRAVELPAYOUTS -------------------------------------------------
  // Tu "marker" (partner ID) de Travelpayouts. Lo encuentras en:
  // Travelpayouts > Herramientas > Panel de afiliado > tu ID de partner.
  travelpayouts: {
    marker: "776663",
    // Host que te asigna Travelpayouts para los widgets de vuelos/hoteles
    // (aparece en el código de "Widgets" de tu panel, cambia según el
    // widget que crees). Pendiente de rellenar cuando crees tu primer widget.
    host: "TU_HOST_TRAVELPAYOUTS", // ej: "search.tp.st"
  },

  // 2) GOOGLE ADSENSE --------------------------------------------------
  // Tu Publisher ID (empieza por "ca-pub-").
  adsense: {
    publisherId: "ca-pub-3634325920891467",
    // IDs de cada bloque de anuncio que crees en tu panel de AdSense.
    slots: {
      header: "0000000000",
      inFeed: "0000000000",
      sidebar: "0000000000",
    },
  },

  // 3) SUPABASE (base de datos de chollos y suscriptores) ---------------
  // Se rellena en la Fase 2. Ver backend/README para crear el proyecto.
  // La "anon key" es pública por diseño (solo permite leer chollos y
  // suscribirse); la clave secreta NUNCA va aquí, solo en GitHub Secrets.
  supabase: {
    url: "TU_SUPABASE_URL", // ej: "https://xxxx.supabase.co"
    anonKey: "TU_SUPABASE_ANON_KEY",
  },

  // 4) NOTIFICACIONES PUSH (Web Push / VAPID) ----------------------------
  // Clave pública generada junto a la privada (ver backend/README).
  push: {
    vapidPublicKey: "BD6-3v3MoGyMq143s8PLCz3kEz7idnNnug5L9RUgntuLWX8VgauTSOtjacEFdDCUx4EPnjzk9hMuc6Cfs8xUebY",
  },

  // 5) CIVITATIS ---------------------------------------------------------
  // Tu ID de afiliado de Civitatis (te lo dan al aceptar el programa
  // de afiliados en https://www.civitatis.com/afiliados/).
  civitatis: {
    affiliateId: "TU_ID_CIVITATIS",
    // Civitatis genera enlaces con este formato:
    // https://www.civitatis.com/es/{destino}/?aid=TU_ID_CIVITATIS
    baseUrl: "https://www.civitatis.com/es",
  },
};

// Genera un enlace de actividad de Civitatis para un destino dado
function buildCivitatisLink(destinoSlug) {
  const { baseUrl, affiliateId } = SITE_CONFIG.civitatis;
  return `${baseUrl}/${destinoSlug}/?aid=${affiliateId}`;
}
