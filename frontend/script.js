function getFormData() {

  const words = document
    .getElementById("words")
    .value
    .split("\n")
    .map(w => w.trim())
    .filter(w => w.length > 0)

  const gridSize = Number(document.getElementById("gridSize").value)
  const cardCount = Number(document.getElementById("cardCount").value)
  const freeCenter = document.getElementById("freeCenter").checked

  return { words, gridSize, cardCount, freeCenter }
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