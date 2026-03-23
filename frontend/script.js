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
  const cutLinesEl = document.getElementById("cutLines");
  const cutLines = cutLinesEl ? cutLinesEl.checked : false;

  return { words, gridSize, cardCount, freeCenter, uppercase, title, displayMode, cutLines }
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

const themeBtn = document.getElementById("toggleTheme");
if (themeBtn) {
  themeBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark");
  });
}