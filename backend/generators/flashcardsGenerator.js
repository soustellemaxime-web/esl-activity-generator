const fs = require("fs");
const path = require("path");

const css = fs.readFileSync(
  path.join(__dirname, "../styles/flashcards.css"),
  "utf8"
);

function generateFlashcards(data) {
  const { words, imageMap, displayMode, cards } = data;

  let html = `
    <html>
      <head>
        <style>${css}</style>
      </head>
      <body>
        <div class="flashcards-container">
  `;

  const cardsPerPage = 8;

  const source = cards || words.map(w => ({
    text: w,
    image: imageMap?.[w]
  }));

  for (let i = 0; i < source.length; i += cardsPerPage) {
      html += `<div class="page ${data.cutLines ? "cut-lines" : ""}">`;

      const pageCards = source.slice(i, i + cardsPerPage);

      pageCards.forEach(card => {
        const word = card.text;
        const image = card.image;

        html += `
          <div class="flashcard" data-word="${word}">
            ${displayMode !== "text" && image ? `
              <div class="image-container">
                <img src="${image}" data-word="${word}">
                <div class="reload-icon">↻</div>
              </div>
            ` : ""}
            ${displayMode !== "image" ? `<p>${word}</p>` : ""}
          </div>
        `;
      });

      html += `</div>`;
    }

  html += `
        </div>
      </body>
    </html>
  `;

  return html;
}

module.exports = generateFlashcards;