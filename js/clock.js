function updateClock() {
  const now = new Date();

  const clockEl = document.getElementById("clock");
  const dateEl = document.getElementById("dateText");

  if (clockEl) {
    clockEl.innerText = now.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true
    });
  }

  if (dateEl) {
    dateEl.innerText = now.toLocaleDateString("ms-MY", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  }
}

updateClock();
setInterval(updateClock, 1000);
