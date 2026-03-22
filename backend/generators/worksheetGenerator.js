const fs = require("fs");
const path = require("path");

const css = fs.readFileSync(
  path.join(__dirname, "../styles/worksheet.css"),
  "utf8"
);

const EXERCISE_SIZES = {
  matching: 1,
  mcq: 1,
  fill: 1
};

const LIMITS = {
  matching: 6,
  mcq: 4,
  fill: 4
};

const MAX_UNITS = 2;

function generateMatching(words, imageMap) {
  // limit number of items
  const selected = words.slice(0, LIMITS.matching);

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
  const selected = words.slice(0, LIMITS.mcq);

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
  const selected = words.slice(0, LIMITS.fill);

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

function paginateExercises(exercises) {
  const pages = [];
  let currentPage = [];
  let currentSize = 0;

  exercises.forEach(ex => {
    if (currentSize + ex.size > MAX_UNITS) {
      pages.push(currentPage);
      currentPage = [];
      currentSize = 0;
    }

    currentPage.push(ex);
    currentSize += ex.size;
  });

  if (currentPage.length > 0) {
    pages.push(currentPage);
  }

  return pages;
}

function generateWorksheet(data) {
  const { words, imageMap, matching, mcq, fill, wsearch, sbuilding, mode } = data;
  const currentMode = mode || "auto";
  const exercises = [];

  if (matching) exercises.push({ type: "matching", size: EXERCISE_SIZES.matching });
  if (mcq) exercises.push({ type: "mcq", size: EXERCISE_SIZES.mcq });
  if (fill) exercises.push({ type: "fill", size: EXERCISE_SIZES.fill });

  const pages = paginateExercises(exercises);

  let html = `
    <html>
      <head>
        <style>${css}</style>
      </head>
      <body>
  `;

  // Add blocks depending on selection

    pages.forEach(page => {
    html += `<div class="page">`;

    html += `<h1>Worksheet</h1>`;

    page.forEach(ex => {
      if (ex.type === "matching") {
        html += generateMatching(words, imageMap);
      }

      if (ex.type === "mcq") {
        html += generateMCQ(words, imageMap);
      }

      if (ex.type === "fill") {
        html += generateFill(words, imageMap);
      }
    });
    html += `</div>`;
  });

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
      </body>
    </html>
  `;

  return html;
}

module.exports = generateWorksheet;