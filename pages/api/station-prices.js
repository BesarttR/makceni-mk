// pages/api/station-prices.js

const FALLBACK_STATIONS = [
  { key: "makpetrol", name: "Makpetrol", logo: "/logos/makpetrol.png", prices: { benzin95: 83.0, benzin98: 85.0, dizel: 90.5, lpg: 54.0 } },
  { key: "okta",      name: "Okta",      logo: "/logos/okta.png",      prices: { benzin95: 83.0, benzin98: 85.0, dizel: 90.5, lpg: 54.0 } },
  { key: "lukoil",    name: "Lukoil",    logo: "/logos/lukoil.png",    prices: { benzin95: 83.0, benzin98: 85.0, dizel: 90.5, lpg: 54.0 } },
];

let cache = { data: null, ts: 0 };
const TTL = 30 * 60 * 1000; // 30 min

// Parse "83,0" -> 83.0, "53,5-54,0" -> 53.75 (range average)
function parsePrice(raw) {
  if (!raw) return null;
  const cleaned = String(raw).trim();

  if (cleaned.includes("-")) {
    const parts = cleaned.split("-").map(p => parseFloat(p.replace(",", ".")));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      return (parts[0] + parts[1]) / 2;
    }
  }

  const n = parseFloat(cleaned.replace(",", "."));
  return isNaN(n) ? null : n;
}

async function scrapePrices() {
  const res = await fetch("https://gorivo.mk/", {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml",
      "Accept-Language": "mk-MK,mk;q=0.9,en;q=0.5",
    },
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();

  const stations = [];
  const stationDefs = [
    { key: "makpetrol", name: "Makpetrol" },
    { key: "okta",      name: "Okta" },
    { key: "lukoil",    name: "Lukoil" },
  ];

  for (const def of stationDefs) {
    const altRegex = new RegExp(`alt=["']${def.name}["']`, "i");
    const altMatch = html.match(altRegex);
    if (!altMatch) continue;

    const chunk = html.slice(altMatch.index, altMatch.index + 2500);

    const cellRegex = /MuiTypography-caption[^"]*"[^>]*>(\d{1,3},\d{1,2}(?:-\d{1,3},\d{1,2})?)/g;
    const matches = [];
    let m;
    while ((m = cellRegex.exec(chunk)) !== null) {
      const v = parsePrice(m[1]);
      if (v != null && v >= 20 && v <= 200) matches.push(v);
      if (matches.length >= 4) break;
    }

    if (matches.length >= 4) {
      stations.push({
        key: def.key,
        name: def.name,
        logo: FALLBACK_STATIONS.find(s => s.key === def.key)?.logo,
        prices: {
          benzin95: matches[0],
          benzin98: matches[1],
          dizel:    matches[2],
          lpg:      matches[3],
        },
      });
    }
  }

  return stations;
}

function mergeWithFallback(scraped) {
  return FALLBACK_STATIONS.map(fb => {
    const found = scraped.find(s => s.key === fb.key);
    if (!found) return fb;
    return {
      ...fb,
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
  if (cache.data && Date.now() - cache.ts < TTL) {
    res.setHeader("Cache-Control", "public, s-maxage=1800, stale-while-revalidate=3600");
    return res.status(200).json(cache.data);
  }

  try {
    const scraped = await scrapePrices();
    const stations = mergeWithFallback(scraped);

    const payload = {
      stations,
      updatedAt: new Date().toISOString(),
    };

    cache = { data: payload, ts: Date.now() };
    res.setHeader("Cache-Control", "public, s-maxage=1800, stale-while-revalidate=3600");
    return res.status(200).json(payload);
  } catch (err) {
    console.error("station-prices fetch failed:", err);
    return res.status(200).json({
      stations: FALLBACK_STATIONS,
      updatedAt: new Date().toISOString(),
    });
  }
}