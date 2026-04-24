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

const { saveWorksheet, getWorksheets, getWorksheetById, deleteWorksheet , countUserWorksheets} = require("./db/worksheetsDB")
const { getUserPlan , getUserFromToken} = require("./utils/getUser")

app.use(express.static(path.join(__dirname, "../frontend")))
app.use("/styles", express.static(path.join(__dirname, "styles")))
app.use("/assets", express.static(path.join(__dirname, "../frontend/assets")))
app.use("/api/worksheet", worksheetRoutes)
app.use("/api/bingo", bingoRoutes)
app.use("/api/flashcards", flashcardRoutes)
app.use("/api/images", imageRoutes)

app.get("/", (req, res) => {
  res.send("API running")
})

app.post('/save', async (req, res) => {
  const { title, data, user_id, type } = req.body;
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
    const { error } = await saveWorksheet(title, data, user_id, type);
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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})