// pages/api/berza.js
//
// Oil    : Yahoo Finance (proper headers) → stooq.com fallback
// Metals : stooq.com (xauusd / xagusd)
// Crypto : CoinGecko (no key, real-time)
//
// Caching: module-level (warm instances) + s-maxage=3600 (Vercel CDN edge)

const USD_TO_MKD      = 57.5;
const TROY_OZ_TO_GRAM = 31.1035;
const CACHE_TTL       = 60 * 60 * 1000;

let _cache   = null;
let _cacheAt = 0;

function pct(current, prev) {
  if (!prev || prev === 0 || isNaN(prev) || isNaN(current)) return 0;
  return parseFloat(((current - prev) / prev * 100).toFixed(2));
}

// ── Yahoo Finance ──────────────────────────────────────
// Yahoo blocks plain server-side fetches but passes with a full browser
// header set including a crumb cookie. We use the crumb-free v8 chart
// endpoint with a realistic User-Agent and Referer — this works from
// Vercel Edge runtime and most serverless environments.
async function fetchYahoo(ticker) {
  const url = `https://query2.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=5d`;
  const res = await fetch(url, {
    headers: {
      "User-Agent":      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept":          "application/json, text/plain, */*",
      "Accept-Language": "en-US,en;q=0.9",
      "Accept-Encoding": "gzip, deflate, br",
      "Referer":         "https://finance.yahoo.com/",
      "Origin":          "https://finance.yahoo.com",
      "Cache-Control":   "no-cache",
    },
    signal: AbortSignal.timeout(12000),
  });

  if (!res.ok) throw new Error(`Yahoo HTTP ${res.status} for ${ticker}`);

  const json   = await res.json();
  const result = json?.chart?.result?.[0];
  if (!result) throw new Error(`Yahoo: no result for ${ticker}`);

  const closes = result?.indicators?.quote?.[0]?.close?.filter(v => v != null);
  if (!closes || closes.length < 2) throw new Error(`Yahoo: not enough closes for ${ticker}`);

  const price  = closes[closes.length - 1];
  const prev   = closes[closes.length - 2];
  const date   = new Date(result.meta.regularMarketTime * 1000).toISOString().split("T")[0];

  return {
    price:  parseFloat(price.toFixed(2)),
    change: pct(price, prev),
    date,
  };
}

// ── stooq.com ──────────────────────────────────────────
async function fetchStooq(sym) {
  const res = await fetch(
    `https://stooq.com/q/l/?s=${sym}&f=sd2t2ohlcv&h&e=csv`,
    { headers: { "User-Agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(10000) }
  );
  if (!res.ok) throw new Error(`stooq HTTP ${res.status} for ${sym}`);

  const lines = (await res.text()).trim().split("\n");
  if (lines.length < 2) throw new Error(`stooq: no data rows for ${sym}`);

  const cols  = lines[1].split(",");
  const close = parseFloat(cols[6]);
  const open  = parseFloat(cols[3]);
  if (isNaN(close) || close === 0) throw new Error(`stooq: invalid close for ${sym} (got "${cols[6]}")`);

  return { price: close, change: pct(close, open), date: cols[1] };
}

// ── Oil ────────────────────────────────────────────────
// Yahoo tickers: BZ=F (Brent), CL=F (WTI)
async function fetchOil(type) {
  const yahooTicker = type === "BRENT" ? "BZ%3DF" : "CL%3DF";  // BZ=F, CL=F URL-encoded
  const stooqSym    = type === "BRENT" ? "CB.F"   : "CL.F";

  try {
    return await fetchYahoo(yahooTicker);
  } catch (e) {
    console.warn(`Yahoo ${type} failed (${e.message}), falling back to stooq`);
    const raw = await fetchStooq(stooqSym);
    return { price: parseFloat(raw.price.toFixed(2)), change: raw.change, date: raw.date };
  }
}

// ── Metals ─────────────────────────────────────────────
async function fetchMetal(symbol) {
  const sym = symbol === "XAU" ? "xauusd" : "xagusd";
  const raw = await fetchStooq(sym);
  return {
    price:  parseFloat((raw.price / TROY_OZ_TO_GRAM).toFixed(2)),
    change: raw.change,
    date:   raw.date,
  };
}

// ── Crypto: CoinGecko ──────────────────────────────────
async function fetchCrypto() {
  const res = await fetch(
    "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true",
    { headers: { "Accept": "application/json" }, signal: AbortSignal.timeout(10000) }
  );
  if (!res.ok) throw new Error(`CoinGecko HTTP ${res.status}`);

  const json = await res.json();
  if (!json?.bitcoin?.usd) throw new Error("CoinGecko: missing BTC");

  return {
    bitcoin:  { price: parseFloat(json.bitcoin.usd.toFixed(2)),  change: parseFloat((json.bitcoin.usd_24h_change  || 0).toFixed(2)) },
    ethereum: { price: parseFloat(json.ethereum.usd.toFixed(2)), change: parseFloat((json.ethereum.usd_24h_change || 0).toFixed(2)) },
  };
}

// ── Handler ────────────────────────────────────────────
export default async function handler(req, res) {
  if (_cache && Date.now() - _cacheAt < CACHE_TTL) {
    res.setHeader("X-Cache", "HIT");
    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=600");
    return res.status(200).json(_cache);
  }

  const errors = [];
  let brent = null, wti = null, gold = null, silver = null, crypto = null;

  await Promise.allSettled([
    fetchOil("BRENT")
      .then(r  => { brent  = r; console.log(`✓ Brent $${r.price} (${r.date})`); })
      .catch(e => { errors.push(`brent: ${e.message}`);  console.error("✗ Brent:",  e.message); }),
    fetchOil("WTI")
      .then(r  => { wti    = r; console.log(`✓ WTI $${r.price} (${r.date})`); })
      .catch(e => { errors.push(`wti: ${e.message}`);    console.error("✗ WTI:",    e.message); }),
    fetchMetal("XAU")
      .then(r  => { gold   = r; console.log(`✓ Gold $${r.price}/g (${r.date})`); })
      .catch(e => { errors.push(`gold: ${e.message}`);   console.error("✗ Gold:",   e.message); }),
    fetchMetal("XAG")
      .then(r  => { silver = r; console.log(`✓ Silver $${r.price}/g (${r.date})`); })
      .catch(e => { errors.push(`silver: ${e.message}`); console.error("✗ Silver:", e.message); }),
    fetchCrypto()
      .then(r  => { crypto = r; console.log(`✓ BTC $${r.bitcoin.price}, ETH $${r.ethereum.price}`); })
      .catch(e => { errors.push(`crypto: ${e.message}`); console.error("✗ Crypto:", e.message); }),
  ]);

  const mkd = (usd) => usd != null ? Math.round(usd * USD_TO_MKD) : null;

  const data = {
    oil: [
      { name: "Brent Crude", usd: brent?.price  ?? null, mkd: mkd(brent?.price),  change: brent?.change  ?? 0, unit: "barrel", date: brent?.date,  stale: !brent  },
      { name: "WTI Crude",   usd: wti?.price    ?? null, mkd: mkd(wti?.price),    change: wti?.change    ?? 0, unit: "barrel", date: wti?.date,    stale: !wti    },
    ],
    metals: [
      { name: "gold",   usd: gold?.price   ?? null, mkd: mkd(gold?.price),   change: gold?.change   ?? 0, unit: "gram", date: gold?.date,   stale: !gold   },
      { name: "silver", usd: silver?.price ?? null, mkd: mkd(silver?.price), change: silver?.change ?? 0, unit: "gram", date: silver?.date, stale: !silver },
    ],
    crypto: [
      { name: "Bitcoin",  usd: crypto?.bitcoin?.price  ?? null, mkd: mkd(crypto?.bitcoin?.price),  change: crypto?.bitcoin?.change  ?? 0, unit: "BTC", date: new Date().toISOString().split("T")[0], stale: !crypto },
      { name: "Ethereum", usd: crypto?.ethereum?.price ?? null, mkd: mkd(crypto?.ethereum?.price), change: crypto?.ethereum?.change ?? 0, unit: "ETH", date: new Date().toISOString().split("T")[0], stale: !crypto },
    ],
    updatedAt: new Date().toISOString(),
    stale: !brent && !wti && !gold && !silver && !crypto,
    errors: errors.length ? errors : undefined,
  };

  if (brent || wti || gold || silver || crypto) {
    _cache   = data;
    _cacheAt = Date.now();
  }

  res.setHeader("X-Cache", "MISS");
  res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=600");
  return res.status(200).json(data);
}