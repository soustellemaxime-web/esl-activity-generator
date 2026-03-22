const express = require("express");

const generateWorksheet = require("../generators/worksheetGenerator");
const generatePDF = require("../services/pdfService");

const router = express.Router();

// preview
router.post("/preview", (req, res) => {
  try {
    const html = generateWorksheet(req.body);
    res.send(html);
  } catch (err) {
    console.error(err);
    res.status(400).send(err.message);
  }
});

router.post("/generate", async (req, res) => {
  const html = generateWorksheet(req.body);
  const pdf = await generatePDF(html);

  res.set({
    "Content-Type": "application/pdf",
    "Content-Disposition": "attachment; filename=worksheet.pdf"
  });
  res.send(pdf);
});


module.exports = router;