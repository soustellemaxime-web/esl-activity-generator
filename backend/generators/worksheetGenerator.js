const fs = require("fs");
const path = require("path");

const css = fs.readFileSync(
  path.join(__dirname, "../styles/worksheet.css"),
  "utf8"
);

const LIMITS = {
  matching: 6,
  mcq: 4,
  fill: 4
};

function wrapCard(content, title, sizeClass = "normal") {
  return `
    <div class="exercise-card ${sizeClass}">
      <h3>${title}</h3>
      ${content}
    </div>
  `;
}

function generateMatching(words, imageMap) {
  // limit number of items
  const selected = words.slice(0, LIMITS.matching);
  let sizeClass = "normal";
  if (selected.length >= 5) sizeClass = "large";
  else if (selected.length >= 4) sizeClass = "medium";

  // shuffle images separately
  const shuffled = [...selected].sort(() => Math.random() - 0.5);

  let html = `
    <div>
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

  return {html, sizeClass};
}

function generateMCQ(words, imageMap) {
  const selected = words.slice(0, LIMITS.mcq);
  let sizeClass = "normal";
  if (selected.length >= 5) sizeClass = "large";
  else if (selected.length >= 4) sizeClass = "medium";

  let html = `
    <div>
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

  return {html, sizeClass};
}

function generateFill(words, imageMap) {
  const selected = words.slice(0, LIMITS.fill);
  let sizeClass = "normal";
  if (selected.length >= 5) sizeClass = "large";
  else if (selected.length >= 4) sizeClass = "medium";

  const sentences = [
    "I see a ______.",
    "This is a ______.",
    "It is a ______.",
    "Look at the ______.",
    "The picture represents a ______."
  ];

  let html = `
    <div>
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

  return {html, sizeClass};
}

function generateWorksheet(data) {
  const { words, imageMap, matching, mcq, fill, wsearch, sbuilding, mode, layout } = data;
  const currentMode = mode || "auto";

  let html = `
    <html>
      <head>
        <style>${css}</style>
      </head>
      <body>
  `;

  const cards = [];

  if (matching) {
    const match = generateMatching(words, imageMap);
    cards.push({ html: wrapCard(match.html, "Match the words", match.sizeClass) });
  }

  if (mcq) {
    const mcq = generateMCQ(words, imageMap);
    cards.push({ html: wrapCard(mcq.html, "Multiple Choice Questions", mcq.sizeClass) });
  }

  if (fill) {
    const fill = generateFill(words, imageMap);
    cards.push({ html: wrapCard(fill.html, "Fill in the blanks", fill.sizeClass) });
  }

  /*
  if (wsearch) {
    html += `
      <div>
        <h2>Word Search</h2>
        <p>Coming soon...</p>
      </div>
    `;
  }

  if (sbuilding) {
    html += `
      <div>
        <h2>Sentence Building</h2>
        <p>Coming soon...</p>
      </div>
    `;
  } 
  */

  const layoutNum = Number(layout) || 4;
  const pages = [];
  for (let i = 0; i < cards.length; i+= layoutNum) {
    pages.push(cards.slice(i, i + layoutNum));
  }

  pages.forEach((pageCards, index) => {
    html += `<div class="page layout-${layoutNum}">`;
    html += `<div class="page-title">Worksheet</div>`;

    pageCards.forEach(card => {
      html += card.html;
    });

    //html += `<div class="page-number">Page ${index + 1}</div>`; //TODO Page numbers
    html += `</div>`;
  });
  
  html += `
      </body>
    </html>
  `;

  return html;
}

module.exports = generateWorksheet;