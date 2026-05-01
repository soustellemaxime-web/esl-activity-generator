const express = require("express");
const router = express.Router();
const { getUserWorksheetStats} = require("../db/worksheetsDB")
const { getUserPlan, getUserFromToken, getUserUsername } = require("../utils/getUser")
const supabase = require('../supabaseClient');

router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    // Who is viewing
    const viewer = await getUserFromToken(req);
    const isOwner = viewer && viewer.id === id;
    // Get profile
    const userPlan = await getUserPlan(id);
    const userUsername = await getUserUsername(id);
    // Get worksheets (for stats)
    let worksheets = await getUserWorksheetStats(id);
    const totalItems = worksheets.length;
    // If NOT owner → keep only public
    if (!isOwner) {
        worksheets = worksheets.filter(w => w.visibility === "public");
    }
    const sharedItems = worksheets.filter(w => w.visibility === "public").length;
    const publicItems = worksheets.filter(w => w.visibility === "public");
    const ratings = publicItems
      .map(w => w.rating_avg)
      .filter(r => r !== null);
    const avgRating =
      ratings.length > 0
        ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
        : 0;
    // Return data
    res.json({
      id,
      username: userUsername,
      plan: userPlan,
      totalItems,
      sharedItems,
      avgRating,
      items: worksheets
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/username", async (req, res) => {
  try {
    const user = await getUserFromToken(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    const { username } = req.body;
    if (!username || username.length < 3) {
      return res.status(400).json({ error: "Invalid username" });
    }
    const { error } = await supabase
      .from("profiles")
      .update({ username })
      .eq("id", user.id);
    if (error) {
      if (error.code === "23505") {
        return res.status(400).json({ error: "Username already taken" });
      }
      console.error(error);
      return res.status(500).json({ error: "Failed to update username" });
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;