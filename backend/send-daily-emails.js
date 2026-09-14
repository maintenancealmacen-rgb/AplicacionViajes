/**
 * SEND-DAILY-EMAILS.JS
 * ------------------------------------------------------------
 * Se ejecuta una vez al día (ver .github/workflows/daily-digest.yml).
 * Busca los chollos detectados en las últimas 24h y se los manda
 * por email a cada suscriptor cuyo umbral de descuento se cumpla,
 * evitando mandar el mismo chollo dos veces (tabla notifications_sent).
 *
 * Usa Resend (https://resend.com) para el envío — tiene capa
 * gratuita (100 emails/día) y es más simple de configurar que
 * SMTP tradicional. Si prefieres SendGrid/Mailgun, solo hay que
 * cambiar la función `sendEmail()`.
 *
 * Variables de entorno necesarias:
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   RESEND_API_KEY
 *   FROM_EMAIL   (ej: "chollos@tu-dominio.com", debe estar verificado en Resend)
 * ------------------------------------------------------------
 */

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function sendEmail(to, subject, html) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.FROM_EMAIL,
      to,
      subject,
      html,
    }),
  });
  if (!res.ok) {
    console.error(`Error enviando a ${to}:`, await res.text());
    return false;
  }
  return true;
}

function dealsToHtml(deals) {
  const rows = deals.map(d => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #eee;">
        <strong>${d.routes.label}</strong><br>
        <span style="color:#5B6B70;font-size:13px;">
          ${d.depart_date || ""} ${d.return_date ? "→ " + d.return_date : ""}
        </span>
      </td>
      <td style="padding:10px 0;border-bottom:1px solid #eee;text-align:right;">
        <span style="color:#1F7A6C;font-weight:600;">-${d.discount_pct}%</span><br>
        <strong>${d.price} €</strong>
      </td>
      <td style="padding:10px 0;border-bottom:1px solid #eee;text-align:right;">
        <a href="${d.affiliate_url}" style="background:#10243B;color:#fff;text-decoration:none;padding:8px 14px;border-radius:4px;font-size:13px;">Ver</a>
      </td>
    </tr>
  `).join("");

  return `
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;">
      <h2 style="font-family:Arial,sans-serif;">Tus chollos de hoy ✈️</h2>
      <table style="width:100%;border-collapse:collapse;">${rows}</table>
      <p style="color:#5B6B70;font-size:12px;margin-top:24px;">
        Recibes esto porque te suscribiste en Volaganga.
      </p>
    </div>
  `;
}

async function main() {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data: deals, error } = await supabase
    .from("deals")
    .select("*, routes(label)")
    .eq("is_active", true)
    .gte("detected_at", since);

  if (error) {
    console.error("Error leyendo chollos:", error);
    process.exit(1);
  }

  if (!deals.length) {
    console.log("No hay chollos nuevos hoy, no se envía nada.");
    return;
  }

  const { data: subscribers, error: subError } = await supabase
    .from("subscribers")
    .select("*")
    .eq("confirmed", true);

  if (subError) {
    console.error("Error leyendo suscriptores:", subError);
    process.exit(1);
  }

  for (const sub of subscribers) {
    const matching = deals.filter(d => d.discount_pct >= (sub.min_discount_pct || 30));
    if (!matching.length) continue;

    // Filtrar los que ya se le enviaron (por si el script se relanza)
    const toSend = [];
    for (const deal of matching) {
      const { data: already } = await supabase
        .from("notifications_sent")
        .select("id")
        .eq("deal_id", deal.id)
        .eq("channel", "email")
        .eq("recipient", sub.email)
        .maybeSingle();
      if (!already) toSend.push(deal);
    }

    if (!toSend.length) continue;

    const ok = await sendEmail(
      sub.email,
      `${toSend.length} chollo${toSend.length > 1 ? "s" : ""} de viaje para ti`,
      dealsToHtml(toSend)
    );

    if (ok) {
      const rows = toSend.map(d => ({
        deal_id: d.id,
        channel: "email",
        recipient: sub.email,
      }));
      await supabase.from("notifications_sent").insert(rows);
      console.log(`Enviado a ${sub.email}: ${toSend.length} chollo(s)`);
    }
  }
}

main();
