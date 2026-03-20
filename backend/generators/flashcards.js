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

  words.forEach(word => {
    const image = imageMap?.[word];

    html += `
      <div class="flashcard">
        ${displayMode !== "text" && image ? `<img src="${image}">` : ""}
        ${displayMode !== "image" ? `<p>${word}</p>` : ""}
      </div>
    `;
  });

  html += `
        </div>
      </body>
    </html>
  `;

  return html;
}