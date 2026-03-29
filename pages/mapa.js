"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Head from "next/head";
import { useLanguage, LanguageSwitcher } from "../translations";

const BRAND_COLORS = {
  okta: "#DC2626", makpetrol: "#D97706", lukoil: "#EA580C", eko: "#7C3AED",
  nis: "#0891B2", shell: "#EAB308", bp: "#15803D", other: "#78716C",
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

const C = {
  bg:"#FAF9F7", surface:"#FFFFFF", surface2:"#F5F4F1", surface3:"#EEECEA",
  border:"#E6E3DD", borderHover:"#CAC7BF",
  orange:"#EA580C", orangeBg:"#FFF4EE", orangeBorder:"#FDD5BC",
  text:"#1C1917", textMid:"#57534E", muted:"#A8A29E",
};

function Spinner() {
  return <div style={{ width:14, height:14, border:`2px solid ${C.orange}`, borderTopColor:"transparent", borderRadius:"50%", animation:"spin .7s linear infinite", flexShrink:0 }} />;
}

export default function BenzinskiPage() {
  const { lang, setLang, tr } = useLanguage();

  const BRAND_LABELS = {
  okta: tr("mapa.brands.okta"), makpetrol: tr("mapa.brands.makpetrol"),
  lukoil: tr("mapa.brands.lukoil"), eko: tr("mapa.brands.eko"),
  nis: tr("mapa.brands.nis"), shell: tr("mapa.brands.shell"),
  bp: tr("mapa.brands.bp"), other: tr("mapa.brands.other"),
};
const FUEL_LIST = [
  tr("mapa.fuelList.benzin95"),
  tr("mapa.fuelList.benzin98"),
  tr("mapa.fuelList.dizel"),
  "LPG",
  "CNG",
];
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

  useEffect(() => {
    setWidth(window.innerWidth);
    const h = () => setWidth(window.innerWidth);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

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
      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", { subdomains:"abcd", maxZoom:19 }).addTo(map);
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
      setLoadMsg("🔄 " + tr("mapa.loading"));
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
        setLoadMsg(`✓ ${tr("mapa.loadedCount", { count: stations.length })}`);
      } catch {
        setLoadMsg("⚠️ " + tr("mapa.fallback"));
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

  const SidebarContent = () => (
    <>
      <div style={{ padding:"14px 14px 10px", borderBottom:`1px solid ${C.border}` }}>
        <button onClick={findNearest} disabled={locating} style={{ width:"100%", marginBottom:10, padding:"10px 12px", borderRadius:9, cursor:locating?"wait":"pointer", fontFamily:"inherit", fontSize:13, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", gap:7, background:nearestStation?"#F0FDF4":C.orangeBg, border:`1px solid ${nearestStation?"#86EFAC":C.orangeBorder}`, color:nearestStation?"#15803D":C.orange, opacity:locating?0.7:1, transition:"all .15s" }}>
          {locating ? <><Spinner/>{tr("mapa.locate.locating")}</> :
           nearestStation ? <>✓ {nearestStation.name.split(" ").slice(0,3).join(" ")}</> :
           <>{tr("mapa.locate.button")}</>}
        </button>

        {nearestStation && (
          <div onClick={() => { flyTo(nearestStation.lat,nearestStation.lng,15); setSelectedId(nearestStation.id); if(isMobile) setSidebarOpen(false); }}
            style={{ background:"#F0FDF4", border:"1px solid #86EFAC", borderRadius:9, padding:"10px 12px", marginBottom:10, cursor:"pointer" }}
            onMouseEnter={e=>e.currentTarget.style.background="#DCFCE7"}
            onMouseLeave={e=>e.currentTarget.style.background="#F0FDF4"}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ fontSize:18 }}>⭐</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:12,fontWeight:700,color:"#15803D",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{nearestStation.name}</div>
                <div style={{ fontSize:11, color:"#16A34A" }}>{tr("mapa.locate.fromYou", { dist: formatDist(nearestStation.distance) })}</div>
              </div>
            </div>
          </div>
        )}

        {locErr && <div style={{ fontSize:11, color:"#DC2626", marginBottom:8 }}>⚠ {locErr}</div>}

        <div style={{ fontSize:10,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:C.muted,marginBottom:8 }}>{tr("mapa.filters.brandLabel")}</div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginBottom:10 }}>
          {activeBrands.map(b => {
            const color = BRAND_COLORS[b]||BRAND_COLORS.other;
            const active = selectedBrands.has(b);
            return (
              <button key={b} onClick={()=>toggleBrand(b)} style={{ padding:"4px 10px", borderRadius:6, cursor:"pointer", fontSize:11, fontWeight:600, fontFamily:"inherit", transition:"all .12s", border:`1px solid ${active?color+"55":C.border}`, background:active?color+"18":C.surface2, color:active?color:C.muted }}>
                {BRAND_LABELS[b]||b}
              </button>
            );
          })}
        </div>

        <div style={{ fontSize:10,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:C.muted,marginBottom:8 }}>{tr("mapa.filters.fuelLabel")}</div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
          {FUEL_LIST.map(f => {
            const active = selectedFuels.has(f);
            return (
              <button key={f} onClick={()=>toggleFuel(f)} style={{ padding:"3px 8px", borderRadius:5, cursor:"pointer", fontSize:10, fontWeight:600, fontFamily:"inherit", transition:"all .12s", border:`1px solid ${active?C.textMid:C.border}`, background:active?C.surface3:C.surface2, color:active?C.text:C.muted }}>
                {f}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ flex:1, overflowY:"auto", padding:"6px 6px 16px" }}>
        {filtered.map(s => {
          const color = BRAND_COLORS[s.brand]||BRAND_COLORS.other;
          const isNearest = nearestStation?.id===s.id;
          const isSel = selectedId===s.id;
          return (
            <div key={s.id}
              onClick={() => { flyTo(s.lat,s.lng,15); setSelectedId(s.id); if(isMobile) setSidebarOpen(false); }}
              style={{ padding:"9px 10px", borderRadius:8, cursor:"pointer", marginBottom:1, transition:"all .12s", display:"flex", alignItems:"center", gap:9, background:isSel?C.surface3:isNearest?"#F0FDF4":"transparent", border:`1px solid ${isSel?color+"40":isNearest?"#86EFAC":"transparent"}` }}
              onMouseEnter={e=>{ if(!isSel) e.currentTarget.style.background=C.surface2; }}
              onMouseLeave={e=>{ if(!isSel) e.currentTarget.style.background=isNearest?"#F0FDF4":"transparent"; }}>
              <div style={{ width:26,height:26,borderRadius:"50%",background:color,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:isNearest?12:8,fontWeight:800,color:"#fff" }}>
                {isNearest?"⭐":(BRAND_LABELS[s.brand]||"?").substring(0,2)}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:12,fontWeight:600,color:C.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{s.name}</div>
                <div style={{ fontSize:10, color:isNearest?"#16A34A":C.muted }}>
                  {isNearest&&nearestStation?.distance?tr("mapa.locate.fromYou", { dist: formatDist(nearestStation.distance) })+" · ":""}{s.city}
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
  <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Map",
    "name": "Бензински станици во Македонија",
    "description": "Интерактивна карта со сите бензински станици во Македонија",
    "url": "https://makceni.mk/mapa"
  })}} />
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
        <header style={{ height:52, flexShrink:0, background:C.surface, borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 16px", zIndex:1000 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            {isMobile && (
              <button onClick={()=>setSidebarOpen(o=>!o)} style={{ width:34, height:34, borderRadius:8, border:`1px solid ${C.border}`, background:sidebarOpen?C.surface3:C.surface2, cursor:"pointer", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center", color:C.text, marginRight:2, flexShrink:0 }}>
                {sidebarOpen ? "✕" : "☰"}
              </button>
            )}
            <a href="/" style={{ fontWeight:800, fontSize:18, color:C.orange, textDecoration:"none" }}>makceni.mk</a>
            <div style={{ width:1, height:14, background:C.border }}/>
            <span style={{ fontSize:12, color:C.muted, fontWeight:500 }}>{tr("mapa.headerTitle")}</span>
          </div>
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            {!isMobile && (
              <span style={{ fontSize:11, color:C.muted }}>
                {loading ? loadMsg : tr("mapa.stations", { filtered: filtered.length, total: allStations.length, cities: cities.size })}
              </span>
            )}
            <LanguageSwitcher lang={lang} setLang={setLang} />
            <a href="/safecity" style={{ fontSize:11, fontWeight:600, color:"#DC2626", background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:7, padding:"5px 10px", textDecoration:"none" }}>
              {isMobile ? "📷" : "📷 Safe City"}
            </a>
            <a href="/" style={{ fontSize:11, fontWeight:500, color:C.muted, background:C.surface2, border:`1px solid ${C.border}`, borderRadius:7, padding:"5px 10px", textDecoration:"none" }}>
              {isMobile ? "←" : tr("nav.back")}
            </a>
          </div>
        </header>

        <div style={{ flex:1, display:"flex", overflow:"hidden", position:"relative" }}>
          {isMobile && sidebarOpen && (
            <div onClick={()=>setSidebarOpen(false)} style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.45)", backdropFilter:"blur(2px)", WebkitBackdropFilter:"blur(2px)", zIndex:400 }}/>
          )}

          <div style={{ width:280, background:C.surface, borderRight:`1px solid ${C.border}`, display:"flex", flexDirection:"column", flexShrink:0,
            ...(isMobile ? { position:"absolute", top:0, left:0, bottom:0, zIndex:500, transform:sidebarOpen?"translateX(0)":"translateX(-100%)", transition:"transform 0.3s cubic-bezier(0.16,1,0.3,1)", boxShadow:sidebarOpen?"4px 0 32px rgba(0,0,0,0.15)":"none" } : {}) }}>
            <SidebarContent />
          </div>

          <div style={{ flex:1, position:"relative", minWidth:0, overflow:"hidden" }} onClick={() => { if(isMobile && sidebarOpen) setSidebarOpen(false); }}>
            {loading && (
              <div style={{ position:"absolute", top:14, left:"50%", transform:"translateX(-50%)", zIndex:600, background:C.surface, border:`1px solid ${C.border}`, borderRadius:8, padding:"10px 18px", fontSize:13, fontWeight:600, color:C.textMid, display:"flex", gap:8, alignItems:"center", whiteSpace:"nowrap" }}>
                <Spinner/>{loadMsg}
              </div>
            )}

            {isMobile && !sidebarOpen && (
              <button onClick={()=>setSidebarOpen(true)} style={{ position:"absolute", top:14, left:14, zIndex:600, display:"flex", alignItems:"center", gap:6, padding:"9px 14px", borderRadius:10, background:C.surface, border:`1px solid ${C.border}`, boxShadow:"0 2px 12px rgba(0,0,0,0.1)", fontSize:13, fontWeight:700, color:C.text, cursor:"pointer", fontFamily:"inherit" }}>
                ☰ <span>{tr("mapa.stationsCount", { count: filtered.length })}</span>
              </button>
            )}

            <div ref={mapRef} style={{ width:"100%", height:"100%", minWidth:0, display:"block" }}/>

            {selectedStation && (
              <div style={{ position:"absolute", bottom:isMobile?16:24, left:isMobile?12:"50%", right:isMobile?12:"auto", transform:isMobile?"none":"translateX(-50%)", zIndex:500, minWidth:isMobile?"auto":310, maxWidth:isMobile?"auto":400, background:C.surface, borderRadius:16, padding:"18px 20px", boxShadow:"0 8px 40px rgba(0,0,0,.12)", border:`1px solid ${C.borderHover}`, animation:isMobile?"fadeUpFull .2s ease":"fadeUp .2s ease" }}>
                {nearestStation?.id===selectedStation.id && (
                  <div style={{ fontSize:9,fontWeight:700,background:"#F0FDF4",color:"#15803D",border:"1px solid #86EFAC",borderRadius:4,padding:"2px 7px",marginBottom:8,display:"inline-block" }}>
                    {tr("mapa.popup.nearestBadge", { dist: formatDist(nearestStation.distance) })}
                  </div>
                )}
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:9,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:BRAND_COLORS[selectedStation.brand]||C.muted,marginBottom:4 }}>{BRAND_LABELS[selectedStation.brand]||selectedStation.brand}</div>
                    <div style={{ fontSize:16, fontWeight:800, color:C.text, marginBottom:2 }}>{selectedStation.name}</div>
                    <div style={{ fontSize:12, color:C.muted }}>{[selectedStation.addr,selectedStation.city].filter(Boolean).join(" · ")}</div>
                  </div>
                  <button onClick={()=>setSelectedId(null)} style={{ background:C.surface2, border:`1px solid ${C.border}`, borderRadius:6, color:C.muted, fontSize:14, cursor:"pointer", padding:"2px 7px", marginLeft:10 }}>×</button>
                </div>
                {selectedStation.fuels.length > 0 && (
                  <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginBottom:14 }}>
                    {selectedStation.fuels.map(f => (
                      <span key={f} style={{ fontSize:10,fontWeight:600,padding:"3px 8px",background:C.surface2,border:`1px solid ${C.border}`,borderRadius:5,color:C.textMid }}>{f}</span>
                    ))}
                  </div>
                )}
                <a href={`https://www.google.com/maps/dir/?api=1&destination=${selectedStation.lat},${selectedStation.lng}`} target="_blank" rel="noopener noreferrer"
                  style={{ display:"block",textAlign:"center",background:C.orange,borderRadius:10,padding:"12px",color:"#fff",fontSize:14,fontWeight:700,textDecoration:"none" }}>
                  {tr("mapa.popup.directions")}
                </a>
              </div>
            )}

            {!isMobile && (
              <div style={{ position:"absolute", top:14, right:14, zIndex:500, background:"rgba(255,255,255,.94)", backdropFilter:"blur(8px)", border:`1px solid ${C.border}`, borderRadius:10, padding:"10px 12px", boxShadow:"0 2px 8px rgba(0,0,0,.06)" }}>
                {Object.entries(BRAND_COLORS).map(([k,color]) => (
                  <div key={k} style={{ display:"flex", alignItems:"center", gap:7, marginBottom:5 }}>
                    <div style={{ width:7,height:7,borderRadius:"50%",background:color }}/>
                    <span style={{ fontSize:11,color:C.textMid,fontWeight:500 }}>{BRAND_LABELS[k]||k}</span>
                  </div>
                ))}
                <div style={{ borderTop:`1px solid ${C.border}`,marginTop:5,paddingTop:5,display:"flex",alignItems:"center",gap:7 }}>
                  <span style={{ fontSize:12 }}>⭐</span>
                  <span style={{ fontSize:11,color:"#15803D",fontWeight:600 }}>{tr("mapa.legend.nearest")}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}