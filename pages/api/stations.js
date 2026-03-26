let cache = null;
let cacheTime = null;
const CACHE_DURATION = 24 * 60 * 60 * 1000;

export default async function handler(req, res) {
  const origin = req.headers.origin ?? req.headers.referer ?? "";
  const isDev = process.env.NODE_ENV === "development";
  const allowed = isDev || ["https://makceni.mk", "https://www.makceni.mk"]
    .some(o => origin.startsWith(o));
  if (!allowed) return res.status(403).json({ error: "Forbidden" });

  if (cache && cacheTime && Date.now() - cacheTime < CACHE_DURATION) {
    return res.status(200).json(cache);
  }

  try {
    const query = `
      [out:json][timeout:60];
      area["ISO3166-1"="MK"][admin_level=2]->.mk;
      (
        node["amenity"="fuel"](area.mk);
        way["amenity"="fuel"](area.mk);
        relation["amenity"="fuel"](area.mk);
      );
      out center;
    `;
    const response = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: "data=" + encodeURIComponent(query),
    });
    const data = await response.json();
    const result = { stations: data.elements, updatedAt: new Date().toISOString() };
    cache = result;
    cacheTime = Date.now();
    res.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate");
    return res.status(200).json(result);
  } catch (err) {
    console.error("Stations fetch error:", err.message);
    return res.status(500).json({ error: "Failed to fetch stations" });
  }
}