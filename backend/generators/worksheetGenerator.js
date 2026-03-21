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

  html += `<div class="section">Words: ${words.join(", ")}</div>`;
  html += `<div class="section">Matching: ${matching}</div>`;
  html += `<div class="section">MCQ: ${mcq}</div>`;
  html += `<div class="section">Fill: ${fill}</div>`;

  html += `
        </div>
      </body>
    </html>
  `;

  return html;
}

module.exports = generateWorksheet;