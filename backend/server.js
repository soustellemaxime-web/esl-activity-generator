const express = require("express")
const cors = require("cors")
const generateBingo = require("./generators/bingo")
const generatePDF = require("./services/pdfService")

const app = express()

app.use(cors())
app.use(express.json())

app.post("/generate-bingo", async (req, res) => {
    const html = generateBingo(req.body)
    const pdf = await generatePDF(html)
    res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=bingo.pdf"
    })
    res.send(pdf)
})

app.listen(3000, () => {
  console.log("Server running on port 3000")
})