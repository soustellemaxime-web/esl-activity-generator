require("dotenv").config()

const express = require("express")
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
app.use("/assets", express.static(path.join(__dirname, "../frontend/assets")))
app.use("/api/worksheet", worksheetRoutes)
app.use("/api/bingo", bingoRoutes)
app.use("/api/flashcards", flashcardRoutes)
app.use("/api/images", imageRoutes)


app.get("/", (req, res) => {
  res.send("API running")
})

app.listen(3000, () => {
  console.log("Server running on port 3000")
})