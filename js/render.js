/* =========================
   Utilities
========================= */

function renderDates(todayKey) {
  const dateEl = document.getElementById("dateText");
  const hijriEl = document.getElementById("hijriDate");

  if (dateEl) {
    const now = new Date();
    dateEl.innerText = now.toLocaleDateString("ms-MY", {
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


function formatLocalDateKey() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function timeToMinutes(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

/* =========================
   Next Prayer (SECONDS)
========================= */
function getNextPrayerDate(todayData) {
  const now = new Date();
  const order = ["Imsak","Subuh","Syuruk","Dhuha","Zohor","Asar","Maghrib","Isyak"];

  for (const name of order) {
    const t = todayData[name];
    if (!t) continue;

    const [h, m] = t.split(":").map(Number);
    const d = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      h, m, 0
    );

    if (d > now) {
      return { name, time: t, date: d };
    }
  }

  // After Isyak → Subuh tomorrow
  const [h, m] = todayData.Subuh.split(":").map(Number);
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  tomorrow.setHours(h, m, 0, 0);

  return { name: "Subuh", time: todayData.Subuh, date: tomorrow };
}


// Update hero section next prayer info
function updateHeroNextPrayer(todayData) {
  if (!todayData) return;

  const nameEl = document.getElementById("nextPrayerName");
  const timeEl = document.getElementById("nextPrayerTime");
  const cdEl   = document.getElementById("nextPrayerCountdown");

  if (!nameEl || !timeEl || !cdEl) return;

  const next = getNextPrayerDate(todayData);
  const diffSeconds = Math.floor((next.date - new Date()) / 1000);
  const diffMinutes = Math.ceil(diffSeconds / 60);

  nameEl.innerText = next.name;
  timeEl.innerText = `dalam jam ${next.time}`;

  if (diffMinutes <= 0) {
    cdEl.innerText = "NOW";
    return;
  }

  if (diffMinutes >= 60) {
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;

    cdEl.innerText = minutes > 0
      ? `dalam ${hours} Jam ${minutes} Minit`
      : `DALAM ${hours} Jam`;
  } else {
    cdEl.innerText = `DALAM ${diffMinutes} MINIT`;
  }
}

// Load prayer data from JSON file
function renderToday(today) {
  const el = document.getElementById("todayPrayer");
  if (!el) return;

  const order = ["Imsak","Subuh","Syuruk","Dhuha","Zohor","Asar","Maghrib","Isyak"];
  el.innerHTML = "";

  order.forEach(name => {
    if (!today[name]) return;

    const secondary = ["Imsak","Syuruk","Dhuha"].includes(name);

    el.innerHTML += `
      <div class="prayer-box ${secondary ? "secondary" : ""}">
        <strong>${today[name]}</strong>
        <span>${name}</span>
      </div>
    `;
  });
}

// Render a random hadith (daily)
function renderDailyHadith(todayKey) {
  if (typeof hadithList === "undefined") return;

  const textEl = document.getElementById("hadithText");
  const sourceEl = document.getElementById("hadithSource");

  if (!textEl || !sourceEl) return;

  // Convert YYYY-MM-DD → number (simple, stable)
  const seed = parseInt(todayKey.replace(/-/g, ""), 10);
  const index = seed % hadithList.length;

  const hadith = hadithList[index];

  textEl.innerText = hadith.text;
  sourceEl.innerText = hadith.source;
}

// Render monthly prayer times table
function renderMonthly(data) {
  const tbody = document.querySelector("#monthlyTable tbody");
  if (!tbody) return;

  tbody.innerHTML = "";

  Object.values(data).forEach(d => {
    tbody.innerHTML += `
      <tr data-date="${d.Date}">
        <td>${d.Date}</td>
        <td>${d.Imsak}</td>
        <td>${d.Subuh}</td>
        <td>${d.Syuruk}</td>
        <td>${d.Dhuha}</td>
        <td>${d.Zohor}</td>
        <td>${d.Asar}</td>
        <td>${d.Maghrib}</td>
        <td>${d.Isyak}</td>
      </tr>
    `;
  });
}

// Highlight today's row in the monthly table
function highlightTodayRow() {
  const todayKey = formatLocalDateKey();
  const row = document.querySelector(`tr[data-date="${todayKey}"]`);
  if (row) row.classList.add("today");
}

function getNextPrayerInfo(today) {
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const order = ["Imsak","Subuh","Syuruk","Dhuha","Zohor","Asar","Maghrib","Isyak"];

  for (const name of order) {
    const t = today[name];
    if (!t) continue;

    const min = timeToMinutes(t);
    if (min > nowMin) {
      const diff = min - nowMin;
      return {
        name,
        time: t,
        minutes: diff
      };
    }
  }

  return { name: "Subuh", time: "Esok", minutes: null };
}

// Update mobile prayer bar
function updateMobilePrayerBar(today) {
  const nameEl = document.getElementById("mpbName");
  const timeEl = document.getElementById("mpbTime");
  const cdEl   = document.getElementById("mpbCountdown");

  if (!nameEl || !timeEl || !cdEl) return;

  const info = getNextPrayerInfo(today);

  nameEl.innerText = info.name;
  timeEl.innerText = info.time;

  if (info.minutes !== null) {
    cdEl.innerText = `${info.minutes}m lagi`;
  } else {
    cdEl.innerText = "";
  }
}

// Apply day/night mode based on Maghrib time
function applyDayNightMode(today) {
  if (!today.Maghrib) return;

  const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
  const maghribMin = timeToMinutes(today.Maghrib);

  document.body.classList.toggle("night", nowMin >= maghribMin);
}

/* =========================
   Init
========================= */
async function initPrayerTimes() {
  const data = await loadPrayerData();
  const todayKey = formatLocalDateKey();
  const today = data[todayKey];
  if (!today) return;

  renderDates(todayKey);
  renderDailyHadith(todayKey);
  
  renderToday(today);
  renderMonthly(data);
  highlightTodayRow();

  updateHeroNextPrayer(today);
  updateMobilePrayerBar(today);
  applyDayNightMode(today);

  setInterval(() => updateHeroNextPrayer(today), 1000);
  setInterval(() => updateMobilePrayerBar(today), 60000);
  setInterval(() => applyDayNightMode(today), 30000);
}

initPrayerTimes();
