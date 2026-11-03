/**
 * POST /api/inquiry — Vercel serverless function.
 *
 * Validates a project inquiry and emails it to the studio through Resend's
 * HTTP API (no SDK dependency). Required environment variables:
 *   RESEND_API_KEY      API key from https://resend.com
 *   INQUIRY_TO_EMAIL    Where inquiries are delivered (the studio inbox)
 * Optional:
 *   INQUIRY_FROM_EMAIL  Verified sender, e.g. "END. YOURCREATIVE <hello@yourdomain.com>"
 *                       Defaults to Resend's onboarding sender for testing.
 *
 * Without the required variables the function answers 503, and the site
 * offers the visitor a pre-filled WhatsApp message instead.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const CATEGORIES = new Set([
  "Website undangan pernikahan",
  "Hadiah digital personal",
  "Cerita interaktif",
  "Museum virtual / ruang 3D",
  "Website bisnis",
  "Landing page kreatif",
  "Lainnya",
]);

const clean = (v, max) => String(v ?? "").trim().slice(0, max);

export function validateInquiry(input) {
  const data = {
    name: clean(input.name, 100),
    email: clean(input.email, 200),
    category: clean(input.category, 60),
    budget: clean(input.budget, 60),
    details: clean(input.details, 3000),
  };
  const errors = {};
  if (data.name.length < 2) errors.name = "Masukkan nama kamu.";
  if (!EMAIL_RE.test(data.email)) errors.email = "Periksa alamat email — sepertinya belum lengkap.";
  if (!CATEGORIES.has(data.category)) errors.category = "Pilih jenis proyek.";
  if (data.details.length < 20) errors.details = "Tambahkan sedikit detail — minimal 20 karakter.";
  return { data, errors };
}

const escapeHtml = (s) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      return res.status(400).json({ ok: false, error: "Invalid JSON" });
    }
  }
  body = body || {};

  // Honeypot filled → silently accept so bots learn nothing.
  if (body.website) return res.status(200).json({ ok: true });

  const { data, errors } = validateInquiry(body);
  if (Object.keys(errors).length) return res.status(400).json({ ok: false, errors });

  const { RESEND_API_KEY, INQUIRY_TO_EMAIL } = process.env;
  const from = process.env.INQUIRY_FROM_EMAIL || "END. YOURCREATIVE <onboarding@resend.dev>";
  if (!RESEND_API_KEY || !INQUIRY_TO_EMAIL) {
    return res.status(503).json({ ok: false, code: "not_configured" });
  }

  const rows = [
    ["Nama", data.name],
    ["Email", data.email],
    ["Proyek", data.category],
    ["Budget", data.budget || "—"],
  ];
  const html = `
    <h2 style="font-family:Georgia,serif;color:#2E1E15">Permintaan proyek baru</h2>
    <table style="font-family:Arial,sans-serif;font-size:14px;color:#2E1E15">
      ${rows.map(([k, v]) => `<tr><td style="padding:4px 16px 4px 0;color:#7A6656">${k}</td><td>${escapeHtml(v)}</td></tr>`).join("")}
    </table>
    <p style="font-family:Arial,sans-serif;font-size:14px;color:#2E1E15;white-space:pre-wrap">${escapeHtml(data.details)}</p>`;
  const text = `${rows.map(([k, v]) => `${k}: ${v}`).join("\n")}\n\n${data.details}`;

  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: INQUIRY_TO_EMAIL.split(",").map((s) => s.trim()),
        reply_to: data.email,
        subject: `Permintaan baru: ${data.category} — ${data.name}`,
        html,
        text,
      }),
    });
    if (!r.ok) {
      console.error("Resend error", r.status, await r.text());
      return res.status(502).json({ ok: false, code: "send_failed" });
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Inquiry send failed", err);
    return res.status(502).json({ ok: false, code: "send_failed" });
  }
}
