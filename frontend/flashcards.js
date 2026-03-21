window.API_BASE = "flashcards";

async function reloadImage(word, cardElement) {
  try {
    const res = await fetch(`http://localhost:3000/api/images?word=${encodeURIComponent(word)}`);
    const data = await res.json();

    if (!data.image) return;

    const img = cardElement.querySelector("img");
    if (img) {
      img.src = data.image;
    }

  } catch (err) {
    console.error("Reload image failed:", err);
  }
}

document.getElementById("words").addEventListener("input", debounce(preview, 500));
document.getElementById("title").addEventListener("input", debounce(preview, 500));
document.getElementById("displayMode").addEventListener("change", debounce(preview, 500));
document.getElementById("cutLines").addEventListener("change", debounce(preview, 500));