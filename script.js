// script.js — CSV-backed picker (no Google Sheets / no JSON)

const els = {
  status: document.getElementById("status"),

  themeBox: document.getElementById("themeBox"),
  themeDraw: document.getElementById("themeDraw"),

  matchYes: document.getElementById("matchYes"),
  matchNo: document.getElementById("matchNo"),

  matchedSection: document.getElementById("matchedSection"),
  independentSection: document.getElementById("independentSection"),

  foodMatchedBox: document.getElementById("foodMatchedBox"),
  dressMatchedBox: document.getElementById("dressMatchedBox"),

  foodBox: document.getElementById("foodBox"),
  dressBox: document.getElementById("dressBox"),
  foodDraw: document.getElementById("foodDraw"),
  dressDraw: document.getElementById("dressDraw"),

  activityBox: document.getElementById("activityBox"),
  activityDraw: document.getElementById("activityDraw"),
};

const DATA_URL = "./data.csv";

let lists = { themes: [], food: [], dress: [], activity: [] };
let matchMode = null; // "yes" | "no" | null

function setStatus(msg) {
  if (els.status) els.status.textContent = msg;
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function setActiveToggle(which) {
  els.matchYes.classList.toggle("active", which === "yes");
  els.matchNo.classList.toggle("active", which === "no");
}

function showMatchedUI(show) {
  els.matchedSection.classList.toggle("hidden", !show);
}

function showIndependentUI(show) {
  els.independentSection.classList.toggle("hidden", !show);
}

function getThemeText() {
  const t = (els.themeBox.textContent || "").trim();
  return t === "—" ? "" : t;
}

function applyMatchedFoodDress() {
  const theme = getThemeText();
  els.foodMatchedBox.textContent = theme || "—";
  els.dressMatchedBox.textContent = theme || "—";
}

function resetIndependentBoxes() {
  els.foodBox.textContent = "—";
  els.dressBox.textContent = "—";
}

function resetMatchedBoxes() {
  els.foodMatchedBox.textContent = "—";
  els.dressMatchedBox.textContent = "—";
}

// Robust-ish CSV parser (handles quoted fields + commas inside quotes)
function parseCSV(text) {
  const rows = [];
  let row = [];
  let cur = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const next = text[i + 1];

    if (c === '"' && inQuotes && next === '"') {
      cur += '"';
      i++;
      continue;
    }
    if (c === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (c === "," && !inQuotes) {
      row.push(cur);
      cur = "";
      continue;
    }
    if ((c === "\n" || c === "\r") && !inQuotes) {
      // swallow CRLF
      if (c === "\r" && next === "\n") i++;

      row.push(cur);
      if (row.some(cell => cell.trim().length > 0)) {
        rows.push(row.map(x => x.trim()));
      }
      row = [];
      cur = "";
      continue;
    }
    cur += c;
  }

  // last line
  if (cur.length || row.length) {
    row.push(cur);
    if (row.some(cell => cell.trim().length > 0)) {
      rows.push(row.map(x => x.trim()));
    }
  }
  return rows;
}

function buildListsFromRows(rows) {
  if (!rows.length) throw new Error("data.csv is empty.");

  const header = rows[0].map(h => (h || "").trim().toLowerCase());

  // Your file has "Themes " (extra space) — trimming fixes it.
  const idxThemes = header.findIndex(h => h === "themes" || h === "theme");
  const idxFood = header.findIndex(h => h === "food");
  const idxDress = header.findIndex(h => h === "dress");
  const idxActivity = header.findIndex(h => h === "activity");

  if (idxThemes === -1 || idxFood === -1 || idxDress === -1 || idxActivity === -1) {
    throw new Error("CSV headers must include: Themes, Food, Dress, Activity");
  }

  const themes = [];
  const food = [];
  const dress = [];
  const activity = [];

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];

    const t = (r[idxThemes] || "").trim();
    const f = (r[idxFood] || "").trim();
    const d = (r[idxDress] || "").trim();
    const a = (r[idxActivity] || "").trim();

    if (t) themes.push(t);
    if (f) food.push(f);
    if (d) dress.push(d);
    if (a) activity.push(a);
  }

  const uniq = arr => Array.from(new Set(arr));
  return {
    themes: uniq(themes),
    food: uniq(food),
    dress: uniq(dress),
    activity: uniq(activity),
  };
}

async function loadData() {
  setStatus("Loading data.csv...");
  const res = await fetch(DATA_URL, { cache: "no-store" });
  if (!res.ok) throw new Error(`Could not load data.csv (HTTP ${res.status})`);

  const text = await res.text();

  // If this ever triggers, your fetch is hitting an HTML page, not the CSV file.
  if (text.toLowerCase().includes("<html")) {
    throw new Error("Fetched HTML instead of CSV. Confirm data.csv is in the repo root.");
  }

  const rows = parseCSV(text);
  lists = buildListsFromRows(rows);

  setStatus(
    `Loaded: ${lists.themes.length} themes, ${lists.food.length} foods, ` +
    `${lists.dress.length} dress options, ${lists.activity.length} activities.`
  );
}

// Draw actions
function drawTheme() {
  if (!lists.themes.length) return;
  els.themeBox.textContent = pickRandom(lists.themes);

  if (matchMode === "yes") applyMatchedFoodDress();
}

function drawFood() {
  if (!lists.food.length) return;
  els.foodBox.textContent = pickRandom(lists.food);
}

function drawDress() {
  if (!lists.dress.length) return;
  els.dressBox.textContent = pickRandom(lists.dress);
}

function drawActivity() {
  if (!lists.activity.length) return;
  els.activityBox.textContent = pickRandom(lists.activity);
}

// Match toggle behavior
function onMatchYes() {
  matchMode = "yes";
  setActiveToggle("yes");
  showIndependentUI(false);
  showMatchedUI(true);
  resetIndependentBoxes();
  applyMatchedFoodDress();
}

function onMatchNo() {
  matchMode = "no";
  setActiveToggle("no");
  showMatchedUI(false);
  showIndependentUI(true);
  resetMatchedBoxes();
}

// Hook up UI
els.themeDraw.addEventListener("click", drawTheme);
els.foodDraw.addEventListener("click", drawFood);
els.dressDraw.addEventListener("click", drawDress);
els.activityDraw.addEventListener("click", drawActivity);

els.matchYes.addEventListener("click", onMatchYes);
els.matchNo.addEventListener("click", onMatchNo);

// Initial UI state
els.themeBox.textContent = "—";
els.activityBox.textContent = "—";
resetIndependentBoxes();
resetMatchedBoxes();

showMatchedUI(false);
showIndependentUI(false);
setActiveToggle(null);

loadData().catch(err => {
  console.error(err);
  setStatus("Error: " + (err?.message || err));
});
