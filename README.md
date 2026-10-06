# 🕌 Waktu Solat Brunei

**Waktu Solat Brunei** is a simple, clean, and mobile-friendly website that displays daily and monthly prayer times for **Brunei Darussalam**, based on the **official timetable issued by the Ministry of Religious Affairs (KHEU)**.

The website is designed to be easy to read at a glance, with a live clock, countdown to the next prayer time, and a full monthly schedule.

🌐 Live site: https://waktusolatbn.com

---

## ✨ Features

- ⏰ **Live clock** (Brunei time)
- 🕋 **Next prayer countdown**
- 📅 **Monthly prayer timetable** with a month selector (and a print view)
- 🗓️ **Upcoming Islamic events** (dates beyond the Hijri data are marked as estimates)
- 🔔 **Prayer time notifications** (while the site is open or installed to the home screen)
- 📱 **Mobile-first responsive design**
- 🌙 **Includes Dhuha prayer time**
- 📍 **Regional offsets** (Tutong +1 min, Belait +3 min)
- 🌄 **Elegant mosque backgrounds**
- 🔒 Served securely via HTTPS (Cloudflare Pages)

---

## 📖 Data Source & Accuracy

Prayer times shown on this website are based on the **official prayer timetable published by**:

> **Kementerian Hal Ehwal Ugama (KHEU), Brunei Darussalam**

This website is provided **for reference purposes only**.  
Any official changes or announcements remain subject to the authority of KHEU.

---

## 🌙 Hijri Date Notice

Hijri dates shown are for **general reference**.  
In Brunei Darussalam, the start of months such as **Ramadhan, Syawal, and Zulhijjah** is determined by **official moon sighting announcements**.

Users are advised to follow **official government announcements** for religious observances.

---

## 🖼️ Image Credits

Background images used on this website are credited to their respective photographers:

- **Masjid Sultan Omar Ali Saifuddien**  
  Photo by *Sam Garza* (Flickr)

- **Masjid Jame’ ‘Asr Hassanil Bolkiah**  
  Photo by *Jorge Láscar* (Flickr)

All images are used with attribution and respect to their original licenses.

---

## 🛠️ Tech Stack

- HTML, CSS, JavaScript (vanilla)
- Cloudflare Pages (hosting & CDN)
- GitHub (version control & deployment)
- Responsive CSS & modern layout techniques

---

## 🚀 Development & Deployment

This project uses **continuous deployment**:

- Changes are committed to GitHub
- Cloudflare Pages automatically builds and deploys the site
- No manual uploads required

---

## 🗂️ Adding a new year of data

1. Add `data/YYYY-MM.json` files with **zero-padded** date keys (`"2027-01-01"`).
2. Add the matching Hijri dates to `js/hijri-data.js`.
3. Update `PRAYER_DATA_RANGE` at the top of `js/load-prayer-data.js` so the month selector includes the new months.

Upcoming events use `js/hijri-data.js` where it has the dates and fall back to an
estimate afterwards, so they become exact automatically once the Hijri data is added.

---

## 🤝 Contributions

Contributions, suggestions, and improvements are welcome.

If you notice:
- UI issues
- Accessibility improvements
- Data inconsistencies
- Performance optimisations

Feel free to open an **issue** or submit a **pull request**.

---

## ⚠️ Disclaimer

This website is **not an official government website**.

It is an independent project intended to help the public easily access prayer time information.  
For official matters, always refer to announcements by **KHEU Brunei Darussalam**.

---

## © Copyright

© 2026 **Imran Asri**  
All rights reserved.
