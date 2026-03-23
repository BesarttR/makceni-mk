// pages/api/berza.js
// Oil:     Alpha Vantage (ALPHA_VANTAGE_KEY in .env.local)
// Metals:  gold-api.com  (no key needed)
// Crypto:  CoinGecko     (no key needed)

let cache = null;
let cacheTime = null;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

const USD_TO_MKD = 57.5;
const TROY_OUNCE_TO_GRAM = 31.1035;
const delay = (ms) => new Promise(r => setTimeout(r, ms));

// ── Oil: Alpha Vantage ─────────────────────────────────
async function fetchOil(type) {
  const key = process.env.ALPHA_VANTAGE_KEY;
  if (!key) throw new Error("No ALPHA_VANTAGE_KEY env var set");

  const res = await fetch(
    `https://www.alphavantage.co/query?function=${type}&interval=daily&apikey=${key}`,
    { signal: AbortSignal.timeout(10000) }
  );
  if (!res.ok) throw new Error(`Alpha Vantage ${res.status} for ${type}`);

  const json = await res.json();
  if (json.Note || json.Information) throw new Error("Alpha Vantage rate limit or key issue");

  const valid = (json?.data || []).filter(d => d.value && d.value !== ".");
  if (valid.length < 2) throw new Error(`Not enough data for ${type}`);

  const price = parseFloat(valid[0].value);
  const prev  = parseFloat(valid[1].value);
  const change = prev ? parseFloat(((price - prev) / prev * 100).toFixed(2)) : 0;

  return { price: parseFloat(price.toFixed(2)), change, date: valid[0].date };
}

// ── Metals: gold-api.com ───────────────────────────────
async function fetchMetal(symbol) {
  const res = await fetch(`https://api.gold-api.com/price/${symbol}`, {
    headers: { "Accept": "application/json" },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`gold-api.com ${res.status} for ${symbol}`);
  const json = await res.json();
  if (!json?.price) throw new Error(`gold-api.com: no price for ${symbol}`);

  // Convert troy ounce → gram
  const pricePerGram = parseFloat((json.price / TROY_OUNCE_TO_GRAM).toFixed(2));
  return {
    price: pricePerGram,
    change: 0,
    date: json.updatedAt?.split("T")[0] || new Date().toISOString().split("T")[0],
  };
}

// ── Crypto: CoinGecko (free, no key, instant) ──────────
async function fetchCrypto() {
  const res = await fetch(
    "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true",
    {
      headers: { "Accept": "application/json" },
      signal: AbortSignal.timeout(8000),
    }
  );
  if (!res.ok) throw new Error(`CoinGecko returned ${res.status}`);
  const json = await res.json();
  if (!json?.bitcoin?.usd) throw new Error("CoinGecko: missing bitcoin price");

  return {
    bitcoin: {
      price: parseFloat(json.bitcoin.usd.toFixed(2)),
      change: parseFloat((json.bitcoin.usd_24h_change || 0).toFixed(2)),
    },
    ethereum: {
      price: parseFloat(json.ethereum.usd.toFixed(2)),
      change: parseFloat((json.ethereum.usd_24h_change || 0).toFixed(2)),
    },
  };
}

export default async function handler(req, res) {
  if (cache && cacheTime && Date.now() - cacheTime < CACHE_DURATION) {
    return res.status(200).json(cache);
  }

  let brent = null, wti = null, gold = null, silver = null, crypto = null;

  // Oil — needs 13s delay between requests (Alpha Vantage 5req/min limit)
  try {
    brent = await fetchOil("BRENT");
    await delay(13000);
    wti = await fetchOil("WTI");
    console.log(`✓ Oil: Brent $${brent.price}, WTI $${wti.price}`);
  } catch (err) {
    console.warn("✗ Oil failed:", err.message);
  }

  // Metals + Crypto in parallel — both instant, no rate limits
  try {
    [gold, silver, crypto] = await Promise.all([
      fetchMetal("XAU"),
      fetchMetal("XAG"),
      fetchCrypto(),
    ]);
    console.log(`✓ Metals: Gold $${gold.price}/г, Silver $${silver.price}/г`);
    console.log(`✓ Crypto: BTC $${crypto.bitcoin.price}, ETH $${crypto.ethereum.price}`);
  } catch (err) {
    console.warn("✗ Metals/Crypto failed:", err.message);
  }

  const data = {
    oil: [
      {
        name: "Brent Crude",
        usd: brent?.price ?? 101.0,
        mkd: Math.round((brent?.price ?? 101.0) * USD_TO_MKD),
        change: brent?.change ?? 0,
        unit: "барел",
        date: brent?.date,
      },
      {
        name: "WTI Crude",
        usd: wti?.price ?? 93.0,
        mkd: Math.round((wti?.price ?? 93.0) * USD_TO_MKD),
        change: wti?.change ?? 0,
        unit: "барел",
        date: wti?.date,
      },
    ],
    metals: [
      {
        name: "Злато",
        usd: gold?.price ?? 96.46,
        mkd: Math.round((gold?.price ?? 96.46) * USD_TO_MKD),
        change: gold?.change ?? 0,
        unit: "грам",
        date: gold?.date,
      },
      {
        name: "Сребро",
        usd: silver?.price ?? 1.06,
        mkd: Math.round((silver?.price ?? 1.06) * USD_TO_MKD),
        change: silver?.change ?? 0,
        unit: "грам",
        date: silver?.date,
      },
    ],
    crypto: [
      {
        name: "Bitcoin",
        usd: crypto?.bitcoin?.price ?? 85000,
        mkd: Math.round((crypto?.bitcoin?.price ?? 85000) * USD_TO_MKD),
        change: crypto?.bitcoin?.change ?? 0,
        unit: "BTC",
        date: new Date().toISOString().split("T")[0],
      },
      {
        name: "Ethereum",
        usd: crypto?.ethereum?.price ?? 2000,
        mkd: Math.round((crypto?.ethereum?.price ?? 2000) * USD_TO_MKD),
        change: crypto?.ethereum?.change ?? 0,
        unit: "ETH",
        date: new Date().toISOString().split("T")[0],
      },
    ],
    updatedAt: new Date().toISOString(),
    source: brent ? "Alpha Vantage + gold-api.com + CoinGecko" : "fallback",
    stale: !brent,
  };

  if (brent || gold || crypto) {
    cache = data;
    cacheTime = Date.now();
  }

  res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate");
  return res.status(200).json(data);
}