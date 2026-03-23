import * as cheerio from "cheerio";
import fs from "fs";
import path from "path";

let cache = null;
let cacheTime = null;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

const HISTORY_PATH = path.join("/tmp", "makceni_price_history.json");

// ── History helpers ────────────────────────────────────
function loadHistory() {
  try {
    if (fs.existsSync(HISTORY_PATH)) return JSON.parse(fs.readFileSync(HISTORY_PATH, "utf8"));
  } catch {}
  return [];
}

function saveHistory(history) {
  try { fs.writeFileSync(HISTORY_PATH, JSON.stringify(history), "utf8"); } catch {}
}

function appendToHistory(prices) {
  const history = loadHistory();
  const today = new Date().toISOString().split("T")[0];
  const alreadyToday = history.find(e => e.date === today);
  if (alreadyToday) {
    alreadyToday.prices = {};
    prices.forEach(p => { alreadyToday.prices[p.key] = p.price; });
  } else {
    const entry = { date: today, prices: {} };
    prices.forEach(p => { entry.prices[p.key] = p.price; });
    history.push(entry);
  }
  const trimmed = history.slice(-180);
  saveHistory(trimmed);
  return trimmed;
}

function getPreviousPrices(history) {
  if (history.length < 2) return {};
  return history[history.length - 2]?.prices || {};
}

function applyChange(prices) {
  const history = loadHistory();
  const prevPrices = getPreviousPrices(history);
  prices.forEach(p => {
    const prev = prevPrices[p.key];
    p.change = prev ? parseFloat((p.price - prev).toFixed(1)) : 0;
  });
  appendToHistory(prices);
  return prices;
}

// ── SOURCE 1: gorivo.mk ────────────────────────────────
async function fetchFromGorivo() {
  const response = await fetch("https://gorivo.mk", {
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml",
      "Accept-Language": "mk,en;q=0.9",
    },
    signal: AbortSignal.timeout(8000),
  });

  if (!response.ok) throw new Error("gorivo.mk returned " + response.status);

  const html = await response.text();
  const $ = cheerio.load(html);
  const prices = [];

  $("h3").each((i, el) => {
    const label = $(el).text().trim().toLowerCase();
    const priceRaw = $(el).next("h4").text().trim();
    const price = parseFloat(priceRaw.replace("ден", "").replace(",", ".").trim());
    if (!label || isNaN(price)) return;

    let key = null, name = null, accent = null, accentLight = null;
    if (label.includes("бензин 98")) {
      key = "benzin98"; name = "Бензин 98+"; accent = "#E67E22"; accentLight = "#FEF3E2";
    } else if (label.includes("бензин")) {
      key = "benzin95"; name = "Бензин 95"; accent = "#F04E1F"; accentLight = "#FFF0EB";
    } else if (label.includes("дизел")) {
      key = "dizel"; name = "Дизел"; accent = "#2563EB"; accentLight = "#DBEAFE";
    } else if (label.includes("плин") || label.includes("lpg")) {
      key = "lpg"; name = "Плин LPG"; accent = "#16A34A"; accentLight = "#DCFCE7";
    } else if (label.includes("метан") || label.includes("cng")) {
      key = "cng"; name = "Метан CNG"; accent = "#7C3AED"; accentLight = "#EDE9FE";
    } else if (label.includes("екстра лесно")) {
      key = "ekstra"; name = "Екстра Лесно"; accent = "#0891B2"; accentLight = "#CFFAFE";
    } else if (label.includes("мазут")) {
      key = "mazut"; name = "Мазут"; accent = "#78716C"; accentLight = "#F5F5F4";
    }
    if (!key || prices.find(p => p.key === key)) return;
    prices.push({ key, label: name, price, change: 0, accent, accentLight });
  });

  if (prices.length === 0) throw new Error("gorivo.mk: parsed 0 prices");
  return prices;
}

