const fs = require("fs")
const path = require("path")

const css = fs.readFileSync(
  path.join(__dirname, "../styles/bingo.css"),
  "utf8"
)

function shuffle(array) {
  const arr = [...array]

  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }

  return arr
}

function createGrid(words, gridSize, freeCenter) {
  const grid = []
  let index = 0

  for (let r = 0; r < gridSize; r++) {

    const row = []

    for (let c = 0; c < gridSize; c++) {

      if (
        freeCenter &&
        r === Math.floor(gridSize / 2) &&
        c === Math.floor(gridSize / 2)
      ) {
        row.push({word: "FREE", image: null})
      } else {
        row.push({word: words[index], image: "https://via.placeholder.com/60"})
        index++
      }

    }

    grid.push(row)
  }

  return grid
}

function generateCards(words, gridSize, cardCount, freeCenter) {
  const cards = []
  const required = gridSize * gridSize - (freeCenter ? 1 : 0)

  if (words.length < required) {
    throw new Error(`Need at least ${required} words`)
  }

  const baseWords = shuffle(words).slice(0, required)

  for (let i = 0; i < cardCount; i++) {
    const rotated = []

    for (let j = 0; j < required; j++) {
      rotated.push(baseWords[(j + i) % required])
    }

    const grid = createGrid(rotated, gridSize, freeCenter)
    cards.push(grid)
  }

  return cards
}

function generateCardsHTML(cards, title, gridSize, displayMode) {
  let html = ``
  for (let i = 0; i < cards.length; i += 4) {

    html += `<div class="page">`

    const pageCards = cards.slice(i, i + 4)

    pageCards.forEach(grid => {

      html += `<div class="card">`
      html += `<h2>${title}</h2>`
      html += `<table style="--grid-size:${gridSize}">`

      grid.forEach(row => {

        html += `<tr>`

        row.forEach(word => {
          if (word === "FREE") {
            html += `<td class="free-cell"><div class="cell-content">★ FREE ★</div></td>`
            } else {
            html += `<td>${renderCell(word, displayMode)}</td>`
           }
        })

        html += `</tr>`
      })

      html += `</table>`
      html += `</div>`

    })

    html += `</div>`
  }

  return html
}

function renderCell(cell, displayMode) {

  if (displayMode === "text") {
    return `<div class="cell-content">${cell.word}</div>`
  }

  if (displayMode === "image-word") {
    return `
      <div class="cell-content">
        <img src="${cell.image || ""}">
        <span>${cell.word}</span>
      </div>
    `
  }

  if (displayMode === "image") {
    return `
      <div class="cell-content">
        <img src="${cell.image || ""}">
      </div>
    `
  }

}

function generateBingo(data) {
    let { words, gridSize, cardCount, freeCenter, uppercase, title, displayMode } = data
    if (uppercase) {
        words = words.map(word => word.toUpperCase())
    }

    const cards = generateCards(words, gridSize, cardCount, freeCenter)

    let html = `
    <html>
    <head>
    <style>${css}</style>
    </head>
    <body>
    `

    html += generateCardsHTML(cards, title, gridSize, displayMode)

    html += generateCallSheet(words)

    html += `
    </body>
    </html>
    `

    return html
}

function generateCallSheet(words) {

  let html = `
  <div class="call-sheet">
    <h1>Call Sheet</h1>
    <div class="call-grid">
  `

  words.forEach(word => {
    html += `<div class="call-word">${word}</div>`
  })

  html += `
    </div>
  </div>
  `

  return html
}

module.exports = generateBingo