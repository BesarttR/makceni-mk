"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Head from "next/head";
import { useLanguage, LanguageSwitcher } from "../translations";

const BRAND_COLORS = {
  okta: "#F87171", makpetrol: "#FBBF24", lukoil: "#FB923C", eko: "#A78BFA",
  nis: "#38BDF8", shell: "#FDE047", bp: "#4ADE80", other: "#94A3B8",
};

const D = {
  bg:          "#000000",
  surface:     "#0C0C14",
  surface2:    "#111120",
  surface3:    "#16162A",
  border:      "#1E1E38",
  borderGlow:  "rgba(100,120,255,0.25)",
  text:        "#F0F0FF",
  textMid:     "#9090B8",
  muted:       "#50507A",
  violet:      "#7C3AED",
  violetLight: "#A78BFA",
  violetDim:   "rgba(124,58,237,0.15)",
  violetBdr:   "rgba(124,58,237,0.35)",
  violetGlow:  "rgba(124,58,237,0.25)",
  cyan:        "#2DD4BF",
  green:       "#4ADE80",
  greenBg:     "rgba(74,222,128,0.1)",
  greenBdr:    "rgba(74,222,128,0.25)",
  red:         "#F87171",
  redBg:       "rgba(248,113,113,0.1)",
  redBdr:      "rgba(248,113,113,0.25)",
  orange:      "#F97316",
  orangeBg:    "rgba(249,115,22,0.12)",
  orangeBdr:   "rgba(249,115,22,0.3)",
  glass:       "rgba(14,14,30,0.85)",
  glassBorder: "rgba(80,90,200,0.3)",
};

const L = {
  bg:          "#F2F0EB",
  surface:     "#FAFAF8",
  surface2:    "#F0EEE9",
  surface3:    "#E8E5DE",
  border:      "#DDD9D0",
  borderGlow:  "rgba(124,58,237,0.15)",
  text:        "#1A1815",
  textMid:     "#5C5850",
  muted:       "#9B9890",
  violet:      "#7C3AED",
  violetLight: "#6D28D9",
  violetDim:   "rgba(124,58,237,0.08)",
  violetBdr:   "rgba(124,58,237,0.2)",
  violetGlow:  "rgba(124,58,237,0.15)",
  cyan:        "#0D9488",
  green:       "#16A34A",
  greenBg:     "rgba(22,163,74,0.08)",
  greenBdr:    "rgba(22,163,74,0.2)",
  red:         "#DC2626",
  redBg:       "rgba(220,38,38,0.08)",
  redBdr:      "rgba(220,38,38,0.2)",
  orange:      "#EA580C",
  orangeBg:    "rgba(234,88,12,0.08)",
  orangeBdr:   "rgba(234,88,12,0.2)",
  glass:       "rgba(242,240,235,0.92)",
  glassBorder: "rgba(0,0,0,0.08)",
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

function parseFuels(tags = {}, tr) {
  const map = {
    "fuel:octane_95": tr("mapa.fuelList.benzin95"),
    "fuel:octane_98": tr("mapa.fuelList.benzin98"),
    "fuel:diesel":    tr("mapa.fuelList.dizel"),
    "fuel:lpg":  "LPG",
    "fuel:cng":  "CNG",
    "fuel:e85":  "E85",
  };
  return Object.entries(map).filter(([k]) => tags[k] === "yes").map(([, v]) => v);
}

function getDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = (lat2-lat1)*Math.PI/180, dLng = (lng2-lng1)*Math.PI/180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return R*2*Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}
function formatDist(m) { return m<1000?`${Math.round(m)} м`:`${(m/1000).toFixed(1)} км`; }

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
];

