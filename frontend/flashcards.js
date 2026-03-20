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

function attachImageReload() {
  const cards = document.querySelectorAll(".flashcard");

  cards.forEach(card => {
    const img = card.querySelector("img");
    const word = card.dataset.word;

    if (!img || !word) return;

    img.onclick = () => reloadImage(word, card);
  });
}

document.getElementById("words").addEventListener("input", debounce(preview, 500));
document.getElementById("title").addEventListener("input", debounce(preview, 500));
document.getElementById("displayMode").addEventListener("change", debounce(preview, 500));