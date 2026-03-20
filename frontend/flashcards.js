window.API_BASE = "flashcards";

document.getElementById("words").addEventListener("input", debounce(preview, 500));
document.getElementById("title").addEventListener("input", debounce(preview, 500));
document.getElementById("displayMode").addEventListener("change", debounce(preview, 500));