const express = require("express");
const router = express.Router();
const { getPublicItems , getPublicItemById } = require("../db/communityDB");
const generateFlashcards = require("../generators/flashcardsGenerator");
const generateWorksheet = require("../generators/worksheetGenerator");
const generateBingo = require("../generators/bingoGenerator");

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

router.post("/:id/preview", async (req, res) => {
  try {
    const { id } = req.params;
    const { data: item, error } = await getPublicItemById(id);
    if (error || !item) {
      return res.status(404).json({ error: "Item not found" });
    }
    const parsedData = typeof item.data === "string"
      ? JSON.parse(item.data)
      : item.data;
    if (parsedData.exercises && !parsedData.customExercises) {
      parsedData.mode = "custom";
      parsedData.customExercises = parsedData.exercises;
    }
    let html;
    if (item.type === "worksheet") {
      html = generateWorksheet(parsedData, { preview: true });
    }
    if (item.type === "flashcards") {
      html = generateFlashcards(parsedData, { preview: true });
    }
    if (item.type === "bingo") {
      html = generateBingo(parsedData, { preview: true });
    }
    res.send(html);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate preview" });
  }
});

module.exports = router;