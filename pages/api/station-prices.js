// pages/station-prices.js
import { useEffect, useState } from "react";
import Image from "next/image";
import { useLanguage, LanguageSwitcher } from "../../translations";

const FALLBACK_STATIONS = [
  { key: "makpetrol", name: "Makpetrol", logo: "/logos/makpetrol.png", prices: { benzin95: 84.5, benzin98: 86.5, dizel: 93.5, lpg: 59.0 } },
  { key: "okta",      name: "Okta",      logo: "/logos/okta.png",      prices: { benzin95: 84.5, benzin98: 86.5, dizel: 92.5, lpg: 59.0 } },
  { key: "lukoil",    name: "Lukoil",    logo: "/logos/lukoil.png",    prices: { benzin95: 84.5, benzin98: 86.5, dizel: 93.5, lpg: 57.0 } },
];

const LANGUAGES = [
  { code: "en", label: "EN" },
  { code: "mk", label: "МК" },
  { code: "sq", label: "SQ" },
  { code: "tr", label: "TR" },
];

function parsePrice(str) {
  if (!str) return null;
  const num = parseFloat(str.replace(",", ".").replace(/[^\d.]/g, ""));
  return isNaN(num) ? null : num;
}

async function scrapeGorivo() {
  const res = await fetch("https://gorivo.mk/", {
    headers: { "User-Agent": "Mozilla/5.0", "Accept": "text/html", "Accept-Language": "mk,en;q=0.5" },
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
    const nameEscaped = def.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const startPattern = new RegExp(nameEscaped, "i");
    const startMatch = html.match(startPattern);

    if (!startMatch) {
      stations.push({ ...def, prices: FALLBACK_STATIONS.find(s => s.key === def.key)?.prices || {} });
      continue;
    }

    const startIdx = startMatch.index;
    const chunk = html.slice(startIdx, startIdx + 2000);

    const priceRegex = /(\d+[,\.]\d+)\s*(?:ден|den)/gi;
    const allPrices = [];
    let m;
    while ((m = priceRegex.exec(chunk)) !== null) allPrices.push(parsePrice(m[1]));

    const prices = {
      benzin95: allPrices[0] ?? null,
      benzin98: allPrices[1] ?? null,
      dizel:    allPrices[2] ?? null,
      lpg:      allPrices[3] ?? null,
    };

    const fallback = FALLBACK_STATIONS.find(s => s.key === def.key)?.prices || {};
    stations.push({
      ...def,
      prices: {
        benzin95: prices.benzin95 ?? fallback.benzin95,
        benzin98: prices.benzin98 ?? fallback.benzin98,
        dizel:    prices.dizel    ?? fallback.dizel,
        lpg:      prices.lpg      ?? fallback.lpg,
      },
    });
  }
  return stations;
}

export default function StationPrices() {
  const [stations, setStations] = useState([]);
  const { tr, lang, setLang } = useLanguage();

  useEffect(() => {
    async function fetchPrices() {
      try {
        const res = await fetch("/api/station-prices");
        const data = await res.json();
        setStations(data.stations || FALLBACK_STATIONS);
      } catch {
        setStations(FALLBACK_STATIONS);
      }
    }
    fetchPrices();
  }, []);

  return (
    <main style={{ padding: "2rem" }}>
      {/* Language switcher */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", justifyContent: "flex-end" }}>
        {LANGUAGES.map(l => (
          <button
            key={l.code}
            onClick={() => setLang(l.code)}
            style={{
              padding: "0.25rem 0.6rem",
              border: "1px solid #ccc",
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: lang === l.code ? "bold" : "normal",
              backgroundColor: lang === l.code ? "#333" : "#fff",
              color: lang === l.code ? "#fff" : "#333",
            }}
          >
            {l.label}
          </button>
        ))}
      </div>

      <h1 style={{ marginBottom: "1rem", display:"flex", alignItems:"center", gap:8 }}>
  <img src="/icons/gasstation1.png" style={{ width:28, height:28, objectFit:"contain" }} />
  {tr("stationPrices.title")}
</h1>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ backgroundColor: "#f1f1f1" }}>
            <th style={{ padding: "0.5rem", textAlign: "left" }}>{tr("stationPrices.station")}</th>
            <th style={{ padding: "0.5rem" }}>{tr("stationPrices.benzin95")}</th>
            <th style={{ padding: "0.5rem" }}>{tr("stationPrices.benzin98")}</th>
            <th style={{ padding: "0.5rem" }}>{tr("stationPrices.dizel")}</th>
            <th style={{ padding: "0.5rem" }}>{tr("stationPrices.lpg")}</th>
          </tr>
        </thead>
        <tbody>
          {stations.map(station => (
            <tr key={station.key} style={{ borderBottom: "1px solid #ccc" }}>
              <td style={{ display: "flex", alignItems: "center", gap: "8px", padding: "0.5rem" }}>
                <div style={{
                  width: 80,
                  height: 40,
                  position: "relative",
                  backgroundColor: "#fff",
                  padding: "4px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px solid #eee",
                  borderRadius: "4px"
                }}>
                  <Image
                    src={station.logo || FALLBACK_STATIONS.find(s => s.key === station.key)?.logo}
                    alt={station.name}
                    fill
                    style={{ objectFit: "contain" }}
                  />
                </div>
                <span>{station.name}</span>
              </td>
              <td style={{ textAlign: "center", padding: "0.5rem" }}>{station.prices.benzin95}</td>
              <td style={{ textAlign: "center", padding: "0.5rem" }}>{station.prices.benzin98}</td>
              <td style={{ textAlign: "center", padding: "0.5rem" }}>{station.prices.dizel}</td>
              <td style={{ textAlign: "center", padding: "0.5rem" }}>{station.prices.lpg}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}