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

function wrapCard(content, title, sizeClass = "normal", type = "", index = 0, mode = "auto") {
  return `
    <div class="exercise-card ${sizeClass}" data-type="${type}" data-index="${index}">
      ${mode === "custom" ? `
        <div class="card-controls">
          <button class="delete-card">❌</button>
          <button class="duplicate-card">📄</button>
        </div>
      ` : ""}
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
          <p><span data-editable>${index + 1}. ${sentence}</span></p>
        </div>
      </div>
    `;
  });

  html += `</div>`;

  return {html, sizeClass};
}

function renderCustomExercises(exercises) {
  const cards = [];
  exercises.forEach(ex => {
    // Fill exercise
    if (ex.type === "fill") {
      let html = `<div><h2>Fill in the blanks</h2>`;
      html += `<div class="questions-container">`;
      ex.questions.forEach((q, i) => {
        html += `
          <div class="fill-question">
            <button class="delete-question">❌</button>
            <div class="fill-image" data-image>
              ${q.image ? `<img src="${q.image}" />` : `<div class="image-placeholder">➕</div>`}
            </div>
            <div class="fill-text">
              <p>${i + 1}.<span data-editable>${q.sentence}</span></p>
            </div>
          </div>
        `;
      });
      html += `</div>`;
      html += `<button class="add-question">➕ Add Question</button>`;
      html += `</div>`;
      cards.push({
        html: wrapCard(html, "Fill in the blanks", "normal", "fill", cards.length, "custom")
      });
    }
    //Matching exercise
    if (ex.type === "matching") {
      let html = `<div class="matching-container">`;
      ex.pairs.forEach((p, i) => {
        html += `
          <div class="matching-row">
            <button class="delete-pair">❌</button>
            <div class="match-left">
              ${i + 1}. <span data-editable>${p.word}</span>
            </div>
            <div class="match-right" data-image>
              <span class="match-label">${String.fromCharCode(65 + i)}.</span>
              ${p.image 
                ? `<img src="${p.image}" />`
                : `<div class="image-placeholder">➕</div>`
              }
            </div>
          </div>
        `;
      });

      html += `</div>`;
      html += `<button class="add-pair">➕ Add pair</button>`;
      cards.push({
        html: wrapCard(html, "Matching", "normal", "matching", cards.length, "custom")
      });
    }
    //MCQ exercise
    if (ex.type === "mcq") {
      let html = `<div class="questions-container">`;
      ex.questions.forEach((q, i) => {
        html += `
          <div class="mcq-question">
            <div class="mcq-image" data-image>
              ${q.image 
                ? `<img src="${q.image}" />`
                : `<div class="image-placeholder">➕</div>`
              }
            </div>
            <div class="mcq-text">
              <p><span data-editable>${q.question}</span></p>
              <ul class="mcq-choices">
                ${q.choices.map(choice => `
                  <li class="mcq-choice">
                    <span data-editable>${choice}</span>
                    <button class="delete-choice">❌</button>
                  </li>
                `).join("")}
              </ul>
              <button class="add-choice">➕ Add choice</button>
            </div>
          </div>
        `;
      });
      html += `</div>`;
      cards.push({
        html: wrapCard(html, "Multiple Choice", "normal", "mcq", cards.length, "custom")
      });
    }
  });
  return cards;
}

function generateWorksheet(data) {
  const { words, imageMap, matching, mcq, fill, wsearch, sbuilding, mode, layout, title } = data;
  const currentMode = mode || "auto";

  if (data.mode === "custom" && data.customExercises) {
    let html = `
      <html>
        <head>
          <style>${css}</style>
        </head>
        <body>
    `;

    const cards = renderCustomExercises(data.customExercises || []);

    const layoutNum = Number(layout) || 4;
    const pages = [];

    for (let i = 0; i < cards.length; i += layoutNum) {
      pages.push(cards.slice(i, i + layoutNum));
    }

    pages.forEach(pageCards => {
      html += `<div class="page layout-${layoutNum}">`;
      html += `<div class="page-title">${title || "Worksheet"}</div>`;

      pageCards.forEach(card => {
        html += card.html;
      });

      html += `</div>`;
    });

    html += `
        </body>
      </html>
    `;

    return html;
  }

  let html = `
    <html>
      <head>
        <style>${css}</style>
      </head>
      <body>
  `;

  let cards = [];
  const { exercises } = data;
  if (exercises && exercises.length > 0) {
    exercises.forEach(type => {
      if (type === "matching") {
        const match = generateMatching(words, imageMap);
        cards.push({
          html: wrapCard(match.html, "Match the words", match.sizeClass, "matching", cards.length, data.mode)
        });
      }

      if (type === "mcq") {
        const mcqData = generateMCQ(words, imageMap);
        cards.push({
          html: wrapCard(mcqData.html, "Multiple Choice Questions", mcqData.sizeClass, "mcq", cards.length, data.mode)
        });
      }

      if (type === "fill") {
        const fillData = generateFill(words, imageMap);
        cards.push({
          html: wrapCard(fillData.html, "Fill in the blanks", fillData.sizeClass, "fill", cards.length, data.mode)
        });
      }
    });
  }
  else {
    if (matching) {
      const match = generateMatching(words, imageMap);
      cards.push({ html: wrapCard(match.html, "Match the words", match.sizeClass, "matching", cards.length, data.mode) });
    }

    if (mcq) {
      const mcqData = generateMCQ(words, imageMap);
      cards.push({ html: wrapCard(mcqData.html, "Multiple Choice Questions", mcqData.sizeClass, "mcq", cards.length, data.mode) });
    }

    if (fill) {
      const fillData = generateFill(words, imageMap);
      cards.push({ html: wrapCard(fillData.html, "Fill in the blanks", fillData.sizeClass, "fill", cards.length, data.mode) });
    }
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
    html += `<div class="page-title">${title || "Worksheet"}</div>`;

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