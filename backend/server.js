require("dotenv").config()

const express = require("express")
const supabase = require("./supabaseClient")
const cors = require("cors")
const path = require("path")
const app = express()

app.use(cors())
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

const bingoRoutes = require("./routes/bingoRoute")
const flashcardRoutes = require("./routes/flashcardsRoute")
const imageRoutes = require("./routes/imagesRoute")
const worksheetRoutes = require("./routes/worksheetRoute")

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
  const { title, data } = req.body;
  const { error } = await supabase.from('worksheets').insert([{ title, data }])
  if (error) {
    console.error("Supabase error:", error)
    return res.status(500).json({ error: "Failed to save worksheet" })
  }
  res.status(200).json({ message: "Worksheet saved successfully" })
})

app.get('/worksheets', async (req, res) => {
  const { data, error } = await supabase.from('worksheets').select('*').order('created_at', { ascending: false })
  if (error) {
    console.error("Supabase error:", error)
    return res.status(500).json({ error: "Failed to fetch worksheets" })
  }
  res.status(200).json(data)
})

app.get('/worksheets/:id', async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase.from('worksheets').select('*').eq('id', id).single()
  if (error) {
    console.error("Supabase error:", error)
    return res.status(500).json({ error: "Failed to fetch worksheet" })
  }
  res.status(200).json(data)
})


app.listen(3000, () => {
  console.log("Server running on port 3000")
})