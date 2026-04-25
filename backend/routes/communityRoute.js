const express = require("express");
const router = express.Router();
const { getPublicItems , getPublicItemById } = require("../db/communityDB");
const generateFlashcards = require("../generators/flashcardsGenerator");
const generateWorksheet = require("../generators/worksheetGenerator");
const generateBingo = require("../generators/bingoGenerator");
const supabase = require('../supabaseClient');

router.get("/", async (req, res) => {
  try {
    const sort = req.query.sort || "default";
    let query = supabase
      .from("worksheets")
      .select("*")
      .eq("visibility", "public");

    if (sort === "rating") {
      query = query.order("rating_avg", { ascending: false });
    }
    if (sort === "new") {
      query = query.order("created_at", { ascending: false });
    }
    const { data, error } = await query;
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
    const { data: item, error } = await getPublicItemById(id);
    if (error) {
      return res.status(500).json({ error: "Failed to fetch item" });
    }
    let userRating = null;
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: userData } = await supabase.auth.getUser(token);
      if (userData?.user) {
        const { data: ratingData } = await supabase
          .from("ratings")
          .select("rating")
          .eq("item_id", id)
          .eq("user_id", userData.user.id)
          .single();

        userRating = ratingData?.rating || null;
      }
    }
    res.json({
      ...item,
      user_rating: userRating 
    });
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

router.post("/:id/rate", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "No token provided" });
    }
    const token = authHeader.replace("Bearer ", "");
    // decode token with supabase
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) {
      return res.status(401).json({ error: "Invalid token" });
    }
    const userId = userData.user.id;
    const { id } = req.params;
    const { rating } = req.body;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Invalid rating" });
    }
    // insert or update
    const { error: upsertError } = await supabase
      .from("ratings")
      .upsert({
        user_id: userId,
        item_id: id,
        rating
      });
    if (upsertError) {
      return res.status(500).json({ error: "Failed to save rating" });
      console.log("UPSERT ERROR:", upsertError);
    }
    // recompute average
    const { data: ratings } = await supabase
      .from("ratings")
      .select("rating")
      .eq("item_id", id);
    const count = ratings.length;
    const avg = ratings.reduce((sum, r) => sum + r.rating, 0) / count;
    // update worksheet table
    await supabase
      .from("worksheets")
      .update({
        rating_avg: avg,
        rating_count: count
      })
      .eq("id", id);

    res.json({
      rating_avg: avg,
      rating_count: count
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Unexpected error" });
  }
});

module.exports = router;