/*
  Service worker for Waktu Solat Brunei.
  It only exists so notifications can be shown reliably (Android Chrome needs it)
  and so tapping a notification opens the site. It does not cache anything,
  so prayer times are always fetched fresh.
*/

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("notificationclick", event => {
  event.notification.close();

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(windows => {
      for (const client of windows) {
        if ("focus" in client) return client.focus();
      }
      return self.clients.openWindow("/");
    })
  );
});
