"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Head from "next/head";

// ─── Brand config ────────────────────────────────────────────────────────────
const BRAND_COLORS = {
  okta:      "#DC2626",
  makpetrol: "#D97706",
  lukoil:    "#EA580C",
  eko:       "#7C3AED",
  nis:       "#0891B2",
  shell:     "#EAB308",
  bp:        "#15803D",
  other:     "#78716C",
};
const BRAND_LABELS = {
  okta:"OKTA", makpetrol:"Макпетрол", lukoil:"Лукоил", eko:"ЕКО",
  nis:"НИС Петрол", shell:"Shell", bp:"BP", other:"Друго",
};

function detectBrand(tags = {}) {
  const raw = ((tags.brand||"")+(tags.operator||"")+(tags.name||"")).toLowerCase();
  if (raw.includes("okta")) return "okta";
  if (raw.includes("makpetrol")||raw.includes("макпетрол")) return "makpetrol";
  if (raw.includes("lukoil")||raw.includes("лукоил")) return "lukoil";
  if (raw.includes("eko")||raw.includes("еко")) return "eko";
  if (raw.includes("nis")||raw.includes("нис")) return "nis";
  if (raw.includes("shell")) return "shell";
  if (raw.includes("bp")) return "bp";
  return "other";
}

function parseFuels(tags = {}) {
  const map = {
    "fuel:octane_95":"Бензин 95","fuel:octane_98":"Бензин 98+",
    "fuel:diesel":"Дизел","fuel:lpg":"LPG","fuel:cng":"CNG","fuel:e85":"E85",
  };
  return Object.entries(map).filter(([k])=>tags[k]==="yes").map(([,v])=>v);
}

function getDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = (lat2-lat1)*Math.PI/180, dLng = (lng2-lng1)*Math.PI/180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return R*2*Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}
function formatDist(m) { return m<1000?`${Math.round(m)} м`:`${(m/1000).toFixed(1)} км`; }

