function renderFlashcardsV2() {
  const state = window.flashcardStateV2;

  if (state.mode === "custom") {
    renderCustomFlashcardsV2(state);
  } else {
    preview(); // keep using existing system
  }
}

function renderCustomFlashcardsV2(state) {
  const container = document.getElementById("preview");

  const { words, imageMap, borders, settings } = state;
  const { displayMode, cutLines } = settings;

  container.innerHTML = `
    <div class="flashcards-container">
      <div class="page ${cutLines ? "cut-lines" : ""}">
        ${words.map((word, i) => {
          const image = imageMap[word];
          const borderStyle = borders?.[i] || "";

          return `
            <div class="flashcard ${borderStyle}" data-index="${i}">
              <button class="delete-card" data-index="${i}">❌</button>

              ${displayMode !== "text" ? `
                <div class="image-container" data-index="${i}">
                  ${image ? `<img src="${image}">` : `<div class="image-placeholder">➕</div>`}
                </div>
              ` : ""}

              ${displayMode !== "image" ? `
                <p contenteditable="true" data-index="${i}" class="flashcard-text">
                  ${word}
                </p>
              ` : ""}
            </div>
          `;
        }).join("")}
      </div>
    </div>
  `;

  attachFlashcardEditHandlers();
  attachFlashcardBorders();
}