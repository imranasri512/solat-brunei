/* =========================
   Prayer time notifications

   Notifications are shown while the site is open in a browser tab or is
   installed to the home screen and running. Browsers do not let a plain
   website wake itself up in the background, so nothing fires once the tab
   is fully closed.
========================= */

const NOTIF_STORAGE_KEY = "waktusolat.notifications.v1";
const NOTIF_FIRED_KEY = "waktusolat.notifications.fired.v1";
const NOTIF_GRACE_MS = 5 * 60 * 1000; // still fire if the tab woke up up to 5 min late
const NOTIF_PRAYER_NAMES = ["Imsak", "Subuh", "Syuruk", "Dhuha", "Zohor", "Asar", "Maghrib", "Isyak"];

const NOTIF_DEFAULTS = {
  enabled: false,
  lead: 0,
  prayers: {
    Imsak: false, Subuh: true, Syuruk: false, Dhuha: false,
    Zohor: true, Asar: true, Maghrib: true, Isyak: true
  }
};

let notifSettings = loadNotifSettings();

/* ---------- storage ---------- */

function loadNotifSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(NOTIF_STORAGE_KEY));
    if (saved && typeof saved === "object") {
      return {
        enabled: !!saved.enabled,
        lead: Number(saved.lead) || 0,
        prayers: { ...NOTIF_DEFAULTS.prayers, ...(saved.prayers || {}) }
      };
    }
  } catch (err) { /* storage blocked or corrupt: use defaults */ }
  return JSON.parse(JSON.stringify(NOTIF_DEFAULTS));
}

function saveNotifSettings() {
  try { localStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify(notifSettings)); } catch (err) { /* ignore */ }
}

function loadFired() {
  try { return JSON.parse(localStorage.getItem(NOTIF_FIRED_KEY)) || {}; } catch (err) { return {}; }
}

function saveFired(fired) {
  try { localStorage.setItem(NOTIF_FIRED_KEY, JSON.stringify(fired)); } catch (err) { /* ignore */ }
}

/* ---------- capability ---------- */

function notificationsSupported() {
  return typeof window !== "undefined" && "Notification" in window;
}

function notificationPermission() {
  return notificationsSupported() ? Notification.permission : "unsupported";
}

async function registerNotificationWorker() {
  if (!("serviceWorker" in navigator)) return null;
  try {
    return await navigator.serviceWorker.register("sw.js");
  } catch (err) {
    return null;
  }
}

/* ---------- showing a notification ---------- */

async function showPrayerNotification(title, body, tag) {
  if (notificationPermission() !== "granted") return false;

  const options = {
    body,
    tag,
    icon: "/favicon.png",
    badge: "/favicon.png",
    lang: "ms"
  };

  try {
    // Service worker route (required on Android Chrome)
    if ("serviceWorker" in navigator) {
      const reg = (await navigator.serviceWorker.getRegistration()) || (await registerNotificationWorker());
      if (reg) {
        await reg.showNotification(title, options);
        return true;
      }
    }
    new Notification(title, options);
    return true;
  } catch (err) {
    try { new Notification(title, options); return true; } catch (e) { return false; }
  }
}

function notificationText(name, time, lead) {
  if (lead > 0) {
    return { title: `${name} dalam ${lead} minit`, body: `Waktu ${name}: ${time} · Brunei Darussalam` };
  }
  return { title: `Masuk waktu ${name}`, body: `${time} · Brunei Darussalam` };
}

/* ---------- scheduler ---------- */

function _prayerDateTime(dateKey, time) {
  const [y, m, d] = dateKey.split("-").map(Number);
  const [h, min] = time.split(":").map(Number);
  return new Date(y, m - 1, d, h, min, 0, 0);
}

async function checkNotifications() {
  if (!notifSettings.enabled || notificationPermission() !== "granted") return;

  const now = new Date();
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const dayKeys = [formatLocalDateKey(now), formatLocalDateKey(tomorrow)];

  const fired = loadFired();
  let changed = false;

  for (const dateKey of dayKeys) {
    const day = await getPrayerDay(dateKey);
    if (!day) continue;

    for (const name of NOTIF_PRAYER_NAMES) {
      if (!notifSettings.prayers[name] || !day[name]) continue;

      const target = _prayerDateTime(dateKey, day[name]);
      const fireAt = new Date(target.getTime() - notifSettings.lead * 60000);
      const late = now - fireAt;
      const id = `${dateKey}:${name}:${notifSettings.lead}`;

      if (late >= 0 && late <= NOTIF_GRACE_MS && !fired[id]) {
        fired[id] = now.getTime();
        changed = true;
        const text = notificationText(name, day[name], notifSettings.lead);
        showPrayerNotification(text.title, text.body, `${dateKey}-${name}`);
      }
    }
  }

  // Forget entries older than two days
  const cutoff = now.getTime() - 2 * 86400000;
  for (const id of Object.keys(fired)) {
    if (fired[id] < cutoff) { delete fired[id]; changed = true; }
  }
  if (changed) saveFired(fired);
}

