require("dotenv").config()

const express = require("express")
const cors = require("cors")

const app = express()

app.use(cors())
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

const bingoRoutes = require("./routes/bingo")
const imageRoutes = require("./routes/images")
app.use("/api/bingo", bingoRoutes)
app.use("/api/images", imageRoutes)


app.get("/", (req, res) => {
  res.send("API running")
})

app.listen(3000, () => {
  console.log("Server running on port 3000")
})