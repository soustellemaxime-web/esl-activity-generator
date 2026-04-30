const express = require("express");
const router = express.Router();
const { getUserWorksheetStats} = require("../db/worksheetsDB")
const { getUserPlan } = require("../utils/getUser")
const supabase = require('../supabaseClient');

router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    // 1. Get profile (plan)
    const userPlan = await getUserPlan(id);
    // 2. Get worksheets (for stats)
    const worksheets = await getUserWorksheetStats(id);
    // 3. Compute stats
    const totalItems = worksheets.length;
    const sharedItems = worksheets.filter(w => w.visibility === "public").length;
    const ratings = worksheets
      .map(w => w.rating_avg)
      .filter(r => r !== null);
    const avgRating =
      ratings.length > 0
        ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
        : 0;
    // 4. Return data
    res.json({
      id,
      username: null,
      plan: userPlan,
      totalItems,
      sharedItems,
      avgRating
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;