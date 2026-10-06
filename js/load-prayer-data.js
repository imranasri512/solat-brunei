/* =========================
   Prayer data loading
   Files live in data/YYYY-MM.json with zero-padded date keys (YYYY-MM-DD).
========================= */

// First and last month that has a data file. Update `to` when you add new months.
const PRAYER_DATA_RANGE = { from: "2026-01", to: "2026-12" };

const _monthCache = new Map();

function listDataMonths() {
  const months = [];
  let [y, m] = PRAYER_DATA_RANGE.from.split("-").map(Number);
  const [endY, endM] = PRAYER_DATA_RANGE.to.split("-").map(Number);

  while (y < endY || (y === endY && m <= endM)) {
    months.push(`${y}-${String(m).padStart(2, "0")}`);
    m++;
    if (m > 12) { m = 1; y++; }
  }
  return months;
}

// Load one month (cached). `ym` looks like "2026-10".
function loadMonthData(ym) {
  if (_monthCache.has(ym)) return _monthCache.get(ym);

  const promise = fetch(`data/${ym}.json`).then(response => {
    if (!response.ok) throw new Error(`Failed to load prayer data for ${ym}`);
    return response.json();
  });

  _monthCache.set(ym, promise);
  promise.catch(() => _monthCache.delete(ym)); // allow a retry after a failure
  return promise;
}

// Current month (kept for compatibility with older code).
async function loadPrayerData() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return loadMonthData(`${now.getFullYear()}-${month}`);
}

// One day's prayer times by key ("2026-10-06"), or null if there is no data.
async function getPrayerDay(dateKey) {
  try {
    const month = await loadMonthData(dateKey.slice(0, 7));
    return month[dateKey] || null;
  } catch (err) {
    return null;
  }
}
