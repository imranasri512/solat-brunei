/* =========================
   Upcoming Islamic events

   - Dates that fall inside js/hijri-data.js come straight from that data.
   - Dates after the end of that data are ESTIMATES: they use the browser's
     Umm al-Qura calendar, shifted so it lines up with the Brunei dates in
     hijri-data.js. They are labelled "Anggaran" on the page.
   - Ramadan, Syawal and Zulhijah are always subject to the official
     moon-sighting announcement in Brunei.
========================= */

const HIJRI_MONTHS = [
  "Muharam", "Safar", "Rabiulawal", "Rabiulakhir", "Jamadilawwal", "Jamadilakhir",
  "Rejab", "Syaaban", "Ramadan", "Syawal", "Zulkaedah", "Zulhijah"
];

const ISLAMIC_EVENTS = [
  { month: 1,  day: 1,  name: "Awal Muharam",         note: "Tahun Baru Hijrah" },
  { month: 1,  day: 10, name: "Hari Asyura",          note: "" },
  { month: 3,  day: 12, name: "Maulidur Rasul",       note: "Keputeraan Nabi Muhammad ﷺ" },
  { month: 7,  day: 27, name: "Israk dan Mikraj",     note: "" },
  { month: 8,  day: 15, name: "Nisfu Syaaban",        note: "" },
  { month: 9,  day: 1,  name: "Awal Ramadan",         note: "Permulaan puasa" },
  { month: 9,  day: 17, name: "Nuzul Quran",          note: "" },
  { month: 10, day: 1,  name: "Hari Raya Aidilfitri", note: "" },
  { month: 12, day: 9,  name: "Hari Arafah",          note: "" },
  { month: 12, day: 10, name: "Hari Raya Aidiladha",  note: "" }
];

const _umalquraFormat = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura-nu-latn", {
  day: "numeric", month: "numeric", year: "numeric", timeZone: "UTC"
});

// "2026-10-06" -> Date at 12:00 UTC (avoids timezone / daylight-saving edge cases)
function _dateFromKey(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12));
}

function _keyFromDate(date) {
  return date.toISOString().slice(0, 10);
}

function _addDaysUTC(date, days) {
  return new Date(date.getTime() + days * 86400000);
}

function _umalquraParts(date) {
  const p = Object.fromEntries(_umalquraFormat.formatToParts(date).map(x => [x.type, x.value]));
  return { day: Number(p.day), month: Number(p.month), year: Number(p.year) };
}

// "24 Rabiulakhir 1448H" -> { day: 24, month: 4, year: 1448 }
function _parseHijri(text) {
  const match = /^(\d+)\s+(\S+)\s+(\d+)H$/.exec(text);
  if (!match) return null;
  const month = HIJRI_MONTHS.indexOf(match[2]) + 1;
  if (!month) return null;
  return { day: Number(match[1]), month, year: Number(match[3]) };
}

function _formatHijri(h) {
  return `${h.day} ${HIJRI_MONTHS[h.month - 1]} ${h.year}H`;
}

function _findEvent(h) {
  return ISLAMIC_EVENTS.find(e => e.month === h.month && e.day === h.day) || null;
}

/*
  Returns the next `limit` events on or after `fromKey` ("YYYY-MM-DD"):
  [{ key, name, note, hijri, estimated }]
  `data` defaults to the global hijriData.
*/
function getUpcomingEvents(fromKey, limit = 6, data = (typeof hijriData !== "undefined" ? hijriData : {})) {
  const events = [];
  const keys = Object.keys(data).sort();
  const lastKey = keys.length ? keys[keys.length - 1] : null;

  // 1) Exact dates from the Hijri data
  for (const key of keys) {
    if (key < fromKey) continue;
    const h = _parseHijri(data[key]);
    const ev = h && _findEvent(h);
    if (ev) events.push({ key, name: ev.name, note: ev.note, hijri: _formatHijri(h), estimated: false });
  }

  // 2) Estimates after the data ends
  if (events.length < limit) {
    const start = lastKey && lastKey >= fromKey ? _addDaysUTC(_dateFromKey(lastKey), 1) : _dateFromKey(fromKey);

    // Work out how far Umm al-Qura is from the Brunei date on the last known day.
    let shift = 0;
    const lastHijri = lastKey ? _parseHijri(data[lastKey]) : null;
    if (lastHijri) {
      for (const k of [0, -1, 1, -2, 2]) {
        const u = _umalquraParts(_addDaysUTC(_dateFromKey(lastKey), k));
        if (u.day === lastHijri.day && u.month === lastHijri.month && u.year === lastHijri.year) {
          shift = k;
          break;
        }
      }
    }

    for (let i = 0; i < 800 && events.length < limit; i++) {
      const date = _addDaysUTC(start, i);
      const h = _umalquraParts(_addDaysUTC(date, shift));
      const ev = _findEvent(h);
      if (ev) events.push({ key: _keyFromDate(date), name: ev.name, note: ev.note, hijri: _formatHijri(h), estimated: true });
    }
  }

  events.sort((a, b) => a.key.localeCompare(b.key));
  return events.slice(0, limit);
}

function _daysUntil(fromKey, key) {
  return Math.round((_dateFromKey(key) - _dateFromKey(fromKey)) / 86400000);
}

function _countdownText(days) {
  if (days <= 0) return "Hari ini";
  if (days === 1) return "Esok";
  if (days < 60) return `Dalam ${days} hari`;
  const months = Math.round(days / 30);
  return `Dalam ~${months} bulan`;
}

function renderEvents(todayKey) {
  const list = document.getElementById("eventsList");
  if (!list) return;

  const events = getUpcomingEvents(todayKey, 6);
  list.innerHTML = "";

  if (!events.length) {
    list.textContent = "Tiada acara akan datang untuk dipaparkan.";
    return;
  }

  events.forEach((ev, i) => {
    const date = _dateFromKey(ev.key);
    const dayNum = date.getUTCDate();
    const monthShort = date.toLocaleDateString("ms-MY", { month: "short", timeZone: "UTC" });
    const weekday = date.toLocaleDateString("ms-MY", { weekday: "long", timeZone: "UTC" });
    const year = date.getUTCFullYear();

    const card = document.createElement("article");
    card.className = "event-card" + (i === 0 ? " next" : "");

    const badge = ev.estimated
      ? `<span class="badge est" title="Tarikh dianggarkan. Tertakluk kepada pengumuman rasmi.">Anggaran</span>`
      : `<span class="badge">Mengikut jadual</span>`;

    card.innerHTML = `
      <div class="event-date" aria-hidden="true">
        <span class="event-day">${dayNum}</span>
        <span class="event-month">${monthShort}</span>
      </div>
      <div class="event-body">
        <h3>${ev.name}</h3>
        <p class="event-meta">${weekday}, ${dayNum} ${monthShort} ${year}</p>
        <p class="event-meta">${ev.hijri}${ev.note ? " · " + ev.note : ""}</p>
        <div class="event-foot">
          <span class="event-countdown">${_countdownText(_daysUntil(todayKey, ev.key))}</span>
          ${badge}
        </div>
      </div>
    `;
    list.appendChild(card);
  });
}
