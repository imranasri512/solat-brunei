async function loadPrayerData() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");

  const response = await fetch(`data/${year}-${month}.json`);
  if (!response.ok) throw new Error("Failed to load prayer data");

  return response.json();
}
