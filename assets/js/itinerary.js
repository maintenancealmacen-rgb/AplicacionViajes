/**
 * ITINERARY.JS
 * ------------------------------------------------------------
 * Genera un itinerario día a día para un destino con actividades
 * de EJEMPLO. Cuando quieras datos reales, sustituye
 * `getActivitiesForDestination()` por una llamada a la API de
 * búsqueda de actividades de Civitatis (o a tu propia base de
 * datos curada). Ver README.md.
 * ------------------------------------------------------------
 */

// Actividades de ejemplo por destino. La clave debe coincidir con
// el "slug" que usa Civitatis en sus URLs (ej: civitatis.com/es/roma/)
// Cada actividad lleva "tags": los gustos a los que encaja, para poder
// filtrar/priorizar el itinerario según lo que elija la persona.
// Gustos disponibles: historia, pareja, aire-libre, museos, gastronomia, noche
const MOCK_ACTIVITIES = {
  roma: [
    { time: "09:00", name: "Free tour por el centro histórico", cat: "Cultura · Gratis + propina", tags: ["historia"] },
    { time: "10:00", name: "Coliseo y Foro Romano sin colas", cat: "Monumentos · 3h", tags: ["historia"] },
    { time: "11:00", name: "Museos Vaticanos y Capilla Sixtina", cat: "Arte · 3h", tags: ["museos"] },
    { time: "12:00", name: "Galería Borghese, visita guiada", cat: "Arte · 2h", tags: ["museos"] },
    { time: "16:00", name: "Clase de pasta en pareja con un chef local", cat: "Gastronomía · 2h30", tags: ["gastronomia", "pareja"] },
    { time: "17:00", name: "Paseo en bici por la Via Appia Antica", cat: "Aire libre · 3h", tags: ["aire-libre"] },
    { time: "19:00", name: "Cena romántica con vistas al Foro", cat: "Gastronomía · 2h", tags: ["pareja", "gastronomia"] },
    { time: "20:00", name: "Tour nocturno por Trastevere", cat: "Cultura · 2h", tags: ["noche", "historia"] },
    { time: "21:00", name: "Bar de vinos y música en vivo", cat: "Vida nocturna · 2h", tags: ["noche"] },
  ],
  paris: [
    { time: "09:30", name: "Torre Eiffel: acceso a cima", cat: "Monumentos · 2h", tags: ["historia"] },
    { time: "10:30", name: "Museo del Louvre, visita guiada", cat: "Arte · 2h30", tags: ["museos"] },
    { time: "11:30", name: "Museo d'Orsay, impresionistas", cat: "Arte · 2h", tags: ["museos"] },
    { time: "13:00", name: "Crucero romántico por el Sena al atardecer", cat: "Panorámico · 1h", tags: ["pareja", "aire-libre"] },
    { time: "15:00", name: "Picnic y paseo por Montmartre", cat: "Aire libre · 2h", tags: ["aire-libre", "pareja"] },
    { time: "17:00", name: "Tour histórico por el Barrio Latino", cat: "Cultura · 2h", tags: ["historia"] },
    { time: "19:00", name: "Cena en un bistró con menú degustación", cat: "Gastronomía · 2h", tags: ["gastronomia", "pareja"] },
    { time: "20:00", name: "Cabaret con cena incluida", cat: "Espectáculo · 3h", tags: ["noche"] },
    { time: "22:00", name: "Ruta de bares de cócteles en Le Marais", cat: "Vida nocturna · 2h", tags: ["noche"] },
  ],
  lisboa: [
    { time: "10:00", name: "Free tour por Alfama", cat: "Cultura · Gratis + propina", tags: ["historia"] },
    { time: "10:30", name: "Museo del Azulejo", cat: "Arte · 1h30", tags: ["museos"] },
    { time: "13:00", name: "Ruta de pastéis de nata y miradores", cat: "Gastronomía · 2h", tags: ["gastronomia"] },
    { time: "14:00", name: "Paseo en tuk-tuk por los miradores al atardecer", cat: "Aire libre · 2h", tags: ["pareja", "aire-libre"] },
    { time: "16:00", name: "Excursión a Sintra y Cascais", cat: "Escapada · 8h", tags: ["aire-libre", "historia"] },
    { time: "19:00", name: "Cena con vino y vistas al Tajo", cat: "Gastronomía · 2h", tags: ["gastronomia", "pareja"] },
    { time: "21:00", name: "Cena con espectáculo de fado", cat: "Espectáculo · 2h", tags: ["noche", "pareja"] },
    { time: "22:30", name: "Bares del Bairro Alto", cat: "Vida nocturna · 2h", tags: ["noche"] },
  ],
  marrakech: [
    { time: "09:00", name: "Zocos y plaza Jemaa el-Fna guiado", cat: "Cultura · 3h", tags: ["historia"] },
    { time: "11:00", name: "Museo de Marrakech y Medersa Ben Youssef", cat: "Arte · 2h", tags: ["museos"] },
    { time: "14:00", name: "Jardines Majorelle en pareja", cat: "Naturaleza · 1h30", tags: ["aire-libre", "pareja"] },
    { time: "16:00", name: "Sesión de hammam y spa para dos", cat: "Bienestar · 2h", tags: ["pareja"] },
    { time: "17:00", name: "Excursión al desierto de Agafay en quad", cat: "Aventura · 5h", tags: ["aire-libre"] },
    { time: "19:00", name: "Clase de cocina marroquí", cat: "Gastronomía · 2h30", tags: ["gastronomia"] },
    { time: "20:30", name: "Cena tradicional con música en vivo", cat: "Gastronomía · 2h", tags: ["gastronomia", "noche"] },
    { time: "22:00", name: "Terraza con vistas y té a la menta", cat: "Vida nocturna · 1h30", tags: ["noche", "pareja"] },
  ],
  napoles: [
    { time: "09:00", name: "Pompeya con guía oficial", cat: "Historia · 4h", tags: ["historia"] },
    { time: "10:00", name: "Museo Arqueológico Nacional", cat: "Arte · 2h", tags: ["museos"] },
    { time: "14:30", name: "Costa Amalfitana en barco privado", cat: "Panorámico · 4h", tags: ["aire-libre", "pareja"] },
    { time: "16:00", name: "Senderismo por el Sendero de los Dioses", cat: "Aire libre · 3h", tags: ["aire-libre"] },
    { time: "19:00", name: "Cena romántica frente al golfo de Nápoles", cat: "Gastronomía · 2h", tags: ["gastronomia", "pareja"] },
    { time: "19:30", name: "Clase de pizza napolitana", cat: "Gastronomía · 2h", tags: ["gastronomia"] },
    { time: "21:00", name: "Bares del centro histórico", cat: "Vida nocturna · 2h", tags: ["noche"] },
  ],
};

