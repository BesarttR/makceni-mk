// pages/api/subscribe.js
// Saves subscriber emails to /tmp/makceni_subscribers.json
// In production use a real DB — /tmp is ephemeral on Vercel

import fs from "fs";
import path from "path";

const SUBS_PATH = path.join("/tmp", "makceni_subscribers.json");

function loadSubscribers() {
  try {
    if (fs.existsSync(SUBS_PATH)) return JSON.parse(fs.readFileSync(SUBS_PATH, "utf8"));
  } catch {}
  return [];
}

function saveSubscribers(subs) {
  try { fs.writeFileSync(SUBS_PATH, JSON.stringify(subs), "utf8"); } catch {}
}

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { email } = req.body;
    if (!email || !email.includes("@")) {
      return res.status(400).json({ error: "Невалиден email" });
    }

    const subs = loadSubscribers();
    const already = subs.find(s => s.email === email.toLowerCase().trim());
    if (already) {
      return res.status(200).json({ ok: true, message: "Веќе претплатен" });
    }

    subs.push({ email: email.toLowerCase().trim(), subscribedAt: new Date().toISOString() });
    saveSubscribers(subs);

    // Send welcome email via Resend
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "МакЦени.мк <no-reply@makceni.mk>",
          to: email,
          subject: "✅ Успешно се претплативте на известувања за цени",
          html: `
            <div style="font-family:'Helvetica Neue',sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#F8F7F4;border-radius:16px;">
              <div style="text-align:center;margin-bottom:24px;">
                <span style="font-size:32px;">⛽</span>
                <h1 style="font-size:22px;font-weight:800;color:#1C1917;margin:8px 0 4px;">МакЦени.мк</h1>
                <p style="color:#A8A29E;font-size:13px;margin:0;">Цени на горива во Македонија</p>
              </div>
              <div style="background:#fff;border-radius:12px;padding:24px;border:1px solid #E4E1DA;">
                <h2 style="font-size:18px;font-weight:700;color:#1C1917;margin:0 0 12px;">✅ Претплатата е активна!</h2>
                <p style="color:#57534E;font-size:14px;line-height:1.6;margin:0 0 16px;">
                  Секој <strong>вторник</strong> кога ќе се сменат цените на горивата, ќе добиете известување на овој email.
                </p>
                <div style="background:#FFF7ED;border:1px solid #FED7AA;border-radius:8px;padding:14px 16px;margin-bottom:16px;">
                  <p style="color:#92400E;font-size:13px;font-weight:600;margin:0;">📧 ${email}</p>
                </div>
                <p style="color:#A8A29E;font-size:12px;margin:0;">За откажување на претплатата одговорете на овој email со „Откажи".</p>
              </div>
              <p style="text-align:center;color:#A8A29E;font-size:11px;margin-top:20px;">
                © 2026 МакЦени.мк · <a href="https://makceni.mk" style="color:#F97316;text-decoration:none;">makceni.mk</a>
              </p>
            </div>
          `,
        }),
      });
    } catch (err) {
      console.error("Welcome email failed:", err.message);
    }

    return res.status(200).json({ ok: true, message: "Претплатата е успешна" });
  }

  // GET — return count (for admin purposes)
  if (req.method === "GET") {
    const subs = loadSubscribers();
    return res.status(200).json({ count: subs.length });
  }

  return res.status(405).json({ error: "Method not allowed" });
}