export default function BenzinskiPage() {
  const { lang, setLang, tr } = useLanguage();
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setIsDark(mq.matches);
    const handler = (e) => setIsDark(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const T = isDark ? D : L;

  const BRAND_LABELS = {
    okta: tr("mapa.brands.okta"), makpetrol: tr("mapa.brands.makpetrol"),
    lukoil: tr("mapa.brands.lukoil"), eko: tr("mapa.brands.eko"),
    nis: tr("mapa.brands.nis"), shell: tr("mapa.brands.shell"),
    bp: tr("mapa.brands.bp"), other: tr("mapa.brands.other"),
  };
  const FUEL_LIST = [
    tr("mapa.fuelList.benzin95"), tr("mapa.fuelList.benzin98"),
    tr("mapa.fuelList.dizel"), "LPG", "CNG",
  ];

  const mapRef     = useRef(null);
  const leafletRef = useRef(null);
  const markersRef = useRef([]);
  const userMkrRef = useRef(null);
  const tileLayerRef = useRef(null);

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

  useEffect(() => {
    setWidth(window.innerWidth);
    const h = () => setWidth(window.innerWidth);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  // Switch map tiles when theme changes
  useEffect(() => {
    if (!mapReady || !leafletRef.current) return;
    const { L, map } = leafletRef.current;
    if (tileLayerRef.current) tileLayerRef.current.remove();
    const tileUrl = isDark
      ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
    tileLayerRef.current = L.tileLayer(tileUrl, { subdomains:"abcd", maxZoom:19 }).addTo(map);
  }, [isDark, mapReady]);

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
      setTimeout(() => map.invalidateSize(), 100);
      setTimeout(() => map.invalidateSize(), 500);
      const tileUrl = isDark
        ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
      tileLayerRef.current = L.tileLayer(tileUrl, { subdomains:"abcd", maxZoom:19 }).addTo(map);
      L.control.zoom({ position:"bottomright" }).addTo(map);
      leafletRef.current = { L, map };
      setMapReady(true);
    };
    document.head.appendChild(script);
    return () => { leafletRef.current?.map?.remove(); };
  }, []);

  useEffect(() => {
    (async () => {
      if (typeof window === "undefined") return;
      setLoading(true);
      setLoadMsg(tr("mapa.loading"));
      let stations;
      try {
        const res = await fetch("/api/stations");
        if (!res.ok) throw new Error("API error");
        const data = await res.json();
        if (!data.stations || data.stations.length === 0) throw new Error("empty");
        stations = data.stations.map(el => {
          const tags = el.tags || {};
          let lat, lng;
          if (el.type === "node")     { lat = el.lat;        lng = el.lon; }
          else if (el.center)         { lat = el.center.lat; lng = el.center.lon; }
          else return null;
          if (!lat || !lng) return null;
          return { id: el.id, lat, lng, brand: detectBrand(tags), name: tags.name || tags["name:mk"] || tags["name:en"] || "Бензинска", addr: [tags["addr:street"], tags["addr:city"]].filter(Boolean).join(", ") || tags.city || "", city: tags["addr:city"] || tags.city || "", fuels: parseFuels(tags, tr) };
        }).filter(Boolean);
        setLoadMsg(tr("mapa.loadedCount", { count: stations.length }));
      } catch {
        setLoadMsg(tr("mapa.fallback"));
        await new Promise(r => setTimeout(r, 600));
        stations = FALLBACK_STATIONS;
      }
      setAllStations(stations);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    let result = allStations.filter(s => {
      if (!selectedBrands.has(s.brand)) return false;
      if (selectedFuels.size > 0) { for (const f of selectedFuels) if (!s.fuels.includes(f)) return false; }
      return true;
    });
    if (nearestStation && userPos) {
      result = [...result].sort((a,b) => getDistance(userPos.lat,userPos.lng,a.lat,a.lng) - getDistance(userPos.lat,userPos.lng,b.lat,b.lng));
    }
    setFiltered(result);
  }, [allStations, selectedBrands, selectedFuels, nearestStation, userPos]);

  useEffect(() => {
    if (!mapReady || !leafletRef.current) return;
    const { L, map } = leafletRef.current;
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
    filtered.forEach(s => {
      const color = BRAND_COLORS[s.brand] || BRAND_COLORS.other;
      const isNearest = nearestStation?.id === s.id;
      const size = isNearest ? 42 : 30;
      const label = BRAND_LABELS[s.brand] || "?";
      const icon = L.divIcon({
        html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:${isNearest?"3px solid rgba(255,255,255,0.9)":"2px solid rgba(255,255,255,0.5)"};display:flex;align-items:center;justify-content:center;font-size:${isNearest?13:8}px;font-weight:800;color:#000;box-shadow:${isNearest?`0 0 0 4px ${color}44,0 4px 20px ${color}88`:`0 2px 10px ${color}55`};cursor:pointer">${isNearest?`<svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke-width='1.5' stroke='white' style='width:20px;height:20px'><path stroke-linecap='round' stroke-linejoin='round' d='M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z'/><path stroke-linecap='round' stroke-linejoin='round' d='M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z'/></svg>`:label.substring(0,2)}</div>`,
        className:"", iconSize:[size,size], iconAnchor:[size/2,size/2],
      });
      const marker = L.marker([s.lat,s.lng],{icon}).addTo(map);
      marker.on("click", () => { flyTo(s.lat,s.lng,15); setSelectedId(s.id); });
      markersRef.current.push(marker);
    });
  }, [mapReady, filtered, nearestStation]);

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

  const flyTo = useCallback((lat, lng, zoom=15) => {
    leafletRef.current?.map?.flyTo([lat,lng], zoom, { duration:0.5 });
  }, []);

  const toggleBrand = (b) => { setSelectedBrands(prev => { const n = new Set(prev); n.has(b)?n.delete(b):n.add(b); return n; }); };
  const toggleFuel  = (f) => { setSelectedFuels(prev =>  { const n = new Set(prev); n.has(f)?n.delete(f):n.add(f); return n; }); };

  const findNearest = useCallback(() => {
    if (!navigator.geolocation) { setLocErr(tr("mapa.locate.error")); return; }
    setLocating(true); setLocErr(null);
    navigator.geolocation.getCurrentPosition(pos => {
      const { latitude:lat, longitude:lng } = pos.coords;
      setUserPos({ lat, lng });
      let best = null, bestD = Infinity;
      allStations.forEach(s => { const d = getDistance(lat, lng, s.lat, s.lng); if (d < bestD) { bestD = d; best = { ...s, distance:d }; } });
      setNearestStation(best);
      setSelectedId(best?.id ?? null);
      setLocating(false);
      if (best) leafletRef.current?.map?.flyTo([(lat+best.lat)/2,(lng+best.lng)/2], 14, { duration:1.2 });
    }, () => {
      setLocating(false);
      setLocErr(tr("mapa.locate.error"));
    }, { enableHighAccuracy:true, timeout:8000 });
  }, [allStations, tr]);

  const selectedStation = selectedId ? filtered.find(s => s.id === selectedId) : null;
  const activeBrands    = [...new Set(allStations.map(s => s.brand))].sort();
  const cities          = new Set(allStations.map(s => s.city).filter(Boolean));

  const LiveDot = ({ color }) => (
    <span style={{ position:"relative", display:"inline-flex", alignItems:"center", justifyContent:"center", width:8, height:8 }}>
      <span style={{ position:"absolute", width:8, height:8, borderRadius:"50%", background:color, opacity:0.3, animation:"ping 1.8s ease-in-out infinite" }} />
      <span style={{ width:5, height:5, borderRadius:"50%", background:color, display:"inline-block" }} />
    </span>
  );

  const Spinner = () => (
    <div style={{ width:14, height:14, border:`2px solid ${T.violet}`, borderTopColor:"transparent", borderRadius:"50%", animation:"spin .7s linear infinite", flexShrink:0 }} />
  );

  const SidebarContent = () => (
    <>
      <div style={{ padding:"16px 16px 12px", borderBottom:`1px solid ${T.border}`, position:"relative" }}>
        <div style={{ position:"absolute", top:0, left:0, right:0, height:1, background:`linear-gradient(90deg,transparent,rgba(100,120,255,0.4),transparent)` }} />
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
          <img src={isDark?"/icons/gasstation1.png":"/icons/gasstation.png"} style={{ width:20, height:20, objectFit:"contain" }} />
          <span style={{ fontSize:13, fontWeight:700, color:T.text }}>
            {loading ? loadMsg : tr("mapa.stations", { filtered: filtered.length, total: allStations.length, cities: cities.size })}
          </span>
          {!loading && <LiveDot color={T.cyan} />}
        </div>

        <button onClick={findNearest} disabled={locating} style={{ width:"100%", marginBottom:10, padding:"10px 12px", borderRadius:10, cursor:locating?"wait":"pointer", fontFamily:"inherit", fontSize:13, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", gap:7, background:nearestStation?T.greenBg:T.violetDim, border:`1px solid ${nearestStation?T.greenBdr:T.violetBdr}`, color:nearestStation?T.green:T.violetLight, opacity:locating?0.6:1, transition:"all .15s", backdropFilter:"blur(8px)" }}>
          {locating ? <><Spinner/>{tr("mapa.locate.locating")}</> :
           nearestStation ? <>✓ {nearestStation.name.split(" ").slice(0,3).join(" ")}</> :
           <><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width:20, height:20, flexShrink:0 }}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" /></svg>{tr("mapa.locate.button")}</>}
        </button>

        {nearestStation && (
          <div onClick={() => { flyTo(nearestStation.lat,nearestStation.lng,15); setSelectedId(nearestStation.id); if(isMobile) setSidebarOpen(false); }}
            style={{ background:T.greenBg, border:`1px solid ${T.greenBdr}`, borderRadius:10, padding:"10px 12px", marginBottom:10, cursor:"pointer", transition:"all .15s" }}
            onMouseEnter={e=>e.currentTarget.style.background=isDark?"rgba(74,222,128,0.18)":"rgba(22,163,74,0.12)"}
            onMouseLeave={e=>e.currentTarget.style.background=T.greenBg}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width:20, height:20, flexShrink:0, color:T.green }}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" /></svg>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:12, fontWeight:700, color:T.green, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{nearestStation.name}</div>
                <div style={{ fontSize:11, color:T.green, opacity:0.7 }}>{tr("mapa.locate.fromYou", { dist: formatDist(nearestStation.distance) })}</div>
              </div>
            </div>
          </div>
        )}

        {locErr && <div style={{ fontSize:11, color:T.red, marginBottom:8, padding:"6px 10px", background:T.redBg, border:`1px solid ${T.redBdr}`, borderRadius:7 }}>⚠ {locErr}</div>}

        <div style={{ fontSize:10, fontWeight:700, letterSpacing:1, textTransform:"uppercase", color:T.muted, marginBottom:7 }}>{tr("mapa.filters.brandLabel")}</div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginBottom:10 }}>
          {activeBrands.map(b => {
            const color = BRAND_COLORS[b] || BRAND_COLORS.other;
            const active = selectedBrands.has(b);
            return (
              <button key={b} onClick={()=>toggleBrand(b)} style={{ padding:"4px 10px", borderRadius:6, cursor:"pointer", fontSize:11, fontWeight:600, fontFamily:"inherit", transition:"all .12s", border:`1px solid ${active?color+"55":isDark?"rgba(60,70,140,0.3)":T.border}`, background:active?`${color}18`:isDark?"rgba(10,10,20,0.5)":T.surface2, color:active?color:T.muted }}>
                {BRAND_LABELS[b]||b}
              </button>
            );
          })}
        </div>

        <div style={{ fontSize:10, fontWeight:700, letterSpacing:1, textTransform:"uppercase", color:T.muted, marginBottom:7 }}>{tr("mapa.filters.fuelLabel")}</div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
          {FUEL_LIST.map(f => {
            const active = selectedFuels.has(f);
            return (
              <button key={f} onClick={()=>toggleFuel(f)} style={{ padding:"3px 8px", borderRadius:5, cursor:"pointer", fontSize:10, fontWeight:600, fontFamily:"inherit", transition:"all .12s", border:`1px solid ${active?T.violetLight+"66":isDark?"rgba(60,70,140,0.3)":T.border}`, background:active?T.violetDim:isDark?"rgba(10,10,20,0.5)":T.surface2, color:active?T.violetLight:T.muted }}>
                {f}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ flex:1, overflowY:"auto", padding:"6px 8px 16px" }}>
        {filtered.map(s => {
          const color = BRAND_COLORS[s.brand] || BRAND_COLORS.other;
          const isNearest = nearestStation?.id === s.id;
          const isSel = selectedId === s.id;
          return (
            <div key={s.id}
              onClick={() => { flyTo(s.lat,s.lng,15); setSelectedId(s.id); if(isMobile) setSidebarOpen(false); }}
              style={{ padding:"9px 10px", borderRadius:10, cursor:"pointer", marginBottom:2, transition:"all .12s", display:"flex", alignItems:"center", gap:9, background:isSel?T.surface3:isNearest?T.greenBg:"transparent", border:`1px solid ${isSel?color+"55":isNearest?T.greenBdr:"transparent"}` }}
              onMouseEnter={e=>{ if(!isSel) e.currentTarget.style.background=T.surface2; }}
              onMouseLeave={e=>{ if(!isSel) e.currentTarget.style.background=isNearest?T.greenBg:"transparent"; }}>
              <div style={{ width:28, height:28, borderRadius:"50%", background:color, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:isNearest?12:8, fontWeight:800, color:"#000", boxShadow:`0 2px 8px ${color}44` }}>
                {isNearest ? <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width:16, height:16 }}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" /></svg> : (BRAND_LABELS[s.brand]||"?").substring(0,2)}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:12, fontWeight:600, color:T.text, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{s.name}</div>
                <div style={{ fontSize:10, color:isNearest?T.green:T.muted }}>
                  {isNearest&&nearestStation?.distance ? tr("mapa.locate.fromYou", { dist: formatDist(nearestStation.distance) })+" · " : ""}{s.city}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );

  return (
    <>
      <Head>
        <title>Бензински Станици во Македонија — Карта | МакЦени</title>
        <meta name="description" content="Пронајдете ја најблиската бензинска станица во Македонија. Карта со сите Макпетрол, Окта и Лукоил станици — цени, локации и насоки." />
        <meta name="keywords" content="бензинска станица македонија, макпетрол локации, окта бензинска, лукоил скопје, најблиска бензинска" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://makceni.mk/mapa" />
        <meta property="og:title" content="Бензински Станици во Македонија — МакЦени" />
        <meta property="og:description" content="Карта со сите бензински станици во Македонија. Пронајди ја најблиската до тебе." />
        <meta property="og:url" content="https://makceni.mk/mapa" />
        <meta property="og:image" content="https://makceni.mk/og-image.png" />
        <meta property="og:type" content="website" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "Map", "name": "Бензински станици во Македонија", "description": "Интерактивна карта со сите бензински станици во Македонија", "url": "https://makceni.mk/mapa" })}} />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1"/>
        <style>{`
          *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
          body{overflow:hidden;font-family:inherit;background:${T.bg};color:${T.text}}
          .leaflet-control-attribution{display:none!important}
          .leaflet-control-zoom a{background:${isDark?"rgba(14,14,30,0.95)":"rgba(255,255,255,0.95)"}!important;color:${T.textMid}!important;border-color:${T.border}!important;backdrop-filter:blur(12px);}
          .leaflet-control-zoom a:hover{color:${T.text}!important;background:${T.surface2}!important;}
          ::-webkit-scrollbar{width:3px;background:transparent}
          ::-webkit-scrollbar-thumb{background:${T.border};border-radius:2px}
          @keyframes spin{to{transform:rotate(360deg)}}
          @keyframes ping{0%{transform:scale(1);opacity:0.3;}75%,100%{transform:scale(2.2);opacity:0;}}
          @keyframes fadeUp{from{opacity:0;transform:translateX(-50%) translateY(8px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
          @keyframes fadeUpFull{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
          @keyframes slideIn{from{opacity:0;transform:translateX(-16px)}to{opacity:1;transform:translateX(0)}}
        `}</style>
      </Head>

      <div style={{ width:"100vw", height:"100vh", display:"flex", flexDirection:"column", background:T.bg }}>

        {/* Navbar */}
        <header style={{ height:62, flexShrink:0, zIndex:1000, background:isDark?"rgba(0,0,0,0.75)":"rgba(242,240,235,0.85)", backdropFilter:"blur(28px)", WebkitBackdropFilter:"blur(28px)", borderBottom:`1px solid ${T.border}`, position:"relative" }}>
          <div style={{ position:"absolute", top:0, left:0, right:0, height:1, background:`linear-gradient(90deg,transparent,${isDark?"rgba(100,120,255,0.5)":"rgba(124,58,237,0.2)"},transparent)` }} />
          <div style={{ maxWidth:1200, margin:"0 auto", padding:`0 ${isMobile?"16px":"40px"}`, height:62, display:"flex", alignItems:"center", justifyContent:"space-between", gap:16 }}>

            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <a href="/" style={{ textDecoration:"none", flexShrink:0 }}>
                <img src={isDark?"/logo2.png":"/logo.png"} alt="makceni.mk" style={{ height:isMobile?86:99, width:"auto", display:"block" }} />
              </a>
              <div style={{ width:1, height:16, background:T.border }}/>
              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                <img src={isDark?"/icons/gasstation1.png":"/icons/gasstation.png"} style={{ width:26, height:26, objectFit:"contain" }} />
                <span style={{ fontSize:13, fontWeight:600, color:T.textMid }}>{tr("mapa.headerTitle")}</span>
              </div>
            </div>

            <div style={{ display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
              {!isMobile && (
                <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                  {loading ? <div style={{ width:6, height:6, borderRadius:"50%", border:`2px solid ${T.violet}`, borderTopColor:"transparent", animation:"spin 0.7s linear infinite" }} /> : <LiveDot color={T.cyan} />}
                  <span style={{ fontSize:12, color:T.muted, fontWeight:500 }}>{loading ? loadMsg : tr("mapa.stations", { filtered: filtered.length, total: allStations.length, cities: cities.size })}</span>
                </div>
              )}
              {!isMobile && <div style={{ width:1, height:18, background:T.border }} />}
              <a href="/safecity" style={{ padding:"7px 13px", borderRadius:8, fontSize:14, fontWeight:600, color:T.textMid, textDecoration:"none", transition:"all 0.15s", border:"1px solid transparent", display:"flex", alignItems:"center", gap:6 }}
                onMouseEnter={e=>{ e.currentTarget.style.background=isDark?"rgba(255,255,255,0.04)":T.surface2; e.currentTarget.style.borderColor=T.border; e.currentTarget.style.color=T.text; }}
                onMouseLeave={e=>{ e.currentTarget.style.background="transparent"; e.currentTarget.style.borderColor="transparent"; e.currentTarget.style.color=T.textMid; }}>
                <img src={isDark?"/icons/safecity1.png":"/icons/safecity.png"} style={{ width:28, height:28, objectFit:"contain" }} />
                {!isMobile && "Safe City"}
              </a>
              <LanguageSwitcher lang={lang} setLang={setLang} isDark={isDark} />
              <a href="/" style={{ padding:"7px 13px", borderRadius:8, fontSize:14, fontWeight:600, color:T.textMid, textDecoration:"none", transition:"all 0.15s", border:"1px solid transparent" }}
                onMouseEnter={e=>{ e.currentTarget.style.background=isDark?"rgba(255,255,255,0.04)":T.surface2; e.currentTarget.style.borderColor=T.border; e.currentTarget.style.color=T.text; }}
                onMouseLeave={e=>{ e.currentTarget.style.background="transparent"; e.currentTarget.style.borderColor="transparent"; e.currentTarget.style.color=T.textMid; }}>
                ←{!isMobile && ` ${tr("nav.back").replace("← ","")}`}
              </a>
            </div>
          </div>
        </header>

        <div style={{ flex:1, display:"flex", overflow:"hidden", position:"relative" }}>
          {isMobile && sidebarOpen && (
            <div onClick={()=>setSidebarOpen(false)} style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.75)", backdropFilter:"blur(4px)", WebkitBackdropFilter:"blur(4px)", zIndex:400 }}/>
          )}

          {/* Sidebar */}
          <div style={{ width:290, background:T.glass, backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)", borderRight:`1px solid ${T.border}`, display:"flex", flexDirection:"column", flexShrink:0, position:"relative",
            ...(isMobile ? { position:"absolute", top:0, left:0, bottom:0, zIndex:500, transform:sidebarOpen?"translateX(0)":"translateX(-100%)", transition:"transform 0.3s cubic-bezier(0.16,1,0.3,1)", boxShadow:sidebarOpen?`4px 0 40px rgba(0,0,0,0.3), 1px 0 0 ${T.border}`:"none" } : {}) }}>
            <SidebarContent />
          </div>

          {/* Map */}
          <div style={{ flex:1, position:"relative", minWidth:0, overflow:"hidden" }} onClick={(e) => { if(isMobile && sidebarOpen && e.target === e.currentTarget) setSidebarOpen(false); }}>

            {loading && (
              <div style={{ position:"absolute", top:16, left:"50%", transform:"translateX(-50%)", zIndex:600, background:T.glass, backdropFilter:"blur(20px)", border:`1px solid ${T.border}`, borderRadius:10, padding:"10px 18px", fontSize:13, fontWeight:600, color:T.textMid, display:"flex", gap:8, alignItems:"center", whiteSpace:"nowrap", boxShadow:`0 8px 32px rgba(0,0,0,0.2)` }}>
                <Spinner/>{loadMsg}
              </div>
            )}

            {isMobile && !sidebarOpen && (
              <button onClick={(e)=>{ e.stopPropagation(); setSidebarOpen(true); }} style={{ position:"absolute", top:14, left:14, zIndex:600, display:"flex", alignItems:"center", gap:6, padding:"9px 14px", borderRadius:10, background:T.glass, backdropFilter:"blur(20px)", border:`1px solid ${T.border}`, boxShadow:`0 4px 20px rgba(0,0,0,0.2)`, fontSize:13, fontWeight:700, color:T.text, cursor:"pointer", fontFamily:"inherit", transition:"all 0.15s" }}>
                ☰ <span style={{ color:T.violetLight }}>{tr("mapa.stationsCount", { count: filtered.length })}</span>
              </button>
            )}

            <div ref={mapRef} style={{ width:"100%", height:"100%", minWidth:0, display:"block" }}/>

            {/* Selected station popup */}
            {selectedStation && (
              <div style={{ position:"absolute", bottom:isMobile?16:24, left:isMobile?12:"50%", right:isMobile?12:"auto", transform:isMobile?"none":"translateX(-50%)", zIndex:500, minWidth:isMobile?"auto":320, maxWidth:isMobile?"auto":420, background:T.glass, backdropFilter:"blur(24px)", WebkitBackdropFilter:"blur(24px)", borderRadius:18, padding:"20px 22px", boxShadow:`0 8px 40px rgba(0,0,0,0.15), 0 0 0 1px ${T.glassBorder}`, border:`1px solid ${T.border}`, animation:isMobile?"fadeUpFull .2s ease":"fadeUp .2s ease" }}>
                <div style={{ position:"absolute", top:0, left:0, right:0, height:1, background:`linear-gradient(90deg,transparent,rgba(120,140,255,0.4),transparent)`, borderRadius:"18px 18px 0 0" }} />

                {nearestStation?.id===selectedStation.id && (
                  <div style={{ fontSize:10, fontWeight:700, background:T.greenBg, color:T.green, border:`1px solid ${T.greenBdr}`, borderRadius:5, padding:"3px 8px", marginBottom:10, display:"inline-flex", alignItems:"center", gap:5 }}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width:12, height:12 }}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" /></svg>
                    {tr("mapa.popup.nearestBadge", { dist: formatDist(nearestStation.distance) })}
                  </div>
                )}

                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:10, fontWeight:700, letterSpacing:1, textTransform:"uppercase", color:BRAND_COLORS[selectedStation.brand]||T.muted, marginBottom:5 }}>{BRAND_LABELS[selectedStation.brand]||selectedStation.brand}</div>
                    <div style={{ fontSize:17, fontWeight:800, color:T.text, marginBottom:3, letterSpacing:-0.3 }}>{selectedStation.name}</div>
                    <div style={{ fontSize:12, color:T.muted }}>{[selectedStation.addr,selectedStation.city].filter(Boolean).join(" · ")}</div>
                  </div>
                  <button onClick={()=>setSelectedId(null)} style={{ background:T.surface2, border:`1px solid ${T.border}`, borderRadius:7, color:T.muted, fontSize:15, cursor:"pointer", padding:"3px 8px", marginLeft:12, transition:"all 0.15s" }}
                    onMouseEnter={e=>e.currentTarget.style.color=T.text}
                    onMouseLeave={e=>e.currentTarget.style.color=T.muted}>×</button>
                </div>

                {selectedStation.fuels.length > 0 && (
                  <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginBottom:14 }}>
                    {selectedStation.fuels.map(f => (
                      <span key={f} style={{ fontSize:10, fontWeight:600, padding:"3px 9px", background:T.surface2, border:`1px solid ${T.border}`, borderRadius:5, color:T.textMid }}>{f}</span>
                    ))}
                  </div>
                )}

                <a href={`https://www.google.com/maps/dir/?api=1&destination=${selectedStation.lat},${selectedStation.lng}`} target="_blank" rel="noopener noreferrer"
                  style={{ display:"block", textAlign:"center", background:`linear-gradient(135deg,${T.violet},#4C1D95)`, borderRadius:11, padding:"12px", color:"#fff", fontSize:14, fontWeight:700, textDecoration:"none", boxShadow:`0 0 20px ${T.violetGlow}` }}>
                  {tr("mapa.popup.directions")}
                </a>
              </div>
            )}

            {/* Legend */}
            {!isMobile && (
              <div style={{ position:"absolute", top:16, right:16, zIndex:500, background:T.glass, backdropFilter:"blur(20px)", border:`1px solid ${T.border}`, borderRadius:12, padding:"12px 14px", boxShadow:`0 4px 20px rgba(0,0,0,0.1)` }}>
                {Object.entries(BRAND_COLORS).map(([k,color]) => (
                  <div key={k} style={{ display:"flex", alignItems:"center", gap:7, marginBottom:6 }}>
                    <div style={{ width:7, height:7, borderRadius:"50%", background:color, boxShadow:`0 0 4px ${color}88` }}/>
                    <span style={{ fontSize:11, color:T.textMid, fontWeight:500 }}>{BRAND_LABELS[k]||k}</span>
                  </div>
                ))}
                <div style={{ borderTop:`1px solid ${T.border}`, marginTop:6, paddingTop:6, display:"flex", alignItems:"center", gap:7 }}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke={T.green} style={{ width:16, height:16 }}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" /></svg>
                  <span style={{ fontSize:11, color:T.green, fontWeight:600 }}>{tr("mapa.legend.nearest")}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}