// ─── Fallback stations ───────────────────────────────────────────────────────
const FALLBACK_STATIONS = [
  { id:1,  lat:41.9981, lng:21.4254, brand:"okta",      name:"OKTA Автокоманда",           addr:"Бул. Александар Македонски", city:"Скопје",    fuels:["Бензин 95","Бензин 98+","Дизел","CNG"] },
  { id:2,  lat:42.0041, lng:21.3892, brand:"okta",      name:"OKTA Буњаковец",             addr:"Бул. 8-ми Септември",        city:"Скопје",    fuels:["Бензин 95","Бензин 98+","Дизел"] },
  { id:3,  lat:41.9754, lng:21.3312, brand:"okta",      name:"OKTA Сарај",                 addr:"Сарај",                      city:"Скопје",    fuels:["Бензин 95","Дизел","LPG"] },
  { id:4,  lat:41.9612, lng:21.4601, brand:"okta",      name:"OKTA Аеродром",              addr:"Бул. Борис Трајковски",      city:"Скопје",    fuels:["Бензин 95","Бензин 98+","Дизел"] },
  { id:5,  lat:42.0201, lng:21.3711, brand:"okta",      name:"OKTA Ѓорче Петров",          addr:"Ѓорче Петров",               city:"Скопје",    fuels:["Бензин 95","Бензин 98+","Дизел","LPG"] },
  { id:6,  lat:41.9981, lng:21.4312, brand:"makpetrol", name:"Макпетрол Центар",           addr:"Бул. Партизански Одреди",    city:"Скопје",    fuels:["Бензин 95","Бензин 98+","Дизел","LPG"] },
  { id:7,  lat:41.9701, lng:21.4789, brand:"makpetrol", name:"Макпетрол Кисела Вода",      addr:"Кисела Вода",                city:"Скопје",    fuels:["Бензин 95","Дизел","CNG"] },
  { id:8,  lat:42.0121, lng:21.4456, brand:"makpetrol", name:"Макпетрол Чаир",             addr:"Чаир",                       city:"Скопје",    fuels:["Бензин 95","Бензин 98+","Дизел"] },
  { id:9,  lat:42.0034, lng:21.5001, brand:"makpetrol", name:"Макпетрол Гази Баба",        addr:"Гази Баба",                  city:"Скопје",    fuels:["Бензин 95","Дизел","LPG"] },
  { id:10, lat:41.9689, lng:21.4523, brand:"lukoil",    name:"Лукоил Борис Трајковски",    addr:"Бул. Борис Трајковски",      city:"Скопје",    fuels:["Бензин 95","Бензин 98+","Дизел","LPG"] },
  { id:11, lat:41.9934, lng:21.3978, brand:"lukoil",    name:"Лукоил Илинден",             addr:"Илинден",                    city:"Скопје",    fuels:["Бензин 95","Дизел"] },
  { id:12, lat:41.9867, lng:21.4667, brand:"lukoil",    name:"Лукоил Сити Мол",            addr:"Сити Мол",                   city:"Скопје",    fuels:["Бензин 95","Бензин 98+","Дизел","LPG"] },
  { id:13, lat:41.9812, lng:21.4012, brand:"lukoil",    name:"Лукоил Водно",               addr:"Водно",                      city:"Скопје",    fuels:["Бензин 95","Дизел"] },
  { id:14, lat:42.0089, lng:20.9712, brand:"makpetrol", name:"Макпетрол Тетово",           addr:"Бул. Илинден",               city:"Тетово",    fuels:["Бензин 95","Бензин 98+","Дизел","LPG"] },
  { id:15, lat:42.0034, lng:20.9634, brand:"lukoil",    name:"Лукоил Тетово",              addr:"Тетово центар",              city:"Тетово",    fuels:["Бензин 95","Дизел"] },
  { id:16, lat:42.0112, lng:20.9801, brand:"okta",      name:"OKTA Тетово",                addr:"Тетово",                     city:"Тетово",    fuels:["Бензин 95","Бензин 98+","Дизел"] },
  { id:17, lat:42.1323, lng:21.7145, brand:"lukoil",    name:"Лукоил Куманово",            addr:"Куманово",                   city:"Куманово",  fuels:["Бензин 95","Бензин 98+","Дизел"] },
  { id:18, lat:42.1289, lng:21.7234, brand:"makpetrol", name:"Макпетрол Куманово",         addr:"Куманово центар",            city:"Куманово",  fuels:["Бензин 95","Дизел","LPG","CNG"] },
  { id:19, lat:41.0312, lng:21.3345, brand:"makpetrol", name:"Макпетрол Битола",           addr:"Бул. 1 Мај",                 city:"Битола",    fuels:["Бензин 95","Бензин 98+","Дизел","LPG"] },
  { id:20, lat:41.0267, lng:21.3412, brand:"lukoil",    name:"Лукоил Битола",              addr:"Битола центар",              city:"Битола",    fuels:["Бензин 95","Дизел"] },
  { id:21, lat:41.1178, lng:20.8012, brand:"makpetrol", name:"Макпетрол Охрид",            addr:"Кеј Македонија",             city:"Охрид",     fuels:["Бензин 95","Бензин 98+","Дизел","LPG"] },
  { id:22, lat:41.1134, lng:20.7978, brand:"lukoil",    name:"Лукоил Охрид",               addr:"Охрид центар",               city:"Охрид",     fuels:["Бензин 95","Дизел"] },
  { id:23, lat:41.7156, lng:21.7734, brand:"makpetrol", name:"Макпетрол Велес",            addr:"Велес центар",               city:"Велес",     fuels:["Бензин 95","Дизел","LPG"] },
  { id:24, lat:41.4378, lng:22.6434, brand:"makpetrol", name:"Макпетрол Струмица",         addr:"Струмица центар",            city:"Струмица",  fuels:["Бензин 95","Дизел","LPG"] },
  { id:25, lat:41.1389, lng:22.5023, brand:"makpetrol", name:"Макпетрол Гевгелија",        addr:"Гевгелија",                  city:"Гевгелија", fuels:["Бензин 95","Дизел","LPG","CNG"] },
  { id:26, lat:41.7956, lng:20.9112, brand:"makpetrol", name:"Макпетрол Гостивар",         addr:"Гостивар центар",            city:"Гостивар",  fuels:["Бензин 95","Бензин 98+","Дизел","LPG"] },
  { id:27, lat:41.7434, lng:22.1923, brand:"lukoil",    name:"Лукоил Штип",                addr:"Штип",                       city:"Штип",      fuels:["Бензин 95","Бензин 98+","Дизел"] },
  { id:28, lat:41.0178, lng:21.3534, brand:"okta",      name:"OKTA Битола",                addr:"Битола",                     city:"Битола",    fuels:["Бензин 95","Бензин 98+","Дизел"] },
  { id:29, lat:41.9456, lng:21.4234, brand:"eko",       name:"ЕКО Скопје Исток",           addr:"Источна индустриска",        city:"Скопје",    fuels:["Бензин 95","Бензин 98+","Дизел"] },
  { id:30, lat:41.9934, lng:21.5212, brand:"nis",       name:"НИС Петрол Скопје",          addr:"Скопје",                     city:"Скопје",    fuels:["Бензин 95","Дизел"] },
  { id:31, lat:42.0567, lng:21.4123, brand:"makpetrol", name:"Макпетрол Бутел",            addr:"Бутел",                      city:"Скопје",    fuels:["Бензин 95","Дизел","LPG"] },
  { id:32, lat:41.9823, lng:21.3612, brand:"lukoil",    name:"Лукоил Западен булевар",     addr:"Западен булевар",            city:"Скопје",    fuels:["Бензин 95","Бензин 98+","Дизел"] },
  { id:33, lat:41.4412, lng:22.6278, brand:"lukoil",    name:"Лукоил Струмица",            addr:"Струмица",                   city:"Струмица",  fuels:["Бензин 95","Дизел"] },
  { id:34, lat:41.4934, lng:22.1823, brand:"makpetrol", name:"Макпетрол Кавадарци",        addr:"Кавадарци",                  city:"Кавадарци", fuels:["Бензин 95","Дизел","LPG"] },
  { id:35, lat:41.5167, lng:22.1956, brand:"lukoil",    name:"Лукоил Кавадарци",           addr:"Кавадарци центар",           city:"Кавадарци", fuels:["Бензин 95","Дизел"] },
  { id:36, lat:41.8634, lng:21.0123, brand:"makpetrol", name:"Макпетрол Кичево",           addr:"Кичево",                     city:"Кичево",    fuels:["Бензин 95","Бензин 98+","Дизел"] },
  { id:37, lat:41.3234, lng:21.5512, brand:"makpetrol", name:"Макпетрол Прилеп",           addr:"Прилеп",                     city:"Прилеп",    fuels:["Бензин 95","Бензин 98+","Дизел","LPG"] },
  { id:38, lat:41.3456, lng:21.5623, brand:"lukoil",    name:"Лукоил Прилеп",              addr:"Прилеп центар",              city:"Прилеп",    fuels:["Бензин 95","Дизел"] },
  { id:39, lat:41.9678, lng:21.4834, brand:"makpetrol", name:"Макпетрол Аеродром",         addr:"Аеродром",                   city:"Скопје",    fuels:["Бензин 95","Дизел","LPG"] },
  { id:40, lat:42.1123, lng:21.4612, brand:"okta",      name:"OKTA Зелениково",            addr:"А1 Автопат",                 city:"Скопје",    fuels:["Бензин 95","Бензин 98+","Дизел"] },
  { id:41, lat:41.7823, lng:22.5034, brand:"makpetrol", name:"Макпетрол Радовиш",          addr:"Радовиш",                    city:"Радовиш",   fuels:["Бензин 95","Дизел","LPG"] },
  { id:42, lat:41.6034, lng:20.8923, brand:"makpetrol", name:"Макпетрол Дебар",            addr:"Дебар центар",               city:"Дебар",     fuels:["Бензин 95","Дизел"] },
  { id:43, lat:41.8712, lng:22.6434, brand:"makpetrol", name:"Макпетрол Берово",           addr:"Берово",                     city:"Берово",    fuels:["Бензин 95","Дизел"] },
  { id:44, lat:41.4623, lng:22.1878, brand:"okta",      name:"OKTA Неготино",              addr:"Неготино",                   city:"Неготино",  fuels:["Бензин 95","Бензин 98+","Дизел"] },
  { id:45, lat:41.5723, lng:21.9134, brand:"lukoil",    name:"Лукоил Неготино-А1",         addr:"А1 Автопат",                 city:"Неготино",  fuels:["Бензин 95","Дизел"] },
  { id:46, lat:41.0056, lng:21.3298, brand:"eko",       name:"ЕКО Битола",                 addr:"Битола",                     city:"Битола",    fuels:["Бензин 95","Бензин 98+","Дизел","LPG"] },
  { id:47, lat:42.0734, lng:21.3289, brand:"lukoil",    name:"Лукоил Ѓорче Петров",        addr:"Ѓорче Петров нас.",          city:"Скопје",    fuels:["Бензин 95","Дизел","LPG"] },
  { id:48, lat:42.0045, lng:21.4712, brand:"eko",       name:"ЕКО Скопје Центар",          addr:"Центар",                     city:"Скопје",    fuels:["Бензин 95","Бензин 98+","Дизел"] },
  { id:49, lat:42.1356, lng:21.6823, brand:"okta",      name:"OKTA Куманово",              addr:"Куманово",                   city:"Куманово",  fuels:["Бензин 95","Бензин 98+","Дизел"] },
  { id:50, lat:41.7856, lng:20.9256, brand:"okta",      name:"OKTA Гостивар",              addr:"Гостивар",                   city:"Гостивар",  fuels:["Бензин 95","Дизел"] },
];

