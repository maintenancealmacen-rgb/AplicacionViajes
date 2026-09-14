/**
 * SUBSCRIBE.JS
 * ------------------------------------------------------------
 * Gestiona las dos formas de recibir chollos:
 *  A) Email: guarda el correo en la tabla `subscribers` de Supabase.
 *  B) Push: pide permiso al navegador, registra el service worker
 *     y guarda la suscripción en `push_subscriptions`.
 * Ambas requieren que config.js tenga rellenos supabase.url/anonKey
 * (y push.vapidPublicKey para la B). Si no están, se avisa al
 * usuario en vez de fallar en silencio.
 * ------------------------------------------------------------
 */

function supabaseConfigured() {
  return SITE_CONFIG.supabase.url && !SITE_CONFIG.supabase.url.startsWith("TU_");
}

async function subscribeByEmail(email, preferredOrigin, minDiscount) {
  const { url, anonKey } = SITE_CONFIG.supabase;
  const res = await fetch(`${url}/rest/v1/subscribers`, {
    method: "POST",
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      email,
      preferred_origin: preferredOrigin || null,
      min_discount_pct: minDiscount || 30,
      confirmed: true, // Nota: para producción real, considera doble
                        // opt-in (enviar un email de confirmación) para
                        // cumplir mejores prácticas de RGPD/anti-spam.
    }),
  });
  if (!res.ok) {
    const msg = await res.text();
    if (msg.includes("duplicate")) throw new Error("Ese correo ya estaba suscrito.");
    throw new Error("No se pudo guardar la suscripción.");
  }
}

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
}

async function subscribeToPush(minDiscount) {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    throw new Error("Tu navegador no admite notificaciones push.");
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error("No has dado permiso para las notificaciones.");
  }

  const registration = await navigator.serviceWorker.register("sw.js");
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(SITE_CONFIG.push.vapidPublicKey),
  });

  const { url, anonKey } = SITE_CONFIG.supabase;
  const json = subscription.toJSON();
  const res = await fetch(`${url}/rest/v1/push_subscriptions`, {
    method: "POST",
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      endpoint: json.endpoint,
      p256dh: json.keys.p256dh,
      auth: json.keys.auth,
      min_discount_pct: minDiscount || 30,
    }),
  });
  if (!res.ok) throw new Error("No se pudo registrar la notificación push.");
}
