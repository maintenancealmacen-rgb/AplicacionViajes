/**
 * SEND-PUSH.JS
 * ------------------------------------------------------------
 * Manda una notificación push del navegador por cada chollo nuevo
 * a quienes hayan activado "Notificaciones push" en la web.
 * Usa el estándar Web Push (funciona en Chrome, Edge, Firefox;
 * en iOS Safari requiere que el usuario "añada a pantalla de
 * inicio" primero, limitación de Apple, no nuestra).
 *
 * Necesitas un par de claves VAPID (se generan una sola vez,
 * gratis, ver README) y guardarlas como secrets:
 *   VAPID_PUBLIC_KEY
 *   VAPID_PRIVATE_KEY
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 * ------------------------------------------------------------
 */

import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

webpush.setVapidDetails(
  "mailto:contacto@volaganga.com",
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

async function main() {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data: deals, error } = await supabase
    .from("deals")
    .select("*, routes(label)")
    .eq("is_active", true)
    .gte("detected_at", since);

  if (error || !deals?.length) {
    console.log("Sin chollos nuevos para notificar por push.");
    return;
  }

  const { data: subs, error: subError } = await supabase
    .from("push_subscriptions")
    .select("*");

  if (subError || !subs?.length) {
    console.log("Sin suscriptores push todavía.");
    return;
  }

  for (const sub of subs) {
    const matching = deals.filter(d => d.discount_pct >= (sub.min_discount_pct || 30));
    if (!matching.length) continue;

    const best = matching.sort((a, b) => b.discount_pct - a.discount_pct)[0];

    const payload = JSON.stringify({
      title: `Chollo: ${best.routes.label}`,
      body: `${best.price} € (-${best.discount_pct}%). Toca para verlo.`,
      url: best.affiliate_url,
    });

    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload
      );
      console.log(`Push enviado a ${sub.endpoint.slice(0, 40)}...`);
    } catch (err) {
      console.error("Error enviando push (puede que la suscripción haya caducado):", err.message);
      if (err.statusCode === 410 || err.statusCode === 404) {
        // La suscripción ya no existe en el navegador del usuario: la limpiamos.
        await supabase.from("push_subscriptions").delete().eq("id", sub.id);
      }
    }
  }
}

main();
