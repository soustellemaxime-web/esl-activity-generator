const express = require("express");
const router = express.Router();
const { getPublicItems , getPublicItemById } = require("../db/communityDB");

router.get("/", async (req, res) => {
  try {
    const { data, error } = await getPublicItems();
    if (error) {
      return res.status(500).json({ error: "Failed to load community items" });
    }
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Unexpected error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await getPublicItemById(id);
    if (error) {
      return res.status(500).json({ error: "Failed to fetch item" });
    }
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Unexpected error" });
  }
});

module.exports = router;