// ── SOURCE 2: RKE PDF ──────────────────────────────────
// RKE publishes PDFs at: erc.org.mk/odluki/YYYY.MM.DD-Odluka za ceni na ND.pdf
// They update every ~2 weeks (Tuesdays). We try the last 30 days to find the latest one.
async function fetchFromRKE() {
  // Try last 30 days to find the most recent PDF
  const today = new Date();
  let pdfText = null;
  let foundDate = null;

  for (let daysBack = 0; daysBack <= 30; daysBack++) {
    const d = new Date(today);
    d.setDate(d.getDate() - daysBack);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const dateStr = `${yyyy}.${mm}.${dd}`;
    const url = `https://erc.org.mk/odluki/${dateStr}-Odluka%20za%20ceni%20na%20ND.pdf`;

    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
          "Accept": "application/pdf,*/*",
          "Referer": "https://www.erc.org.mk/",
        },
        signal: AbortSignal.timeout(6000),
      });

      if (res.ok) {
        // Read as text — basic PDF text extraction for simple PDFs
        const buffer = await res.arrayBuffer();
        pdfText = extractTextFromPDF(buffer);
        foundDate = dateStr;
        break;
      }
    } catch {
      // Try next day
    }
  }

  if (!pdfText) throw new Error("RKE: no PDF found in last 30 days");

  // Parse prices from RKE PDF text using regex
  // Format: "ЕУРОСУПЕР БС-95 изнесува 86,50 ден/лит"
  const prices = [];

  const patterns = [
    { regex: /ЕУРОСУПЕР\s+БС-95[^0-9]*([\d]+[,.][\d]+)\s*ден/i, key: "benzin95", name: "Бензин 95", accent: "#F04E1F", accentLight: "#FFF0EB" },
    { regex: /ЕУРОСУПЕР\s+БС-98[^0-9]*([\d]+[,.][\d]+)\s*ден/i, key: "benzin98", name: "Бензин 98+", accent: "#E67E22", accentLight: "#FEF3E2" },
    { regex: /ЕУРОДИЗЕЛ[^0-9]*([\d]+[,.][\d]+)\s*ден/i,          key: "dizel",   name: "Дизел",     accent: "#2563EB", accentLight: "#DBEAFE" },
    { regex: /Екстра лесно[^0-9]*([\d]+[,.][\d]+)\s*ден/i,        key: "ekstra",  name: "Екстра Лесно", accent: "#0891B2", accentLight: "#CFFAFE" },
    { regex: /Мазут[^0-9]*([\d]+[,.][\d]+)\s*ден/i,               key: "mazut",   name: "Мазут",     accent: "#78716C", accentLight: "#F5F5F4" },
  ];

  for (const { regex, key, name, accent, accentLight } of patterns) {
    const match = pdfText.match(regex);
    if (match) {
      const price = parseFloat(match[1].replace(",", "."));
      if (!isNaN(price) && price > 0) {
        prices.push({ key, label: name, price, change: 0, accent, accentLight });
      }
    }
  }

  // LPG and CNG are rarely in RKE PDF — keep them from cache if available
  if (cache?.prices) {
    for (const key of ["lpg", "cng"]) {
      if (!prices.find(p => p.key === key)) {
        const cached = cache.prices.find(p => p.key === key);
        if (cached) prices.push({ ...cached, change: 0 });
      }
    }
  }

  if (prices.length < 3) throw new Error(`RKE: only parsed ${prices.length} prices from PDF`);

  console.log(`RKE PDF fetched for date ${foundDate}, parsed ${prices.length} prices`);
  return prices;
}

// ── Basic PDF text extractor (no external lib needed) ─
// Extracts readable text streams from simple PDFs
function extractTextFromPDF(buffer) {
  try {
    const bytes = new Uint8Array(buffer);
    let text = "";
    // Decode as latin1 to preserve Cyrillic encoded in PDF streams
    for (let i = 0; i < bytes.length; i++) {
      text += String.fromCharCode(bytes[i]);
    }
    // Extract text between BT (begin text) and ET (end text) markers
    const btEtRegex = /BT([\s\S]*?)ET/g;
    let match;
    let extracted = "";
    while ((match = btEtRegex.exec(text)) !== null) {
      // Extract string literals from Tj and TJ operators
      const tjRegex = /\(([^)]*)\)\s*Tj/g;
      const tjArrRegex = /\[([^\]]*)\]\s*TJ/g;
      let m;
      while ((m = tjRegex.exec(match[1])) !== null) extracted += m[1] + " ";
      while ((m = tjArrRegex.exec(match[1])) !== null) {
        // Pull strings from array
        const strRegex = /\(([^)]*)\)/g;
        let sm;
        while ((sm = strRegex.exec(m[1])) !== null) extracted += sm[1];
        extracted += " ";
      }
    }
    // Also try to get raw text for Macedonian (UTF-16 encoded PDFs)
    // Fall back to full raw text search if extraction is empty
    if (extracted.trim().length < 50) {
      return text; // raw fallback
    }
    return extracted;
  } catch {
    return "";
  }
}

// ── Main handler ───────────────────────────────────────
export default async function handler(req, res) {
  // Serve price history
  if (req.method === "GET" && req.query.history === "1") {
    const history = loadHistory();
    const period = req.query.period || "7d";
    const days = period === "6m" ? 180 : period === "30d" ? 30 : 7;
    return res.status(200).json({ history: history.slice(-days) });
  }

  const forceRefresh = req.headers["x-force-refresh"] === "true";
  if (!forceRefresh && cache && cacheTime && Date.now() - cacheTime < CACHE_DURATION) {
    return res.status(200).json(cache);
  }

  let prices = null;
  let source = null;
  const errors = [];

  // ── Layer 1: gorivo.mk ─────────────────────────────
  try {
    prices = await fetchFromGorivo();
    source = "gorivo.mk";
    console.log("✓ Prices from gorivo.mk");
  } catch (err) {
    errors.push(`gorivo.mk: ${err.message}`);
    console.warn("✗ gorivo.mk failed:", err.message);
  }

  // ── Layer 2: RKE PDF ───────────────────────────────
  if (!prices) {
    try {
      prices = await fetchFromRKE();
      source = "erc.org.mk";
      console.log("✓ Prices from RKE PDF");
    } catch (err) {
      errors.push(`RKE: ${err.message}`);
      console.warn("✗ RKE failed:", err.message);
    }
  }

  // ── Layer 3: stale cache ───────────────────────────
  if (!prices) {
    if (cache) {
      console.warn("✗ All sources failed, returning stale cache. Errors:", errors);
      return res.status(200).json({ ...cache, stale: true, errors });
    }
    return res.status(500).json({ error: "All price sources failed", errors });
  }

  // Apply change calculation and save history
  prices = applyChange(prices);

  const data = {
    prices,
    updatedAt: new Date().toISOString(),
    source,
  };

  cache = data;
  cacheTime = Date.now();
  res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate");
  return res.status(200).json(data);
}