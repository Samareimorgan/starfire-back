import fs from "fs";
import path from "path";

export const dataDir = path.join(process.cwd(), "data");
export const sigilLogPath = path.join(dataDir, "sigil_log.jsonl");

export function ensureDataDir() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
}

export function appendSigilLog(entry) {
  ensureDataDir();
  fs.appendFileSync(sigilLogPath, JSON.stringify(entry) + "\n", "utf8");
}

export function readSigilLog(limit = 2000) {
  if (!fs.existsSync(sigilLogPath)) return [];
  const lines = fs.readFileSync(sigilLogPath, "utf8").trim().split("\n").filter(Boolean);
  const sliced = lines.slice(-limit);
  return sliced
    .map((l) => {
      try { return JSON.parse(l); } catch { return null; }
    })
    .filter(Boolean);
}
