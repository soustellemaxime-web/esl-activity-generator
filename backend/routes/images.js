const express = require("express");
const router = express.Router();

const { getImages } = require("../services/imageService");

router.get("/", async (req, res) => {
  const word = req.query.word;

  if (!word) {
    return res.status(400).json({ error: "Missing word" });
  }

  try {
    const result = await getImages(word);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Image fetch failed" });
  }
});

module.exports = router;