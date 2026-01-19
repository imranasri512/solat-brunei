function updateClock() {
  const now = new Date();

  document.getElementById("clock").innerText =
    now.toLocaleTimeString("en-GB", { hour12: true });

  document.getElementById("dateText").innerText =
    now.toLocaleDateString("ms-MY", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    });

  // Hijri date
  const hijri = hijriData[todayKey];
  document.getElementById("hijriDate").innerText =
    now.toLocaleDateString("ms-MY-u-ca-islamic", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
}


setInterval(updateClock, 1000);
updateClock();
