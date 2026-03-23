"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Head from "next/head";

const C = {
  bg: "#FAF9F7", surface: "#FFFFFF", surface2: "#F5F4F1", surface3: "#EEECEA",
  border: "#E6E3DD", borderHover: "#CAC7BF",
  orange: "#EA580C", orangeBg: "#FFF4EE", orangeBorder: "#FDD5BC",
  text: "#1C1917", textMid: "#57534E", muted: "#A8A29E",
};

const BRANDS = {
  OKTA:      { color: "#DC2626", label: "OKTA" },
  MAKPETROL: { color: "#D97706", label: "MAKPETROL" },
  LUKOIL:    { color: "#EA580C", label: "LUKOIL" },
  OTHER:     { color: "#78716C", label: "Друго" },
};

const STATIONS = [
  { id: 1,  brand: "OKTA",      name: "OKTA Автокоманда",        city: "Скопје",    lat: 41.9981, lng: 21.4254, fuels: ["Бензин 95","Бензин 98+","Дизел","CNG"],  address: "Бул. Александар Македонски" },
  { id: 2,  brand: "OKTA",      name: "OKTA Буњаковец",          city: "Скопје",    lat: 42.0041, lng: 21.3892, fuels: ["Бензин 95","Бензин 98+","Дизел"],         address: "Бул. 8-ми Септември" },
  { id: 3,  brand: "OKTA",      name: "OKTA Сарај",              city: "Скопје",    lat: 41.9754, lng: 21.3312, fuels: ["Бензин 95","Дизел","LPG"],                address: "Сарај" },
  { id: 4,  brand: "OKTA",      name: "OKTA Аеродром",           city: "Скопје",    lat: 41.9612, lng: 21.4601, fuels: ["Бензин 95","Бензин 98+","Дизел"],         address: "Бул. Борис Трајковски" },
  { id: 5,  brand: "OKTA",      name: "OKTA Ѓорче Петров",       city: "Скопје",    lat: 42.0201, lng: 21.3711, fuels: ["Бензин 95","Бензин 98+","Дизел","LPG"],   address: "Ѓорче Петров" },
  { id: 6,  brand: "MAKPETROL", name: "Макпетрол Центар",        city: "Скопје",    lat: 41.9981, lng: 21.4312, fuels: ["Бензин 95","Бензин 98+","Дизел","LPG"],   address: "Бул. Партизански Одреди" },
  { id: 7,  brand: "MAKPETROL", name: "Макпетрол Кисела Вода",   city: "Скопје",    lat: 41.9701, lng: 21.4789, fuels: ["Бензин 95","Дизел","CNG"],                address: "Кисела Вода" },
  { id: 8,  brand: "MAKPETROL", name: "Макпетрол Чаир",          city: "Скопје",    lat: 42.0121, lng: 21.4456, fuels: ["Бензин 95","Бензин 98+","Дизел"],         address: "Чаир" },
  { id: 9,  brand: "MAKPETROL", name: "Макпетрол Гази Баба",     city: "Скопје",    lat: 42.0034, lng: 21.5001, fuels: ["Бензин 95","Дизел","LPG"],                address: "Гази Баба" },
  { id: 10, brand: "LUKOIL",    name: "Лукоил Борис Трајковски", city: "Скопје",    lat: 41.9689, lng: 21.4523, fuels: ["Бензин 95","Бензин 98+","Дизел","LPG"],   address: "Бул. Борис Трајковски" },
  { id: 11, brand: "LUKOIL",    name: "Лукоил Илинден",          city: "Скопје",    lat: 41.9934, lng: 21.3978, fuels: ["Бензин 95","Дизел"],                      address: "Илинден" },
  { id: 12, brand: "LUKOIL",    name: "Лукоил Сити Мол",         city: "Скопје",    lat: 41.9867, lng: 21.4667, fuels: ["Бензин 95","Бензин 98+","Дизел","LPG"],   address: "Сити Мол" },
  { id: 13, brand: "LUKOIL",    name: "Лукоил Водно",            city: "Скопје",    lat: 41.9812, lng: 21.4012, fuels: ["Бензин 95","Дизел"],                      address: "Водно" },
  { id: 14, brand: "MAKPETROL", name: "Макпетрол Тетово",        city: "Тетово",    lat: 42.0089, lng: 20.9712, fuels: ["Бензин 95","Бензин 98+","Дизел","LPG"],   address: "Бул. Илинден, Тетово" },
  { id: 15, brand: "LUKOIL",    name: "Лукоил Тетово",           city: "Тетово",    lat: 42.0034, lng: 20.9634, fuels: ["Бензин 95","Дизел"],                      address: "Тетово центар" },
  { id: 16, brand: "OKTA",      name: "OKTA Тетово",             city: "Тетово",    lat: 42.0112, lng: 20.9801, fuels: ["Бензин 95","Бензин 98+","Дизел"],         address: "Тетово" },
  { id: 17, brand: "LUKOIL",    name: "Лукоил Куманово",         city: "Куманово",  lat: 42.1323, lng: 21.7145, fuels: ["Бензин 95","Бензин 98+","Дизел"],         address: "Куманово" },
  { id: 18, brand: "MAKPETROL", name: "Макпетрол Куманово",      city: "Куманово",  lat: 42.1289, lng: 21.7234, fuels: ["Бензин 95","Дизел","LPG","CNG"],          address: "Куманово центар" },
  { id: 19, brand: "MAKPETROL", name: "Макпетрол Битола",        city: "Битола",    lat: 41.0312, lng: 21.3345, fuels: ["Бензин 95","Бензин 98+","Дизел","LPG"],   address: "Бул. 1 Мај, Битола" },
  { id: 20, brand: "LUKOIL",    name: "Лукоил Битола",           city: "Битола",    lat: 41.0267, lng: 21.3412, fuels: ["Бензин 95","Дизел"],                      address: "Битола центар" },
  { id: 21, brand: "MAKPETROL", name: "Макпетрол Охрид",         city: "Охрид",     lat: 41.1178, lng: 20.8012, fuels: ["Бензин 95","Бензин 98+","Дизел","LPG"],   address: "Кеј Македонија, Охрид" },
  { id: 22, brand: "LUKOIL",    name: "Лукоил Охрид",            city: "Охрид",     lat: 41.1134, lng: 20.7978, fuels: ["Бензин 95","Дизел"],                      address: "Охрид центар" },
  { id: 23, brand: "MAKPETROL", name: "Макпетрол Велес",         city: "Велес",     lat: 41.7156, lng: 21.7734, fuels: ["Бензин 95","Дизел","LPG"],                address: "Велес центар" },
  { id: 24, brand: "MAKPETROL", name: "Макпетрол Струмица",      city: "Струмица",  lat: 41.4378, lng: 22.6434, fuels: ["Бензин 95","Дизел","LPG"],                address: "Струмица центар" },
  { id: 25, brand: "MAKPETROL", name: "Макпетрол Гевгелија",     city: "Гевгелија", lat: 41.1389, lng: 22.5023, fuels: ["Бензин 95","Дизел","LPG","CNG"],          address: "Гевгелија" },
  { id: 26, brand: "MAKPETROL", name: "Макпетрол Гостивар",      city: "Гостивар",  lat: 41.7956, lng: 20.9112, fuels: ["Бензин 95","Бензин 98+","Дизел","LPG"],   address: "Гостивар центар" },
  { id: 27, brand: "LUKOIL",    name: "Лукоил Штип",             city: "Штип",      lat: 41.7434, lng: 22.1923, fuels: ["Бензин 95","Бензин 98+","Дизел"],         address: "Штип" },
];

function getDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = (lat2-lat1)*Math.PI/180, dLng = (lng2-lng1)*Math.PI/180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return R*2*Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}
function formatDist(m) { return m<1000 ? `${Math.round(m)} м` : `${(m/1000).toFixed(1)} км`; }

function useIsMobile() {
  const [v, setV] = useState(false);
  useEffect(() => {
    const check = () => setV(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return v;
}

export default function MapPage() {
  const mapRef = useRef(null);
  const leafletRef = useRef(null);
  const markersRef = useRef([]);
  const userMarkerRef = useRef(null);

  const [selectedBrands, setSelectedBrands] = useState(["OKTA","MAKPETROL","LUKOIL","OTHER"]);
  const [selectedStation, setSelectedStation] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [locating, setLocating] = useState(false);
  const [userPos, setUserPos] = useState(null);
  const [nearestStation, setNearestStation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const isMobile = useIsMobile();
  const filtered = STATIONS.filter(s => selectedBrands.includes(s.brand));

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;
    const link = document.createElement("link");
    link.rel = "stylesheet"; link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);
    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => {
      const L = window.L; leafletRef.current = L;
      const map = L.map(mapRef.current, { center: [41.6086,21.7453], zoom: 8, zoomControl: false });
      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", { subdomains:"abcd", maxZoom:19 }).addTo(map);
      L.control.zoom({ position:"bottomright" }).addTo(map);
      leafletRef.current._map = map; setMapReady(true);
    };
    document.head.appendChild(script);
    return () => { if (leafletRef.current?._map) leafletRef.current._map.remove(); };
  }, [mounted]);

  useEffect(() => {
    if (!mapReady || !leafletRef.current) return;
    const L = leafletRef.current, map = L._map;
    markersRef.current.forEach(m => m.remove()); markersRef.current = [];
    filtered.forEach(s => {
      const brand = BRANDS[s.brand]||BRANDS.OTHER, isNearest = nearestStation?.id===s.id;
      const icon = L.divIcon({ html:`<div style="width:${isNearest?40:32}px;height:${isNearest?40:32}px;border-radius:50%;background:${brand.color};border:${isNearest?"3px solid #fff":"2.5px solid white"};display:flex;align-items:center;justify-content:center;font-size:${isNearest?"10px":"9px"};font-weight:800;color:white;box-shadow:${isNearest?`0 0 0 4px ${brand.color}44,0 4px 16px ${brand.color}88`:`0 3px 10px ${brand.color}66`};font-family:sans-serif;">${isNearest?"⭐":brand.label.substring(0,2)}</div>`, className:"", iconSize:[isNearest?40:32,isNearest?40:32], iconAnchor:[isNearest?20:16,isNearest?20:16] });
      markersRef.current.push(L.marker([s.lat,s.lng],{icon}).addTo(map).on("click",()=>{ setSelectedStation(s); setSheetOpen(false); }));
    });
  }, [mapReady, filtered, nearestStation]);

  useEffect(() => {
    if (!mapReady||!leafletRef.current||!userPos) return;
    const L=leafletRef.current, map=L._map;
    if (userMarkerRef.current) userMarkerRef.current.remove();
    const icon = L.divIcon({ html:`<div style="width:16px;height:16px;border-radius:50%;background:#3B82F6;border:3px solid #fff;box-shadow:0 0 0 6px rgba(59,130,246,0.25);"></div>`, className:"", iconSize:[16,16], iconAnchor:[8,8] });
    userMarkerRef.current = L.marker([userPos.lat,userPos.lng],{icon,zIndexOffset:1000}).addTo(map);
  }, [mapReady, userPos]);

  const findNearest = useCallback(() => {
    if (!navigator.geolocation) { setLocationError("Геолокацијата не е поддржана."); return; }
    setLocating(true); setLocationError(null); setNearestStation(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const {latitude:lat,longitude:lng} = pos.coords;
        setUserPos({lat,lng});
        let nearest=null, nearestDist=Infinity;
        STATIONS.forEach(s => { const dist=getDistance(lat,lng,s.lat,s.lng); if(dist<nearestDist){nearestDist=dist;nearest={...s,distance:dist};} });
        setNearestStation(nearest); setSelectedStation(nearest); setLocating(false); setSheetOpen(false);
        if (nearest&&leafletRef.current?._map) leafletRef.current._map.flyTo([(lat+nearest.lat)/2,(lng+nearest.lng)/2],14,{duration:1});
      },
      () => { setLocationError("Дозволете пристап до локација во Settings на вашиот телефон.");setLocating(false); },
      { enableHighAccuracy:true, timeout:8000 }
    );
  }, []);

  const flyTo = (lat,lng) => leafletRef.current?._map?.flyTo([lat,lng],15,{duration:0.7});

  const StationCard = () => {
    if (!selectedStation) return null;
    const brand = BRANDS[selectedStation.brand]||BRANDS.OTHER;
    const isNearest = nearestStation?.id===selectedStation.id;
    return (
      <div style={{ background:C.surface, borderRadius:isMobile?"20px 20px 0 0":16, padding:isMobile?"16px 16px 44px":"18px 20px", boxShadow:isMobile?"0 -4px 24px rgba(0,0,0,0.1)":"0 8px 40px rgba(0,0,0,0.1)", border:isMobile?"none":`1px solid ${C.borderHover}` }}>
        {isMobile && <div style={{ width:36,height:4,background:C.border,borderRadius:2,margin:"0 auto 14px" }} />}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4, flexWrap:"wrap" }}>
              <div style={{ fontSize:9,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:brand.color }}>{selectedStation.brand}</div>
              {isNearest && <div style={{ fontSize:9,fontWeight:700,background:"#F0FDF4",color:"#15803D",border:"1px solid #86EFAC",borderRadius:4,padding:"1px 6px" }}>⭐ Најблиска · {formatDist(nearestStation.distance)}</div>}
            </div>
            <div style={{ fontSize:16,fontWeight:800,color:C.text,marginBottom:2 }}>{selectedStation.name}</div>
            <div style={{ fontSize:12,color:C.muted }}>{selectedStation.address} · {selectedStation.city}</div>
          </div>
          {!isMobile && <button onClick={()=>setSelectedStation(null)} style={{ background:C.surface2,border:`1px solid ${C.border}`,borderRadius:6,color:C.muted,fontSize:14,cursor:"pointer",padding:"2px 7px",marginLeft:10 }}>×</button>}
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <a href={`https://www.google.com/maps/dir/?api=1&destination=${selectedStation.lat},${selectedStation.lng}`} target="_blank" rel="noopener noreferrer"
            style={{ flex:1,display:"block",textAlign:"center",background:C.orange,borderRadius:10,padding:"12px",color:"white",fontSize:14,fontWeight:700,textDecoration:"none" }}>
            🧭 Упатства
          </a>
          {isMobile && <button onClick={()=>setSelectedStation(null)} style={{ width:46,background:C.surface2,border:`1px solid ${C.border}`,borderRadius:10,color:C.muted,fontSize:18,cursor:"pointer",flexShrink:0 }}>×</button>}
        </div>
      </div>
    );
  };

  return (
    <>
      <Head>
        <title>Бензинcки — Makceni.mk</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <style>{`
          *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
          body{background:${C.bg};color:${C.text};font-family:'DM Sans',sans-serif;-webkit-font-smoothing:antialiased;overflow:hidden;}
          .leaflet-control-attribution{display:none!important;}
          .leaflet-control-zoom a{background:white!important;color:#57534E!important;border-color:#E6E3DD!important;box-shadow:0 1px 3px rgba(0,0,0,0.08)!important;}
          ::-webkit-scrollbar{width:3px;background:transparent;}
          ::-webkit-scrollbar-thumb{background:${C.border};border-radius:2px;}
          @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
          @keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
          @keyframes spin{to{transform:rotate(360deg)}}
        `}</style>
      </Head>

      <div style={{ width:"100vw", height:"100vh", display:"flex", flexDirection:"column" }}>

        {/* HEADER */}
        <header style={{ height:isMobile?48:52, flexShrink:0, zIndex:1000, background:C.surface, borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"space-between", padding:isMobile?"0 14px":"0 20px", boxShadow:"0 1px 2px rgba(0,0,0,0.04)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <a href="/" style={{ fontWeight:800, fontSize:isMobile?16:18, color:C.orange, textDecoration:"none" }}>makceni.mk</a>
            {!isMobile && <><div style={{ width:1, height:14, background:C.border }} /><span style={{ fontSize:12, color:C.muted, fontWeight:500 }}>Бензинcки</span></>}
          </div>
          <div style={{ display:"flex", gap:6, alignItems:"center" }}>
            {!isMobile && <span style={{ fontSize:11, color:C.muted }}>{filtered.length} станици</span>}
            <a href="/safecity" style={{ fontSize:11, fontWeight:600, color:"#DC2626", background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:7, padding:isMobile?"5px 10px":"5px 12px", textDecoration:"none" }}>📷{!isMobile&&" Safe City"}</a>
            <a href="/" style={{ fontSize:11, fontWeight:500, color:C.muted, background:C.surface2, border:`1px solid ${C.border}`, borderRadius:7, padding:isMobile?"5px 10px":"5px 12px", textDecoration:"none" }}>←{!isMobile&&" Назад"}</a>
          </div>
        </header>

        <div style={{ flex:1, display:"flex", overflow:"hidden", position:"relative" }}>

          {/* DESKTOP SIDEBAR */}
          {!isMobile && (
            <div style={{ width:276, background:C.surface, borderRight:`1px solid ${C.border}`, display:"flex", flexDirection:"column", flexShrink:0 }}>
              <div style={{ padding:"14px 14px 10px", borderBottom:`1px solid ${C.border}` }}>
                <button onClick={findNearest} disabled={locating} style={{ width:"100%", marginBottom:12, padding:"10px 12px", borderRadius:9, cursor:locating?"wait":"pointer", fontFamily:"inherit", fontSize:13, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", gap:7, background:nearestStation?"#F0FDF4":C.orangeBg, border:`1px solid ${nearestStation?"#86EFAC":C.orangeBorder}`, color:nearestStation?"#15803D":C.orange, transition:"all 0.15s", opacity:locating?0.7:1 }}>
                  {locating?<><div style={{ width:14,height:14,border:`2px solid ${C.orange}`,borderTopColor:"transparent",borderRadius:"50%",animation:"spin 0.7s linear infinite" }}/>Пронаоѓање...</>:nearestStation?<>✓ Најблиска: {nearestStation.name.split(" ").slice(0,2).join(" ")}</>:<>📍 Најблиска бензинска</>}
                </button>
                {nearestStation && (
                  <div onClick={()=>{flyTo(nearestStation.lat,nearestStation.lng);setSelectedStation(nearestStation);}} style={{ background:"#F0FDF4",border:"1px solid #86EFAC",borderRadius:9,padding:"10px 12px",marginBottom:12,cursor:"pointer" }} onMouseEnter={e=>e.currentTarget.style.background="#DCFCE7"} onMouseLeave={e=>e.currentTarget.style.background="#F0FDF4"}>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <div style={{ width:28,height:28,borderRadius:"50%",background:(BRANDS[nearestStation.brand]||BRANDS.OTHER).color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0 }}>⭐</div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:12,fontWeight:700,color:"#15803D",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{nearestStation.name}</div>
                        <div style={{ fontSize:11,color:"#16A34A" }}>{formatDist(nearestStation.distance)} од вас</div>
                      </div>
                    </div>
                  </div>
                )}
                {locationError && <div style={{ fontSize:11,color:"#DC2626",marginBottom:10 }}>⚠ {locationError}</div>}
                <div style={{ fontSize:10,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:C.muted,marginBottom:8 }}>Бренд</div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                  {Object.entries(BRANDS).map(([key,brand])=>(
                    <button key={key} onClick={()=>setSelectedBrands(prev=>prev.includes(key)?prev.filter(b=>b!==key):[...prev,key])} style={{ padding:"4px 10px",borderRadius:6,cursor:"pointer",fontSize:11,fontWeight:600,border:`1px solid ${selectedBrands.includes(key)?brand.color+"55":C.border}`,background:selectedBrands.includes(key)?brand.color+"12":C.surface2,color:selectedBrands.includes(key)?brand.color:C.muted,transition:"all 0.12s" }}>{brand.label}</button>
                  ))}
                </div>
              </div>
              <div style={{ flex:1, overflowY:"auto", padding:"6px 6px 16px" }}>
                {filtered.map(s=>{
                  const brand=BRANDS[s.brand]||BRANDS.OTHER, isSel=selectedStation?.id===s.id, isNearest=nearestStation?.id===s.id;
                  return (
                    <div key={s.id} onClick={()=>{flyTo(s.lat,s.lng);setSelectedStation(s);}} onMouseEnter={e=>{if(!isSel)e.currentTarget.style.background=C.surface2;}} onMouseLeave={e=>{if(!isSel)e.currentTarget.style.background=isNearest?"#F0FDF4":"transparent";}} style={{ padding:"9px 10px",borderRadius:8,cursor:"pointer",marginBottom:1,transition:"all 0.12s",background:isSel?C.surface3:isNearest?"#F0FDF4":"transparent",border:`1px solid ${isSel?brand.color+"40":isNearest?"#86EFAC":"transparent"}` }}>
                      <div style={{ display:"flex", alignItems:"center", gap:9 }}>
                        <div style={{ width:26,height:26,borderRadius:"50%",background:brand.color,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:isNearest?12:8,fontWeight:800,color:"white" }}>{isNearest?"⭐":brand.label.substring(0,2)}</div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:12,fontWeight:600,color:C.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{s.name}</div>
                          <div style={{ fontSize:10,color:isNearest?"#16A34A":C.muted }}>{isNearest&&nearestStation?.distance?`${formatDist(nearestStation.distance)} · `:""}{s.city}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* MAP */}
          <div style={{ flex:1, position:"relative" }}>
            <div ref={mapRef} style={{ width:"100%", height:"100%" }} />

            {/* Desktop popup */}
            {!isMobile && selectedStation && (
              <div style={{ position:"absolute", bottom:24, left:"50%", transform:"translateX(-50%)", zIndex:500, minWidth:310, maxWidth:400, animation:"fadeUp 0.2s ease" }}>
                <StationCard />
              </div>
            )}

            {/* Desktop legend */}
            {!isMobile && (
              <div style={{ position:"absolute", top:14, right:14, zIndex:500, background:"rgba(255,255,255,0.94)", backdropFilter:"blur(8px)", border:`1px solid ${C.border}`, borderRadius:10, padding:"10px 12px", boxShadow:"0 2px 8px rgba(0,0,0,0.06)" }}>
                {Object.entries(BRANDS).map(([k,brand])=>(
                  <div key={k} style={{ display:"flex", alignItems:"center", gap:7, marginBottom:5 }}>
                    <div style={{ width:7,height:7,borderRadius:"50%",background:brand.color }} />
                    <span style={{ fontSize:11,color:C.textMid,fontWeight:500 }}>{brand.label}</span>
                  </div>
                ))}
                <div style={{ display:"flex", alignItems:"center", gap:7, marginTop:5, paddingTop:5, borderTop:`1px solid ${C.border}` }}>
                  <span style={{ fontSize:11 }}>⭐</span>
                  <span style={{ fontSize:11,color:"#15803D",fontWeight:600 }}>Најблиска</span>
                </div>
              </div>
            )}

            {/* MOBILE floating buttons */}
            {isMobile && !sheetOpen && (
              <div style={{ position:"absolute", top: 60,
bottom: "auto", left:"50%", transform:"translateX(-50%)", zIndex:500, display:"flex", gap:10, transition:"bottom 0.3s ease" }}>
                <button onClick={findNearest} disabled={locating} style={{ height:46,padding:"0 18px",borderRadius:23,background:nearestStation?"#F0FDF4":C.surface,border:`2px solid ${nearestStation?"#86EFAC":C.orangeBorder}`,color:nearestStation?"#15803D":C.orange,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",boxShadow:"0 4px 16px rgba(0,0,0,0.15)",display:"flex",alignItems:"center",gap:6,whiteSpace:"nowrap" }}>
                  {locating?<><div style={{ width:14,height:14,border:`2px solid ${C.orange}`,borderTopColor:"transparent",borderRadius:"50%",animation:"spin 0.7s linear infinite" }}/>Пронаоѓање...</>:nearestStation?<>⭐ Најблиска</>:<>📍 Најблиска</>}
                </button>
                <button onClick={()=>setSheetOpen(true)} style={{ height:46,padding:"0 18px",borderRadius:23,background:C.surface,border:`1px solid ${C.border}`,color:C.text,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",boxShadow:"0 4px 16px rgba(0,0,0,0.15)",display:"flex",alignItems:"center",gap:6 }}>
                  ☰ Листа
                </button>
              </div>
            )}

            {/* MOBILE station card */}
            {isMobile && selectedStation && (
              <div style={{ position:"absolute", bottom:0, left:0, right:0, zIndex:600, animation:"slideUp 0.25s ease" }}>
                <StationCard />
              </div>
            )}

            {/* MOBILE bottom sheet */}
            {isMobile && sheetOpen && (
              <>
                <div onClick={()=>setSheetOpen(false)} style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.45)", zIndex:700 }} />
                <div style={{ position:"absolute", bottom:0, left:0, right:0, zIndex:800, background:C.surface, borderRadius:"20px 20px 0 0", maxHeight:"82vh", display:"flex", flexDirection:"column", animation:"slideUp 0.3s ease" }}>
                  <div style={{ padding:"12px 16px 10px", borderBottom:`1px solid ${C.border}`, flexShrink:0 }}>
                    <div style={{ width:36,height:4,background:C.border,borderRadius:2,margin:"0 auto 12px" }} />
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                      <div style={{ fontSize:14,fontWeight:700,color:C.text }}>{filtered.length} Бензинcки</div>
                      <button onClick={()=>setSheetOpen(false)} style={{ background:C.surface2,border:`1px solid ${C.border}`,borderRadius:6,color:C.muted,fontSize:16,cursor:"pointer",padding:"2px 8px" }}>×</button>
                    </div>
                    <button onClick={findNearest} disabled={locating} style={{ width:"100%",marginBottom:10,padding:"10px 12px",borderRadius:9,cursor:locating?"wait":"pointer",fontFamily:"inherit",fontSize:13,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",gap:7,background:nearestStation?"#F0FDF4":C.orangeBg,border:`1px solid ${nearestStation?"#86EFAC":C.orangeBorder}`,color:nearestStation?"#15803D":C.orange }}>
                      {locating?<><div style={{ width:14,height:14,border:`2px solid ${C.orange}`,borderTopColor:"transparent",borderRadius:"50%",animation:"spin 0.7s linear infinite" }}/>Пронаоѓање...</>:nearestStation?<>✓ {nearestStation.name.split(" ").slice(0,2).join(" ")}</>:<>📍 Најблиска бензинска</>}
                    </button>
                    {locationError && <div style={{ fontSize:11,color:"#DC2626",marginBottom:8 }}>⚠ {locationError}</div>}
                    <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                      {Object.entries(BRANDS).map(([key,brand])=>(
                        <button key={key} onClick={()=>setSelectedBrands(prev=>prev.includes(key)?prev.filter(b=>b!==key):[...prev,key])} style={{ padding:"4px 10px",borderRadius:6,cursor:"pointer",fontSize:11,fontWeight:600,border:`1px solid ${selectedBrands.includes(key)?brand.color+"55":C.border}`,background:selectedBrands.includes(key)?brand.color+"12":C.surface2,color:selectedBrands.includes(key)?brand.color:C.muted }}>{brand.label}</button>
                      ))}
                    </div>
                  </div>
                  <div style={{ overflowY:"auto", padding:"6px 10px 32px", flex:1 }}>
                    {filtered.map(s=>{
                      const brand=BRANDS[s.brand]||BRANDS.OTHER, isNearest=nearestStation?.id===s.id;
                      return (
                        <div key={s.id} onClick={()=>{flyTo(s.lat,s.lng);setSelectedStation(s);setSheetOpen(false);}} style={{ padding:"12px 10px",borderRadius:10,cursor:"pointer",marginBottom:2,background:isNearest?"#F0FDF4":"transparent",border:`1px solid ${isNearest?"#86EFAC":"transparent"}`,display:"flex",alignItems:"center",gap:12 }}>
                          <div style={{ width:36,height:36,borderRadius:"50%",background:brand.color,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:isNearest?16:10,fontWeight:800,color:"white" }}>{isNearest?"⭐":brand.label.substring(0,2)}</div>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ fontSize:14,fontWeight:600,color:C.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{s.name}</div>
                            <div style={{ fontSize:11,color:isNearest?"#16A34A":C.muted }}>{isNearest&&nearestStation?.distance?`${formatDist(nearestStation.distance)} · `:""}{s.city}</div>
                          </div>
                          <div style={{ fontSize:16,color:C.muted }}>›</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}