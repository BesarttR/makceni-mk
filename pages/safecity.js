"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Head from "next/head";
import { useLanguage, LanguageSwitcher } from "../translations";

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
  glass:       "rgba(14,14,30,0.88)",
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

function getDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = (lat2-lat1)*Math.PI/180, dLng = (lng2-lng1)*Math.PI/180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return R*2*Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function getBearing(lat1, lng1, lat2, lng2) {
  const dLng = (lng2-lng1)*Math.PI/180;
  const y = Math.sin(dLng)*Math.cos(lat2*Math.PI/180);
  const x = Math.cos(lat1*Math.PI/180)*Math.sin(lat2*Math.PI/180)-Math.sin(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.cos(dLng);
  return (Math.atan2(y,x)*180/Math.PI+360)%360;
}

function playWarningSound(audioCtx) {
  if (!audioCtx) return;
  const play = () => {
    try {
      const beep = (freq, startTime, duration, vol = 0.5) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(vol, startTime + 0.01);
        gain.gain.linearRampToValueAtTime(0, startTime + duration);
        osc.start(startTime); osc.stop(startTime + duration + 0.05);
      };
      const t = audioCtx.currentTime;
      beep(1046, t, 0.15); beep(880, t+0.2, 0.2); beep(1046, t+0.45, 0.15);
    } catch(e) { console.warn("beep failed:", e); }
  };
  if (audioCtx.state === "running") { play(); }
  else { audioCtx.resume().then(play).catch(e => console.warn("resume failed:", e)); }
}

const WARN_DISTANCE = 200, COOLDOWN_MS = 5 * 60 * 1000;

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

function getArrowIcon(L, heading) {
  const rotation = heading !== null && heading !== undefined ? heading : 0;
  const hasHeading = heading !== null && heading !== undefined;
  const html = hasHeading
    ? `<div style="width:36px;height:36px;display:flex;align-items:center;justify-content:center;transform:rotate(${rotation}deg);">
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="18" cy="18" r="14" fill="#3B82F6" fill-opacity="0.2"/>
          <circle cx="18" cy="18" r="8" fill="#3B82F6" stroke="white" stroke-width="2.5"/>
          <polygon points="18,4 23,16 18,13 13,16" fill="#3B82F6" stroke="white" stroke-width="1.5" stroke-linejoin="round"/>
        </svg>
      </div>`
    : `<div style="width:16px;height:16px;border-radius:50%;background:#3B82F6;border:3px solid #fff;box-shadow:0 0 0 6px rgba(59,130,246,0.25);"></div>`;
  return L.divIcon({ html, className:"", iconSize:hasHeading?[36,36]:[16,16], iconAnchor:hasHeading?[18,18]:[8,8] });
}

