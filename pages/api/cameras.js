// Cache cameras for 24 hours
let cache = null;
let cacheTime = null;
const CACHE_DURATION = 24 * 60 * 60 * 1000;

const ALLOWED_ORIGINS = [
  "https://makceni.mk",
  "https://www.makceni.mk",
  "http://localhost:3000", // remove in production if you want
];

// 218 verified Safe City camera locations (source: gorivo.mk)
const GORIVO_CAMERAS = [/* ... your existing array ... */];

export default async function handler(req, res) {
  const origin = req.headers.origin ?? req.headers.referer ?? "";
  const allowed = ALLOWED_ORIGINS.some(o => origin.startsWith(o));

  if (!allowed) {
    return res.status(403).json({ error: "Forbidden" });
  }

  if (cache && cacheTime && Date.now() - cacheTime < CACHE_DURATION) {
    return res.status(200).json(cache);
  }

  try {
    const query = `[out:json][timeout:25];
(
  node["highway"="speed_camera"](41.85,21.30,42.10,21.65);
  node["enforcement"="maxspeed"](41.85,21.30,42.10,21.65);
);
out center;`;

    const response = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: "data=" + encodeURIComponent(query),
    });

    let cameras = [...GORIVO_CAMERAS];

    if (response.ok) {
      const json = await response.json();
      const osmCameras = json.elements
        .filter(el => el.lat && el.lon)
        .map(el => ({
          id: el.id,
          lat: el.lat,
          lng: el.lon,
          maxspeed: el.tags?.maxspeed || null,
        }));

      osmCameras.forEach(osmCam => {
        const isDuplicate = cameras.some(c => {
          const dlat = Math.abs(c.lat - osmCam.lat);
          const dlng = Math.abs(c.lng - osmCam.lng);
          return dlat < 0.0005 && dlng < 0.0005;
        });
        if (!isDuplicate) cameras.push(osmCam);
      });
    }

    const data = {
      cameras,
      updatedAt: new Date().toISOString(),
      count: cameras.length,
      source: "gorivo.mk + OSM",
    };

    cache = data;
    cacheTime = Date.now();
    res.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate");
    return res.status(200).json(data);

  } catch (err) {
    console.error("Camera fetch error:", err.message);
    const data = {
      cameras: GORIVO_CAMERAS,
      updatedAt: new Date().toISOString(),
      count: GORIVO_CAMERAS.length,
      source: "gorivo.mk (cached)",
    };
    cache = data;
    cacheTime = Date.now();
    return res.status(200).json(data);
  }
}