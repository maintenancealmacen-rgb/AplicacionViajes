/**
 * DEALS.JS
 * ------------------------------------------------------------
 * De momento usa datos de EJEMPLO (MOCK_DEALS) para que puedas
 * ver la web funcionando ya. Cuando tengas backend, sustituye
 * `getDeals()` por una llamada fetch() a tu propio endpoint,
 * que a su vez llame a la API de Travelpayouts. Ver README.md
 * sección "Conectar datos reales".
 * ------------------------------------------------------------
 */

const MOCK_DEALS = [
  {
    id: "vuelo-roma",
    type: "vuelo",
    title: "Madrid → Roma",
    meta: "Vuelta · 15-19 nov · Vueling",
    img: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=600",
    price: 39,
    was: 112,
    destSlug: "roma",
    // Enlace real: Travelpayouts genera esto dinámicamente vía su widget/API
    affiliateUrl: "#",
  },
  {
    id: "vuelo-lisboa",
    type: "vuelo",
    title: "Barcelona → Lisboa",
    meta: "Ida y vuelta · 3-6 oct · Ryanair",
    img: "https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=600",
    price: 27,
    was: 68,
    destSlug: "lisboa",
    affiliateUrl: "#",
  },
  {
    id: "hotel-paris",
    type: "hotel",
    title: "Hotel Le Marais, París",
    meta: "3 noches · 2 adultos · Desayuno incl.",
    img: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600",
    price: 189,
    was: 340,
    destSlug: "paris",
    affiliateUrl: "#",
  },
  {
    id: "vuelo-napoles",
    type: "vuelo",
    title: "Valencia → Nápoles",
    meta: "Ida y vuelta · 20-24 oct · Volotea",
    img: "https://images.unsplash.com/photo-1533104816931-20fa691ff6ca?w=600",
    price: 31,
    was: 79,
    destSlug: "napoles",
    affiliateUrl: "#",
  },
  {
    id: "hotel-lisboa",
    type: "hotel",
    title: "Boutique Alfama, Lisboa",
    meta: "4 noches · 2 adultos",
    img: "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=600",
    price: 156,
    was: 260,
    destSlug: "lisboa",
    affiliateUrl: "#",
  },
  {
    id: "vuelo-marrakech",
    type: "vuelo",
    title: "Málaga → Marrakech",
    meta: "Ida y vuelta · 8-12 dic · Ryanair",
    img: "https://images.unsplash.com/photo-1489749798305-4fea3ae63d43?w=600",
    price: 45,
    was: 120,
    destSlug: "marrakech",
    affiliateUrl: "#",
  },
];

// Devuelve los chollos reales desde Supabase si ya está configurado
// (backend/schema.sql + config.js rellenos). Si no, usa los de ejemplo
// para que la web nunca se quede vacía mientras montas la Fase 2.
async function getDeals() {
  const { url, anonKey } = SITE_CONFIG.supabase;
  if (!url || url.startsWith("TU_")) return MOCK_DEALS;

  try {
    const res = await fetch(
      `${url}/rest/v1/deals?is_active=eq.true&select=*,routes(label)&order=discount_pct.desc&limit=24`,
      { headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` } }
    );
    if (!res.ok) throw new Error(`Supabase respondió ${res.status}`);
    const rows = await res.json();
    if (!rows.length) return MOCK_DEALS;

    return rows.map(r => ({
      id: String(r.id),
      type: "vuelo",
      title: r.routes?.label || "Destino",
      meta: [r.depart_date, r.return_date].filter(Boolean).join(" → "),
      img: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=600",
      price: Number(r.price),
      was: Number(r.market_price),
      affiliateUrl: r.affiliate_url || "#",
    }));
  } catch (err) {
    console.warn("No se pudo leer Supabase, usando datos de ejemplo:", err.message);
    return MOCK_DEALS;
  }
}

function discountPct(price, was) {
  return Math.round(100 - (price / was) * 100);
}

function dealCardHTML(deal) {
  const pct = discountPct(deal.price, deal.was);
  return `
    <article class="deal-card" data-type="${deal.type}">
      <div class="deal-img" style="background-image:url('${deal.img}')">
        <span class="deal-badge">-${pct}%</span>
      </div>
      <div class="deal-body">
        <h3>${deal.title}</h3>
        <div class="deal-meta">${deal.meta}</div>
        <div class="deal-price-row">
          <div class="deal-price">
            <span class="was">${deal.was} €</span>
            ${deal.price} €
          </div>
          <div class="deal-save">Ahorras ${deal.was - deal.price} €</div>
        </div>
        <a class="deal-cta" href="${deal.affiliateUrl}" target="_blank" rel="noopener sponsored"
           onclick="trackDealClick('${deal.id}')">
          Ver oferta
        </a>
      </div>
    </article>
  `;
}

function trackDealClick(dealId) {
  // Punto de enganche para analítica propia (GA4, Plausible, etc.)
  // antes de redirigir al enlace de afiliado.
  console.log("[analytics] click en chollo:", dealId);
}

async function renderDeals(filter = "todos") {
  const grid = document.getElementById("dealGrid");
  if (!grid) return;
  const deals = await getDeals();
  const filtered = filter === "todos" ? deals : deals.filter(d => d.type === filter);
  grid.innerHTML = filtered.map(dealCardHTML).join("");
}

function setupFilters() {
  const chips = document.querySelectorAll(".filter-chip");
  chips.forEach(chip => {
    chip.addEventListener("click", () => {
      chips.forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      renderDeals(chip.dataset.filter);
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  renderDeals();
  setupFilters();
});
