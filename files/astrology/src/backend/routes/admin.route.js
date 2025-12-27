// src/backend/routes/admin.route.js
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";
import requireAdmin from "../middleware/requireAdmin.js";

const router = express.Router();

// ---- Activity log (no DB) ----
const dataDir = path.join(process.cwd(), "data");
const emailLogPath = path.join(dataDir, "email_log.jsonl");

// ---- Sigils directory ----
const sigilDir = path.join(process.cwd(), "generated_images");

function ensureDataDir() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
}

// Match your image-generation "safe filename" style.
// IMPORTANT: keep this consistent with openaiImage.service.js
function safePart(s) {
  return String(s || "").replace(/[^\w]+/g, "_").trim();
}

function buildUserKeyFromRow(row) {
  const name = row?.name || row?.form?.currentName || row?.form?.birthName || "";
  const dob = row?.dob || row?.form?.dob || "";
  return {
    name: String(name).trim(),
    dob: String(dob).trim(),
  };
}

function buildSigilFilename(name, dob) {
  const safeName = safePart(name);
  const safeDob = safePart(dob);
  if (!safeName || !safeDob) return null;
  return `${safeName}_${safeDob}.png`;
}

function listPngsRecursive(dir) {
    if (!fs.existsSync(dir)) return [];
    const out = [];
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, ent.name);
      if (ent.isDirectory()) out.push(...listPngsRecursive(p));
      else if (ent.isFile() && ent.name.toLowerCase().endsWith(".png")) out.push(p);
    }
    return out;
  }
  
  function inferSigilMeta(req, row) {
    const { name, dob } = buildUserKeyFromRow(row);
    const base = `${req.protocol}://${req.get("host")}`;
  
    // Fast path: expected filename
    const expected = buildSigilFilename(name, dob);
    if (expected) {
      const expectedPath = path.join(sigilDir, expected);
      if (fs.existsSync(expectedPath)) {
        return {
          hasSigil: true,
          sigilFile: expected,
          sigilUrl: `${base}/generated_images/${expected}`,
        };
      }
    }
  
    // Robust path: scan for any png that contains both safe name + safe dob
    const safeName = safePart(name).toLowerCase();
    const safeDob = safePart(dob).toLowerCase();
  
    const allPngs = listPngsRecursive(sigilDir);
    const found = allPngs.find((fullPath) => {
      const rel = path.relative(sigilDir, fullPath).replaceAll(path.sep, "/").toLowerCase();
      return rel.includes(safeName) && rel.includes(safeDob);
    });
  
    if (!found) {
      return { hasSigil: false, sigilUrl: null, sigilFile: null };
    }
  
    const rel = path.relative(sigilDir, found).replaceAll(path.sep, "/");
    return {
      hasSigil: true,
      sigilFile: rel,
      sigilUrl: `${base}/generated_images/${rel}`,
    };
  }
  

// ---- Admin Login ----
router.post("/api/admin/login", async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ error: "Missing credentials" });
    }

    if (username !== process.env.ADMIN_USERNAME) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const ok = await bcrypt.compare(password, process.env.ADMIN_PASSWORD_HASH || "");
    if (!ok) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ role: "admin", username }, process.env.JWT_SECRET, {
      expiresIn: "2h",
    });

    return res.json({ token });
  } catch (err) {
    console.error("🔥 Admin login error:", err);
    return res.status(500).json({ error: "Login failed" });
  }
});

// ---- Admin Health ----
router.get("/api/admin/health", requireAdmin, (req, res) => {
  return res.json({ ok: true, admin: req.admin?.username });
});

// ---- Recent Email Activity (last 50) ----
router.get("/api/admin/email-activity", requireAdmin, (req, res) => {
  try {
    ensureDataDir();

    if (!fs.existsSync(emailLogPath)) {
      return res.json({ items: [] });
    }

    const lines = fs
      .readFileSync(emailLogPath, "utf8")
      .split("\n")
      .filter(Boolean);

    const rawItems = lines.slice(-50).reverse().map((l) => JSON.parse(l));

    // ✅ Enrich each item with sigil existence info
    const items = rawItems.map((row) => {
      const sigilMeta = inferSigilMeta(req, row);
      return {
        ...row,
        ...sigilMeta, // hasSigil, sigilUrl, sigilFile
      };
    });

    return res.json({ items });
  } catch (err) {
    console.error("🔥 Read activity error:", err);
    return res.status(500).json({ error: "Failed to read activity" });
  }
});

export { ensureDataDir, emailLogPath };
export default router;
