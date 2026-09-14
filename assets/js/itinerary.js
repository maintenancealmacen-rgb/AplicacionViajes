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
const MOCK_ACTIVITIES = {
  roma: [
    { time: "09:00", name: "Free tour por el centro histórico", cat: "Cultura · Gratis + propina" },
    { time: "12:30", name: "Coliseo y Foro Romano sin colas", cat: "Monumentos · 3h" },
    { time: "16:00", name: "Clase de pasta con un chef local", cat: "Gastronomía · 2h30" },
    { time: "20:00", name: "Tour nocturno por Trastevere", cat: "Cultura · 2h" },
  ],
  paris: [
    { time: "09:30", name: "Torre Eiffel: acceso a cima", cat: "Monumentos · 2h" },
    { time: "13:00", name: "Crucero por el Sena", cat: "Panorámico · 1h" },
    { time: "16:30", name: "Museo del Louvre, visita guiada", cat: "Cultura · 2h30" },
    { time: "20:00", name: "Cabaret con cena incluida", cat: "Espectáculo · 3h" },
  ],
  lisboa: [
    { time: "10:00", name: "Free tour por Alfama", cat: "Cultura · Gratis + propina" },
    { time: "13:00", name: "Ruta de pastéis de nata y miradores", cat: "Gastronomía · 2h" },
    { time: "16:00", name: "Excursión a Sintra y Cascais", cat: "Escapada · 8h" },
    { time: "21:00", name: "Cena con espectáculo de fado", cat: "Espectáculo · 2h" },
  ],
  marrakech: [
    { time: "09:00", name: "Zocos y plaza Jemaa el-Fna guiado", cat: "Cultura · 3h" },
    { time: "14:00", name: "Jardines Majorelle", cat: "Naturaleza · 1h30" },
    { time: "17:00", name: "Excursión al desierto de Agafay", cat: "Aventura · 5h" },
    { time: "20:30", name: "Cena tradicional con música en vivo", cat: "Gastronomía · 2h" },
  ],
  napoles: [
    { time: "09:00", name: "Pompeya con guía oficial", cat: "Historia · 4h" },
    { time: "14:30", name: "Costa Amalfitana en barco", cat: "Panorámico · 4h" },
    { time: "19:30", name: "Clase de pizza napolitana", cat: "Gastronomía · 2h" },
  ],
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

function distributeAcrossDays(activities, numDays) {
  // Reparte las actividades de ejemplo entre los días elegidos,
  // repitiendo el patrón si hay más días que actividades-tipo.
  const days = [];
  for (let d = 0; d < numDays; d++) {
    days.push(activities.length ? [activities[d % activities.length]] : []);
  }
  return days;
}

async function buildItinerary() {
  const destino = document.getElementById("itDestino").value.trim();
  const numDays = parseInt(document.getElementById("itDias").value, 10) || 1;
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

  const days = distributeAcrossDays(activities, numDays);

  resultBox.innerHTML = days.map((dayActivities, i) => `
    <div class="day-block">
      <h3>Día ${i + 1}</h3>
      ${dayActivities.map(a => activityRowHTML(a, slug)).join("")}
    </div>
  `).join("");
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("itineraryForm");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      buildItinerary();
    });
  }
});