// ─── Overpass fetch ───────────────────────────────────────────────────────────
async function fetchOverpassStations() {
  const bbox = "40.8,20.4,42.4,23.1";
  const query = `[out:json][timeout:60];(node["amenity"="fuel"](${bbox});way["amenity"="fuel"](${bbox});relation["amenity"="fuel"](${bbox}););out center;`;
  const endpoints = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
  ];
  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: "data=" + encodeURIComponent(query),
        signal: AbortSignal.timeout(65000),
      });
      if (!res.ok) continue;
      const data = await res.json();
      if (!data.elements || data.elements.length === 0) continue;
      return data.elements.map(el => {
        const tags = el.tags || {};
        let lat, lng;
        if (el.type === "node")   { lat = el.lat; lng = el.lon; }
        else if (el.center)       { lat = el.center.lat; lng = el.center.lon; }
        else return null;
        if (!lat || !lng) return null;
        return {
          id: el.id, lat, lng,
          brand: detectBrand(tags),
          name:  tags.name || tags["name:mk"] || tags["name:en"] || "Бензинска",
          addr:  [tags["addr:street"], tags["addr:city"]].filter(Boolean).join(", ") || tags.city || "",
          city:  tags["addr:city"] || tags.city || "",
          fuels: parseFuels(tags),
        };
      }).filter(Boolean);
    } catch (err) {
      console.warn(`Overpass failed on ${url}:`, err);
    }
  }
  throw new Error("All Overpass mirrors failed");
}

