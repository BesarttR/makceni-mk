
const FEEDS = [
  { url: "https://mk.tv21.tv/feed/",    source: "TV21"  },
  { url: "https://telma.com.mk/feed/",  source: "Телма" },
  { url: "https://mia.mk/feed/",        source: "МИА"   },
];

let cache = null;
let cacheTime = 0;
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

async function fetchFeed({ url, source }) {
  const res = await fetch(url, {
    headers: { "User-Agent": "makceni.mk/1.0" },
    signal: AbortSignal.timeout(6000),
  });
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  const xml = await res.text();
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let m;
  while ((m = itemRegex.exec(xml)) !== null) {
    const block = m[1];
    const title   = extractTag(block, "title");
    const link    = extractTag(block, "link") || extractTag(block, "guid");
    const pubDate = extractTag(block, "pubDate");
    const src     = source;
    if (!title || !link) continue;
    items.push({
      title: decode(title),
      url: link.trim(),
      source: src,
      publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
    });
  }
  return items;
}

function extractTag(xml, tag) {
  const re = new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`, "i");
  const found = xml.match(re);
  return found ? found[1].trim() : null;
}

function decode(str) {
  return str
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, " ").trim();
}

function relativeTime(iso) {
  const mins = Math.floor((Date.now() - new Date(iso)) / 60000);
  if (mins < 2)  return "пред малку";
  if (mins < 60) return `${mins}мин`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}ч`;
  return `${Math.floor(hrs / 24)}д`;
}

export default async function handler(req, res) {
  const showAll = req.query.all === "1";
  const bust = req.query.bust === "1";

  if (!bust && cache && Date.now() - cacheTime < CACHE_TTL) {
    const news = showAll ? cache : buildPreview(cache);
    return res.status(200).json({ news, cachedAt: new Date(cacheTime).toISOString() });
  }

  const results = await Promise.allSettled(FEEDS.map(fetchFeed));

  // Collect up to 5 items per source
  let perSource = [];
  results.forEach((r, i) => {
    if (r.status === "fulfilled") {
      const source = FEEDS[i].source;
      const items = r.value
        .filter(item => {
          const letters = item.title.replace(/[^a-zA-Zа-шА-Ш\u0400-\u04FF]/g, "");
          if (letters.length === 0) return false;
          const cyrillic = (item.title.match(/[\u0400-\u04FF]/g) || []).length;
          return cyrillic / letters.length >= 0.3;
        })
        .slice(0, 5)
        .map(item => ({ ...item, source, time: relativeTime(item.publishedAt) }));
      perSource.push(items);
    }
  });

  // Interleave: TV21[0], Telma[0], MIA[0], TV21[1], Telma[1], MIA[1] ...
  const maxLen = Math.max(...perSource.map(a => a.length));
  let all = [];
  for (let i = 0; i < maxLen; i++) {
    for (const items of perSource) {
      if (items[i]) all.push(items[i]);
    }
  }

  cache = all;
  cacheTime = Date.now();

  const news = showAll ? all : buildPreview(all);
  res.status(200).json({ news, cachedAt: new Date(cacheTime).toISOString() });
}

/**
 * Returns exactly 1 article per source for the preview (3 cards total).
 */
function buildPreview(all) {
  const seen = new Set();
  const preview = [];
  for (const item of all) {
    if (!seen.has(item.source)) {
      seen.add(item.source);
      preview.push(item);
    }
    if (preview.length === 3) break;
  }
  return preview;
}