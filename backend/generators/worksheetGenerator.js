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

function generateMCQ(words, imageMap) {
  const selected = words.slice(0, 5); // number of questions

  let html = `
    <div class="exercise">
      <h2>Choose the correct answer</h2>
  `;

  selected.forEach((word, index) => {
    // pick 2 wrong answers
    const others = words.filter(w => w !== word);
    const shuffled = others.sort(() => Math.random() - 0.5).slice(0, 2);

    const choices = [word, ...shuffled]
      .sort(() => Math.random() - 0.5);

    const img = imageMap?.[word];

    html += `
      <div class="mcq-question">
        <div class="mcq-image">
          ${img ? `<img src="${img}" />` : ""}
        </div>

        <div class="mcq-text">
          <p>${index + 1}. What is this?</p>

          ${choices.map((choice, i) => `
            <div class="mcq-option">
              ${String.fromCharCode(97 + i)}) ${choice}
            </div>
          `).join("")}
        </div>
      </div>
    `;
  });

  html += `</div>`;

  return html;
}

function generateFill(words, imageMap) {
  const selected = words.slice(0, 5);

  const sentences = [
    "I see a ______.",
    "This is a ______.",
    "It is a ______.",
    "Look at the ______.",
    "The picture represents a ______."
  ];

  let html = `
    <div class="exercise">
      <h2>Fill in the blanks</h2>
  `;

  selected.forEach((word, index) => {
    const img = imageMap?.[word];

    const sentence =
      sentences[Math.floor(Math.random() * sentences.length)];

    html += `
      <div class="fill-question">
        <div class="fill-image">
          ${img ? `<img src="${img}" />` : ""}
        </div>

        <div class="fill-text">
          <p>${index + 1}. ${sentence}</p>
        </div>
      </div>
    `;
  });

  html += `</div>`;

  return html;
}

function generateWorksheet(data) {
  const { words, imageMap, matching, mcq, fill, wsearch, sbuilding, mode } = data;
  const currentMode = mode || "auto";

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
    html += generateMCQ(words, imageMap);
  }

  if (fill) {
    html += generateFill(words, imageMap);
  }

  if (wsearch) {
    html += `
      <div class="exercise">
        <h2>Word Search</h2>
        <p>Coming soon...</p>
      </div>
    `;
  }

  if (sbuilding) {
    html += `
      <div class="exercise">
        <h2>Sentence Building</h2>
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