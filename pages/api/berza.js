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
  const tickerMap = { WTI: "CL=F", BRENT: "BZ=F" };
  const ticker = tickerMap[type];

  const res = await fetch(
    `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1h&range=1d`,
    {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(10000),
    }
  );
  if (!res.ok) throw new Error(`Yahoo Finance ${res.status} for ${ticker}`);
  const json = await res.json();

  const result = json?.chart?.result?.[0];
  if (!result) throw new Error(`Yahoo Finance: no result for ${ticker}`);

  const closes = result?.indicators?.quote?.[0]?.close?.filter(v => v != null);
  if (!closes || closes.length < 2) throw new Error(`Yahoo Finance: not enough data for ${ticker}`);

  const price  = closes[closes.length - 1];
  const prev   = closes[closes.length - 2];
  const change = prev ? parseFloat(((price - prev) / prev * 100).toFixed(2)) : 0;
  const date   = new Date(result.meta.regularMarketTime * 1000).toISOString();

  return { price: parseFloat(price.toFixed(2)), change, date };
}
// ── Metals: gold-api.com ───────────────────────────────
async function fetchMetal(symbol) {
  const tickerMap = { XAU: "GC=F", XAG: "SI=F" };
  const ticker = tickerMap[symbol];

  const res = await fetch(
    `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1h&range=1d`,
    {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(10000),
    }
  );
  if (!res.ok) throw new Error(`Yahoo Finance ${res.status} for ${ticker}`);
  const json = await res.json();

  const result = json?.chart?.result?.[0];
  if (!result) throw new Error(`Yahoo Finance: no result for ${ticker}`);

  const closes = result?.indicators?.quote?.[0]?.close?.filter(v => v != null);
  if (!closes || closes.length < 2) throw new Error(`Yahoo Finance: not enough data for ${ticker}`);

  const priceOz = closes[closes.length - 1];
  const prevOz  = closes[closes.length - 2];
  const change  = prevOz ? parseFloat(((priceOz - prevOz) / prevOz * 100).toFixed(2)) : 0;
  const pricePerGram = parseFloat((priceOz / TROY_OUNCE_TO_GRAM).toFixed(2));

  return {
    price: pricePerGram,
    change,
    date: new Date(result.meta.regularMarketTime * 1000).toISOString().split("T")[0],
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
  [brent, wti] = await Promise.all([
    fetchOil("BRENT"),
    fetchOil("WTI"),
  ]);
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
    stale: !brent,
  };

  if (brent || gold || crypto) {
    cache = data;
    cacheTime = Date.now();
  }

  res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate");
  return res.status(200).json(data);
}