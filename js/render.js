/* =========================
   Utilities
========================= */

const PRAYER_ORDER = ["Imsak", "Subuh", "Syuruk", "Dhuha", "Zohor", "Asar", "Maghrib", "Isyak"];
const SECONDARY_TIMES = ["Imsak", "Syuruk", "Dhuha"];

// Data files are keyed by zero-padded dates ("2026-01-01"). Keep this format exact.
function formatLocalDateKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDays(date, days) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

function timeToMinutes(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function renderDates(todayKey) {
  const dateEl = document.getElementById("dateText");
  const hijriEl = document.getElementById("hijriDate");

  if (dateEl) {
    dateEl.innerText = new Date().toLocaleDateString("ms-MY", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  }

  if (hijriEl && typeof hijriData !== "undefined") {
    hijriEl.innerText =
      hijriData[todayKey]
        ? hijriData[todayKey]
        : "Tarikh Hijri tertakluk kepada pengumuman rasmi";
  }
}

/* =========================
   Next prayer
========================= */

// Returns { name, time, date, isToday } for the next listed time.
function getNextPrayerDate(todayData, tomorrowData) {
  const now = new Date();

  for (const name of PRAYER_ORDER) {
    const t = todayData[name];
    if (!t) continue;

    const [h, m] = t.split(":").map(Number);
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0);

    if (d > now) return { name, time: t, date: d, isToday: true };
  }

  // After Isyak: Subuh tomorrow (use tomorrow's own time when we have it)
  const subuh = (tomorrowData && tomorrowData.Subuh) || todayData.Subuh;
  const [h, m] = subuh.split(":").map(Number);
  const tomorrow = addDays(now, 1);
  tomorrow.setHours(h, m, 0, 0);

  return { name: "Subuh", time: subuh, date: tomorrow, isToday: false };
}

function formatCountdown(diffMinutes) {
  if (diffMinutes <= 0) return "sekarang";
  if (diffMinutes >= 60) {
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    return minutes > 0 ? `dalam ${hours} jam ${minutes} minit` : `dalam ${hours} jam`;
  }
  return `dalam ${diffMinutes} minit`;
}

let lastNextName = null;

// Update the hero "next prayer" block (runs every second)
function updateHeroNextPrayer(todayData, tomorrowData) {
  if (!todayData) return;

  const nameEl = document.getElementById("nextPrayerName");
  const timeEl = document.getElementById("nextPrayerTime");
  const cdEl = document.getElementById("nextPrayerCountdown");
  if (!nameEl || !timeEl || !cdEl) return;

  const next = getNextPrayerDate(todayData, tomorrowData);
  const diffSeconds = Math.floor((next.date - new Date()) / 1000);
  const diffMinutes = Math.ceil(diffSeconds / 60);

  nameEl.innerText = next.name;
  timeEl.innerText = next.isToday ? `pada jam ${next.time}` : `esok pada jam ${next.time}`;
  cdEl.innerText = formatCountdown(diffMinutes);
  nameEl.classList.toggle("urgent", diffMinutes > 0 && diffMinutes <= 10);

  const key = next.isToday ? next.name : "tomorrow";
  if (key !== lastNextName) {
    lastNextName = key;
    markPrayerStates(todayData, next.isToday ? next.name : null);
  }
}

/* =========================
   Today's prayer boxes
========================= */

function renderToday(today) {
  const el = document.getElementById("todayPrayer");
  if (!el) return;

  el.innerHTML = PRAYER_ORDER
    .filter(name => today[name])
    .map(name => `
      <div class="prayer-box ${SECONDARY_TIMES.includes(name) ? "secondary" : ""}" data-prayer="${name}">
        <span class="pn">${name}</span>
        <strong>${today[name]}</strong>
      </div>
    `)
    .join("");

  lastNextName = null; // force the states to be re-marked
}

// Mark boxes as past / next
function markPrayerStates(today, nextName) {
  const nowMin = new Date().getHours() * 60 + new Date().getMinutes();

  document.querySelectorAll(".prayer-box[data-prayer]").forEach(box => {
    const name = box.dataset.prayer;
    const time = today[name];
    box.classList.toggle("next", name === nextName);
    box.classList.toggle("past", !!time && timeToMinutes(time) <= nowMin && name !== nextName);
  });
}

/* =========================
   Hadith of the day
========================= */

function renderDailyHadith(todayKey) {
  if (typeof hadithList === "undefined") return;

  const textEl = document.getElementById("hadithText");
  const sourceEl = document.getElementById("hadithSource");
  if (!textEl || !sourceEl) return;

  // YYYY-MM-DD -> number (simple, stable)
  const seed = parseInt(todayKey.replace(/-/g, ""), 10);
  const hadith = hadithList[seed % hadithList.length];

  textEl.innerText = hadith.text;
  sourceEl.innerText = hadith.source;
}

/* =========================
   Monthly jadual (month selector)
========================= */

let selectedMonth = null;

function monthLabel(ym) {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("ms-MY", { month: "long", year: "numeric" });
}

function currentMonthKey() {
  return formatLocalDateKey().slice(0, 7);
}

// Pick the month to show first: this month, or the closest month we have data for
function pickInitialMonth() {
  const months = listDataMonths();
  const now = currentMonthKey();
  if (months.includes(now)) return now;
  return now < months[0] ? months[0] : months[months.length - 1];
}

function renderMonthly(data) {
  const tbody = document.querySelector("#monthlyTable tbody");
  if (!tbody) return;

  const hasHijri = typeof hijriData !== "undefined";

  tbody.innerHTML = Object.entries(data)
    .filter(([key]) => /^\d{4}-\d{2}-\d{2}$/.test(key)) // ignore malformed keys instead of showing broken rows
    .map(([key, d]) => {
      const [y, m, day] = key.split("-").map(Number);
      const date = new Date(y, m - 1, day);
      const weekday = date.toLocaleDateString("ms-MY", { weekday: "short" });
      const hijri = hasHijri && hijriData[key] ? hijriData[key].replace(/\s+\d+H$/, "") : "-";

      return `
        <tr data-date="${key}" class="${date.getDay() === 5 ? "jumaat" : ""}">
          <td class="col-date"><span class="dow">${weekday}</span> <strong>${day}</strong></td>
          <td>${d.Imsak}</td>
          <td>${d.Subuh}</td>
          <td>${d.Syuruk}</td>
          <td>${d.Dhuha}</td>
          <td>${d.Zohor}</td>
          <td>${d.Asar}</td>
          <td>${d.Maghrib}</td>
          <td>${d.Isyak}</td>
          <td class="col-hijri">${hijri}</td>
        </tr>
      `;
    })
    .join("");
}

function showMonthMessage(text) {
  const tbody = document.querySelector("#monthlyTable tbody");
  if (tbody) tbody.innerHTML = `<tr><td colspan="10" class="table-message">${text}</td></tr>`;
}

// Highlight today's row and, on the current month, scroll the table to it
function highlightTodayRow() {
  const row = document.querySelector(`tr[data-date="${formatLocalDateKey()}"]`);
  if (!row) return;
  row.classList.add("today");

  const wrapper = document.getElementById("tableWrapper");
  const head = document.querySelector("#monthlyTable thead");
  if (!wrapper || !head) return;

  const offset = row.getBoundingClientRect().top - wrapper.getBoundingClientRect().top + wrapper.scrollTop;
  wrapper.scrollTop = Math.max(0, offset - head.offsetHeight - 8);
}

function updateMonthControls() {
  const months = listDataMonths();
  const index = months.indexOf(selectedMonth);

  const select = document.getElementById("monthSelect");
  const prev = document.getElementById("monthPrev");
  const next = document.getElementById("monthNext");
  const printLabel = document.getElementById("printMonth");

  if (select) select.value = selectedMonth;
  if (prev) prev.disabled = index <= 0;
  if (next) next.disabled = index === -1 || index >= months.length - 1;
  if (printLabel) printLabel.textContent = `${monthLabel(selectedMonth)} · Berdasarkan Jadual KHEU`;
}

async function showMonth(ym) {
  selectedMonth = ym;
  updateMonthControls();

  const wrapper = document.getElementById("tableWrapper");
  if (wrapper) wrapper.scrollTop = 0;

  try {
    const data = await loadMonthData(ym);
    if (ym !== selectedMonth) return; // another month was picked while loading
    renderMonthly(data);
    if (ym === currentMonthKey()) highlightTodayRow();
  } catch (err) {
    if (ym === selectedMonth) showMonthMessage("Data waktu solat bagi bulan ini belum tersedia.");
  }
}

function initMonthSelector() {
  const select = document.getElementById("monthSelect");
  const prev = document.getElementById("monthPrev");
  const next = document.getElementById("monthNext");
  const print = document.getElementById("printBtn");
  if (!select) return;

  const months = listDataMonths();
  select.innerHTML = months.map(ym => `<option value="${ym}">${monthLabel(ym)}</option>`).join("");

  select.addEventListener("change", () => showMonth(select.value));
  prev.addEventListener("click", () => {
    const i = months.indexOf(selectedMonth);
    if (i > 0) showMonth(months[i - 1]);
  });
  next.addEventListener("click", () => {
    const i = months.indexOf(selectedMonth);
    if (i < months.length - 1) showMonth(months[i + 1]);
  });
  if (print) print.addEventListener("click", () => window.print());

  showMonth(pickInitialMonth());
}

/* =========================
   Mobile prayer bar + day/night
========================= */

function updateMobilePrayerBar(today, tomorrow) {
  const nameEl = document.getElementById("mpbName");
  const timeEl = document.getElementById("mpbTime");
  const cdEl = document.getElementById("mpbCountdown");
  if (!nameEl || !timeEl || !cdEl) return;

  const next = getNextPrayerDate(today, tomorrow);
  const minutes = Math.ceil((next.date - new Date()) / 60000);

  nameEl.innerText = next.name;
  timeEl.innerText = next.isToday ? next.time : `Esok ${next.time}`;
  cdEl.innerText = minutes >= 60
    ? `${Math.floor(minutes / 60)}j ${minutes % 60}m lagi`
    : `${minutes}m lagi`;
}

function applyDayNightMode(today) {
  if (!today.Maghrib) return;

  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  document.body.classList.toggle("night", nowMin >= timeToMinutes(today.Maghrib));
}

/* =========================
   Init
========================= */

let currentTodayKey = null;
let todayData = null;
let tomorrowData = null;
let timersStarted = false;

function showDataUnavailable() {
  const nameEl = document.getElementById("nextPrayerName");
  const cdEl = document.getElementById("nextPrayerCountdown");
  const timeEl = document.getElementById("nextPrayerTime");
  if (nameEl) nameEl.innerText = "-";
  if (cdEl) cdEl.innerText = "Data hari ini belum tersedia";
  if (timeEl) timeEl.innerText = "";
}

// Load today's (and tomorrow's) data and paint the hero. Safe to call again at midnight.
async function loadToday() {
  const now = new Date();
  const todayKey = formatLocalDateKey(now);
  const [today, tomorrow] = await Promise.all([
    getPrayerDay(todayKey),
    getPrayerDay(formatLocalDateKey(addDays(now, 1)))
  ]);

  if (!today) {
    showDataUnavailable();
    return false;
  }

  currentTodayKey = todayKey;
  todayData = today;
  tomorrowData = tomorrow;

  renderDates(todayKey);
  renderDailyHadith(todayKey);
  renderToday(today);
  renderEvents(todayKey);

  updateHeroNextPrayer(today, tomorrow);
  updateMobilePrayerBar(today, tomorrow);
  applyDayNightMode(today);
  return true;
}

function startTimers() {
  if (timersStarted) return;
  timersStarted = true;

  setInterval(() => {
    // New day: reload today's data and refresh the monthly highlight
    if (formatLocalDateKey() !== currentTodayKey) {
      loadToday().then(ok => {
        if (ok && selectedMonth === currentMonthKey()) {
          document.querySelectorAll("tr.today").forEach(r => r.classList.remove("today"));
          highlightTodayRow();
        }
      });
      return;
    }
    if (todayData) updateHeroNextPrayer(todayData, tomorrowData);
  }, 1000);

  setInterval(() => {
    if (!todayData) return;
    updateMobilePrayerBar(todayData, tomorrowData);
    applyDayNightMode(todayData);
  }, 30000);
}

function initTopBar() {
  const bar = document.querySelector(".top-bar");
  if (!bar) return;
  const update = () => bar.classList.toggle("scrolled", window.scrollY > 20);
  window.addEventListener("scroll", update, { passive: true });
  update();
}

async function initPrayerTimes() {
  initTopBar();
  initMonthSelector();
  if (typeof initNotifications === "function") initNotifications();

  const ok = await loadToday();
  if (ok) startTimers();
}

initPrayerTimes();