const TASTE_LABELS = {
  historia: "Histórico",
  pareja: "En pareja",
  "aire-libre": "Aire libre",
  museos: "Museos",
  gastronomia: "Gastronomía",
  noche: "Vida nocturna",
};

function slugify(text) {
  return text
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

async function getActivitiesForDestination(destino) {
  const slug = slugify(destino);
  return { slug, activities: MOCK_ACTIVITIES[slug] || [] };
}

function activityRowHTML(activity, destSlug) {
  const link = buildCivitatisLink(destSlug);
  return `
    <div class="activity-row">
      <span class="time">${activity.time}</span>
      <span>
        <div class="name">${activity.name}</div>
        <div class="cat">${activity.cat}</div>
      </span>
      <a class="activity-cta" href="${link}" target="_blank" rel="noopener sponsored"
         onclick="trackActivityClick('${activity.name}')">
        Reservar
      </a>
    </div>
  `;
}

function trackActivityClick(name) {
  console.log("[analytics] click en actividad:", name);
}

function distributeAcrossDays(activities, numDays, selectedTags) {
  // Si hay gustos seleccionados, ordena las actividades poniendo primero
  // las que coincidan con más gustos elegidos (sin descartar el resto,
  // por si no hay suficientes para llenar todos los días).
  let ordered = activities;
  if (selectedTags && selectedTags.length) {
    const score = (a) => (a.tags || []).filter(t => selectedTags.includes(t)).length;
    ordered = [...activities].sort((a, b) => score(b) - score(a));
  }

  const days = [];
  for (let d = 0; d < numDays; d++) {
    days.push(ordered.length ? [ordered[d % ordered.length]] : []);
  }
  return days;
}

function getSelectedTags() {
  return [...document.querySelectorAll(".taste-chip.active")].map(el => el.dataset.tag);
}

async function buildItinerary() {
  const destino = document.getElementById("itDestino").value.trim();
  const numDays = parseInt(document.getElementById("itDias").value, 10) || 1;
  const selectedTags = getSelectedTags();
  const resultBox = document.getElementById("itineraryResult");

  if (!destino) {
    resultBox.innerHTML = `<div class="empty-state">Escribe un destino para generar el plan.</div>`;
    return;
  }

  const { slug, activities } = await getActivitiesForDestination(destino);

  if (!activities.length) {
    resultBox.innerHTML = `<div class="empty-state">
      Todavía no tenemos actividades cargadas para "${destino}".
      Prueba con Roma, París, Lisboa, Nápoles o Marrakech (datos de ejemplo),
      o conecta la búsqueda en vivo de Civitatis — ver README.
    </div>`;
    return;
  }

  const days = distributeAcrossDays(activities, numDays, selectedTags);
  const tagsNote = selectedTags.length
    ? `<p style="color:var(--text-muted);font-size:0.85rem;margin-bottom:16px;">
        Priorizando: ${selectedTags.map(t => TASTE_LABELS[t]).join(", ")}
      </p>`
    : "";

  resultBox.innerHTML = tagsNote + days.map((dayActivities, i) => `
    <div class="day-block">
      <h3>Día ${i + 1}</h3>
      ${dayActivities.map(a => activityRowHTML(a, slug)).join("")}
    </div>
  `).join("");
}

function setupTasteChips() {
  document.querySelectorAll(".taste-chip").forEach(chip => {
    chip.addEventListener("click", () => chip.classList.toggle("active"));
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("itineraryForm");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      buildItinerary();
    });
  }
  setupTasteChips();
});
