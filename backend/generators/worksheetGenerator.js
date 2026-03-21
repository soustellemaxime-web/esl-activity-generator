const fs = require("fs");
const path = require("path");

const css = fs.readFileSync(
  path.join(__dirname, "../styles/worksheet.css"),
  "utf8"
);

function generateMatching(words, imageMap) {
  // limit number of items (important for layout)
  const selected = words.slice(0, 6);

  // shuffle images separately
  const shuffled = [...selected].sort(() => Math.random() - 0.5);

  let html = `
    <div class="exercise">
      <h2>Match the words to the pictures</h2>

      <div class="matching">
  `;

  // LEFT: words
  html += `<div class="matching-words">`;
  selected.forEach((word, i) => {
    html += `<div class="match-item">${i + 1}. ${word}</div>`;
  });
  html += `</div>`;

  // RIGHT: images
  html += `<div class="matching-images">`;
  shuffled.forEach((word, i) => {
    const letter = String.fromCharCode(65 + i);
    const img = imageMap?.[word];

    html += `
        <div class="match-item">
            <span class="match-label">${letter}.</span>
            ${img ? `<img src="${img}" />` : ""}
        </div>
        `;
  });
  html += `</div>`;

  html += `
      </div>
    </div>
  `;

  return html;
}

function generateWorksheet(data) {
  const { words, imageMap, matching, mcq, fill } = data;

  let html = `
    <html>
      <head>
        <style>${css}</style>
      </head>
      <body>
        <div class="page">
          <h1>Worksheet</h1>
  `;

  // Add blocks depending on selection

  if (matching) {
    html += generateMatching(words, imageMap);
  }

  if (mcq) {
    html += `
      <div class="exercise">
        <h2>Multiple Choice</h2>
        <p>Coming soon...</p>
      </div>
    `;
  }

  if (fill) {
    html += `
      <div class="exercise">
        <h2>Fill in the blanks</h2>
        <p>Coming soon...</p>
      </div>
    `;
  }

  html += `
        </div>
      </body>
    </html>
  `;

  return html;
}

module.exports = generateWorksheet;