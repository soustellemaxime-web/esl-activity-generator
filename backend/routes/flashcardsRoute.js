const express = require("express");

const generateFlashcards = require("../generators/flashcardsGenerator");
const generatePDF = require("../services/pdfService");
const { getTodayDownloads, addDownload } = require("../db/downloadsDB")
const { getUserFromToken } = require("../utils/getUser");
const supabase = require('../supabaseClient');

const router = express.Router();

router.post("/preview", (req, res) => {
  const html = generateFlashcards(req.body);
  res.send(html);
});

router.post("/generate", async (req, res) => {
  // Track downloads
  try {
    const user = await getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const user_id = user.id;
    // Get user plan
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan")
      .eq("id", user_id)
      .single();
    // Get today's downloads
    const { data: downloads } = await getTodayDownloads(user_id);
    if (profile.plan === "free" && downloads.length >= 3) {
      return res.status(403).json({ error: "Download limit reached for today." });
    }
    // Generate the file
    const html = generateFlashcards(req.body);
    const pdf = await generatePDF(html);
    await addDownload(user_id);
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": "attachment; filename=flashcards.pdf"
    });
    res.send(pdf);
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: "An error occurred while tracking downloads." });
  }
});

module.exports = router;