// pages/api/cron.js
// Called by Vercel Cron every Tuesday at 00:05
// 1. Fetches new prices from gorivo.mk (or RKE fallback)
// 2. Sends email notifications to all subscribers
//
// vercel.json entry:
//   { "path": "/api/cron", "schedule": "5 0 * * 2" }
//
// Set in Vercel env vars:
//   CRON_SECRET=your_secret
//   NEXT_PUBLIC_BASE_URL=https://makceni.mk

export default async function handler(req, res) {
  const authHeader = req.headers["authorization"];
  const secret = process.env.CRON_SECRET;
  const isVercelCron = authHeader === `Bearer ${secret}`;
  const isManualCall = req.query.secret === secret;

  if (secret && !isVercelCron && !isManualCall) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const base = process.env.NEXT_PUBLIC_BASE_URL || "https://makceni.mk";
  const results = {};

  // Step 1: Force refresh prices
  try {
    const r = await fetch(`${base}/api/prices`, {
      headers: { "x-force-refresh": "true", "User-Agent": "makceni-cron/1.0" },
    });
    const d = await r.json();
    results.prices = { ok: r.ok, source: d.source, count: d.prices?.length, stale: d.stale };
    console.log(`[CRON] Prices refreshed. Source: ${d.source}, Count: ${d.prices?.length}`);
  } catch (err) {
    results.prices = { ok: false, error: err.message };
    console.error("[CRON] Price refresh failed:", err.message);
  }

  // Step 2: Send email notifications to subscribers
  try {
    const r = await fetch(`${base}/api/notify`, {
      headers: {
        "Authorization": `Bearer ${secret}`,
        "User-Agent": "makceni-cron/1.0",
      },
    });
    const d = await r.json();
    results.notify = d;
    console.log(`[CRON] Notifications sent: ${d.sent}, Failed: ${d.failed}`);
  } catch (err) {
    results.notify = { ok: false, error: err.message };
    console.error("[CRON] Notify failed:", err.message);
  }

  return res.status(200).json({ ok: true, ...results });
}