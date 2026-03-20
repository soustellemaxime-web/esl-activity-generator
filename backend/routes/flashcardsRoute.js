const express = require("express");

const generateFlashcards = require("../generators/flashcardsGenerator");
const generatePDF = require("../services/pdfService");

const router = express.Router();

router.post("/preview", (req, res) => {
  const html = generateFlashcards(req.body);
  res.send(html);
});

router.post("/generate", async (req, res) => {
  const html = generateFlashcards(req.body);
  const pdf = await generatePDF(html);

  res.set({
    "Content-Type": "application/pdf",
    "Content-Disposition": "attachment; filename=flashcards.pdf"
  });

  res.send(pdf);
});

module.exports = router;