let globalImageMap = {};
const isFlashcardsPage = window.location.pathname.includes("flashcards");

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
      ⏳ Generating bingo...
    </div>
  `;

  const data = getFormData()

  if (data.displayMode !== "text") {
    globalImageMap = await loadImages(data.words, globalImageMap);
  }

  data.imageMap = globalImageMap;
  const endpoint = isFlashcardsPage ? "flashcards/preview" : "bingo/preview";
  const res = await fetch(`http://localhost:3000/api/${endpoint}`, {
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
      
      const endpoint = isFlashcardsPage ? "flashcards/generate" : "bingo/generate";
      const res = await fetch(`http://localhost:3000/api/${endpoint}`, {
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
      a.download = "bingo.pdf"
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
  const displayMode = document.getElementById("displayMode").value;
  if (displayMode !== "text") return;
  preview();
}, 500);

function updateWordRequirement() {
  if (!document.getElementById("gridSize")) return;
  const gridSize = Number(document.getElementById("gridSize").value)
  const freeCenter = document.getElementById("freeCenter").checked

  const words = parseWords(
    document.getElementById("words").value
  )

  const currentCount = words.length

  let required = gridSize * gridSize

  if (freeCenter) {
    required -= 1
  }

  const remaining = required - currentCount

  const element = document.getElementById("wordRequirement")

  if (remaining > 0) {
    element.style.color = "red"
  } else {
    element.style.color = "green"
  }

  let message = `Words: ${currentCount} / ${required}`
  if (remaining > 0) {
    message += ` (${remaining} more needed)`
  }

  document.getElementById("wordRequirement").textContent = message
}

function parseWords(text){
    return text
    .split(/[\n,;\t|]+/)
    .map(word => word.trim())
    .filter(word => word.length > 0)
}

function safeListener(id, event, callback) {
  const el = document.getElementById(id);
  if (el) el.addEventListener(event, callback);
}
  
safeListener("gridSize", "change", updateWordRequirement);
safeListener("freeCenter", "change", updateWordRequirement);
safeListener("words", "input", updateWordRequirement);
safeListener("words", "input", debouncedPreview);
safeListener("gridSize", "change", debouncedPreview);
safeListener("freeCenter", "change", debouncedPreview);
safeListener("title", "input", debouncedPreview);
safeListener("uppercase", "change", debouncedPreview);
safeListener("cardCount", "input", debouncedPreview);

document.getElementById("toggleTheme").addEventListener("click", () => {
  document.body.classList.toggle("dark");
});

const previewEl = document.getElementById("preview");
if (previewEl) {
  previewEl.addEventListener("click", async (e) => {
    document.getElementById("preview").addEventListener("click", async (e) => {
      const icon = e.target.closest(".reload-icon");
      if (!icon) return;

      const container = icon.closest(".image-container");
      const img = container.querySelector("img");

      if (!img) return;

      const word = img.dataset.word;
      icon.classList.add("loading");
      // force new image (ignore cache)
      const res = await fetch(`http://localhost:3000/api/images?word=${word}&t=${Date.now()}`);
      const data = await res.json();

      if (!data.image) return;

      // convert to base64 again
      const imageRes = await fetch(data.image);
      const blob = await imageRes.blob();

      const base64 = await new Promise(resolve => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });

      // update cache
      globalImageMap[word] = base64;

      // update image visually
        document.querySelectorAll(`img[data-word="${word}"]`)
        .forEach(el => {
          el.src = base64;

          // visual feedback
          el.style.opacity = "0.5";
          setTimeout(() => {
            el.style.opacity = "1";
        }, 200);
      });
      icon.classList.remove("loading");
    });
  });
}
updateWordRequirement()