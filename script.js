

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

let lists = {
  themes: [],
  food: [],
  dress: [],
  activity: []
};

let matchMode = null; // "yes" or "no"

function setStatus(msg) { els.status.textContent = msg; }
function pickRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

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
      if (cur.length || row.length) row.push(cur);
      if (row.length) rows.push(row.map(x => x.trim()));
      row = [];
      cur = "";
      continue;
    }
    cur += c;
  }

  if (cur.length || row.length) {
    row.push(cur);
    rows.push(row.map(x => x.trim()));
  }

  return rows.filter(r => r.some(cell => cell && cell.length));
}

function buildListsFromRows(rows) {
  const header = rows[0].map(h => (h || "").toLowerCase().trim());

  const idxThemes = header.findIndex(h => h.startsWith("themes") || h === "theme");
  const idxFood = header.findIndex(h => h.startsWith("food"));
  const idxDress = header.findIndex(h => h.startsWith("dress"));
  const idxActivity = header.findIndex(h => h.startsWith("activity"));

  if (idxThemes === -1 || idxFood === -1 || idxDress === -1 || idxActivity === -1) {
    throw new Error("CSV headers must be: Themes, Food, Dress, Activity");
  }

  const themes = [];
  const food = [];
  const dress = [];
  const activity = [];

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (r[idxThemes]) themes.push(r[idxThemes]);
    if (r[idxFood]) food.push(r[idxFood]);
    if (r[idxDress]) dress.push(r[idxDress]);
    if (r[idxActivity]) activity.push(r[idxActivity]);
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
  const res = await fetch(DATA_URL);
  if (!res.ok) throw new Error(`Could not load data.csv (HTTP ${res.status})`);
  const text = await res.text();
  const rows = parseCSV(text);
  lists = buildListsFromRows(rows);

  setStatus(
    `Loaded: ${lists.themes.length} themes, ` +
    `${lists.food.length} foods, ` +
    `${lists.dress.length} dress options, ` +
    `${lists.activity.length} activities.`
  );
}


function normalizeHeader(h) {
  return String(h || "").trim().toLowerCase();
}

function cleanCell(v) {
  if (v === null || v === undefined) return "";
  return String(v).trim();
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

function currentThemeText() {
  const t = (els.themeBox.textContent || "").trim();
  return (t === "—" ? "" : t);
}

// If match mode is YES, copy Theme into Food/Dress boxes
function applyMatchedFoodDress() {
  const theme = currentThemeText();
  els.foodMatchedBox.textContent = theme || "—";
  els.dressMatchedBox.textContent = theme || "—";
}

// Draw actions
function drawTheme() {
  if (!lists.themes.length) return;
  const theme = pickRandom(lists.themes);
  els.themeBox.textContent = theme;

  // If matching, copy theme down immediately
  if (matchMode === "yes") {
    applyMatchedFoodDress();
  }
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
  applyMatchedFoodDress();
}

function onMatchNo() {
  matchMode = "no";
  setActiveToggle("no");
  showMatchedUI(false);
  showIndependentUI(true);
}

// Build lists from the sheet table (treat each column as its own independent list)
function buildListsFromTable(table) {
  const headers = table.cols.map(c => normalizeHeader(c.label));

  const idxThemes = headers.findIndex(h => h.startsWith("themes") || h === "theme");
  const idxFood = headers.findIndex(h => h.startsWith("food"));
  const idxDress = headers.findIndex(h => h.startsWith("dress"));
  const idxActivity = headers.findIndex(h => h.startsWith("activity"));

  if (idxThemes === -1) throw new Error("Could not find a 'Themes' column header.");
  if (idxFood === -1) throw new Error("Could not find a 'Food' column header.");
  if (idxDress === -1) throw new Error("Could not find a 'Dress' column header.");
  if (idxActivity === -1) throw new Error("Could not find an 'Activity' column header.");

  const themes = [];
  const food = [];
  const dress = [];
  const activity = [];

  for (const r of table.rows) {
    const cells = r.c || [];
    const t = cleanCell(cells[idxThemes]?.v);
    const f = cleanCell(cells[idxFood]?.v);
    const d = cleanCell(cells[idxDress]?.v);
    const a = cleanCell(cells[idxActivity]?.v);

    if (t) themes.push(t);
    if (f) food.push(f);
    if (d) dress.push(d);
    if (a) activity.push(a);
  }

  // remove duplicates (optional but nice)
  const uniq = arr => Array.from(new Set(arr));
  return {
    themes: uniq(themes),
    food: uniq(food),
    dress: uniq(dress),
    activity: uniq(activity),
  };
}



// Hook up UI
els.themeDraw.addEventListener("click", drawTheme);
els.foodDraw.addEventListener("click", drawFood);
els.dressDraw.addEventListener("click", drawDress);
els.activityDraw.addEventListener("click", drawActivity);

els.matchYes.addEventListener("click", onMatchYes);
els.matchNo.addEventListener("click", onMatchNo);

// Initial UI state
showMatchedUI(false);
showIndependentUI(false);
setActiveToggle(null);

loadData().catch(err => {
  console.error(err);
  setStatus("Error: " + (err?.message || err));
});