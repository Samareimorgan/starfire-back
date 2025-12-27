import PDFDocument from "pdfkit";

export function buildReadingPdfBuffer({ numerology, intent, form, astrology }) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "LETTER", margin: 50 });
      const chunks = [];

      doc.on("data", (c) => chunks.push(c));
      doc.on("end", () => resolve(Buffer.concat(chunks)));

      doc.fontSize(20).text("SigilSync Reading");
      doc.moveDown(0.5);
      doc.fontSize(10).fillColor("#555").text(`Generated: ${new Date().toLocaleString()}`);
      doc.fillColor("#000");
      doc.moveDown(1);

      if (form) {
        doc.fontSize(12).text("Details", { underline: true });
        doc.moveDown(0.35);
        doc.fontSize(11);
        doc.text(`Name: ${form.currentName || form.birthName || "—"}`);
        doc.text(`DOB: ${form.dob || "—"}`);
        doc.text(`Calculation Date: ${form.calcDate || "—"}`);
        if (form.birthTime) doc.text(`Birth Time: ${form.birthTime}`);
        if (form.city || form.state || form.zip) {
          doc.text(`Location: ${[form.city, form.state, form.zip].filter(Boolean).join(", ")}`);
        }
        if (form.tz) doc.text(`Timezone: ${form.tz}`);
        doc.moveDown(1);
      }

      if (intent && String(intent).trim()) {
        doc.fontSize(12).text("Intent", { underline: true });
        doc.moveDown(0.35);
        doc.fontSize(11).text(String(intent));
        doc.moveDown(1);
      }

      doc.fontSize(12).text("Numerology", { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(11);

      const orderedKeys = [
        "Life Path",
        "Expression",
        "Soul Urge",
        "Personality",
        "Birthday",
        "Maturity",
        "Personal Year",
        "Personal Month",
        "Personal Day",
      ];

      for (const k of orderedKeys) {
        doc.text(`${k}: ${numerology?.[k] ?? "—"}`);
      }

      if (astrology) {
        doc.moveDown(1);
        doc.fontSize(12).text("Astrology", { underline: true });
        doc.moveDown(0.35);
        doc.fontSize(11);
        doc.text(`Sun: ${astrology.sun || "—"}`);
        doc.text(`Moon: ${astrology.moon || "—"}`);
        doc.text(`Rising: ${astrology.rising || "—"}`);
      }

      doc.moveDown(1);
      doc.fontSize(9).fillColor("#666").text("Sent by SigilSync • StarFire Origins");

      doc.end();
    } catch (e) {
      reject(e);
    }
  });
}