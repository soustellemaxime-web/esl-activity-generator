const express = require("express")

const generateBingo = require("../generators/bingoGenerator")
const generatePDF = require("../services/pdfService")
const { getTodayDownloads, addDownload } = require("../db/downloadsDB")
const { getUserFromToken } = require("../utils/getUser");
const supabase = require('../supabaseClient');

const router = express.Router()

// Preview
router.post("/preview", (req, res) => {
  try {
    const previewData = { ...req.body }
    previewData.cardCount = Math.min(previewData.cardCount, 2)

    const html = generateBingo(previewData)
    res.send(html)
  } catch (error) {
    console.error(error)
    res.status(400).send(error.message)
  }
})

// Generate PDF
router.post("/generate", async (req, res) => {
  // Track downloads
  try {
    const isCommunity = req.body.isCommunity || false;
    const downloadType = isCommunity ? "community" : "generator";
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
    const { data: generatorDownloads } = await getTodayDownloads(user_id, "generator");
    const { data: communityDownloads } = await getTodayDownloads(user_id, "community");
    if (profile.plan === "free" && generatorDownloads.length >= 3) {
      return res.status(403).json({
        error: "Download limit reached for today."
      });
    }
    if (isCommunity) {
      let communityLimit;
      if (profile.plan === "free") communityLimit = 3;
      if (profile.plan === "premium") communityLimit = 10;
      if (profile.plan === "vip") communityLimit = Infinity;
      if (communityDownloads.length >= communityLimit) {
        return res.status(403).json({
          error: "Community download limit reached"
        });
      }
    }
    // Generate the file
    const html = generateBingo(req.body)
    const pdf = await generatePDF(html)
    await addDownload(user_id, downloadType);
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": "attachment; filename=bingo.pdf"
    });
    res.send(pdf)
} catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred while tracking downloads." });
}
});

module.exports = router