import fs from "fs";
import path from "path";

function safeFilePart(s) {
  return String(s || "")
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[\/\\?%*:|"<>]/g, "-"); // includes "/" fix
}

export async function generateAstrologyImage({ name, dob, promptOverride }) {
  if (!name || !dob) throw new Error("Missing name or date of birth");

  const prompt =
    promptOverride ||
    `Create a detailed, high-quality astrological illustration for:
Name: ${name}
Date of birth: ${dob}
Style: mystical night sky, zodiac constellations, glowing aura, no text.`;

  const openaiRes = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-image-1",
      prompt,
      size: "1024x1024",
      n: 1,
    }),
  });

  const data = await openaiRes.json().catch(() => ({}));

  if (!openaiRes.ok) {
    throw new Error(data?.error?.message || "OpenAI request failed");
  }

  const b64 = data?.data?.[0]?.b64_json;
  if (!b64) throw new Error("No b64_json field in OpenAI response");

  // ✅ FIX: define buffer

  // ✅ Ensure output dir exists
// 🔹 Ensure output directory exists
const outputDir = path.join(process.cwd(), "generated_images");
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// 🔹 Safe filename (VERY IMPORTANT)
const safeName = String(name).replace(/[^\w]+/g, "_");
const safeDob = String(dob).replace(/[^\w]+/g, "_");
const filename = `${safeName}_${safeDob}.png`;

const outputPath = path.join(outputDir, filename);

// 🔹 Decode base64 and save
const buffer = Buffer.from(b64, "base64");
fs.writeFileSync(outputPath, buffer);

// 🔹 Stable public URL (survives reload)
const publicUrl = `/generated_images/${filename}`;

// 🔹 Data URL (for immediate preview)
const dataUrl = `data:image/png;base64,${b64}`;

// ✅ RETURN EVERYTHING
return {
  imageUrl: dataUrl,      // for instant frontend preview
  publicUrl,              // for dashboard + reload
  savedFile: outputPath,  // for logs
};

}
