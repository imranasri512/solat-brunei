function formatLocalDateKey() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

async function initPrayerTimes() {
  const data = await loadPrayerData();
  const todayKey = formatLocalDateKey();
  const today = data[todayKey];

  const hijriEl = document.getElementById("hijriDate");

if (hijriEl && typeof hijriData !== "undefined") {
  hijriEl.innerText =
    hijriData[todayKey]
      ? hijriData[todayKey]
      : "Tarikh Hijri tertakluk kepada pengumuman rasmi";
}

  if (!today) {
    console.warn("No data for today:", todayKey);
    return;
  }

  renderToday(today);
  renderMonthly(data);
  HighlightTodayRow();
  updatePrayerState(today);
  applyDayNightMode(today);
  updateMobilePrayerBar(today);
  updateMainCountdown(today);

  // Update prayer state every minute
  setInterval(() => {
    updatePrayerState(today);
    updateMobilePrayerBar(today);
    updateMainCountdown(today);
  }, 60000);

  setInterval(() => applyDayNightMode(today), 30000);
}

function renderToday(d) {
  const order = ["Imsak","Subuh","Syuruk","Dhuha","Zohor","Asar","Maghrib","Isyak"];
  const el = document.getElementById("todayPrayer");
  el.innerHTML = "";

  order.forEach(name => {
    if (!d[name]) return;
    const secondary = ["Imsak","Syuruk","Dhuha"].includes(name);
    el.innerHTML += `
      <div class="prayer-box ${secondary ? "secondary" : ""}">
        <strong>${d[name]}</strong>
        <span>${name}</span>
      </div>
    `;
  });
}

function renderMonthly(data) {
  const tbody = document.querySelector("#monthlyTable tbody");
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

function HighlightTodayRow() {
  const todayKey = formatLocalDateKey();
  const row = document.querySelector(`tr[data-date="${todayKey}"]`);

  if (row) {
    row.classList.add("today");}
  }

  function applyDayNightMode(todayData) {
  if (!todayData || !todayData.Maghrib) return;

  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();

  const [mh, mm] = todayData.Maghrib.split(":").map(Number);
  const maghribMin = mh * 60 + mm;

  if (nowMin >= maghribMin) {
    document.body.classList.add("night");
  } else {
    document.body.classList.remove("night");
  }
}

function getNextPrayerInfo(todayData) {
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();

  const order = ["Imsak","Subuh","Syuruk","Dhuha","Zohor","Asar","Maghrib","Isyak"];

  for (let i = 0; i < order.length; i++) {
    const t = todayData[order[i]];
    if (!t) continue;

    const [h, m] = t.split(":").map(Number);
    const prayerMin = h * 60 + m;

    if (prayerMin > nowMin) {
      const diff = prayerMin - nowMin;
      return {
        name: order[i],
        time: t,
        hours: Math.floor(diff / 60),
        minutes: diff % 60
      };
    }
  }

  return null; // after Isyak
}

function updateMobilePrayerBar(todayData) {
  const bar = document.getElementById("mobilePrayerBar");
  if (!bar || !todayData) return;

  const nameEl = document.getElementById("mpbName");
  const timeEl = document.getElementById("mpbTime");
  const cdEl   = document.getElementById("mpbCountdown");

  if (!nameEl || !timeEl || !cdEl) return;

const info = getNextPrayerInfo(todayData);

if (info) {
  nameEl.innerText = info.name;
  timeEl.innerText = info.time;
  cdEl.innerText   = `· ${info.hours}j ${info.minutes}m lagi`;
} else {
  nameEl.innerText = "Subuh";
  timeEl.innerText = "Esok";
  cdEl.innerText   = "";
  }
}

const footer = document.querySelector(".site-footer");
const mobileBar = document.getElementById("mobilePrayerBar");

if (footer && mobileBar) {
  const observer = new IntersectionObserver(
    ([entry]) => {
      mobileBar.style.opacity = entry.isIntersecting ? "0" : "1";
      mobileBar.style.pointerEvents = entry.isIntersecting ? "none" : "auto";
    },
    { threshold: 0.1 }
  );

  observer.observe(footer);
}


    
    // Delay ensures table is rendered first
 /*   setTimeout(() => {
      row.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });
    }, 300);
  }
} */

/* SCROLL LISTENER (FIXED – SINGLE INSTANCE) */
window.addEventListener("scroll", () => {
  document.querySelector(".top-bar")
    .classList.toggle("scrolled", window.scrollY > 20);
});

function timeToMinutes(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function updatePrayerState(todayData) {
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();

  const order = ["Imsak","Subuh","Syuruk","Dhuha","Zohor","Asar","Maghrib","Isyak"];
  let current = null;
  let next = null;

  for (let i = 0; i < order.length; i++) {
    const t = todayData[order[i]];
    if (!t) continue;

    const thisMin = timeToMinutes(t);
    const nextMin = order[i + 1] ? timeToMinutes(todayData[order[i + 1]]) : null;

    if (nowMin >= thisMin && (nextMin === null || nowMin < nextMin)) {
      current = order[i];
      next = order[i + 1];
      break;
    }
  }

  function updateCountdown(todayData) {
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();

  const order = ["Imsak","Subuh","Syuruk","Dhuha","Zohor","Asar","Maghrib","Isyak"];

  for (let i = 0; i < order.length; i++) {
    const t = todayData[order[i]];
    if (!t) continue;

    const [h, m] = t.split(":").map(Number);
    const prayerMin = h * 60 + m;

    if (prayerMin > nowMin) {
      const diff = prayerMin - nowMin;
      const hh = Math.floor(diff / 60);
      const mm = diff % 60;

      document.getElementById("countdown").innerText =
        `Seterusnya: ${order[i]} · ${hh}j ${mm}m lagi`;
      return;
    }
  }

  // After Isyak
  document.getElementById("countdown").innerText =
    "Menunggu Subuh esok";
}


  document.querySelectorAll(".prayer-box").forEach(box => {
    box.classList.remove("active", "next");

    if (box.querySelector("span").innerText === current) {
      box.classList.add("active");
    }
    if (box.querySelector("span").innerText === next) {
      box.classList.add("next");
    }
  });
}

function updateMainCountdown(todayData) {
  const el = document.getElementById("mainCountdown");
  if (!el) return;

  const info = getNextPrayerInfo(todayData);

  if (info) {
    el.innerText = `${info.name} · ${info.hours}j ${info.minutes}m lagi`;
  } else {
    el.innerText = "Menunggu Subuh esok";
  }
}



initPrayerTimes();
