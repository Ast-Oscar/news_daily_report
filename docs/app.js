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
const catSelect = document.querySelector("#catSelect");
const qInput = document.querySelector("#q");
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
  const dates = (indexData.available_dates || []).slice().sort().reverse();
  for (const d of dates) {
    dateSelect.appendChild(el("option", { value: d }, [document.createTextNode(d)]));
  }

  const u = new URL(location.href);
  const forced = u.searchParams.get("date");
  dateSelect.value = forced || indexData.latest || dates[0] || "";
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

function render() {
  const date = currentData?.date || dateSelect.value || "";
  const tz = currentData?.timezone || "Europe/Paris";
  const gen = currentData?.generated_at_utc || "";
  const items = currentData?.items || [];
  const catFilter = catSelect.value;
  const q = (qInput.value || "").trim().toLowerCase();

  // Filter items by category and search
  const filtered = items.filter(it => {
    if (catFilter && it.categorie !== catFilter) return false;
    if (q) {
      const hay = `${it.titre} ${it.description}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
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
    const bySub = groupBy(catItems, "sous_categorie");
    for (const [sub, subItems] of bySub.entries()) {
      content.appendChild(el("h3", {}, [document.createTextNode(sub || "Général")]));
      for (const it of subItems) {
        const ul = el("ul");
        for (const s of (it.sources || [])) {
          const a = el(
            "a",
            { href: s.url, target: "_blank", rel: "noopener noreferrer" },
            [document.createTextNode(s.url)]
          );
          ul.appendChild(el("li", {}, [a, document.createTextNode(` (${s.type})`)]));
        }
        const status = it.verification_status || "unverified";
        const badges = el("div", {}, [
          el("span", { class: "badge" }, [document.createTextNode(it.confidence || "?")]),
          el("span", { class: "badge" }, [document.createTextNode(status)]),
        ]);
        content.appendChild(el("div", { class: "card" }, [
          badges,
          el("h4", {}, [document.createTextNode(it.titre)]),
          el("p", {}, [document.createTextNode(it.description)]),
          ul
        ]));
      }
      content.appendChild(el("hr"));
    }
  }

  // Update URL params
  const u = new URL(location.href);
  u.searchParams.set("date", dateSelect.value);
  if (catSelect.value) u.searchParams.set("cat", catSelect.value);
  else u.searchParams.delete("cat");
  history.replaceState(null, "", u.toString());
}

function bindEvents() {
  dateSelect.addEventListener("change", () => loadDate(dateSelect.value));
  catSelect.addEventListener("change", render);
  qInput.addEventListener("input", render);

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
