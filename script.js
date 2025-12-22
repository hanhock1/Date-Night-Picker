
// Google "gviz" endpoint (works on GitHub Pages)
const SHEET_ID = "1s5YwjY0KEDlpCALxEJoW9-DOh9jM_GGQCxnBWmMhs50";
const GVIZ_URL =
  "https://docs.google.com/spreadsheets/d/1s5YwjY0KEDlpCALxEJoW9-DOh9jM_GGQCxnBWmMhs50/edit?usp=sharing";


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

let lists = {
  themes: [],
  food: [],
  dress: [],
  activity: []
};

let matchMode = null; // "yes" or "no"

function setStatus(msg) { els.status.textContent = msg; }
function pickRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function gvizTextToJson(text) {
  return JSON.parse(text.substring(47, text.length - 2));
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

async function loadSheet() {
  setStatus("Loading your Google Sheet...");
  const res = await fetch(GVIZ_URL);
  const text = await res.text();
  const json = gvizTextToJson(text);
  const table = json.table;

  lists = buildListsFromTable(table);

  if (!lists.themes.length) {
    setStatus("No themes found. Make sure the Themes column has values and the sheet is published.");
    return;
  }

  setStatus(
    `Loaded: ${lists.themes.length} themes, ${lists.food.length} foods, ${lists.dress.length} dress options, ${lists.activity.length} activities.`
  );
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

loadSheet().catch(err => {
  console.error(err);
  setStatus("Error: " + (err?.message || err));
});
