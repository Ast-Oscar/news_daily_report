// docs/app.js

const CATEGORIES_LABELS = {
  GOUVERNANCE_REGULATION_EVALUATION: "Gouvernance / Régulation / Évaluation",
  ECONOMIE_INDUSTRIE_INVESTISSEMENTS: "Économie / Industrie / Investissements",
  RSE_SOCIETE_CULTURE: "RSE / Société / Culture",
  CYBERSECURITE_RISQUES_SECURITE_MODELES: "Cybersécurité / Risques / Sécurité des modèles",
  SANTE_SCIENCE_RECHERCHE: "Santé / Science / Recherche",
  DEFENSE_GEOPOLITIQUE_SOUVERAINETE: "Défense / Géopolitique / Souveraineté"
};

const dateSelect = document.querySelector("#dateSelect");
const calendar = document.querySelector("#calendar");
const calendarHeader = document.querySelector("#calendar-header");
const catSelect = document.querySelector("#catSelect");
// Recherche supprimée
const content = document.querySelector("#content");
const meta = document.querySelector("#meta");
const metaExtra = document.querySelector("#meta-extra");

let indexData = null;
let currentData = null;

function el(tag, attrs = {}, children = []) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") n.className = v;
    else n.setAttribute(k, v);
  }
  for (const c of children) n.appendChild(c);
  return n;
}

async function loadIndex() {
  const res = await fetch("./data/index.json", { cache: "no-store" });
  if (!res.ok) throw new Error("index.json introuvable. Attends la première génération.");
  indexData = await res.json();
}

function populateCategorySelect() {
  for (const [value, label] of Object.entries(CATEGORIES_LABELS)) {
    catSelect.appendChild(el("option", { value }, [document.createTextNode(label)]));
  }
}

function populateDateSelectAndSelectLatest() {
  dateSelect.innerHTML = "";
  const dates = (indexData.available_dates || []).slice().sort();
  for (const d of dates) {
    dateSelect.appendChild(el("option", { value: d }, [document.createTextNode(d)]));
  }
  const u = new URL(location.href);
  const forced = u.searchParams.get("date");
  dateSelect.value = forced || indexData.latest || dates[dates.length - 1] || "";
  renderCalendar(dates, dateSelect.value);
}

function renderCalendar(availableDates, selectedDate) {
  // Affiche le calendrier du mois de la date sélectionnée
  calendar.innerHTML = "";
  if (!selectedDate) {
    calendarHeader.textContent = "";
    return;
  }
  const [year, month] = selectedDate.split("-").map(Number);
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const startDay = firstDay.getDay() || 7; // Lundi=1, Dimanche=7
  // Affichage du mois/année
  const monthNames = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
  calendarHeader.textContent = `${monthNames[month - 1]} ${year}`;
  // Affichage des jours de la semaine
  const daysOfWeek = ["L", "M", "M", "J", "V", "S", "D"];
  daysOfWeek.forEach(d => calendar.appendChild(el("div", { class: "calendar-day inactive" }, [document.createTextNode(d)])));
  // Jours vides avant le 1er
  for (let i = 1; i < startDay; i++) {
    calendar.appendChild(el("div", { class: "calendar-day inactive" }, [document.createTextNode("")]));
  }
  // Jours du mois
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const dateStr = `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}-${d.toString().padStart(2, "0")}`;
    const isAvailable = availableDates.includes(dateStr);
    const isActive = dateStr === selectedDate;
    const dayEl = el("div", {
      class: `calendar-day${isAvailable ? "" : " inactive"}${isActive ? " active" : ""}`,
      tabIndex: isAvailable ? 0 : -1,
      title: isAvailable ? `Voir la veille du ${dateStr}` : "Pas de veille ce jour"
    }, [document.createTextNode(d)]);
    if (isAvailable) {
      dayEl.addEventListener("click", () => {
        dateSelect.value = dateStr;
        loadDate(dateStr);
        renderCalendar(availableDates, dateStr);
      });
    }
    calendar.appendChild(dayEl);
  }
}

