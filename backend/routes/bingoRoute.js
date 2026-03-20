const express = require("express")

const generateBingo = require("../generators/bingoGenerator")
const generatePDF = require("../services/pdfService")

const router = express.Router()

// Preview
router.post("/preview", (req, res) => {
  try {
    const previewData = { ...req.body }
    previewData.cardCount = Math.min(previewData.cardCount, 2)

    const html = generateBingo(previewData)
    res.send(html)
  } catch (error) {
    console.error(error)
    res.status(400).send(error.message)
  }
})

// Generate PDF
router.post("/generate", async (req, res) => {
  const html = generateBingo(req.body)
  const pdf = await generatePDF(html)

  res.set({
    "Content-Type": "application/pdf",
    "Content-Disposition": "attachment; filename=bingo.pdf"
  })

  res.send(pdf)
})

module.exports = router