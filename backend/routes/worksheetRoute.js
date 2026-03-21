const express = require("express");

const generateWorksheet = require("../generators/worksheetGenerator");

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

module.exports = router;