async function loadDate(date) {
  const res = await fetch(`./data/${date}.json`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Données du ${date} introuvables.`);
  currentData = await res.json();
  render();
}

function groupBy(items, key) {
  const m = new Map();
  for (const it of items) {
    const k = it[key] || "";
    if (!m.has(k)) m.set(k, []);
    m.get(k).push(it);
  }
  return m;
}

function getCatClass(cat) {
  switch (cat) {
    case "GOUVERNANCE_REGULATION_EVALUATION": return "cat-gouvernance";
    case "ECONOMIE_INDUSTRIE_INVESTISSEMENTS": return "cat-economie";
    case "RSE_SOCIETE_CULTURE": return "cat-rse";
    case "CYBERSECURITE_RISQUES_SECURITE_MODELES": return "cat-cyber";
    case "SANTE_SCIENCE_RECHERCHE": return "cat-sante";
    case "DEFENSE_GEOPOLITIQUE_SOUVERAINETE": return "cat-defense";
    default: return "";
  }
}

function render() {
  const date = currentData?.date || dateSelect.value || "";
  const tz = currentData?.timezone || "Europe/Paris";
  const gen = currentData?.generated_at_utc || "";
  const items = currentData?.items || [];
  const catFilter = catSelect.value;
  // Filter items by category uniquement
  const filtered = items.filter(it => {
    if (catFilter && it.categorie !== catFilter) return false;
    return true;
  });

  meta.textContent = `${filtered.length} actualité(s) — date: ${date} (${tz}) — généré: ${gen}`;
  if (currentData?.meta && Object.keys(currentData.meta).length > 0) {
    metaExtra.textContent = "Infos techniques : " + JSON.stringify(currentData.meta);
  } else {
    metaExtra.textContent = "";
  }

  content.innerHTML = "";
  if (!filtered.length) {
    content.appendChild(el("p", { class: "muted" }, [document.createTextNode("Aucun résultat pour ces filtres.")]));
    return;
  }

  // Group by category, then subcategory
  const byCat = groupBy(filtered, "categorie");
  for (const [cat, catItems] of byCat.entries()) {
    content.appendChild(el("h2", {}, [document.createTextNode(CATEGORIES_LABELS[cat] || cat)]));
    // On ne groupe plus par sous_categorie, ni ne l'affiche
    for (const it of catItems) {
      // résumé visible : titre + niveau de confiance + bouton
      const status = it.verification_status || "unverified";
      const badges = el("div", { style: "display:inline-block;vertical-align:middle;" }, [
        el("span", { class: "badge" }, [document.createTextNode(it.confidence || "?")]),
        el("span", { class: "badge" }, [document.createTextNode(status)])
      ]);
      const btn = el("button", {
        class: "toggle-details",
        style: "float:right;font-size:1.2em;padding:0.2em 0.7em;border-radius:1em;border:none;background:#fff;cursor:pointer;transition:background 0.2s;",
        title: "Afficher les détails"
      }, [document.createTextNode("+")]);

      // détails cachés
      const ul = el("ul");
      for (const s of (it.sources || [])) {
        const a = el(
          "a",
          { href: s.url, target: "_blank", rel: "noopener noreferrer" },
          [document.createTextNode(s.url)]
        );
        ul.appendChild(el("li", {}, [a])); // On n'affiche plus le type
      }
      const details = el("div", { class: "details", style: "display:none;" }, [
        el("p", {}, [document.createTextNode(it.description)]),
        ul
      ]);

      btn.addEventListener("click", function() {
        if (details.style.display === "none") {
          details.style.display = "block";
          btn.textContent = "–";
          btn.title = "Masquer les détails";
        } else {
          details.style.display = "none";
          btn.textContent = "+";
          btn.title = "Afficher les détails";
        }
      });

      content.appendChild(el("div", { class: `card ${getCatClass(it.categorie)}` }, [
        btn,
        badges,
        el("h4", { style: "display:inline-block;margin-left:0.5em;vertical-align:middle;" }, [document.createTextNode(it.titre)]),
        details
      ]));
    }
    content.appendChild(el("hr"));
  }

  // Update URL params
  const u = new URL(location.href);
  u.searchParams.set("date", dateSelect.value);
  if (catSelect.value) u.searchParams.set("cat", catSelect.value);
  else u.searchParams.delete("cat");
  history.replaceState(null, "", u.toString());
}

function bindEvents() {
  dateSelect.addEventListener("change", () => {
    loadDate(dateSelect.value);
    renderCalendar(indexData.available_dates, dateSelect.value);
  });
  catSelect.addEventListener("change", render);
  // Recherche supprimée

  const u = new URL(location.href);
  const cat = u.searchParams.get("cat");
  if (cat) catSelect.value = cat;
}

(async function init() {
  try {
    await loadIndex();
    populateCategorySelect();
    populateDateSelectAndSelectLatest();
    bindEvents();
    if (dateSelect.value) await loadDate(dateSelect.value);
  } catch (e) {
    content.innerHTML = `<p class="muted">${String(e.message || e)}</p>`;
  }
})();
