const fs = require("fs");
const path = require("path");

const css = fs.readFileSync(
  path.join(__dirname, "../styles/worksheet.css"),
  "utf8"
);

function generateWorksheet(data) {
  const { words, matching, mcq, fill } = data;

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
    html += `
      <div class="exercise">
        <h2>Match the words</h2>
        <p>Coming soon...</p>
      </div>
    `;
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