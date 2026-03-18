function getFormData() {
  const title = document.getElementById("title").value
  const uppercase = document.getElementById("uppercase").checked
  const words = parseWords(
     document.getElementById("words").value
  )

  const gridSize = Number(document.getElementById("gridSize").value)
  const cardCount = Number(document.getElementById("cardCount").value)
  const freeCenter = document.getElementById("freeCenter").checked
  const displayMode = document.getElementById("displayMode").value

  return { words, gridSize, cardCount, freeCenter, uppercase, title, displayMode }
}


async function preview() {

  const data = getFormData()

  const res = await fetch("http://localhost:3000/preview-bingo", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  })

  const html = await res.text()

  document.getElementById("preview").innerHTML = html
}


async function download() {

  const data = getFormData()

  const res = await fetch("http://localhost:3000/generate-bingo", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  })

  const blob = await res.blob()

  const url = window.URL.createObjectURL(blob)

  const a = document.createElement("a")
  a.href = url
  a.download = "bingo.pdf"
  a.click()
}

function debounce(func, delay) {

  let timer

  return function (...args) {

    clearTimeout(timer)

    timer = setTimeout(() => {
      func.apply(this, args)
    }, delay)

  }
}

const debouncedPreview = debounce(preview, 500)

function updateWordRequirement() {

  const gridSize = Number(document.getElementById("gridSize").value)
  const freeCenter = document.getElementById("freeCenter").checked

  const words = parseWords(
    document.getElementById("words").value
  )

  const currentCount = words.length

  let required = gridSize * gridSize

  if (freeCenter) {
    required -= 1
  }

  const remaining = required - currentCount

  const element = document.getElementById("wordRequirement")

  if (remaining > 0) {
    element.style.color = "red"
  } else {
    element.style.color = "green"
  }

  let message = `Words: ${currentCount} / ${required}`
  if (remaining > 0) {
    message += ` (${remaining} more needed)`
  }

  document.getElementById("wordRequirement").textContent = message
}

function parseWords(text){
    return text
    .split(/[\n,;\t|]+/)
    .map(word => word.trim())
    .filter(word => word.length > 0)
}

document.getElementById("gridSize")
  .addEventListener("change", updateWordRequirement)

document.getElementById("freeCenter")
  .addEventListener("change", updateWordRequirement)

document.getElementById("words")
  .addEventListener("input", updateWordRequirement)

document.getElementById("words")
  .addEventListener("input", debouncedPreview)

document.getElementById("gridSize")
  .addEventListener("change", debouncedPreview)

document.getElementById("cardCount")
  .addEventListener("input", debouncedPreview)

document.getElementById("freeCenter")
  .addEventListener("change", debouncedPreview)

document.getElementById("uppercase")
  .addEventListener("change", debouncedPreview)

document.getElementById("title")
  .addEventListener("input", debouncedPreview)

updateWordRequirement()