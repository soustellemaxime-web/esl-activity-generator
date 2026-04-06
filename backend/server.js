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

const { saveWorksheet, getWorksheets, getWorksheetById, deleteWorksheet } = require("./db/worksheetsDB")

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
  const { error } = await saveWorksheet(title, data, user_id, type);
  if (error) {
    console.error("Supabase error:", error)
    return res.status(500).json({ error: `Failed to save ${type}` })
  }
  res.status(200).json({ message: `${type} saved successfully` })
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