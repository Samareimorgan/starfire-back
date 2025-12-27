import express from "express";
import { generateAstrologyImage } from "../services/openaiImage.service.js";

const router = express.Router();

router.post("/api/astrology-image", async (req, res) => {
  try {
    const { name, dob } = req.body || {};
    const out = await generateAstrologyImage({ name, dob });
    res.json(out);
  } catch (err) {
    console.error("🔥 Server error:", err);
    res.status(500).json({ error: err.message || "Failed to generate image" });
  }
});

export default router;
