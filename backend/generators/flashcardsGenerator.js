const fs = require("fs");
const path = require("path");

const css = fs.readFileSync(
  path.join(__dirname, "../styles/flashcards.css"),
  "utf8"
);

function generateFlashcards(data) {
  const { words, imageMap, displayMode } = data;

  let html = `
    <html>
      <head>
        <style>${css}</style>
      </head>
      <body>
        <div class="flashcards-container">
  `;

  const cardsPerPage = 8;

  for (let i = 0; i < words.length; i += cardsPerPage) {
      html += `<div class="page">`;

      const pageWords = words.slice(i, i + cardsPerPage);

      pageWords.forEach(word => {
        const image = imageMap?.[word];

        html += `
          <div class="flashcard" data-word="${word}">
            ${displayMode !== "text" && image ? `<img src="${image}">` : ""}
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