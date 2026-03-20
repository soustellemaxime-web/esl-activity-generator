window.API_BASE = "bingo";

function updateWordRequirement() {
  const gridSize = Number(document.getElementById("gridSize").value);
  const freeCenter = document.getElementById("freeCenter").checked;

  const words = parseWords(document.getElementById("words").value);

  const currentCount = words.length;

  let required = gridSize * gridSize;
  if (freeCenter) required -= 1;

  const remaining = required - currentCount;

  const element = document.getElementById("wordRequirement");

  element.style.color = remaining > 0 ? "red" : "green";

  let message = `Words: ${currentCount} / ${required}`;
  if (remaining > 0) message += ` (${remaining} more needed)`;

  element.textContent = message;
}

document.getElementById("gridSize").addEventListener("change", updateWordRequirement);
document.getElementById("freeCenter").addEventListener("change", updateWordRequirement);
document.getElementById("words").addEventListener("input", updateWordRequirement);

// preview triggers
document.getElementById("words").addEventListener("input", debounce(preview, 500));
document.getElementById("gridSize").addEventListener("change", debounce(preview, 500));
document.getElementById("cardCount").addEventListener("input", debounce(preview, 500));
document.getElementById("freeCenter").addEventListener("change", debounce(preview, 500));
document.getElementById("uppercase").addEventListener("change", debounce(preview, 500));
document.getElementById("title").addEventListener("input", debounce(preview, 500));

updateWordRequirement();