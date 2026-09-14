/**
 * SWEEP-PRICES.JS
 * ------------------------------------------------------------
 * Este script lo ejecuta GitHub Actions cada X horas (ver
 * .github/workflows/sweep.yml). Para cada ruta activa en la
 * tabla `routes`:
 *   1. Pregunta a Travelpayouts los precios más baratos.
 *   2. Los guarda en `price_history`.
 *   3. Calcula la media de los últimos 90 días para esa ruta
 *      (= "precio de mercado").
 *   4. Si el precio actual es un X% más barato que esa media,
 *      lo guarda como "chollo" en la tabla `deals`.
 *
 * Variables de entorno necesarias (se configuran como "Secrets"
 * en GitHub, ver README):
 *   TRAVELPAYOUTS_TOKEN
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY   (¡la secreta, no la anon!)
 * ------------------------------------------------------------
 */

import { createClient } from "@supabase/supabase-js";

const TP_TOKEN = process.env.TRAVELPAYOUTS_TOKEN;
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Umbral de descuento para considerar algo "chollo".
// Se puede ajustar por ruta en el futuro; de momento es global.
const DISCOUNT_THRESHOLD_PCT = 30;

// Cuántos días hacia atrás usamos para calcular el "precio de mercado"
const MARKET_WINDOW_DAYS = 90;

async function fetchCheapestPrice(origin, destination) {
  // Documentación: https://travelpayouts.github.io/slate/#flight-tickets-for-specific-dates
  const url = new URL("https://api.travelpayouts.com/aviasales/v3/prices_for_dates");
  url.searchParams.set("origin", origin);
  url.searchParams.set("destination", destination);
  url.searchParams.set("currency", "eur");
  url.searchParams.set("sorting", "price");
  url.searchParams.set("limit", "1");
  url.searchParams.set("one_way", "false");
  url.searchParams.set("token", TP_TOKEN);

  const res = await fetch(url, {
    headers: { "Accept-Encoding": "gzip, deflate" },
  });

  if (!res.ok) {
    console.error(`Travelpayouts respondió ${res.status} para ${origin}-${destination}`);
    return null;
  }

  const json = await res.json();
  const best = json?.data?.[0];
  if (!best) return null;

  return {
    price: best.price,
    depart_date: best.departure_at ? best.departure_at.slice(0, 10) : null,
    return_date: best.return_at ? best.return_at.slice(0, 10) : null,
  };
}

async function marketAverage(routeId, excludeBelow) {
  const since = new Date();
  since.setDate(since.getDate() - MARKET_WINDOW_DAYS);

  const { data, error } = await supabase
    .from("price_history")
    .select("price")
    .eq("route_id", routeId)
    .gte("found_at", since.toISOString());

  if (error || !data || data.length < 3) {
    // Sin histórico suficiente todavía: no podemos calcular un chollo fiable
    return null;
  }

  const avg = data.reduce((sum, r) => sum + Number(r.price), 0) / data.length;
  return avg;
}

function buildAffiliateUrl(marker, origin, destination, departDate, returnDate) {
  // Enlace de búsqueda de Aviasales con tu marker de afiliado.
  const base = `https://www.aviasales.com/search/${origin}${departDate?.replace(/-/g, "").slice(2) || ""}${destination}`;
  return `${base}?marker=${marker}`;
}

async function sweepRoute(route) {
  const result = await fetchCheapestPrice(route.origin, route.destination);
  if (!result) {
    console.log(`Sin datos para ${route.label}`);
    return;
  }

  // 1. Guardar en el histórico
  await supabase.from("price_history").insert({
    route_id: route.id,
    price: result.price,
    depart_date: result.depart_date,
    return_date: result.return_date,
  });

  // 2. Calcular precio de mercado
  const avg = await marketAverage(route.id);
  if (avg === null) {
    console.log(`Histórico insuficiente aún para ${route.label}, no se evalúa chollo`);
    return;
  }

  const discountPct = Math.round(100 - (result.price / avg) * 100);
  console.log(`${route.label}: ${result.price}€ vs media ${avg.toFixed(0)}€ (${discountPct}% dto.)`);

  if (discountPct >= DISCOUNT_THRESHOLD_PCT) {
    await supabase.from("deals").insert({
      route_id: route.id,
      price: result.price,
      market_price: avg,
      discount_pct: discountPct,
      depart_date: result.depart_date,
      return_date: result.return_date,
      affiliate_url: buildAffiliateUrl(
        process.env.TRAVELPAYOUTS_MARKER,
        route.origin,
        route.destination,
        result.depart_date,
        result.return_date
      ),
    });
    console.log(`  → ¡Chollo guardado!`);
  }
}

async function main() {
  const { data: routes, error } = await supabase
    .from("routes")
    .select("*")
    .eq("active", true);

  if (error) {
    console.error("Error leyendo rutas:", error);
    process.exit(1);
  }

  for (const route of routes) {
    try {
      await sweepRoute(route);
    } catch (err) {
      console.error(`Error en ruta ${route.label}:`, err.message);
    }
  }
}

main();
