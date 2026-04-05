const fs = require("fs");
const path = require("path");

const css = fs.readFileSync(
  path.join(__dirname, "../styles/worksheet.css"),
  "utf8"
);

const LIMITS = {
  "1": {
    fill: 9,
    match: 9,
    mcq: [
      { questions: 4, choices: 2 },
      { questions: 3, choices: 3 },
      { questions: 3, choices: 4 }
    ]
  },

  "2": {
    fill: 4,
    match: 4,
    mcq: [
      { questions: 1, choices: 8 },
      { questions: 2, choices: 2 }
    ]
  },

  "3": {
    fill: 2,
    match: 2,
    mcq: [
      { questions: 1, choices: 4 }
    ]
  },

  "4": {
    fill: 4,
    match: 4,
    mcq: [
      { questions: 2, choices: 2 }
    ]
  }
};

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

function getMCQLimit(layout, questionCount) {
  const configs = LIMITS[layout]?.mcq || [];
  for (const config of configs) {
    if (questionCount <= config.questions) {
      return config;
    }
  }
  return configs[configs.length - 1];
}

function wrapCard(content, title, sizeClass = "normal", type = "", index = 0, mode = "auto", borderStyle = "border-classic") {
  return `
    <div class="exercise-card ${sizeClass} ${borderStyle}" data-type="${type}" data-index="${index}">
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

function generateMatching(words, imageMap, layout) {
  // limit number of items
  const selected = words.slice(0, LIMITS[layout]?.match || 1);
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

function generateMCQ(words, imageMap, layout) {
  const config = getMCQLimit(layout, words.length);
  const selected = words.slice(0, config?.questions || 1);
  let sizeClass = "normal";
  if (selected.length >= 5) sizeClass = "large";
  else if (selected.length >= 4) sizeClass = "medium";

  let html = `
    <div>
      <h2>Choose the correct answer</h2>
  `;

  selected.forEach((word, index) => {
    // pick wrong answers based on config
    const others = words.filter(w => w !== word);
    const shuffled = others.sort(() => Math.random() - 0.5).slice(0, config.choices - 1);

    const choices = [word, ...shuffled]
      .sort(() => Math.random() - 0.5)
      .slice(0, config.choices);

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

function generateFill(words, imageMap, layout) {
  const selected = words.slice(0, LIMITS[layout]?.fill || 1);
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
    // Open questions exercise
    if (ex.type === "open") {
      let html = `<div class="questions-container">`;
      ex.questions.forEach((q, i) => {
        html += `
          <div class="open-question">
            <button class="delete-question">❌</button>

            <div class="open-image" data-image>
              ${q.image 
                ? `<img src="${q.image}" />`
                : `<div class="image-placeholder">➕</div>`
              }
            </div>
            <div class="open-text">
              <p>${i + 1}. <span data-editable>${q.question}</span></p>
            </div>
            <div class="open-answer">
              <div class="answer-line">A:</div>
            </div>
          </div>
        `;
      });
      html += `</div>`;
      html += `<button class="add-question">➕ Add Question</button>`;
      cards.push({
        html: wrapCard(html, "Open Questions", "normal", "open", cards.length, "custom", ex.borderStyle || "border-classic")
      });
    }
    // Fill exercise
    if (ex.type === "fill") {
      let html =`<div class="questions-container">`;
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
      cards.push({
        html: wrapCard(html, "Fill in the blanks", "normal", "fill", cards.length, "custom", ex.borderStyle || "border-classic")
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
        html: wrapCard(html, "Matching", "normal", "matching", cards.length, "custom", ex.borderStyle || "border-classic")
      });
    }
    //MCQ exercise
    if (ex.type === "mcq") {
      let html = `<div class="questions-container">`;
      ex.questions.forEach((q, i) => {
        html += `
          <div class="mcq-question">
            <button class="delete-question">❌</button>
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
      html += `<button class="add-question">➕ Add Question</button>`;
      cards.push({
        html: wrapCard(html, "Multiple Choice", "normal", "mcq", cards.length, "custom", ex.borderStyle || "border-classic")
      });
    }
  });
  return cards;
}

function generateWorksheet(data) {
  const { words, imageMap, matching, mcq, fill, mode, layout, title } = data;
  const currentMode = mode || "auto";

  // CUSTOM MODE
  if (data.mode === "custom" && data.customExercises) {
    let html = `
      <html>
        <head>
          <link href="https://fonts.googleapis.com/css2?family=Patrick+Hand&family=Schoolbell&family=Gloria+Hallelujah&family=Comic+Neue&family=Baloo+2&family=Nunito&family=Quicksand&family=Fredoka&display=swap" rel="stylesheet">
          <link rel="stylesheet" href="${BASE_URL}/styles/worksheet.css">
        </head>
        <body class="${data.font || "font-default"}">
    `;

    const cards = renderCustomExercises(data.customExercises || []);

    const layoutNum = Number(layout) || 4;
    const pages = [];

    for (let i = 0; i < cards.length; i += layoutNum) {
      pages.push(cards.slice(i, i + layoutNum));
    }

    pages.forEach(pageCards => {
      html += `<div class="page layout-${layoutNum}">`;
      const stickersHTML = (data.stickers || []).map((s, i) => `
        <div class="sticker-wrapper"
          data-id="${s.id}"
          data-index="${i}"
          style="
            left:${s.x}px;
            top:${s.y}px; 
            width:${s.width}px; 
            height:${s.height}px; 
            transform: rotate(${s.rotation}deg);"
        >
          <img class="sticker-img" src="${s.src}" />
          <div class="resize-handle"></div>
          <div class="rotate-handle"></div>
          <button class="sticker-delete">❌</button>
        </div>
      `).join("");
      html += stickersHTML;
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

  // AUTO MODE
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
        const match = generateMatching(words, imageMap, layout);
        cards.push({
          html: wrapCard(match.html, "Match the words", match.sizeClass, "matching", cards.length, data.mode)
        });
      }

      if (type === "mcq") {
        const mcqData = generateMCQ(words, imageMap, layout);
        cards.push({
          html: wrapCard(mcqData.html, "Multiple Choice Questions", mcqData.sizeClass, "mcq", cards.length, data.mode)
        });
      }

      if (type === "fill") {
        const fillData = generateFill(words, imageMap, layout);
        cards.push({
          html: wrapCard(fillData.html, "Fill in the blanks", fillData.sizeClass, "fill", cards.length, data.mode)
        });
      }
    });
  }
  else {
    if (matching) {
      const match = generateMatching(words, imageMap, layout);
      cards.push({ html: wrapCard(match.html, "Match the words", match.sizeClass, "matching", cards.length, data.mode) });
    }

    if (mcq) {
      const mcqData = generateMCQ(words, imageMap, layout);
      cards.push({ html: wrapCard(mcqData.html, "Multiple Choice Questions", mcqData.sizeClass, "mcq", cards.length, data.mode) });
    }

    if (fill) {
      const fillData = generateFill(words, imageMap, layout);
      cards.push({ html: wrapCard(fillData.html, "Fill in the blanks", fillData.sizeClass, "fill", cards.length, data.mode) });
    }
  }
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
    html += `</div>`;
  });
  
  html += `
      </body>
    </html>
  `;

  return html;
}

module.exports = generateWorksheet;