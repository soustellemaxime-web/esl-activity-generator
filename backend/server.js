require("dotenv").config()

const express = require("express")
const supabase = require("./supabaseClient")
const cors = require("cors")
const path = require("path")
const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

const bingoRoutes = require("./routes/bingoRoute")
const flashcardRoutes = require("./routes/flashcardsRoute")
const imageRoutes = require("./routes/imagesRoute")
const worksheetRoutes = require("./routes/worksheetRoute")
const communityRoutes = require("./routes/communityRoute")

const { saveWorksheet, updateWorksheet, getWorksheets, getWorksheetById, deleteWorksheet , countUserWorksheets, getUserWorksheetStats} = require("./db/worksheetsDB")
const { getUserPlan , getUserFromToken} = require("./utils/getUser")
const { getTodayDownloads } = require("./db/downloadsDB")

app.use(express.static(path.join(__dirname, "../frontend")))
app.use("/styles", express.static(path.join(__dirname, "styles")))
app.use("/assets", express.static(path.join(__dirname, "../frontend/assets")))
app.use("/api/worksheet", worksheetRoutes)
app.use("/api/community", communityRoutes)
app.use("/api/bingo", bingoRoutes)
app.use("/api/flashcards", flashcardRoutes)
app.use("/api/images", imageRoutes)

app.get("/", (req, res) => {
  res.send("API running")
})

app.post('/save', async (req, res) => {
  const { title, data, type, visibility, id } = req.body;
  try {
    // Get user
    const user = await getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const user_id = user.id;
    // Get user plan
    const plan = await getUserPlan(user_id);
    if (!plan) {
      return res.status(404).json({ error: "User plan not found" });
    }
    // Count user's saved items
    const { count, error: countError } = await countUserWorksheets(user_id);
    if (countError) {
      console.error("Supabase error:", countError);
      return res.status(500).json({ error: "Failed to count saved items" });
    }
    // Enforce limits based on plan
    let limit = 5;
    if (plan === "premium") limit = 30;
    if (plan === "vip") limit = Infinity;
    if (count >= limit) {
      return res.status(403).json({ error: `Save limit reached for ${plan} plan` });
    }
    // Save the item
    let result;
    if (id) {
      result = await updateWorksheet(id, title, data, user_id, type, visibility);
    } else {
      result = await saveWorksheet(title, data, user_id, type, visibility);
    }
    const { error } = result;
    if (error) {
      console.error("Supabase error:", error)
      return res.status(500).json({ error: `Failed to save ${type}` })
    }
    res.status(200).json({ message: `${type} saved successfully` })
  } catch (error) {
    console.error("Error in /save route:", error)
    res.status(500).json({ error: "An unexpected error occurred" })
  }
})

app.get('/worksheets', async (req, res) => {
  const { user_id, type } = req.query;
  const { data, error } = await getWorksheets(user_id, type);
  if (error) {
    console.error("Supabase error:", error)
    return res.status(500).json({ error: `Failed to fetch ${type || 'worksheets'}` })
  }
  res.status(200).json(data)
})

app.get('/worksheets/:id', async (req, res) => {
  const { id } = req.params;
  const { user_id } = req.query;
  const { data, error } = await getWorksheetById(id, user_id);
  if (error) {
    console.error("Supabase error:", error)
    return res.status(500).json({ error: "Failed to fetch worksheet" })
  }
  res.status(200).json(data)
})

app.delete('/worksheets/:id', async (req, res) => {
  const { id } = req.params;
  const { user_id } = req.query;
  const { error } = await deleteWorksheet(id, user_id);
  if (error) {
    console.error("Supabase error:", error)
    return res.status(500).json({ error: "Failed to delete worksheet" })
  }
  res.status(200).json({ message: "Worksheet deleted successfully" })
})

app.get("/limits", async (req, res) => {
  const user = await getUserFromToken(req);
  if (!user) return res.status(401).json({});
  const user_id = user.id;
  const plan = await getUserPlan(user_id);
  const { count } = await countUserWorksheets(user_id);
  let saveLimit = 5;
  if (plan === "premium") saveLimit = 30;
  if (plan === "vip") saveLimit = null;
  // Generator limits
  let generatorLimit = 3;
  if (plan === "premium") generatorLimit = 30;
  if (plan === "vip") generatorLimit = null;
  // Community limits
  let communityLimit = 3;
  if (plan === "premium") communityLimit = 10;
  if (plan === "vip") communityLimit = null;
  const { data: generatorDownloads } = await getTodayDownloads(user_id, "generator");
  const { data: communityDownloads } = await getTodayDownloads(user_id, "community");
  const generatorCount = generatorDownloads ? generatorDownloads.length : 0;
  const communityCount = communityDownloads ? communityDownloads.length : 0;
  res.json({
    limits: {
      saves: {
        used: count,
        limit: saveLimit
      },
      downloads: {
        used: generatorCount,
        limit: generatorLimit
      },
      communityDownloads: {
        used: communityCount,
        limit: communityLimit
      }
    },
    plan
  });
});

app.get("/api/profile/:id", async (req, res) => {
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
      username: null, // we don’t have it yet
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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})