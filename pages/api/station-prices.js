// pages/api/station-prices.js

const FALLBACK_STATIONS = [
  { key: "makpetrol", name: "Makpetrol", logo: "/logos/makpetrol.png", prices: { benzin95: 83.0, benzin98: 85.0, dizel: 90.5, lpg: 54.0 } },
  { key: "okta",      name: "Okta",      logo: "/logos/okta.png",      prices: { benzin95: 83.0, benzin98: 85.0, dizel: 90.5, lpg: 54.0 } },
  { key: "lukoil",    name: "Lukoil",    logo: "/logos/lukoil.png",    prices: { benzin95: 83.0, benzin98: 85.0, dizel: 90.5, lpg: 54.0 } },
];

// Cache so we don't hammer gorivo.mk on every page load
let cache = { data: null, ts: 0 };
const TTL = 30 * 60 * 1000; // 30 min

function num(v) {
  if (v == null) return null;
  const n = parseFloat(String(v).replace(",", "."));
  return isNaN(n) ? null : n;
}

// Map gorivo.mk fuel labels (whatever they use) to our keys
function mapFuelKey(label) {
  const s = String(label || "").toLowerCase();
  if (s.includes("еурос")  && s.includes("95")) return "benzin95";
  if (s.includes("eurosuper") && s.includes("95")) return "benzin95";
  if (s.includes("95")) return "benzin95";
  if (s.includes("98")) return "benzin98";
  if (s.includes("дизел") || s.includes("dizel") || s.includes("diesel")) return "dizel";
  if (s.includes("lpg") || s.includes("тнг") || s.includes("плин")) return "lpg";
  return null;
}

function mapStationKey(name) {
  const s = String(name || "").toLowerCase();
  if (s.includes("makpetrol") || s.includes("макпетрол")) return "makpetrol";
  if (s.includes("okta") || s.includes("окта")) return "okta";
  if (s.includes("lukoil") || s.includes("лукоил")) return "lukoil";
  return null;
}

async function scrapeGorivo() {
  const res = await fetch("https://gorivo.mk/", {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml",
      "Accept-Language": "mk-MK,mk;q=0.9,en;q=0.5",
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();

  // 1) Try to extract __NEXT_DATA__ (most reliable for Next.js sites)
  const nextDataMatch = html.match(
    /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/
  );

  if (nextDataMatch) {
    try {
      const json = JSON.parse(nextDataMatch[1]);
      // Walk the object looking for arrays of stations/prices
      const stationsFound = extractFromNextData(json);
      if (stationsFound && stationsFound.length) return stationsFound;
    } catch (e) {
      console.error("Failed to parse __NEXT_DATA__:", e.message);
    }
  }

  // 2) Fallback: regex over raw HTML (best-effort)
  return scrapeFromHtml(html);
}

// Recursively walk __NEXT_DATA__ and collect station price objects
function extractFromNextData(obj, results = {}) {
  if (!obj || typeof obj !== "object") return results;

  // Heuristic: gorivo.mk usually has objects like { name: "Makpetrol", prices: [...] }
  // or arrays of { fuel: "...", price: 84.5, station: "..." }
  if (Array.isArray(obj)) {
    for (const item of obj) extractFromNextData(item, results);
    return Object.values(results);
  }

  // Look for station-like shapes
  const stationName = obj.name || obj.station || obj.stationName;
  const stKey = mapStationKey(stationName);

  if (stKey) {
    const fuelArr = obj.prices || obj.fuels || obj.fuelPrices;
    if (Array.isArray(fuelArr)) {
      results[stKey] = results[stKey] || { key: stKey, name: stationName, prices: {} };
      for (const f of fuelArr) {
        const fk = mapFuelKey(f.fuel || f.type || f.name || f.label);
        const p = num(f.price ?? f.value ?? f.amount);
        if (fk && p != null) results[stKey].prices[fk] = p;
      }
    }
  }

  for (const k of Object.keys(obj)) {
    if (obj[k] && typeof obj[k] === "object") extractFromNextData(obj[k], results);
  }

  return Object.values(results);
}

function scrapeFromHtml(html) {
  // Last-ditch text-based extraction
  const stations = [];
  for (const def of [
    { key: "makpetrol", name: "Makpetrol" },
    { key: "okta", name: "Okta" },
    { key: "lukoil", name: "Lukoil" },
  ]) {
    const re = new RegExp(def.name, "i");
    const m = html.match(re);
    if (!m) continue;
    const chunk = html.slice(m.index, m.index + 3000);
    const priceRe = /(\d{2,3}[.,]\d{1,2})\s*(?:ден|den|MKD)/gi;
    const all = [];
    let pm;
    while ((pm = priceRe.exec(chunk)) !== null) all.push(num(pm[1]));
    if (all.length >= 2) {
      stations.push({
        key: def.key,
        name: def.name,
        prices: {
          benzin95: all[0] ?? null,
          benzin98: all[1] ?? null,
          dizel:    all[2] ?? null,
          lpg:      all[3] ?? null,
        },
      });
    }
  }
  return stations;
}

// Merge scraped data over fallback so partial scrapes still work
function mergeWithFallback(scraped) {
  return FALLBACK_STATIONS.map(fb => {
    const found = scraped.find(s => s.key === fb.key);
    if (!found) return fb;
    return {
      ...fb,
      name: found.name || fb.name,
      prices: {
        benzin95: found.prices.benzin95 ?? fb.prices.benzin95,
        benzin98: found.prices.benzin98 ?? fb.prices.benzin98,
        dizel:    found.prices.dizel    ?? fb.prices.dizel,
        lpg:      found.prices.lpg      ?? fb.prices.lpg,
      },
    };
  });
}

export default async function handler(req, res) {
  // Serve from cache if fresh
  if (cache.data && Date.now() - cache.ts < TTL) {
    res.setHeader("Cache-Control", "public, s-maxage=1800, stale-while-revalidate=3600");
    return res.status(200).json(cache.data);
  }

  try {
    const scraped = await scrapeGorivo();
    const stations = mergeWithFallback(scraped);

    const payload = {
      stations,
      updatedAt: new Date().toISOString(),
      source: scraped.length > 0 ? "gorivo.mk" : "fallback",
    };

    cache = { data: payload, ts: Date.now() };
    res.setHeader("Cache-Control", "public, s-maxage=1800, stale-while-revalidate=3600");
    return res.status(200).json(payload);
  } catch (err) {
    console.error("station-prices scrape failed:", err);
    return res.status(200).json({
      stations: FALLBACK_STATIONS,
      updatedAt: new Date().toISOString(),
      source: "fallback",
      error: err.message,
    });
  }
}