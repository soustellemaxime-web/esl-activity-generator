let globalImageMap = {};

function getFormData() {
  const title = document.getElementById("title")?.value || "";
  const uppercase = document.getElementById("uppercase")?.checked || false;
  const words = parseWords(
     document.getElementById("words")?.value || ""
  )

  const gridSizeEl = document.getElementById("gridSize")
  const gridSize = gridSizeEl ? Number(gridSizeEl.value) : null
  const cardCountEl = document.getElementById("cardCount")
  const cardCount = cardCountEl ? Number(cardCountEl.value) : null
  const freeCenterEl = document.getElementById("freeCenter")
  const freeCenter = freeCenterEl ? freeCenterEl.checked : false
  const displayMode = document.getElementById("displayMode")?.value || "text"

  return { words, gridSize, cardCount, freeCenter, uppercase, title, displayMode }
}

async function loadImages(words, existingMap = {}) {
  const uniqueWords = [...new Set(words)];
  const missingWords = uniqueWords.filter(word => !(word in existingMap));

  if (missingWords.length === 0) {
    return existingMap;
  }

  const promises = missingWords.map(word =>
    fetch(`http://localhost:3000/api/images?word=${word}`)
      .then(res => res.json())
      .then(async data => {
        const imageUrl = data.image;

        if (!imageUrl) return { word, image: null };

        const res = await fetch(imageUrl);
        const blob = await res.blob();

        const base64 = await new Promise(resolve => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        });

        return { word, image: base64 };
      })
  );

  const results = await Promise.all(promises);

  const newMap = { ...existingMap };

  results.forEach(({ word, image }) => {
    newMap[word] = image;
  });

  return newMap;
}

async function preview() {
  const previewDiv = document.getElementById("preview");
  previewDiv.innerHTML = "";
  const scrollY = window.scrollY;
  previewDiv.innerHTML = `
    <div style="text-align:center; padding:20px;">
      ⏳ Generating ${window.API_BASE}...
    </div>
  `;

  const data = getFormData()

  if (data.displayMode !== "text") {
    globalImageMap = await loadImages(data.words, globalImageMap);
  }

  data.imageMap = globalImageMap;
  const res = await fetch(`http://localhost:3000/api/${window.API_BASE}/preview`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  })

  const html = await res.text()

  document.getElementById("preview").innerHTML = html
  window.scrollTo(0, scrollY);
}


async function download() {

  const btn = document.getElementById("downloadBtn");
  btn.disabled = true;
  btn.textContent = "⏳ Generating PDF...";

  try {
      const data = getFormData()

      if (data.displayMode !== "text") {
        globalImageMap = await loadImages(data.words, globalImageMap);
      }

      data.imageMap = globalImageMap;
      
      const res = await fetch(`http://localhost:3000/api/${window.API_BASE}/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      })

      const blob = await res.blob()

      const url = window.URL.createObjectURL(blob)

      const a = document.createElement("a")
      a.href = url
      a.download = `${window.API_BASE}.pdf`
      a.click()
    } catch (err) {
    console.error(err);
  }
  btn.disabled = false;
  btn.textContent = "⬇️ Download PDF";
}

function debounce(func, delay) {

  let timer

  return function (...args) {

    clearTimeout(timer)

    timer = setTimeout(() => {
      func.apply(this, args)
    }, delay)

  }
}

const debouncedPreview = debounce(() => {
  const displayModeEl = document.getElementById("displayMode");
  if (!displayModeEl) return;
  const displayMode = displayModeEl.value;
  if (displayMode !== "text") return;
  preview();
}, 500);

function parseWords(text){
    return text
    .split(/[\n,;\t|]+/)
    .map(word => word.trim())
    .filter(word => word.length > 0)
}

document.getElementById("toggleTheme").addEventListener("click", () => {
  document.body.classList.toggle("dark");
});

const previewEl = document.getElementById("preview");
if (previewEl) {
  previewEl.addEventListener("click", async (e) => {
    const icon = e.target.closest(".reload-icon");
    if (!icon) return;

    const container = icon.closest(".image-container");
    const img = container.querySelector("img");
    if (!img) return;

    const word = img.dataset.word;

    icon.classList.add("loading");

    const res = await fetch(`http://localhost:3000/api/images?word=${word}&t=${Date.now()}`);
    const data = await res.json();

    if (!data.image) return;

    const imageRes = await fetch(data.image);
    const blob = await imageRes.blob();

    const base64 = await new Promise(resolve => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });

    globalImageMap[word] = base64;

    document.querySelectorAll(`img[data-word="${word}"]`).forEach(el => {
      el.src = base64;
      el.style.opacity = "0.5";
      setTimeout(() => el.style.opacity = "1", 200);
    });

    icon.classList.remove("loading");
  });
}