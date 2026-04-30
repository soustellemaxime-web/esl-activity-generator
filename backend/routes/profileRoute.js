const express = require("express");
const router = express.Router();
const { getUserWorksheetStats} = require("../db/worksheetsDB")
const { getUserPlan, getUserFromToken } = require("../utils/getUser")
const supabase = require('../supabaseClient');

router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    // Who is viewing
    const viewer = await getUserFromToken(req);
    const isOwner = viewer && viewer.id === id;
    // Get profile (plan)
    const userPlan = await getUserPlan(id);
    // Get worksheets (for stats)
    let worksheets = await getUserWorksheetStats(id);
    const totalItems = worksheets.length;
    // If NOT owner → keep only public
    if (!isOwner) {
        worksheets = worksheets.filter(w => w.visibility === "public");
    }
    const sharedItems = worksheets.filter(w => w.visibility === "public").length;
    const ratings = worksheets
      .map(w => w.rating_avg)
      .filter(r => r !== null);
    const avgRating =
      ratings.length > 0
        ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
        : 0;
    // Return data
    res.json({
      id,
      username: null,
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

module.exports = router;