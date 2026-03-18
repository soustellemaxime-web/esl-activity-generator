function shuffle(array) {
  const arr = [...array]

  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }

  return arr
}

function createGrid(words, gridSize) {
  const grid = []
  let index = 0

  for (let r = 0; r < gridSize; r++) {
    const row = []

    for (let c = 0; c < gridSize; c++) {
      row.push(words[index])
      index++
    }

    grid.push(row)
  }

  return grid
}

function generateCards(words, gridSize, cardCount) {
  const cards = []
  const required = gridSize * gridSize

  if (words.length < required) {
    throw new Error("Not enough words for the grid size")
  }

  const baseWords = shuffle(words).slice(0, required)

  for (let i = 0; i < cardCount; i++) {
    const rotated = []

    for (let j = 0; j < required; j++) {
      rotated.push(baseWords[(j + i) % required])
    }

    const grid = createGrid(rotated, gridSize)
    cards.push(grid)
  }

  return cards
}

function generateHTML(cards) {
  let html = `
  <html>
  <head>
  <style>
  body { font-family: Arial; }
  table { border-collapse: collapse; margin: 40px auto; }
  td {
    border: 2px solid black;
    width: 120px;
    height: 120px;
    text-align: center;
    font-size: 20px;
  }
  .card {
    page-break-after: always;
  }
  </style>
  </head>
  <body>
  `

  cards.forEach(grid => {
    html += `<div class="card"><table>`

    grid.forEach(row => {
      html += "<tr>"

      row.forEach(word => {
        html += `<td>${word}</td>`
      })

      html += "</tr>"
    })

    html += "</table></div>"
  })

  html += "</body></html>"

  return html
}

function generateBingo(data) {
  const { words, gridSize, cardCount } = data

  const cards = generateCards(words, gridSize, cardCount)

  return generateHTML(cards)
}

module.exports = generateBingo