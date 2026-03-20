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
  const icons = document.querySelectorAll(".reload-icon");

  icons.forEach(icon => {
    icon.onclick = async (e) => {
      e.stopPropagation();

      const container = icon.closest(".image-container");
      const img = container.querySelector("img");
      const word = img.dataset.word;

      icon.classList.add("loading");

      await reloadImage(word, container.closest(".flashcard"));

      icon.classList.remove("loading");
    };
  });
}

document.getElementById("words").addEventListener("input", debounce(preview, 500));
document.getElementById("title").addEventListener("input", debounce(preview, 500));
document.getElementById("displayMode").addEventListener("change", debounce(preview, 500));