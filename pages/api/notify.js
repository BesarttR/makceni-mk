// pages/api/notify.js
// Sends price change emails to all subscribers
// Called by cron.js every Tuesday after new prices are fetched

import fs from "fs";
import path from "path";

const SUBS_PATH = path.join("/tmp", "makceni_subscribers.json");

function loadSubscribers() {
  try {
    if (fs.existsSync(SUBS_PATH)) return JSON.parse(fs.readFileSync(SUBS_PATH, "utf8"));
  } catch {}
  return [];
}

function formatChange(change) {
  if (!change || Math.abs(change) < 0.05) return `<span style="color:#A8A29E;">Нема промена</span>`;
  const color = change > 0 ? "#DC2626" : "#15803D";
  const arrow = change > 0 ? "▲" : "▼";
  const sign = change > 0 ? "+" : "";
  return `<span style="color:${color};font-weight:700;">${arrow} ${sign}${change.toFixed(1)} ден</span>`;
}

function buildEmailHtml(prices, updatedAt) {
  const date = new Date(updatedAt).toLocaleDateString("mk-MK", { day: "numeric", month: "long", year: "numeric" });

  const rows = prices.map(p => `
    <tr>
      <td style="padding:12px 16px;border-bottom:1px solid #E4E1DA;font-weight:600;color:#1C1917;font-size:14px;">${p.label}</td>
      <td style="padding:12px 16px;border-bottom:1px solid #E4E1DA;font-weight:800;color:#1C1917;font-size:16px;text-align:right;">${p.price.toFixed(1)} <span style="font-size:11px;color:#A8A29E;font-weight:400;">ден</span></td>
      <td style="padding:12px 16px;border-bottom:1px solid #E4E1DA;text-align:right;font-size:13px;">${formatChange(p.change)}</td>
    </tr>
  `).join("");

  const hasChanges = prices.some(p => Math.abs(p.change || 0) >= 0.05);
  const subject = hasChanges ? "⛽ Цените на горивата се сменија" : "⛽ Нови цени на горива — без промена";

  return {
    subject,
    html: `
      <div style="font-family:'Helvetica Neue',sans-serif;max-width:560px;margin:0 auto;padding:32px 16px;background:#F8F7F4;">
        <div style="text-align:center;margin-bottom:24px;">
          <span style="font-size:36px;">⛽</span>
          <h1 style="font-size:22px;font-weight:800;color:#1C1917;margin:8px 0 4px;">МакЦени.мк</h1>
          <p style="color:#A8A29E;font-size:13px;margin:0;">Ажурирано ${date}</p>
        </div>

        <div style="background:#fff;border-radius:16px;overflow:hidden;border:1px solid #E4E1DA;margin-bottom:20px;">
          <div style="background:#FFF7ED;padding:16px 20px;border-bottom:1px solid #FED7AA;">
            <h2 style="font-size:16px;font-weight:700;color:#92400E;margin:0;">
              ${hasChanges ? "📊 Промена на цени денес" : "📊 Цени без промена оваа недела"}
            </h2>
          </div>
          <table style="width:100%;border-collapse:collapse;">
            <thead>
              <tr style="background:#F8F7F4;">
                <th style="padding:10px 16px;text-align:left;font-size:10px;font-weight:700;color:#A8A29E;letter-spacing:1px;text-transform:uppercase;">Гориво</th>
                <th style="padding:10px 16px;text-align:right;font-size:10px;font-weight:700;color:#A8A29E;letter-spacing:1px;text-transform:uppercase;">Цена</th>
                <th style="padding:10px 16px;text-align:right;font-size:10px;font-weight:700;color:#A8A29E;letter-spacing:1px;text-transform:uppercase;">Промена</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>

        <div style="text-align:center;margin-bottom:20px;">
          <a href="https://makceni.mk" style="display:inline-block;background:#F97316;color:#fff;font-weight:700;font-size:14px;padding:12px 28px;border-radius:10px;text-decoration:none;">
            Провери ги сите цени →
          </a>
        </div>

        <p style="text-align:center;color:#A8A29E;font-size:11px;line-height:1.6;">
          Добивате ова известување затоа што се претплативте на <a href="https://makceni.mk" style="color:#F97316;text-decoration:none;">makceni.mk</a>.<br/>
          За откажување одговорете со „Откажи".
        </p>
      </div>
    `,
  };
}

export default async function handler(req, res) {
  // Security check
  const secret = process.env.CRON_SECRET;
  const authHeader = req.headers["authorization"];
  const isVercelCron = authHeader === `Bearer ${secret}`;
  const isManual = req.query.secret === secret;

  if (secret && !isVercelCron && !isManual) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const subscribers = loadSubscribers();
  if (subscribers.length === 0) {
    return res.status(200).json({ ok: true, message: "No subscribers", sent: 0 });
  }

  // Fetch latest prices
  const base = process.env.NEXT_PUBLIC_BASE_URL || "https://makceni.mk";
  let prices = [];
  let updatedAt = new Date().toISOString();

  try {
    const r = await fetch(`${base}/api/prices`, { headers: { "x-force-refresh": "true" } });
    const d = await r.json();
    prices = d.prices || [];
    updatedAt = d.updatedAt || updatedAt;
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch prices: " + err.message });
  }

  if (prices.length === 0) {
    return res.status(500).json({ error: "No prices returned" });
  }

  const { subject, html } = buildEmailHtml(prices, updatedAt);

  // Send to all subscribers
  let sent = 0, failed = 0;
  for (const sub of subscribers) {
    try {
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "МакЦени.мк <no-reply@makceni.mk>",
          to: sub.email,
          subject,
          html,
        }),
      });
      if (r.ok) sent++;
      else failed++;
    } catch {
      failed++;
    }
  }

  console.log(`[NOTIFY] Sent: ${sent}, Failed: ${failed}, Total: ${subscribers.length}`);
  return res.status(200).json({ ok: true, sent, failed, total: subscribers.length });
}