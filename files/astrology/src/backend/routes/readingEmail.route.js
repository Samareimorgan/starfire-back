import express from "express";
import fs from "fs";
import { getMailer } from "../services/mailer.service.js";
import { buildReadingPdfBuffer } from "../utils/pdfReading.js";
import { ensureDataDir, emailLogPath } from "./admin.route.js";

const router = express.Router();

router.post("/api/send-astrology-reading", async (req, res) => {
  const startedAt = new Date().toISOString();

  // capture values for logging even if failure happens
  const { email, intent, numerology, form, astrology } = req.body || {};
  const toEmail = (email && String(email).trim()) || "rinkarto2000@gmail.com";

  try {
    if (!numerology || typeof numerology !== "object") {
      return res.status(400).json({ error: "Missing numerology results" });
    }

    const numerologyRows = Object.entries(numerology)
      .map(([k, v]) => {
        const val = v === null || v === undefined ? "—" : String(v);
        return `<tr>
          <td style="padding:8px 10px;border-bottom:1px solid #eee;"><b>${k}</b></td>
          <td style="padding:8px 10px;border-bottom:1px solid #eee;">${val}</td>
        </tr>`;
      })
      .join("");

    // ✅ IMPORTANT: html must be defined before sendMail()
    const html = `
      <div style="font-family: Arial, sans-serif; line-height:1.5; color:#111;">
        <h2 style="margin:0 0 8px;">Your SigilSync Reading</h2>
        <p style="margin:0 0 16px;color:#444;">
          Here’s your numerology summary. (Astrology section will appear once enabled.)
        </p>

        ${
          intent
            ? `<p style="margin:0 0 16px;"><b>Intent:</b> ${String(intent).replace(/</g, "&lt;")}</p>`
            : ""
        }

        ${
          form
            ? `<p style="margin:0 0 16px;color:#444;">
                <b>Name:</b> ${form.currentName || form.birthName || "—"}<br/>
                <b>DOB:</b> ${form.dob || "—"}<br/>
                <b>Calculation date:</b> ${form.calcDate || "—"}
              </p>`
            : ""
        }

        <h3 style="margin:18px 0 10px;">Numerology</h3>
        <table style="border-collapse:collapse;width:100%;max-width:520px;">
          ${numerologyRows}
        </table>

        <p style="margin:20px 0 0;color:#777;font-size:12px;">
          PDF attached • Sent by SigilSync • StarFire Origins
        </p>
      </div>
    `;

    const pdfBuffer = await buildReadingPdfBuffer({ numerology, intent, form, astrology });

    const mailer = getMailer();
    await mailer.sendMail({
      from: process.env.MAIL_FROM || process.env.SMTP_USER,
      to: toEmail,
      subject: "Your SigilSync Reading",
      html, // ✅ now defined
      attachments: [
        {
          filename: "SigilSync-Reading.pdf",
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    });

    // ✅ log success
    ensureDataDir();
    fs.appendFileSync(
      emailLogPath,
      JSON.stringify({
        at: startedAt,
        status: "sent",
        sentTo: toEmail,
        intent: intent || "",
        name: form?.currentName || form?.birthName || "",
        dob: form?.dob || "",
      }) + "\n"
    );

    return res.json({ ok: true, sentTo: toEmail });
  } catch (err) {
    // ✅ log failure too (so dashboard shows it)
    try {
      ensureDataDir();
      fs.appendFileSync(
        emailLogPath,
        JSON.stringify({
          at: startedAt,
          status: "failed",
          sentTo: toEmail,
          intent: intent || "",
          name: form?.currentName || form?.birthName || "",
          dob: form?.dob || "",
          error: err?.message || String(err),
        }) + "\n"
      );
    } catch {}

    console.error("🔥 Email send error:", err);
    return res.status(500).json({ error: err?.message || "Failed to send email" });
  }
});

export default router;
