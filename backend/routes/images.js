const express = require("express");
require("dotenv").config();

const router = express.Router();

const cache = {};

router.get("/", async (req, res) => {
  const word = req.query.word?.toLowerCase();

  if (!word) {
    return res.status(400).json({ error: "Missing word" });
  }

  if (cache[word]) {
    return res.json({ source: "cache", images: cache[word] });
  }

  try {
    const url = `https://pixabay.com/api/?key=${process.env.PIXABAY_API_KEY}&q=${encodeURIComponent(word)}&image_type=photo&per_page=5`;

    const response = await fetch(url);
    const data = await response.json();

    const images = data.hits.map(img => img.webformatURL);

    cache[word] = images;

    res.json({ source: "api", images });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Image fetch failed" });
  }
});

module.exports = router;