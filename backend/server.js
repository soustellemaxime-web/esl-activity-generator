const express = require("express")
const cors = require("cors")

const generateBingo = require("./generators/bingo")

const app = express()

app.use(cors())
app.use(express.json())

app.post("/generate-bingo", (req, res) => {
  const html = generateBingo(req.body)

  res.send(html)
})

app.listen(3000, () => {
  console.log("Server running on port 3000")
})