export default function SafeCityPage() {
  const { lang, setLang, tr } = useLanguage();
  const [isDark, setIsDark] = useState(true);

  const mapRef = useRef(null), leafletRef = useRef(null), clusterGroupRef = useRef(null), reportMarkerRef = useRef(null);
  const audioCtxRef = useRef(null), warnedCamerasRef = useRef({}), watchIdRef = useRef(null);
  const camerasRef = useRef([]), soundEnabledRef = useRef(true), lastSpeedRef = useRef(null);
  const lastHeadingRef = useRef(null);
  const wakeLockRef = useRef(null);
  const tileLayerRef = useRef(null);

  const [cameras, setCameras] = useState([]);
  const [reportedCameras, setReportedCameras] = useState([]);
  const [cameraCount, setCameraCount] = useState(0);
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const [proximityAlert, setProximityAlert] = useState(null);
  const [trackingActive, setTrackingActive] = useState(false);
  const [trackingError, setTrackingError] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [currentSpeed, setCurrentSpeed] = useState(null);
  const [reportMode, setReportMode] = useState(false);
  const [reportPin, setReportPin] = useState(null);
  const [reportForm, setReportForm] = useState({ maxspeed: "50", description: "" });
  const [reportSent, setReportSent] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [gpsHint, setGpsHint] = useState(false);

  const T = isDark ? D : L;
  const isMobile = useIsMobile();

  useEffect(() => {
    setMounted(true);
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setIsDark(mq.matches);
    const handler = (e) => setIsDark(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Switch map tiles when theme changes
  useEffect(() => {
    if (!mapReady || !leafletRef.current?._map) return;
    const map = leafletRef.current._map;
    const L = leafletRef.current;
    if (tileLayerRef.current) map.removeLayer(tileLayerRef.current);
    const tileUrl = isDark
      ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
    tileLayerRef.current = L.tileLayer(tileUrl, { subdomains:"abcd", maxZoom:19 }).addTo(map);
  }, [isDark, mapReady]);

  useEffect(() => { soundEnabledRef.current = soundEnabled; }, [soundEnabled]);

  useEffect(() => {
    fetch("/api/cameras").then(r => r.json()).then(d => { if (d.cameras) { setCameras(d.cameras); camerasRef.current = d.cameras; setCameraCount(d.count); } setLoading(false); }).catch(() => setLoading(false));
    fetch("/api/report-camera").then(r => r.json()).then(d => { if (d.cameras) setReportedCameras(d.cameras); }).catch(() => {});
  }, []);

  const initAudio = useCallback(() => {
    if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtxRef.current.state === "suspended") audioCtxRef.current.resume().catch(() => {});
  }, []);

  const checkProximity = useCallback((lat, lng, heading) => {
    let closest = null, closestDist = Infinity;
    camerasRef.current.forEach((cam, idx) => {
      const dist = getDistance(lat, lng, cam.lat, cam.lng);
      if (dist <= WARN_DISTANCE && dist < closestDist) {
        if (heading !== null && heading !== undefined) {
          const bearing = getBearing(lat, lng, cam.lat, cam.lng);
          const diff = Math.abs(heading - bearing) % 360;
          const angleDiff = diff > 180 ? 360 - diff : diff;
          if (angleDiff > 90) return;
        }
        closestDist = dist; closest = { ...cam, _idx: idx };
      }
    });
    if (closest) {
      const now = Date.now(), lastWarned = warnedCamerasRef.current[closest._idx] || 0;
      if (now - lastWarned > COOLDOWN_MS) {
        warnedCamerasRef.current[closest._idx] = now;
        setProximityAlert({ camera: closest, distance: Math.round(closestDist) });
        if (soundEnabledRef.current && audioCtxRef.current) {
          audioCtxRef.current.resume().then(() => playWarningSound(audioCtxRef.current)).catch(() => playWarningSound(audioCtxRef.current));
        }
        setTimeout(() => setProximityAlert(null), 5000);
      } else {
        setProximityAlert(prev => prev ? { ...prev, distance: Math.round(closestDist) } : null);
      }
    } else { setProximityAlert(null); }
  }, []);

  const requestWakeLock = useCallback(async () => {
    if ("wakeLock" in navigator) {
      try {
        wakeLockRef.current = await navigator.wakeLock.request("screen");
        wakeLockRef.current.addEventListener("release", () => { wakeLockRef.current = null; });
      } catch(e) { console.warn("Wake lock failed:", e); }
    }
  }, []);

  const releaseWakeLock = useCallback(() => {
    if (wakeLockRef.current) { wakeLockRef.current.release().catch(() => {}); wakeLockRef.current = null; }
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => { if (document.visibilityState === "visible" && trackingActive) requestWakeLock(); };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [trackingActive, requestWakeLock]);

  const startTracking = useCallback(() => {
    initAudio();
    if (!navigator.geolocation) { setTrackingError(tr("safecity.errors.permissionDenied")); return; }
    setTrackingError(null); setTrackingActive(true); requestWakeLock();
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, speed, heading } = pos.coords;
        if (speed !== null && speed >= 0) { const kmh = Math.round(speed * 3.6); setCurrentSpeed(kmh); lastSpeedRef.current = kmh; }
        else setCurrentSpeed(lastSpeedRef.current);
        if (heading !== null && heading !== undefined) lastHeadingRef.current = heading;
        if (leafletRef.current) {
          const L = leafletRef.current, map = L._map;
          const currentHeading = heading !== null && heading !== undefined ? heading : lastHeadingRef.current;
          const icon = getArrowIcon(L, currentHeading);
          if (!L._userMarker) { L._userMarker = L.marker([latitude, longitude], { icon, zIndexOffset:1000 }).addTo(map); }
          else { L._userMarker.setLatLng([latitude, longitude]); L._userMarker.setIcon(icon); }
          map.flyTo([latitude, longitude], 17, { animate:true, duration:0.8 });
        }
        checkProximity(latitude, longitude, heading !== null && heading !== undefined ? heading : lastHeadingRef.current);
      },
      (err) => {
        if (err.code === 1) setTrackingError(tr("safecity.errors.permissionDenied"));
        else if (err.code === 2) setTrackingError(tr("safecity.errors.unavailable"));
        else if (err.code === 3) setTrackingError(tr("safecity.errors.timeout"));
        setTrackingActive(false); setCurrentSpeed(null); releaseWakeLock();
      },
      { enableHighAccuracy:true, maximumAge:2000, timeout:10000 }
    );
  }, [initAudio, checkProximity, requestWakeLock, releaseWakeLock, tr]);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) { navigator.geolocation.clearWatch(watchIdRef.current); watchIdRef.current = null; }
    if (leafletRef.current?._userMarker) { leafletRef.current._userMarker.remove(); leafletRef.current._userMarker = null; }
    setTrackingActive(false); setProximityAlert(null); setCurrentSpeed(null);
    lastSpeedRef.current = null; lastHeadingRef.current = null; releaseWakeLock();
  }, [releaseWakeLock]);

  useEffect(() => { return () => { if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current); }; }, []);

  useEffect(() => {
    if (!mounted) return;
    const addCss = (href) => { const l = document.createElement("link"); l.rel = "stylesheet"; l.href = href; document.head.appendChild(l); };
    addCss("https://unpkg.com/leaflet@1.9.4/dist/leaflet.css");
    addCss("https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css");
    addCss("https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css");
    const ls = document.createElement("script"); ls.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    ls.onload = () => {
      const cs = document.createElement("script"); cs.src = "https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js";
      cs.onload = () => {
        const L = window.L; leafletRef.current = L;
        const map = L.map(mapRef.current, { center:[41.9981,21.4254], zoom:13, zoomControl:false, attributionControl:false });
        const tileUrl = isDark
          ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
        tileLayerRef.current = L.tileLayer(tileUrl, { subdomains:"abcd", maxZoom:19 }).addTo(map);
        L.control.zoom({ position:"bottomright" }).addTo(map);
        leafletRef.current._map = map; setMapReady(true);
      };
      document.head.appendChild(cs);
    };
    document.head.appendChild(ls);
    return () => { if (leafletRef.current?._map) leafletRef.current._map.remove(); };
  }, [mounted]);

  useEffect(() => {
    if (!mapReady || !leafletRef.current || cameras.length === 0) return;
    const L = leafletRef.current, map = L._map;
    if (clusterGroupRef.current) map.removeLayer(clusterGroupRef.current);
    const cg = L.markerClusterGroup({
      maxClusterRadius:48, showCoverageOnHover:false, zoomToBoundsOnClick:true, spiderfyOnMaxZoom:true,
      iconCreateFunction: (cluster) => {
        const count = cluster.getChildCount();
        return L.divIcon({ html:`<div style="width:38px;height:38px;border-radius:50%;background:radial-gradient(circle,#FF4444,#CC0000);border:3px solid rgba(255,255,255,0.9);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;color:#fff;box-shadow:0 0 0 4px rgba(255,60,60,0.25),0 4px 14px rgba(255,0,0,0.4);font-family:inherit;">${count}</div>`, className:"", iconSize:[38,38], iconAnchor:[19,19] });
      },
    });
    cameras.forEach(cam => {
      const icon = L.divIcon({ html:`<div style="width:46px;height:46px;border-radius:50%;border:3px solid rgba(255,255,255,0.9);overflow:hidden;box-shadow:0 0 0 4px rgba(255,60,60,0.25),0 4px 14px rgba(255,0,0,0.4);background:radial-gradient(circle,#FF4444,#CC0000) url('/icons/safecity1.png') center/cover no-repeat;"></div>`, className:"", iconSize:[46,46], iconAnchor:[23,23] });
      const marker = L.marker([cam.lat, cam.lng], { icon });
      marker.on("click", () => { setSelectedCamera(cam); setReportPin(null); });
      cg.addLayer(marker);
    });
    map.addLayer(cg); clusterGroupRef.current = cg;
  }, [mapReady, cameras]);

  useEffect(() => {
    if (!mapReady || !leafletRef.current) return;
    const L = leafletRef.current, map = L._map;
    reportedCameras.forEach(cam => {
      const icon = L.divIcon({ html:`<div style="width:48px;height:48px;border-radius:50%;border:3px solid rgba(255,255,255,0.9);overflow:hidden;box-shadow:0 0 0 3px rgba(249,115,22,0.3),0 4px 12px rgba(249,115,22,0.5);background:radial-gradient(circle,#F97316,#EA580C) url('/icons/safecity1.png') center/cover no-repeat;"></div>`, className:"", iconSize:[48,48], iconAnchor:[24,24] });
      L.marker([cam.lat, cam.lng], { icon }).addTo(map).on("click", () => setSelectedCamera({ ...cam, reported:true }));
    });
  }, [mapReady, reportedCameras]);

  useEffect(() => {
    if (!mapReady || !leafletRef.current) return;
    const map = leafletRef.current._map;
    const onClick = (e) => {
      if (!reportMode) return;
      const { lat, lng } = e.latlng; setReportPin({ lat, lng }); setReportSent(false);
      const L = leafletRef.current;
      if (reportMarkerRef.current) reportMarkerRef.current.remove();
      const icon = L.divIcon({ html:`<div style="width:36px;height:36px;border-radius:50%;background:#F97316;border:3px solid white;display:flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 4px 16px rgba(249,115,22,0.6);animation:bounce 0.4s ease;">📍</div>`, className:"", iconSize:[36,36], iconAnchor:[18,36] });
      reportMarkerRef.current = L.marker([lat, lng], { icon }).addTo(map);
    };
    map.on("click", onClick);
    return () => map.off("click", onClick);
  }, [mapReady, reportMode]);

  const toggleReportMode = () => {
    setReportMode(prev => {
      if (prev) { if (reportMarkerRef.current) { reportMarkerRef.current.remove(); reportMarkerRef.current = null; } setReportPin(null); setReportSent(false); }
      return !prev;
    });
    setSelectedCamera(null);
  };

  const submitReport = async () => {
    if (!reportPin) return;
    setReportLoading(true);
    try {
      const res = await fetch("/api/report-camera", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ lat:reportPin.lat, lng:reportPin.lng, ...reportForm }) });
      const data = await res.json();
      if (data.success) { setReportSent(true); setReportedCameras(prev => [...prev, data.camera]); setCameraCount(prev => prev+1); if (reportMarkerRef.current) { reportMarkerRef.current.remove(); reportMarkerRef.current = null; } setReportPin(null); setReportMode(false); }
    } catch(e) {}
    setReportLoading(false);
  };

  const getSpeedColor = (spd) => { if (spd === null) return T.muted; if (spd <= 50) return T.green; if (spd <= 80) return T.orange; return T.red; };

  const handleGpsToggle = () => {
    initAudio();
    if (!trackingActive) { startTracking(); setGpsHint(true); setTimeout(() => setGpsHint(false), 5000); }
    else { stopTracking(); setGpsHint(false); }
  };

  const inp = { background:isDark?"rgba(0,0,0,0.4)":T.surface, border:`1px solid ${T.border}`, borderRadius:9, padding:"9px 12px", color:T.text, fontSize:13, fontWeight:500, width:"100%", outline:"none", fontFamily:"inherit", backdropFilter:"blur(8px)" };

  return (
    <>
      <Head>
        <title>Safe City Камери во Македонија — Радар Предупредување | МакЦени</title>
        <meta name="description" content="Карта со Safe City камери за брзина во Македонија. Добијте предупредување пред камера додека возите — бесплатно и во реално време." />
        <meta name="keywords" content="safe city камери македонија, камери за брзина скопје, радар македонија, safe city скопје, камери за сообраќај" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://makceni.mk/safecity" />
        <meta property="og:title" content="Safe City Камери — МакЦени" />
        <meta property="og:description" content="Карта со Safe City камери за брзина во Македонија. Предупредување во реално време додека возите." />
        <meta property="og:url" content="https://makceni.mk/safecity" />
        <meta property="og:image" content="https://makceni.mk/og-image.png" />
        <meta property="og:type" content="website" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context":"https://schema.org", "@type":"WebApplication", "name":"Safe City Камери — МакЦени", "description":"Предупредување за Safe City камери за брзина во Македонија во реално време", "url":"https://makceni.mk/safecity", "applicationCategory":"NavigationApplication", "operatingSystem":"Web" }) }} />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <style>{`
          *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
          body{background:${T.bg};color:${T.text};font-family:inherit;-webkit-font-smoothing:antialiased;overflow:hidden;}
          .leaflet-control-attribution{display:none!important;}
          .leaflet-control-zoom a{background:${isDark?"rgba(14,14,30,0.95)":T.surface}!important;color:${T.textMid}!important;border-color:${T.border}!important;backdrop-filter:blur(12px);}
          .leaflet-control-zoom a:hover{color:${T.text}!important;background:${T.surface2}!important;}
          .leaflet-container{background:${T.bg}!important;}
          .marker-cluster{background:transparent!important;border:none!important;}
          .marker-cluster div{background:transparent!important;}
          @keyframes ping{0%{transform:scale(1);opacity:0.3;}75%,100%{transform:scale(2.2);opacity:0;}}
          @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
          @keyframes fadeDown{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
          @keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
          @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.35}}
          @keyframes bounce{0%{transform:translateY(-12px)}60%{transform:translateY(3px)}100%{transform:translateY(0)}}
          @keyframes alertPulse{0%{box-shadow:0 0 0 0 rgba(248,113,113,0.5)}60%{box-shadow:0 0 0 14px rgba(248,113,113,0)}100%{box-shadow:0 0 0 0 rgba(248,113,113,0)}}
          @keyframes popIn{0%{opacity:0;transform:translate(-50%,-50%) scale(0.88)}70%{transform:translate(-50%,-50%) scale(1.02)}100%{opacity:1;transform:translate(-50%,-50%) scale(1)}}
          @keyframes spin{to{transform:rotate(360deg)}}
        `}</style>
      </Head>

      <div style={{ width:"100vw", height:"100vh", display:"flex", flexDirection:"column", background:T.bg }} onClick={initAudio}>

        {/* ── Navbar ── */}
        <header style={{ height:62, flexShrink:0, zIndex:1000, background:isDark?"rgba(0,0,0,0.75)":"rgba(242,240,235,0.85)", backdropFilter:"blur(28px)", WebkitBackdropFilter:"blur(28px)", borderBottom:`1px solid ${T.border}`, position:"relative" }}>
          <div style={{ position:"absolute", top:0, left:0, right:0, height:1, background:`linear-gradient(90deg,transparent,${isDark?"rgba(100,120,255,0.5)":"rgba(124,58,237,0.2)"},transparent)` }} />
          <div style={{ maxWidth:1200, margin:"0 auto", padding:`0 ${isMobile?"16px":"40px"}`, height:62, display:"flex", alignItems:"center", justifyContent:"space-between", gap:16 }}>

            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <a href="/" style={{ textDecoration:"none", flexShrink:0 }}>
                <img src={isDark?"/logo2.png":"/logo.png"} alt="makceni.mk" style={{ height:isMobile?84:99, width:"auto", display:"block" }} />
              </a>
              <div style={{ width:1, height:16, background:T.border }}/>
              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                <span style={{ position:"relative", display:"inline-flex", alignItems:"center", justifyContent:"center", width:8, height:8 }}>
                  <span style={{ position:"absolute", width:8, height:8, borderRadius:"50%", background:T.red, opacity:0.3, animation:"ping 1.8s ease-in-out infinite" }} />
                  <span style={{ width:5, height:5, borderRadius:"50%", background:T.red, display:"inline-block" }} />
                </span>
                <img src={isDark?"/icons/safecity1.png":"/icons/safecity.png"} style={{ width:26, height:26, objectFit:"contain" }} />
                <span style={{ fontSize:13, fontWeight:600, color:T.textMid }}>{tr("safecity.headerTitle")}</span>
              </div>
            </div>

            <div style={{ display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
              <div style={{ background:T.redBg, border:`1px solid ${T.redBdr}`, borderRadius:8, padding:"5px 12px", display:"flex", alignItems:"center", gap:6 }}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke={T.red} style={{ width:16, height:16, flexShrink:0 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                </svg>
                <span style={{ fontSize:13, fontWeight:700, color:T.red }}>
                  {loading ? "..." : isMobile ? tr("safecity.camerasCountMobile",{count:cameraCount}) : tr("safecity.camerasCount",{count:cameraCount})}
                </span>
              </div>
              {!isMobile && (
                <>
                  <button onClick={toggleReportMode} style={{ padding:"7px 13px", borderRadius:8, fontSize:14, fontWeight:600, color:reportMode?T.text:T.textMid, background:reportMode?isDark?"rgba(255,255,255,0.04)":T.surface2:"transparent", border:`1px solid ${reportMode?T.border:"transparent"}`, cursor:"pointer", transition:"all 0.15s", fontFamily:"inherit" }}
                    onMouseEnter={e=>{ e.currentTarget.style.background=isDark?"rgba(255,255,255,0.04)":T.surface2; e.currentTarget.style.borderColor=T.border; e.currentTarget.style.color=T.text; }}
                    onMouseLeave={e=>{ if(!reportMode){ e.currentTarget.style.background="transparent"; e.currentTarget.style.borderColor="transparent"; e.currentTarget.style.color=T.textMid; } }}>
                    {reportMode ? tr("safecity.cancelBtn") : tr("safecity.reportBtn")}
                  </button>
                  <a href="/mapa" style={{ padding:"7px 13px", borderRadius:8, fontSize:14, fontWeight:600, color:T.textMid, textDecoration:"none", transition:"all 0.15s", border:"1px solid transparent", display:"flex", alignItems:"center", gap:6 }}
                    onMouseEnter={e=>{ e.currentTarget.style.background=isDark?"rgba(255,255,255,0.04)":T.surface2; e.currentTarget.style.borderColor=T.border; e.currentTarget.style.color=T.text; }}
                    onMouseLeave={e=>{ e.currentTarget.style.background="transparent"; e.currentTarget.style.borderColor="transparent"; e.currentTarget.style.color=T.textMid; }}>
                    <img src={isDark?"/icons/gasstation1.png":"/icons/gasstation.png"} style={{ width:22, height:22, objectFit:"contain" }} />
                    {tr("safecity.gasStationsBtn")}
                  </a>
                  <div style={{ width:1, height:18, background:T.border }} />
                </>
              )}
              <LanguageSwitcher lang={lang} setLang={setLang} isDark={isDark} />
              <a href="/" style={{ padding:"7px 13px", borderRadius:8, fontSize:14, fontWeight:600, color:T.textMid, textDecoration:"none", transition:"all 0.15s", border:"1px solid transparent" }}
                onMouseEnter={e=>{ e.currentTarget.style.background=isDark?"rgba(255,255,255,0.04)":T.surface2; e.currentTarget.style.borderColor=T.border; e.currentTarget.style.color=T.text; }}
                onMouseLeave={e=>{ e.currentTarget.style.background="transparent"; e.currentTarget.style.borderColor="transparent"; e.currentTarget.style.color=T.textMid; }}>
                ←{!isMobile && ` ${tr("nav.back").replace("← ","")}`}
              </a>
            </div>
          </div>
        </header>

        <div style={{ flex:1, position:"relative" }}>
          <div ref={mapRef} style={{ width:"100%", height:"100%" }} />

          {/* ── Proximity Alert ── */}
          {proximityAlert && (
            <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", zIndex:700, background:T.glass, backdropFilter:"blur(24px)", border:`2px solid ${T.red}`, borderRadius:20, overflow:"hidden", width:"min(340px,90vw)", animation:"alertPulse 1.2s ease-out infinite,popIn 0.3s cubic-bezier(0.34,1.56,0.64,1) forwards", boxShadow:`0 0 0 1px ${T.redBdr}, 0 24px 60px rgba(0,0,0,0.4)` }}>
              <div style={{ position:"absolute", top:0, left:0, right:0, height:1, background:`linear-gradient(90deg,transparent,${T.red}88,transparent)` }} />
              <div style={{ background:T.redBg, padding:"12px 16px", display:"flex", alignItems:"center", gap:8, borderBottom:`1px solid ${T.redBdr}` }}>
                <span style={{ fontSize:18 }}>⚠️</span>
                <span style={{ fontSize:14, fontWeight:800, color:T.red, flex:1 }}>{tr("safecity.proximity.title")}</span>
                <button onClick={()=>setProximityAlert(null)} style={{ background:T.redBg, border:`1px solid ${T.redBdr}`, color:T.red, borderRadius:6, padding:"2px 8px", cursor:"pointer", fontSize:14, fontWeight:700, fontFamily:"inherit" }}>{tr("safecity.proximity.close")}</button>
              </div>
              <div style={{ padding:"22px", textAlign:"center" }}>
                <div style={{ fontSize:72, fontWeight:800, color:T.red, lineHeight:1, letterSpacing:-3, marginBottom:4 }}>{proximityAlert.distance}</div>
                <div style={{ fontSize:11, fontWeight:700, color:T.muted, letterSpacing:2, textTransform:"uppercase", marginBottom:16 }}>{tr("safecity.proximity.meters")}</div>
                {proximityAlert.camera.maxspeed && (
                  <div style={{ display:"inline-flex", alignItems:"center", gap:12, background:T.redBg, border:`1px solid ${T.redBdr}`, borderRadius:12, padding:"10px 20px", marginBottom:14 }}>
                    <div style={{ fontSize:40, fontWeight:800, color:T.red, lineHeight:1, letterSpacing:-1 }}>{proximityAlert.camera.maxspeed}</div>
                    <div style={{ textAlign:"left" }}>
                      <div style={{ fontSize:10, fontWeight:700, color:T.red, letterSpacing:1.5 }}>{tr("safecity.proximity.kmh")}</div>
                      <div style={{ fontSize:10, color:T.muted, marginTop:2 }}>{tr("safecity.proximity.limit")}</div>
                    </div>
                  </div>
                )}
                <div style={{ fontSize:12, color:T.muted }}>{tr("safecity.proximity.slowDown")}</div>
              </div>
            </div>
          )}

          {/* ── Speed indicator ── */}
          {trackingActive && (
            <div style={{ position:"absolute", bottom:80, right:16, zIndex:600, background:T.glass, backdropFilter:"blur(20px)", border:`2px solid ${getSpeedColor(currentSpeed)}`, borderRadius:16, padding:"10px 16px", minWidth:84, textAlign:"center", boxShadow:`0 4px 20px rgba(0,0,0,0.2), 0 0 0 1px ${T.glassBorder}`, transition:"border-color 0.3s" }}>
              <div style={{ fontSize:38, fontWeight:800, lineHeight:1, color:getSpeedColor(currentSpeed), letterSpacing:-1, transition:"color 0.3s" }}>{currentSpeed !== null ? currentSpeed : "--"}</div>
              <div style={{ fontSize:10, fontWeight:700, color:T.muted, letterSpacing:1, textTransform:"uppercase", marginTop:3 }}>{tr("safecity.speed.unit")}</div>
            </div>
          )}

          {/* ── Desktop Sidebar ── */}
          {!isMobile && (
            <div style={{ position:"absolute", top:16, left:16, zIndex:500, background:T.glass, backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)", border:`1px solid ${T.border}`, borderRadius:16, padding:"18px 20px", maxWidth:290, boxShadow:`0 8px 32px rgba(0,0,0,0.2), 0 0 0 1px ${T.glassBorder}` }}>
              <div style={{ position:"absolute", top:0, left:0, right:0, height:1, background:`linear-gradient(90deg,transparent,${isDark?"rgba(120,140,255,0.4)":"rgba(124,58,237,0.15)"},transparent)`, borderRadius:"16px 16px 0 0" }} />
              <div style={{ fontSize:15, fontWeight:700, color:T.text, marginBottom:5, display:"flex", alignItems:"center", gap:8 }}>
                <img src={isDark?"/icons/safecity1.png":"/icons/safecity.png"} style={{ width:24, height:24, objectFit:"contain", verticalAlign:"middle" }} />
                {tr("safecity.sidebar.title")}
              </div>
              <div style={{ fontSize:12, color:T.muted, lineHeight:1.6, marginBottom:10 }}>{tr("safecity.sidebar.desc")}</div>

              <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:10 }}>
                {[["#FF4444", tr("safecity.sidebar.legendCameras")], [T.orange, tr("safecity.sidebar.legendReported")], ["#3B82F6", tr("safecity.sidebar.legendYou")]].map(([color, label]) => (
                  <div key={label} style={{ display:"flex", alignItems:"center", gap:5 }}>
                    <div style={{ width:8, height:8, borderRadius:"50%", background:color, boxShadow:`0 0 4px ${color}88` }} />
                    <span style={{ fontSize:11, color:T.muted }}>{label}</span>
                  </div>
                ))}
              </div>

              <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:14 }}>
                <span style={{ position:"relative", display:"inline-flex", alignItems:"center", justifyContent:"center", width:8, height:8 }}>
                  <span style={{ position:"absolute", width:8, height:8, borderRadius:"50%", background:T.red, opacity:0.3, animation:"ping 1.8s ease-in-out infinite" }} />
                  <span style={{ width:5, height:5, borderRadius:"50%", background:T.red, display:"inline-block" }} />
                </span>
                <span style={{ fontSize:11, color:T.muted, fontWeight:500 }}>{loading ? tr("safecity.sidebar.loadingText") : tr("safecity.sidebar.locationsCount",{count:cameraCount})}</span>
              </div>

              <div style={{ borderTop:`1px solid ${T.border}`, paddingTop:12, marginBottom:12 }}>
                <div style={{ fontSize:10, fontWeight:700, color:T.muted, letterSpacing:1, textTransform:"uppercase", marginBottom:8 }}>{tr("safecity.sidebar.warningLabel")}</div>

                <button
                  onClick={trackingActive ? stopTracking : ()=>{ startTracking(); setGpsHint(true); setTimeout(()=>setGpsHint(false),5000); }}
                  style={{ width:"100%", padding:"9px 12px", borderRadius:10, cursor:"pointer", fontFamily:"inherit", fontSize:13, fontWeight:700, textAlign:"left", display:"flex", alignItems:"center", justifyContent:"space-between", background:trackingActive?T.greenBg:T.surface2, border:`1px solid ${trackingActive?T.greenBdr:T.border}`, color:trackingActive?T.green:T.textMid, transition:"all 0.15s", marginBottom:6 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width:16, height:16, flexShrink:0 }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                    </svg>
                    <span>{trackingActive ? tr("safecity.sidebar.gpsOn") : tr("safecity.sidebar.gpsOff")}</span>
                  </div>
                  <div style={{ width:36, height:20, borderRadius:10, background:trackingActive?T.green:isDark?"rgba(60,70,140,0.4)":T.border, position:"relative", transition:"background 0.2s", flexShrink:0 }}>
                    <div style={{ position:"absolute", top:2, left:trackingActive?18:2, width:14, height:14, borderRadius:"50%", background:"#fff", transition:"left 0.2s", boxShadow:"0 1px 3px rgba(0,0,0,0.4)" }} />
                  </div>
                </button>

                {!trackingActive && !gpsHint && (
                  <div style={{ background:T.orangeBg, border:`1px solid ${T.orangeBdr}`, borderRadius:8, padding:"8px 10px", marginBottom:6 }}>
                    <div style={{ fontSize:11, fontWeight:600, color:T.orange }}>{tr("safecity.sidebar.gpsHint")}</div>
                  </div>
                )}
                {gpsHint && (
                  <div style={{ background:T.greenBg, border:`1px solid ${T.greenBdr}`, borderRadius:8, padding:"8px 10px", marginBottom:6, animation:"fadeUp 0.2s ease" }}>
                    <div style={{ fontSize:11, fontWeight:600, color:T.green, display:"flex", alignItems:"center", gap:6 }}>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width:14, height:14, flexShrink:0 }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
                      </svg>
                      {tr("safecity.sidebar.soundHint",{dist:WARN_DISTANCE})}
                    </div>
                  </div>
                )}

                <button onClick={()=>{ initAudio(); setSoundEnabled(s=>!s); }} style={{ width:"100%", padding:"7px 12px", borderRadius:10, cursor:"pointer", fontFamily:"inherit", fontSize:12, fontWeight:600, textAlign:"left", display:"flex", alignItems:"center", justifyContent:"space-between", background:T.surface2, border:`1px solid ${T.border}`, color:T.textMid, transition:"all 0.15s" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                    {soundEnabled ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width:16, height:16, flexShrink:0 }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width:16, height:16, flexShrink:0 }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75 19.5 12m0 0 2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6 4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
                      </svg>
                    )}
                    <span>{tr("safecity.sidebar.soundLabel")}</span>
                  </div>
                  <div style={{ width:36, height:20, borderRadius:10, background:soundEnabled?T.orange:isDark?"rgba(60,70,140,0.4)":T.border, position:"relative", transition:"background 0.2s", flexShrink:0 }}>
                    <div style={{ position:"absolute", top:2, left:soundEnabled?18:2, width:14, height:14, borderRadius:"50%", background:"#fff", transition:"left 0.2s", boxShadow:"0 1px 3px rgba(0,0,0,0.4)" }} />
                  </div>
                </button>

                {trackingError && (
                  <div style={{ marginTop:6, fontSize:11, color:T.red, lineHeight:1.5, background:T.redBg, border:`1px solid ${T.redBdr}`, borderRadius:7, padding:"6px 10px" }}>⚠ {trackingError}</div>
                )}
              </div>

              <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" style={{ display:"inline-flex", alignItems:"center", gap:5, fontSize:11, fontWeight:600, color:T.muted, background:T.surface2, border:`1px solid ${T.border}`, borderRadius:6, padding:"4px 9px", textDecoration:"none" }}>{tr("safecity.sidebar.osmLink")}</a>
            </div>
          )}

          {/* ── Mobile Top Controls ── */}
          {isMobile && (
            <div style={{ position:"absolute", top:12, left:"50%", transform:"translateX(-50%)", zIndex:500, display:"flex", gap:8 }}>
              <button onClick={handleGpsToggle} style={{ height:40, padding:"0 14px", borderRadius:20, background:trackingActive?T.greenBg:T.glass, backdropFilter:"blur(16px)", border:`2px solid ${trackingActive?T.greenBdr:T.border}`, color:trackingActive?T.green:T.textMid, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit", boxShadow:"0 2px 16px rgba(0,0,0,0.2)", display:"flex", alignItems:"center", gap:5, whiteSpace:"nowrap" }}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width:16, height:16, flexShrink:0 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                </svg>
                {trackingActive ? tr("safecity.mobileControls.gpsOn") : tr("safecity.mobileControls.gpsOff")}
              </button>
              <button onClick={()=>{ initAudio(); setSoundEnabled(s=>!s); }} style={{ height:40, width:44, borderRadius:20, background:T.glass, backdropFilter:"blur(16px)", border:`1px solid ${T.border}`, cursor:"pointer", fontFamily:"inherit", boxShadow:"0 2px 16px rgba(0,0,0,0.2)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                {soundEnabled ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke={T.textMid} style={{ width:16, height:16, flexShrink:0 }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke={T.textMid} style={{ width:16, height:16, flexShrink:0 }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75 19.5 12m0 0 2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6 4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
                  </svg>
                )}
              </button>
              <button onClick={toggleReportMode} style={{ height:40, padding:"0 14px", borderRadius:20, background:reportMode?T.orange:T.glass, backdropFilter:"blur(16px)", border:`1px solid ${reportMode?T.orange:T.border}`, color:reportMode?"#fff":T.muted, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit", boxShadow:"0 2px 16px rgba(0,0,0,0.2)" }}>
                {reportMode ? tr("safecity.mobileControls.cancel") : tr("safecity.mobileControls.report")}
              </button>
            </div>
          )}

          {isMobile && !trackingActive && !gpsHint && !reportMode && (
            <div style={{ position:"absolute", top:62, left:"50%", transform:"translateX(-50%)", zIndex:500, background:T.glass, backdropFilter:"blur(16px)", border:`1px solid ${T.orangeBdr}`, borderRadius:10, padding:"8px 14px", fontSize:11, color:T.orange, fontWeight:600, whiteSpace:"nowrap", boxShadow:"0 2px 16px rgba(0,0,0,0.2)" }}>
              {tr("safecity.mobileControls.hint")}
            </div>
          )}
          {isMobile && gpsHint && (
            <div style={{ position:"absolute", top:62, left:"50%", transform:"translateX(-50%)", zIndex:500, background:T.glass, backdropFilter:"blur(16px)", border:`1px solid ${T.greenBdr}`, borderRadius:10, padding:"9px 16px", fontSize:12, fontWeight:600, color:T.green, whiteSpace:"nowrap", animation:"fadeDown 0.2s ease", boxShadow:"0 4px 20px rgba(0,0,0,0.2)" }}>
              {tr("safecity.mobileControls.soundHint",{dist:WARN_DISTANCE})}
            </div>
          )}
          {isMobile && trackingError && (
            <div style={{ position:"absolute", top:gpsHint?100:62, left:"50%", transform:"translateX(-50%)", zIndex:500, background:T.redBg, border:`1px solid ${T.redBdr}`, borderRadius:10, padding:"8px 14px", fontSize:11, color:T.red, fontWeight:600, whiteSpace:"nowrap" }}>
              ⚠ {trackingError}
            </div>
          )}

          {reportMode && (
            <div style={{ position:"absolute", top:isMobile?62:16, left:"50%", transform:"translateX(-50%)", zIndex:600, background:T.orange, borderRadius:12, padding:"10px 20px", boxShadow:`0 4px 20px ${T.orangeBdr}`, animation:"fadeDown 0.2s ease", whiteSpace:"nowrap" }}>
              <div style={{ fontSize:13, fontWeight:700, color:"#fff", textAlign:"center" }}>{tr("safecity.reportMode.instruction")}</div>
            </div>
          )}
          {reportSent && (
            <div style={{ position:"absolute", top:isMobile?62:16, left:"50%", transform:"translateX(-50%)", zIndex:600, background:T.green, borderRadius:12, padding:"10px 20px", boxShadow:`0 4px 20px ${T.greenBdr}`, animation:"fadeDown 0.2s ease", whiteSpace:"nowrap" }}>
              <div style={{ fontSize:13, fontWeight:700, color:"#000" }}>{tr("safecity.reportMode.successMsg")}</div>
            </div>
          )}

          {/* ── Report Form ── */}
          {reportPin && !reportSent && (
            <div style={{ position:"absolute", bottom:0, left:0, right:0, zIndex:500, background:T.glass, backdropFilter:"blur(24px)", WebkitBackdropFilter:"blur(24px)", borderRadius:isMobile?"20px 20px 0 0":18, padding:isMobile?"20px 16px 36px":"20px 22px", boxShadow:`0 -4px 40px rgba(0,0,0,0.2), 0 0 0 1px ${T.border}`, animation:isMobile?"slideUp 0.25s ease":"fadeUp 0.2s ease" }}>
              <div style={{ position:"absolute", top:0, left:0, right:0, height:1, background:`linear-gradient(90deg,transparent,${isDark?"rgba(120,140,255,0.4)":"rgba(124,58,237,0.15)"},transparent)` }} />
              {isMobile && <div style={{ width:36, height:4, background:T.border, borderRadius:2, margin:"0 auto 14px" }} />}
              <div style={{ fontSize:16, fontWeight:800, color:T.text, marginBottom:4 }}>{tr("safecity.reportMode.formTitle")}</div>
              <div style={{ fontSize:12, color:T.muted, marginBottom:16 }}>{tr("safecity.reportMode.locationLabel")} {reportPin.lat.toFixed(5)}, {reportPin.lng.toFixed(5)}</div>
              <div style={{ marginBottom:12 }}>
                <div style={{ fontSize:10, fontWeight:700, color:T.muted, letterSpacing:1, textTransform:"uppercase", marginBottom:5 }}>{tr("safecity.reportMode.speedLabel")}</div>
                <div style={{ display:"flex", gap:8 }}>
                  {["40","50","60","80"].map(s => (
                    <button key={s} onClick={()=>setReportForm(f=>({...f,maxspeed:s}))} style={{ flex:1, padding:"8px", borderRadius:8, cursor:"pointer", fontSize:13, fontWeight:700, border:`1.5px solid ${reportForm.maxspeed===s?T.orange:T.border}`, background:reportForm.maxspeed===s?T.orangeBg:T.surface2, color:reportForm.maxspeed===s?T.orange:T.muted, transition:"all 0.12s", fontFamily:"inherit" }}>{s}</button>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom:16 }}>
                <div style={{ fontSize:10, fontWeight:700, color:T.muted, letterSpacing:1, textTransform:"uppercase", marginBottom:5 }}>{tr("safecity.reportMode.descLabel")}</div>
                <input type="text" placeholder={tr("safecity.reportMode.descPlaceholder")} value={reportForm.description} onChange={e=>setReportForm(f=>({...f,description:e.target.value}))} style={inp} />
              </div>
              <div style={{ display:"flex", gap:8 }}>
                <button onClick={()=>{ setReportPin(null); if(reportMarkerRef.current){reportMarkerRef.current.remove();reportMarkerRef.current=null;} }} style={{ flex:1, padding:"10px", borderRadius:9, border:`1px solid ${T.border}`, background:T.surface2, color:T.textMid, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>{tr("safecity.reportMode.cancel")}</button>
                <button onClick={submitReport} disabled={reportLoading} style={{ flex:2, padding:"10px", borderRadius:9, border:"none", background:`linear-gradient(135deg,${T.orange},#C2410C)`, color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer", opacity:reportLoading?0.7:1, fontFamily:"inherit", boxShadow:`0 0 20px ${T.orangeBdr}` }}>{reportLoading ? tr("safecity.reportMode.submitting") : tr("safecity.reportMode.submit")}</button>
              </div>
            </div>
          )}

          {/* ── Camera Popup ── */}
          {selectedCamera && !reportPin && (
            <div style={{ position:"absolute", bottom:isMobile?0:24, left:isMobile?0:"50%", right:isMobile?0:"auto", transform:isMobile?"none":"translateX(-50%)", zIndex:500, background:T.glass, backdropFilter:"blur(24px)", WebkitBackdropFilter:"blur(24px)", borderRadius:isMobile?"20px 20px 0 0":18, padding:isMobile?"16px 16px 36px":"20px 22px", boxShadow:`0 -4px 40px rgba(0,0,0,0.2), 0 0 0 1px ${T.border}`, animation:isMobile?"slideUp 0.25s ease":"fadeUp 0.2s ease", minWidth:isMobile?"auto":300, maxWidth:isMobile?"100%":420 }}>
              <div style={{ position:"absolute", top:0, left:0, right:0, height:1, background:`linear-gradient(90deg,transparent,${isDark?"rgba(120,140,255,0.4)":"rgba(124,58,237,0.15)"},transparent)` }} />
              {isMobile && <div style={{ width:36, height:4, background:T.border, borderRadius:2, margin:"0 auto 14px" }} />}
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
                <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                  <div style={{ width:50, height:50, borderRadius:"50%", background:selectedCamera.reported?T.orange:"#DC2626", overflow:"hidden", flexShrink:0, boxShadow:`0 0 0 3px ${selectedCamera.reported?T.orangeBdr:T.redBdr}` }}>
                    <img src="/icons/safecity1.png" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                  </div>
                  <div>
                    <div style={{ fontSize:15, fontWeight:800, color:T.text }}>{tr("safecity.cameraPopup.title")}</div>
                    <div style={{ fontSize:11, color:T.muted, marginTop:2 }}>{selectedCamera.reported ? tr("safecity.cameraPopup.reported") : tr("safecity.cameraPopup.official")}</div>
                  </div>
                </div>
                <button onClick={()=>setSelectedCamera(null)} style={{ background:T.surface2, border:`1px solid ${T.border}`, borderRadius:6, color:T.muted, fontSize:14, cursor:"pointer", padding:"3px 8px", lineHeight:1, transition:"all 0.15s" }}>×</button>
              </div>
              {selectedCamera.maxspeed ? (
                <div style={{ background:T.redBg, border:`1px solid ${T.redBdr}`, borderRadius:12, padding:"14px 16px", marginBottom:14, display:"flex", alignItems:"center", gap:16 }}>
                  <div style={{ fontSize:48, fontWeight:800, color:T.red, lineHeight:1, letterSpacing:-2 }}>{selectedCamera.maxspeed}</div>
                  <div>
                    <div style={{ fontSize:12, fontWeight:700, color:T.red, letterSpacing:1 }}>{tr("safecity.cameraPopup.kmh")}</div>
                    <div style={{ fontSize:12, color:T.muted, marginTop:2 }}>{tr("safecity.cameraPopup.maxSpeed")}</div>
                  </div>
                </div>
              ) : (
                <div style={{ background:T.redBg, border:`1px solid ${T.redBdr}`, borderRadius:12, padding:"11px 14px", marginBottom:14 }}>
                  <div style={{ fontSize:12, fontWeight:600, color:T.red }}>{tr("safecity.cameraPopup.warning")}</div>
                </div>
              )}
              <a href={`https://www.google.com/maps/dir/?api=1&destination=${selectedCamera.lat},${selectedCamera.lng}`} target="_blank" rel="noopener noreferrer" style={{ display:"block", textAlign:"center", background:`linear-gradient(135deg,${T.violet},#4C1D95)`, borderRadius:11, padding:"12px", color:"#fff", fontSize:13, fontWeight:700, textDecoration:"none", boxShadow:`0 0 20px ${T.violetGlow}` }}>{tr("safecity.cameraPopup.googleMaps")}</a>
            </div>
          )}
        </div>
      </div>
    </>
  );
}