// ─── Colors ───────────────────────────────────────────────────────────────────
const C = {
  bg:"#FAF9F7", surface:"#FFFFFF", surface2:"#F5F4F1", surface3:"#EEECEA",
  border:"#E6E3DD", borderHover:"#CAC7BF",
  orange:"#EA580C", orangeBg:"#FFF4EE", orangeBorder:"#FDD5BC",
  text:"#1C1917", textMid:"#57534E", muted:"#A8A29E",
};
const FUEL_LIST = ["Бензин 95","Бензин 98+","Дизел","LPG","CNG"];

function Spinner() {
  return (
    <div style={{ width:14, height:14, border:`2px solid ${C.orange}`, borderTopColor:"transparent",
      borderRadius:"50%", animation:"spin .7s linear infinite", flexShrink:0 }} />
  );
}

export default function BenzinskiPage() {
  const mapRef     = useRef(null);
  const leafletRef = useRef(null);
  const markersRef = useRef([]);
  const userMkrRef = useRef(null);

  const [allStations,    setAllStations]    = useState([]);
  const [filtered,       setFiltered]       = useState([]);
  const [selectedBrands, setSelectedBrands] = useState(new Set(Object.keys(BRAND_COLORS)));
  const [selectedFuels,  setSelectedFuels]  = useState(new Set());
  const [selectedId,     setSelectedId]     = useState(null);
  const [nearestStation, setNearestStation] = useState(null);
  const [userPos,        setUserPos]        = useState(null);
  const [mapReady,       setMapReady]       = useState(false);
  const [loading,        setLoading]        = useState(true);
  const [loadMsg,        setLoadMsg]        = useState("Вчитување...");
  const [locating,       setLocating]       = useState(false);
  const [locErr,         setLocErr]         = useState(null);
  const [sidebarOpen,    setSidebarOpen]    = useState(false);
  const [width,          setWidth]          = useState(1024);

  const isMobile = width < 640;

  // ── Window width ─────────────────────────────────────────────────────────
  useEffect(() => {
    setWidth(window.innerWidth);
    const h = () => setWidth(window.innerWidth);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  // ── Load Leaflet + init map ───────────────────────────────────────────────
  useEffect(() => {
    const cssLink = document.createElement("link");
    cssLink.rel = "stylesheet";
    cssLink.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(cssLink);
    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
   script.onload = () => {
  const L = window.L;
  const map = L.map(mapRef.current, { center:[41.6086,21.7453], zoom:8, zoomControl:false });
  // Fix for mobile: force recalculate size after a tick
  setTimeout(() => map.invalidateSize(), 100);
  setTimeout(() => map.invalidateSize(), 500);
      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
        { subdomains:"abcd", maxZoom:19 }).addTo(map);
      L.control.zoom({ position:"bottomright" }).addTo(map);
      leafletRef.current = { L, map };
      setMapReady(true);
    };
    document.head.appendChild(script);
    return () => { leafletRef.current?.map?.remove(); };
  }, []);

  // ── Fetch stations ────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      setLoading(true);
      setLoadMsg("🔄 Вчитување од OpenStreetMap...");
      let stations;
      try {
        stations = await fetchOverpassStations();
        if (!stations || stations.length === 0) throw new Error("empty");
        setLoadMsg(`✓ Вчитани ${stations.length} станици`);
      } catch {
        setLoadMsg("⚠️ OSM недостапен — локални податоци");
        await new Promise(r => setTimeout(r, 600));
        stations = FALLBACK_STATIONS;
      }
      setAllStations(stations);
      setLoading(false);
    })();
  }, []);

  // ── Apply filters ─────────────────────────────────────────────────────────
  useEffect(() => {
    let result = allStations.filter(s => {
      if (!selectedBrands.has(s.brand)) return false;
      if (selectedFuels.size > 0) {
        for (const f of selectedFuels) if (!s.fuels.includes(f)) return false;
      }
      return true;
    });
    if (nearestStation && userPos) {
      result = [...result].sort((a,b) =>
        getDistance(userPos.lat,userPos.lng,a.lat,a.lng) -
        getDistance(userPos.lat,userPos.lng,b.lat,b.lng)
      );
    }
    setFiltered(result);
  }, [allStations, selectedBrands, selectedFuels, nearestStation, userPos]);

  // ── Render markers ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapReady || !leafletRef.current) return;
    const { L, map } = leafletRef.current;
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
    filtered.forEach(s => {
      const color = BRAND_COLORS[s.brand] || BRAND_COLORS.other;
      const isNearest = nearestStation?.id === s.id;
      const size = isNearest ? 40 : 28;
      const label = BRAND_LABELS[s.brand] || "?";
      const icon = L.divIcon({
        html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:${isNearest?"3px":"2px"} solid white;display:flex;align-items:center;justify-content:center;font-size:${isNearest?13:8}px;font-weight:800;color:white;box-shadow:${isNearest?`0 0 0 3px ${color}66,0 3px 12px ${color}88`:`0 2px 8px ${color}66`};cursor:pointer">${isNearest?"⭐":label.substring(0,2)}</div>`,
        className:"", iconSize:[size,size], iconAnchor:[size/2,size/2],
      });
      const marker = L.marker([s.lat,s.lng],{icon}).addTo(map);
      marker.on("click", () => { flyTo(s.lat,s.lng,15); setSelectedId(s.id); });
      markersRef.current.push(marker);
    });
  }, [mapReady, filtered, nearestStation]);

  // ── Render user dot ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapReady || !leafletRef.current || !userPos) return;
    const { L, map } = leafletRef.current;
    if (userMkrRef.current) userMkrRef.current.remove();
    const icon = L.divIcon({
      html:`<div style="width:16px;height:16px;border-radius:50%;background:#3B82F6;border:3px solid #fff;box-shadow:0 0 0 6px rgba(59,130,246,0.25)"></div>`,
      className:"", iconSize:[16,16], iconAnchor:[8,8],
    });
    userMkrRef.current = L.marker([userPos.lat,userPos.lng],{icon,zIndexOffset:1000}).addTo(map);
  }, [mapReady, userPos]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const flyTo = useCallback((lat, lng, zoom=15) => {
    leafletRef.current?.map?.flyTo([lat,lng], zoom, { duration:0.5 });
  }, []);

  const toggleBrand = (b) => {
    setSelectedBrands(prev => { const n = new Set(prev); n.has(b)?n.delete(b):n.add(b); return n; });
  };
  const toggleFuel = (f) => {
    setSelectedFuels(prev => { const n = new Set(prev); n.has(f)?n.delete(f):n.add(f); return n; });
  };

  const findNearest = useCallback(() => {
    if (!navigator.geolocation) { setLocErr("Геолокацијата не е поддржана."); return; }
    setLocating(true); setLocErr(null);
    navigator.geolocation.getCurrentPosition(pos => {
      const { latitude:lat, longitude:lng } = pos.coords;
      setUserPos({ lat, lng });
      let best = null, bestD = Infinity;
      allStations.forEach(s => {
        const d = getDistance(lat, lng, s.lat, s.lng);
        if (d < bestD) { bestD = d; best = { ...s, distance:d }; }
      });
      setNearestStation(best);
      setSelectedId(best?.id ?? null);
      setLocating(false);
      if (best) leafletRef.current?.map?.flyTo([(lat+best.lat)/2,(lng+best.lng)/2], 14, { duration:1.2 });
    }, () => {
      setLocating(false);
      setLocErr("Дозволете пристап до локација во Settings.");
    }, { enableHighAccuracy:true, timeout:8000 });
  }, [allStations]);

  // ── Derived ───────────────────────────────────────────────────────────────
  const selectedStation = selectedId ? filtered.find(s => s.id === selectedId) : null;
  const activeBrands    = [...new Set(allStations.map(s => s.brand))].sort();
  const cities          = new Set(allStations.map(s => s.city).filter(Boolean));

  // ── Sidebar content (shared between mobile drawer and desktop panel) ──────
  const SidebarContent = () => (
    <>
      <div style={{ padding:"14px 14px 10px", borderBottom:`1px solid ${C.border}` }}>

        {/* Locate button */}
        <button onClick={findNearest} disabled={locating} style={{
          width:"100%", marginBottom:10, padding:"10px 12px", borderRadius:9,
          cursor:locating?"wait":"pointer", fontFamily:"inherit", fontSize:13, fontWeight:700,
          display:"flex", alignItems:"center", justifyContent:"center", gap:7,
          background:nearestStation?"#F0FDF4":C.orangeBg,
          border:`1px solid ${nearestStation?"#86EFAC":C.orangeBorder}`,
          color:nearestStation?"#15803D":C.orange, opacity:locating?0.7:1, transition:"all .15s",
        }}>
          {locating ? <><Spinner/>Пронаоѓање...</> :
           nearestStation ? <>✓ {nearestStation.name.split(" ").slice(0,3).join(" ")}</> :
           <>📍 Најблиска бензинска</>}
        </button>

        {/* Nearest card */}
        {nearestStation && (
          <div onClick={() => { flyTo(nearestStation.lat,nearestStation.lng,15); setSelectedId(nearestStation.id); if(isMobile) setSidebarOpen(false); }}
            style={{ background:"#F0FDF4", border:"1px solid #86EFAC", borderRadius:9,
              padding:"10px 12px", marginBottom:10, cursor:"pointer" }}
            onMouseEnter={e=>e.currentTarget.style.background="#DCFCE7"}
            onMouseLeave={e=>e.currentTarget.style.background="#F0FDF4"}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ fontSize:18 }}>⭐</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:12,fontWeight:700,color:"#15803D",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>
                  {nearestStation.name}
                </div>
                <div style={{ fontSize:11, color:"#16A34A" }}>{formatDist(nearestStation.distance)} од вас</div>
              </div>
            </div>
          </div>
        )}

        {locErr && <div style={{ fontSize:11, color:"#DC2626", marginBottom:8 }}>⚠ {locErr}</div>}

        {/* Brand filters */}
        <div style={{ fontSize:10,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:C.muted,marginBottom:8 }}>Бренд</div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginBottom:10 }}>
          {activeBrands.map(b => {
            const color = BRAND_COLORS[b]||BRAND_COLORS.other;
            const active = selectedBrands.has(b);
            return (
              <button key={b} onClick={()=>toggleBrand(b)} style={{
                padding:"4px 10px", borderRadius:6, cursor:"pointer", fontSize:11, fontWeight:600,
                fontFamily:"inherit", transition:"all .12s",
                border:`1px solid ${active?color+"55":C.border}`,
                background:active?color+"18":C.surface2,
                color:active?color:C.muted,
              }}>{BRAND_LABELS[b]||b}</button>
            );
          })}
        </div>

        {/* Fuel filters */}
        <div style={{ fontSize:10,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:C.muted,marginBottom:8 }}>Гориво</div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
          {FUEL_LIST.map(f => {
            const active = selectedFuels.has(f);
            return (
              <button key={f} onClick={()=>toggleFuel(f)} style={{
                padding:"3px 8px", borderRadius:5, cursor:"pointer", fontSize:10, fontWeight:600,
                fontFamily:"inherit", transition:"all .12s",
                border:`1px solid ${active?C.textMid:C.border}`,
                background:active?C.surface3:C.surface2,
                color:active?C.text:C.muted,
              }}>{f}</button>
            );
          })}
        </div>
      </div>

      {/* Station list */}
      <div style={{ flex:1, overflowY:"auto", padding:"6px 6px 16px" }}>
        {filtered.map(s => {
          const color = BRAND_COLORS[s.brand]||BRAND_COLORS.other;
          const isNearest = nearestStation?.id===s.id;
          const isSel = selectedId===s.id;
          return (
            <div key={s.id}
              onClick={() => { flyTo(s.lat,s.lng,15); setSelectedId(s.id); if(isMobile) setSidebarOpen(false); }}
              style={{ padding:"9px 10px", borderRadius:8, cursor:"pointer", marginBottom:1,
                transition:"all .12s", display:"flex", alignItems:"center", gap:9,
                background:isSel?C.surface3:isNearest?"#F0FDF4":"transparent",
                border:`1px solid ${isSel?color+"40":isNearest?"#86EFAC":"transparent"}` }}
              onMouseEnter={e=>{ if(!isSel) e.currentTarget.style.background=C.surface2; }}
              onMouseLeave={e=>{ if(!isSel) e.currentTarget.style.background=isNearest?"#F0FDF4":"transparent"; }}>
              <div style={{ width:26,height:26,borderRadius:"50%",background:color,flexShrink:0,
                display:"flex",alignItems:"center",justifyContent:"center",
                fontSize:isNearest?12:8,fontWeight:800,color:"#fff" }}>
                {isNearest?"⭐":(BRAND_LABELS[s.brand]||"?").substring(0,2)}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:12,fontWeight:600,color:C.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>
                  {s.name}
                </div>
                <div style={{ fontSize:10, color:isNearest?"#16A34A":C.muted }}>
                  {isNearest&&nearestStation?.distance?formatDist(nearestStation.distance)+" · ":""}{s.city}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <Head>
        <title>Бензински — Македонија</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1"/>
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
        <style>{`
          *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
          body{overflow:hidden;font-family:'DM Sans',sans-serif;background:${C.bg};color:${C.text}}
          .leaflet-control-attribution{display:none!important}
          .leaflet-control-zoom a{background:#fff!important;color:#57534E!important;border-color:#E6E3DD!important}
          ::-webkit-scrollbar{width:3px;background:transparent}
          ::-webkit-scrollbar-thumb{background:${C.border};border-radius:2px}
          @keyframes spin{to{transform:rotate(360deg)}}
          @keyframes fadeUp{from{opacity:0;transform:translateX(-50%) translateY(8px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
          @keyframes fadeUpFull{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        `}</style>
      </Head>

      <div style={{ width:"100vw", height:"100vh", display:"flex", flexDirection:"column" }}>

        {/* HEADER */}
        <header style={{ height:52, flexShrink:0, background:C.surface, borderBottom:`1px solid ${C.border}`,
          display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 16px", zIndex:1000 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            {/* Hamburger — mobile only */}
            {isMobile && (
              <button onClick={()=>setSidebarOpen(o=>!o)} style={{
                width:34, height:34, borderRadius:8, border:`1px solid ${C.border}`,
                background:sidebarOpen?C.surface3:C.surface2, cursor:"pointer",
                fontSize:16, display:"flex", alignItems:"center", justifyContent:"center",
                color:C.text, marginRight:2, flexShrink:0,
              }}>
                {sidebarOpen ? "✕" : "☰"}
              </button>
            )}
            <a href="/" style={{ fontWeight:800, fontSize:18, color:C.orange, textDecoration:"none" }}>makceni.mk</a>
            <div style={{ width:1, height:14, background:C.border }}/>
            <span style={{ fontSize:12, color:C.muted, fontWeight:500 }}>Бензински</span>
          </div>
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            {!isMobile && (
              <span style={{ fontSize:11, color:C.muted }}>
                {loading ? loadMsg : `${filtered.length} / ${allStations.length} станици · ${cities.size} општини`}
              </span>
            )}
            <a href="/safecity" style={{ fontSize:11, fontWeight:600, color:"#DC2626", background:"#FEF2F2",
              border:"1px solid #FECACA", borderRadius:7, padding:"5px 10px", textDecoration:"none" }}>
              {isMobile ? "📷" : "📷 Safe City"}
            </a>
            <a href="/" style={{ fontSize:11, fontWeight:500, color:C.muted, background:C.surface2,
              border:`1px solid ${C.border}`, borderRadius:7, padding:"5px 10px", textDecoration:"none" }}>
              {isMobile ? "←" : "← Назад"}
            </a>
          </div>
        </header>

        <div style={{ flex:1, display:"flex", overflow:"hidden", position:"relative" }}>

          {/* MOBILE BACKDROP */}
          {isMobile && sidebarOpen && (
            <div onClick={()=>setSidebarOpen(false)} style={{
              position:"absolute", inset:0, background:"rgba(0,0,0,0.45)",
              backdropFilter:"blur(2px)", WebkitBackdropFilter:"blur(2px)", zIndex:400,
            }}/>
          )}

          {/* SIDEBAR — desktop: static, mobile: slide-in overlay */}
          <div style={{
            width: 280,
            background: C.surface,
            borderRight: `1px solid ${C.border}`,
            display: "flex",
            flexDirection: "column",
            flexShrink: 0,
            ...(isMobile ? {
              position: "absolute",
              top: 0, left: 0, bottom: 0,
              zIndex: 500,
              transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)",
              transition: "transform 0.3s cubic-bezier(0.16,1,0.3,1)",
              boxShadow: sidebarOpen ? "4px 0 32px rgba(0,0,0,0.15)" : "none",
            } : {}),
          }}>
            <SidebarContent />
          </div>

          {/* MAP */}
          <div style={{ flex:1, position:"relative", minWidth:0, overflow:"hidden" }}
            onClick={() => { if(isMobile && sidebarOpen) setSidebarOpen(false); }}>

            {/* Loading pill */}
            {loading && (
              <div style={{ position:"absolute", top:14, left:"50%", transform:"translateX(-50%)",
                zIndex:600, background:C.surface, border:`1px solid ${C.border}`, borderRadius:8,
                padding:"10px 18px", fontSize:13, fontWeight:600, color:C.textMid,
                display:"flex", gap:8, alignItems:"center", whiteSpace:"nowrap" }}>
                <Spinner/>{loadMsg}
              </div>
            )}

            {/* Mobile list toggle button — shown when sidebar is closed */}
            {isMobile && !sidebarOpen && (
              <button onClick={()=>setSidebarOpen(true)} style={{
                position:"absolute", top:14, left:14, zIndex:600,
                display:"flex", alignItems:"center", gap:6,
                padding:"9px 14px", borderRadius:10,
                background:C.surface, border:`1px solid ${C.border}`,
                boxShadow:"0 2px 12px rgba(0,0,0,0.1)",
                fontSize:13, fontWeight:700, color:C.text,
                cursor:"pointer", fontFamily:"inherit",
              }}>
                ☰ <span>{filtered.length} станици</span>
              </button>
            )}
            <div ref={mapRef} style={{ width:"100%", height:"100%", minWidth:0, display:"block" }}/>

            {/* Station popup */}
            {selectedStation && (
              <div style={{
                position:"absolute",
                bottom: isMobile ? 16 : 24,
                left: isMobile ? 12 : "50%",
                right: isMobile ? 12 : "auto",
                transform: isMobile ? "none" : "translateX(-50%)",
                zIndex:500,
                minWidth: isMobile ? "auto" : 310,
                maxWidth: isMobile ? "auto" : 400,
                background:C.surface, borderRadius:16, padding:"18px 20px",
                boxShadow:"0 8px 40px rgba(0,0,0,.12)",
                border:`1px solid ${C.borderHover}`,
                animation: isMobile ? "fadeUpFull .2s ease" : "fadeUp .2s ease",
              }}>
                {nearestStation?.id===selectedStation.id && (
                  <div style={{ fontSize:9,fontWeight:700,background:"#F0FDF4",color:"#15803D",
                    border:"1px solid #86EFAC",borderRadius:4,padding:"2px 7px",
                    marginBottom:8,display:"inline-block" }}>
                    ⭐ Најблиска · {formatDist(nearestStation.distance)}
                  </div>
                )}
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:9,fontWeight:700,letterSpacing:1,textTransform:"uppercase",
                      color:BRAND_COLORS[selectedStation.brand]||C.muted, marginBottom:4 }}>
                      {BRAND_LABELS[selectedStation.brand]||selectedStation.brand}
                    </div>
                    <div style={{ fontSize:16, fontWeight:800, color:C.text, marginBottom:2 }}>
                      {selectedStation.name}
                    </div>
                    <div style={{ fontSize:12, color:C.muted }}>
                      {[selectedStation.addr,selectedStation.city].filter(Boolean).join(" · ")}
                    </div>
                  </div>
                  <button onClick={()=>setSelectedId(null)} style={{
                    background:C.surface2, border:`1px solid ${C.border}`, borderRadius:6,
                    color:C.muted, fontSize:14, cursor:"pointer", padding:"2px 7px", marginLeft:10,
                  }}>×</button>
                </div>
                {selectedStation.fuels.length > 0 && (
                  <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginBottom:14 }}>
                    {selectedStation.fuels.map(f => (
                      <span key={f} style={{ fontSize:10,fontWeight:600,padding:"3px 8px",
                        background:C.surface2,border:`1px solid ${C.border}`,borderRadius:5,color:C.textMid }}>
                        {f}
                      </span>
                    ))}
                  </div>
                )}
                <a href={`https://www.google.com/maps/dir/?api=1&destination=${selectedStation.lat},${selectedStation.lng}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ display:"block",textAlign:"center",background:C.orange,borderRadius:10,
                    padding:"12px",color:"#fff",fontSize:14,fontWeight:700,textDecoration:"none" }}>
                  🧭 Упатства
                </a>
              </div>
            )}

            {/* Legend — desktop only */}
            {!isMobile && (
              <div style={{ position:"absolute", top:14, right:14, zIndex:500,
                background:"rgba(255,255,255,.94)", backdropFilter:"blur(8px)",
                border:`1px solid ${C.border}`, borderRadius:10, padding:"10px 12px",
                boxShadow:"0 2px 8px rgba(0,0,0,.06)" }}>
                {Object.entries(BRAND_COLORS).map(([k,color]) => (
                  <div key={k} style={{ display:"flex", alignItems:"center", gap:7, marginBottom:5 }}>
                    <div style={{ width:7,height:7,borderRadius:"50%",background:color }}/>
                    <span style={{ fontSize:11,color:C.textMid,fontWeight:500 }}>{BRAND_LABELS[k]||k}</span>
                  </div>
                ))}
                <div style={{ borderTop:`1px solid ${C.border}`,marginTop:5,paddingTop:5,
                  display:"flex",alignItems:"center",gap:7 }}>
                  <span style={{ fontSize:12 }}>⭐</span>
                  <span style={{ fontSize:11,color:"#15803D",fontWeight:600 }}>Најблиска</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}