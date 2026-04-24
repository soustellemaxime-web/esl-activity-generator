const express = require("express");

const generateWorksheet = require("../generators/worksheetGenerator");
const generatePDF = require("../services/pdfService");
const { getTodayDownloads, addDownload } = require("../db/downloadsDB")
const { getUserFromToken } = require("../utils/getUser");
const supabase = require('../supabaseClient');

const router = express.Router();

// preview
router.post("/preview", (req, res) => {
  try {
    const html = generateWorksheet(req.body);
    res.send(html);
  } catch (err) {
    console.error(err);
    res.status(400).send(err.message);
  }
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
    const html = generateWorksheet(req.body);
    const pdf = await generatePDF(html);
    await addDownload(user_id);
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": "attachment; filename=worksheet.pdf"
    });
    res.send(pdf);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred while tracking downloads." });
  }
});

module.exports = router;