/* ---------- settings panel ---------- */

function describeNotificationStatus() {
  const perm = notificationPermission();
  if (perm === "unsupported") return "Pelayar ini tidak menyokong notifikasi.";
  if (perm === "denied") return "Notifikasi disekat. Benarkan di tetapan pelayar untuk laman ini.";
  if (notifSettings.enabled && perm === "granted") return "Aktif. Anda akan dimaklumkan semasa laman ini dibuka.";
  return "Belum aktif.";
}

function syncNotificationUI() {
  const btn = document.getElementById("notifBtn");
  const toggle = document.getElementById("notifEnabled");
  const status = document.getElementById("notifStatus");
  const lead = document.getElementById("notifLead");
  const testBtn = document.getElementById("notifTest");
  const perm = notificationPermission();
  const active = notifSettings.enabled && perm === "granted";

  if (btn) btn.classList.toggle("on", active);
  if (toggle) {
    toggle.checked = active;
    toggle.disabled = perm === "unsupported" || perm === "denied";
  }
  if (status) status.textContent = describeNotificationStatus();
  if (lead) lead.value = String(notifSettings.lead);
  if (testBtn) testBtn.disabled = perm !== "granted";

  document.querySelectorAll("#notifPrayers input[type=checkbox]").forEach(box => {
    box.checked = !!notifSettings.prayers[box.value];
    box.disabled = !active;
  });
  if (lead) lead.disabled = !active;
}

async function setNotificationsEnabled(wantEnabled) {
  if (!wantEnabled) {
    notifSettings.enabled = false;
    saveNotifSettings();
    syncNotificationUI();
    return;
  }

  if (!notificationsSupported()) { syncNotificationUI(); return; }

  let perm = Notification.permission;
  if (perm === "default") {
    try { perm = await Notification.requestPermission(); } catch (err) { perm = Notification.permission; }
  }

  if (perm === "granted") {
    await registerNotificationWorker();
    notifSettings.enabled = true;
    saveNotifSettings();
    checkNotifications();
  } else {
    notifSettings.enabled = false;
    saveNotifSettings();
  }
  syncNotificationUI();
}

function initNotifications() {
  const btn = document.getElementById("notifBtn");
  const panel = document.getElementById("notifPanel");
  if (!btn || !panel) return;

  function setPanel(open) {
    panel.hidden = !open;
    btn.setAttribute("aria-expanded", String(open));
    if (open) syncNotificationUI();
  }

  btn.addEventListener("click", e => {
    e.stopPropagation();
    setPanel(panel.hidden);
  });

  document.addEventListener("click", e => {
    if (!panel.hidden && !panel.contains(e.target) && e.target !== btn) setPanel(false);
  });

  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && !panel.hidden) { setPanel(false); btn.focus(); }
  });

  document.getElementById("notifEnabled").addEventListener("change", e => {
    setNotificationsEnabled(e.target.checked);
  });

  document.getElementById("notifLead").addEventListener("change", e => {
    notifSettings.lead = Number(e.target.value) || 0;
    saveNotifSettings();
  });

  document.querySelectorAll("#notifPrayers input[type=checkbox]").forEach(box => {
    box.addEventListener("change", () => {
      notifSettings.prayers[box.value] = box.checked;
      saveNotifSettings();
    });
  });

  document.getElementById("notifTest").addEventListener("click", () => {
    showPrayerNotification("Waktu Solat Brunei", "Notifikasi berfungsi. Semoga bermanfaat.", "test");
  });

  // If the person already allowed notifications earlier, make sure the worker is ready.
  if (notifSettings.enabled && notificationPermission() === "granted") {
    registerNotificationWorker();
  } else if (notifSettings.enabled) {
    notifSettings.enabled = false; // permission was revoked in the browser
    saveNotifSettings();
  }

  syncNotificationUI();
  checkNotifications();
  setInterval(checkNotifications, 15000);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) checkNotifications();
  });
}
