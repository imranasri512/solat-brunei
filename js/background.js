const images = [
  "assets/masjid_soas.png",
  "assets/masjid_jame.png"
];

const bg1 = document.querySelector(".bg-1");
const bg2 = document.querySelector(".bg-2");

let index = 0;
let showFirst = true;

bg1.style.backgroundImage = `url(${images[0]})`;
bg1.classList.add("active");

setInterval(() => {
  index = (index + 1) % images.length;

  const fadeIn = showFirst ? bg2 : bg1;
  const fadeOut = showFirst ? bg1 : bg2;

  fadeIn.style.backgroundImage = `url(${images[index]})`;
  fadeIn.classList.add("active");
  fadeOut.classList.remove("active");

  showFirst = !showFirst;
}, 15000);
