"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Head from "next/head";
import { useLanguage, LanguageSwitcher } from "../translations";

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
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(vol, startTime + 0.01);
        gain.gain.linearRampToValueAtTime(0, startTime + duration);
        osc.start(startTime);
        osc.stop(startTime + duration + 0.05);
      };
      const t = audioCtx.currentTime;
      beep(1046, t, 0.15);
      beep(880, t + 0.2, 0.2);
      beep(1046, t + 0.45, 0.15);
    } catch (e) { console.warn("beep failed:", e); }
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
  return L.divIcon({ html, className: "", iconSize: hasHeading ? [36, 36] : [16, 16], iconAnchor: hasHeading ? [18, 18] : [8, 8] });
}

export default function SafeCityPage() {
  const { lang, setLang, tr } = useLanguage();

  const mapRef = useRef(null), leafletRef = useRef(null), clusterGroupRef = useRef(null), reportMarkerRef = useRef(null);
  const audioCtxRef = useRef(null), warnedCamerasRef = useRef({}), watchIdRef = useRef(null);
  const camerasRef = useRef([]), soundEnabledRef = useRef(true), lastSpeedRef = useRef(null);
  const lastHeadingRef = useRef(null);
  const wakeLockRef = useRef(null);

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

  const isMobile = useIsMobile();

  useEffect(() => { setMounted(true); }, []);
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
        closestDist = dist;
        closest = { ...cam, _idx: idx };
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
    } else {
      setProximityAlert(null);
    }
  }, []);

  const requestWakeLock = useCallback(async () => {
    if ("wakeLock" in navigator) {
      try {
        wakeLockRef.current = await navigator.wakeLock.request("screen");
        wakeLockRef.current.addEventListener("release", () => { wakeLockRef.current = null; });
      } catch (e) { console.warn("Wake lock failed:", e); }
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
    setTrackingError(null); setTrackingActive(true);
    requestWakeLock();
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
          if (!L._userMarker) { L._userMarker = L.marker([latitude, longitude], { icon, zIndexOffset: 1000 }).addTo(map); }
          else { L._userMarker.setLatLng([latitude, longitude]); L._userMarker.setIcon(icon); }
          map.flyTo([latitude, longitude], 17, { animate: true, duration: 0.8 });
        }
        checkProximity(latitude, longitude, heading !== null && heading !== undefined ? heading : lastHeadingRef.current);
      },
      (err) => {
        if (err.code === 1) setTrackingError(tr("safecity.errors.permissionDenied"));
        else if (err.code === 2) setTrackingError(tr("safecity.errors.unavailable"));
        else if (err.code === 3) setTrackingError(tr("safecity.errors.timeout"));
        setTrackingActive(false); setCurrentSpeed(null);
        releaseWakeLock();
      },
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
    );
  }, [initAudio, checkProximity, requestWakeLock, releaseWakeLock, tr]);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) { navigator.geolocation.clearWatch(watchIdRef.current); watchIdRef.current = null; }
    if (leafletRef.current?._userMarker) { leafletRef.current._userMarker.remove(); leafletRef.current._userMarker = null; }
    setTrackingActive(false); setProximityAlert(null); setCurrentSpeed(null); lastSpeedRef.current = null; lastHeadingRef.current = null;
    releaseWakeLock();
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
        const map = L.map(mapRef.current, { center: [41.9981, 21.4254], zoom: 13, zoomControl: false, attributionControl: false });
        L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", { subdomains: "abcd", maxZoom: 19 }).addTo(map);
        L.control.zoom({ position: "bottomright" }).addTo(map);
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
      maxClusterRadius: 48, showCoverageOnHover: false, zoomToBoundsOnClick: true, spiderfyOnMaxZoom: true,
      iconCreateFunction: (cluster) => {
        const count = cluster.getChildCount();
        return L.divIcon({ html: `<div style="width:38px;height:38px;border-radius:50%;background:radial-gradient(circle,#FF4444,#CC0000);border:3px solid rgba(255,255,255,0.9);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;color:#fff;box-shadow:0 0 0 4px rgba(255,60,60,0.25),0 4px 14px rgba(255,0,0,0.4);font-family:'DM Sans',sans-serif;">${count}</div>`, className: "", iconSize: [38, 38], iconAnchor: [19, 19] });
      },
    });
    cameras.forEach(cam => {
      const icon = L.divIcon({ html: `<div style="width:36px;height:36px;border-radius:50%;background:radial-gradient(circle,#FF4444,#CC0000);border:3px solid rgba(255,255,255,0.9);display:flex;align-items:center;justify-content:center;font-size:15px;box-shadow:0 0 0 4px rgba(255,60,60,0.25),0 4px 14px rgba(255,0,0,0.4);">📷</div>`, className: "", iconSize: [36, 36], iconAnchor: [18, 18] });
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
      const icon = L.divIcon({ html: `<div style="width:32px;height:32px;border-radius:50%;background:radial-gradient(circle,#F97316,#EA580C);border:3px solid rgba(255,255,255,0.9);display:flex;align-items:center;justify-content:center;font-size:13px;box-shadow:0 0 0 3px rgba(249,115,22,0.3),0 4px 12px rgba(249,115,22,0.5);">📷</div>`, className: "", iconSize: [32, 32], iconAnchor: [16, 16] });
      L.marker([cam.lat, cam.lng], { icon }).addTo(map).on("click", () => setSelectedCamera({ ...cam, reported: true }));
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
      const icon = L.divIcon({ html: `<div style="width:36px;height:36px;border-radius:50%;background:#F97316;border:3px solid white;display:flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 4px 16px rgba(249,115,22,0.6);animation:bounce 0.4s ease;">📍</div>`, className: "", iconSize: [36, 36], iconAnchor: [18, 36] });
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
      const res = await fetch("/api/report-camera", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lat: reportPin.lat, lng: reportPin.lng, ...reportForm }) });
      const data = await res.json();
      if (data.success) { setReportSent(true); setReportedCameras(prev => [...prev, data.camera]); setCameraCount(prev => prev + 1); if (reportMarkerRef.current) { reportMarkerRef.current.remove(); reportMarkerRef.current = null; } setReportPin(null); setReportMode(false); }
    } catch (e) {}
    setReportLoading(false);
  };

  const getSpeedColor = (spd) => { if (spd === null) return "#9A9590"; if (spd <= 50) return "#16A34A"; if (spd <= 80) return "#D97706"; return "#DC2626"; };

  const handleGpsToggle = () => {
    initAudio();
    if (!trackingActive) { startTracking(); setGpsHint(true); setTimeout(() => setGpsHint(false), 5000); }
    else { stopTracking(); setGpsHint(false); }
  };

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
  <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Safe City Камери — МакЦени",
    "description": "Предупредување за Safe City камери за брзина во Македонија во реално време",
    "url": "https://makceni.mk/safecity",
    "applicationCategory": "NavigationApplication",
    "operatingSystem": "Web"
  })}} />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
  <style>{`
          *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
          body{background:#F4F1EB;color:#1a1a2e;font-family:'DM Sans',sans-serif;-webkit-font-smoothing:antialiased;overflow:hidden;}
          .leaflet-control-attribution{display:none!important;}
          .leaflet-control-zoom a{background:#fff!important;color:#333!important;border-color:#ddd!important;box-shadow:0 2px 8px rgba(0,0,0,0.15)!important;font-weight:700!important;}
          .leaflet-container{background:#F4F1EB!important;}
          .marker-cluster{background:transparent!important;border:none!important;}
          .marker-cluster div{background:transparent!important;}
          @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
          @keyframes fadeDown{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
          @keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
          @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.35}}
          @keyframes bounce{0%{transform:translateY(-12px)}60%{transform:translateY(3px)}100%{transform:translateY(0)}}
          @keyframes alertPulse{0%{box-shadow:0 0 0 0 rgba(220,38,38,0.5)}60%{box-shadow:0 0 0 14px rgba(220,38,38,0)}100%{box-shadow:0 0 0 0 rgba(220,38,38,0)}}
          @keyframes popIn{0%{opacity:0;transform:translate(-50%,-50%) scale(0.88)}70%{transform:translate(-50%,-50%) scale(1.02)}100%{opacity:1;transform:translate(-50%,-50%) scale(1)}}
        `}</style>
      </Head>

      <div style={{ width: "100vw", height: "100vh", display: "flex", flexDirection: "column" }} onClick={initAudio}>

        <header style={{ height: isMobile ? 48 : 60, flexShrink: 0, zIndex: 1000, background: "#FFFFFF", borderBottom: "1px solid #E8E5DE", display: "flex", alignItems: "center", justifyContent: "space-between", padding: isMobile ? "0 14px" : "0 24px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 8 : 12 }}>
            <a href="/" style={{ fontWeight: 800, fontSize: isMobile ? 16 : 20, color: "#F97316", textDecoration: "none", letterSpacing: -0.5 }}>makceni.mk</a>
            <div style={{ width: 1, height: 16, background: "#E8E5DE" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#FF4444", animation: "pulse 2s infinite" }} />
              <span style={{ fontSize: isMobile ? 12 : 14, color: "#4A4640", fontWeight: 600 }}>{tr("safecity.headerTitle")}</span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: isMobile ? "4px 8px" : "5px 12px" }}>
              <span style={{ fontSize: isMobile ? 11 : 13, fontWeight: 700, color: "#DC2626" }}>
                {loading ? "..." : isMobile ? tr("safecity.camerasCountMobile", { count: cameraCount }) : tr("safecity.camerasCount", { count: cameraCount })}
              </span>
            </div>
            {!isMobile && (
              <>
                <button onClick={toggleReportMode} style={{ fontSize: 13, fontWeight: 700, color: reportMode ? "#fff" : "#F97316", background: reportMode ? "#F97316" : "#FFF7ED", border: `1px solid ${reportMode ? "#F97316" : "#FED7AA"}`, borderRadius: 8, padding: "6px 14px", cursor: "pointer", transition: "all 0.15s", fontFamily: "inherit" }}>
                  {reportMode ? tr("safecity.cancelBtn") : tr("safecity.reportBtn")}
                </button>
                <a href="/mapa" style={{ fontSize: 13, fontWeight: 600, color: "#92400E", background: "#FEF3C7", border: "1px solid #FDE68A", borderRadius: 8, padding: "6px 14px", textDecoration: "none" }}>{tr("safecity.gasStationsBtn")}</a>
              </>
            )}
            <LanguageSwitcher lang={lang} setLang={setLang} />
            <a href="/" style={{ fontSize: isMobile ? 11 : 13, fontWeight: 500, color: "#9A9590", background: "#F5F4F1", border: "1px solid #E8E5DE", borderRadius: 8, padding: isMobile ? "4px 8px" : "6px 14px", textDecoration: "none" }}>←{!isMobile && ` ${tr("nav.back").replace("← ", "")}`}</a>
          </div>
        </header>

        <div style={{ flex: 1, position: "relative" }}>
          <div ref={mapRef} style={{ width: "100%", height: "100%" }} />

          {proximityAlert && (
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", zIndex: 700, background: "#FFFFFF", border: "2px solid #DC2626", borderRadius: 18, overflow: "hidden", width: "min(320px,88vw)", animation: "alertPulse 1.2s ease-out infinite,popIn 0.3s cubic-bezier(0.34,1.56,0.64,1) forwards" }}>
              <div style={{ background: "#DC2626", padding: "11px 16px", display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 18 }}>⚠️</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: "#fff", flex: 1 }}>{tr("safecity.proximity.title")}</span>
                <button onClick={() => setProximityAlert(null)} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", borderRadius: 6, padding: "2px 8px", cursor: "pointer", fontSize: 14, fontWeight: 700, fontFamily: "inherit" }}>{tr("safecity.proximity.close")}</button>
              </div>
              <div style={{ padding: "20px", textAlign: "center" }}>
                <div style={{ fontSize: 72, fontWeight: 800, color: "#DC2626", lineHeight: 1, letterSpacing: -3, marginBottom: 4 }}>{proximityAlert.distance}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#9A9590", letterSpacing: 2, textTransform: "uppercase", marginBottom: 16 }}>{tr("safecity.proximity.meters")}</div>
                {proximityAlert.camera.maxspeed && (
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 12, background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 12, padding: "10px 20px", marginBottom: 14 }}>
                    <div style={{ fontSize: 40, fontWeight: 800, color: "#DC2626", lineHeight: 1, letterSpacing: -1 }}>{proximityAlert.camera.maxspeed}</div>
                    <div style={{ textAlign: "left" }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#DC2626", letterSpacing: 1.5 }}>{tr("safecity.proximity.kmh")}</div>
                      <div style={{ fontSize: 10, color: "#9A9590", marginTop: 2 }}>{tr("safecity.proximity.limit")}</div>
                    </div>
                  </div>
                )}
                <div style={{ fontSize: 12, color: "#9A9590" }}>{tr("safecity.proximity.slowDown")}</div>
              </div>
            </div>
          )}

          {trackingActive && (
            <div style={{ position: "absolute", bottom: 80, right: 16, zIndex: 600, background: "#FFFFFF", border: `2px solid ${getSpeedColor(currentSpeed)}`, borderRadius: 16, padding: "10px 16px", minWidth: 84, textAlign: "center", boxShadow: "0 4px 20px rgba(0,0,0,0.12)", transition: "border-color 0.3s" }}>
              <div style={{ fontSize: 38, fontWeight: 800, lineHeight: 1, color: getSpeedColor(currentSpeed), letterSpacing: -1, transition: "color 0.3s" }}>{currentSpeed !== null ? currentSpeed : "--"}</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#9A9590", letterSpacing: 1, textTransform: "uppercase", marginTop: 3 }}>{tr("safecity.speed.unit")}</div>
            </div>
          )}

          {/* DESKTOP SIDEBAR */}
          {!isMobile && (
            <div style={{ position: "absolute", top: 16, left: 16, zIndex: 500, background: "rgba(255,255,255,0.97)", backdropFilter: "blur(12px)", border: "1px solid #E8E5DE", borderRadius: 14, padding: "16px 18px", maxWidth: 280, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#1A1814", marginBottom: 5 }}>{tr("safecity.sidebar.title")}</div>
              <div style={{ fontSize: 12, color: "#9A9590", lineHeight: 1.6, marginBottom: 10 }}>{tr("safecity.sidebar.desc")}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                {[["#FF4444", tr("safecity.sidebar.legendCameras")], ["#F97316", tr("safecity.sidebar.legendReported")], ["#3B82F6", tr("safecity.sidebar.legendYou")]].map(([color, label]) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />
                    <span style={{ fontSize: 11, color: "#9A9590" }}>{label}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 14 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#FF4444", animation: "pulse 2s infinite" }} />
                <span style={{ fontSize: 11, color: "#9A9590", fontWeight: 500 }}>{loading ? tr("safecity.sidebar.loadingText") : tr("safecity.sidebar.locationsCount", { count: cameraCount })}</span>
              </div>
              <div style={{ borderTop: "1px solid #E8E5DE", paddingTop: 12, marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#9A9590", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 8 }}>{tr("safecity.sidebar.warningLabel")}</div>
                <button
                  onClick={trackingActive ? stopTracking : () => { startTracking(); setGpsHint(true); setTimeout(() => setGpsHint(false), 5000); }}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: 9, cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 700, textAlign: "left", display: "flex", alignItems: "center", justifyContent: "space-between", background: trackingActive ? "#F0FDF4" : "#F5F4F1", border: `1px solid ${trackingActive ? "#86EFAC" : "#E8E5DE"}`, color: trackingActive ? "#15803D" : "#4A4640", transition: "all 0.15s", marginBottom: 6 }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <span style={{ fontSize: 14 }}>📍</span>
                    <span>{trackingActive ? tr("safecity.sidebar.gpsOn") : tr("safecity.sidebar.gpsOff")}</span>
                  </div>
                  <div style={{ width: 36, height: 20, borderRadius: 10, background: trackingActive ? "#22C55E" : "#D1D5DB", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
                    <div style={{ position: "absolute", top: 2, left: trackingActive ? 18 : 2, width: 14, height: 14, borderRadius: "50%", background: "#fff", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
                  </div>
                </button>

                {!trackingActive && !gpsHint && (
                  <div style={{ background: "#FFF7ED", border: "1px solid #FED7AA", borderRadius: 8, padding: "8px 10px", marginBottom: 6 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "#92400E" }}>{tr("safecity.sidebar.gpsHint")}</div>
                  </div>
                )}
                {gpsHint && (
                  <div style={{ background: "#F0FDF4", border: "1px solid #86EFAC", borderRadius: 8, padding: "8px 10px", marginBottom: 6, animation: "fadeUp 0.2s ease" }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "#15803D" }}>{tr("safecity.sidebar.soundHint", { dist: WARN_DISTANCE })}</div>
                  </div>
                )}

                <button onClick={() => { initAudio(); setSoundEnabled(s => !s); }} style={{ width: "100%", padding: "7px 12px", borderRadius: 9, cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 600, textAlign: "left", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#F5F4F1", border: "1px solid #E8E5DE", color: "#4A4640", transition: "all 0.15s" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <span style={{ fontSize: 13 }}>{soundEnabled ? "🔊" : "🔇"}</span>
                    <span style={{ color: "#9A9590" }}>{tr("safecity.sidebar.soundLabel")}</span>
                  </div>
                  <div style={{ width: 36, height: 20, borderRadius: 10, background: soundEnabled ? "#F97316" : "#D1D5DB", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
                    <div style={{ position: "absolute", top: 2, left: soundEnabled ? 18 : 2, width: 14, height: 14, borderRadius: "50%", background: "#fff", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
                  </div>
                </button>
                {trackingError && <div style={{ marginTop: 6, fontSize: 11, color: "#DC2626", lineHeight: 1.5 }}>⚠ {trackingError}</div>}
              </div>
              <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, color: "#9A9590", background: "#F5F4F1", border: "1px solid #E8E5DE", borderRadius: 6, padding: "4px 9px", textDecoration: "none" }}>{tr("safecity.sidebar.osmLink")}</a>
            </div>
          )}

          {/* MOBILE TOP CONTROLS */}
          {isMobile && (
            <div style={{ position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)", zIndex: 500, display: "flex", gap: 8 }}>
              <button onClick={handleGpsToggle} style={{ height: 40, padding: "0 14px", borderRadius: 20, background: trackingActive ? "#F0FDF4" : "#fff", border: `2px solid ${trackingActive ? "#86EFAC" : "#E8E5DE"}`, color: trackingActive ? "#15803D" : "#4A4640", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 2px 12px rgba(0,0,0,0.12)", display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap" }}>
                <span>📍</span>{trackingActive ? tr("safecity.mobileControls.gpsOn") : tr("safecity.mobileControls.gpsOff")}
              </button>
              <button onClick={() => { initAudio(); setSoundEnabled(s => !s); }} style={{ height: 40, width: 40, borderRadius: 20, background: "#fff", border: "1px solid #E8E5DE", fontSize: 16, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 2px 12px rgba(0,0,0,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {soundEnabled ? "🔊" : "🔇"}
              </button>
              <button onClick={toggleReportMode} style={{ height: 40, padding: "0 14px", borderRadius: 20, background: reportMode ? "#F97316" : "#fff", border: `1px solid ${reportMode ? "#F97316" : "#E8E5DE"}`, color: reportMode ? "#fff" : "#9A9590", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 2px 12px rgba(0,0,0,0.12)" }}>
                {reportMode ? tr("safecity.mobileControls.cancel") : tr("safecity.mobileControls.report")}
              </button>
            </div>
          )}

          {isMobile && !trackingActive && !gpsHint && !reportMode && (
            <div style={{ position: "absolute", top: 62, left: "50%", transform: "translateX(-50%)", zIndex: 500, background: "#fff", border: "1px solid #FED7AA", borderRadius: 10, padding: "8px 14px", fontSize: 11, color: "#92400E", fontWeight: 600, whiteSpace: "nowrap", boxShadow: "0 2px 10px rgba(0,0,0,0.08)" }}>
              {tr("safecity.mobileControls.hint")}
            </div>
          )}
          {isMobile && gpsHint && (
            <div style={{ position: "absolute", top: 62, left: "50%", transform: "translateX(-50%)", zIndex: 500, background: "#1C1917", borderRadius: 10, padding: "9px 16px", fontSize: 12, fontWeight: 600, color: "#fff", whiteSpace: "nowrap", animation: "fadeDown 0.2s ease", boxShadow: "0 4px 16px rgba(0,0,0,0.25)" }}>
              {tr("safecity.mobileControls.soundHint", { dist: WARN_DISTANCE })}
            </div>
          )}
          {isMobile && trackingError && (
            <div style={{ position: "absolute", top: gpsHint ? 100 : 62, left: "50%", transform: "translateX(-50%)", zIndex: 500, background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: "8px 14px", fontSize: 11, color: "#DC2626", fontWeight: 600, whiteSpace: "nowrap" }}>
              ⚠ {trackingError}
            </div>
          )}

          {reportMode && (
            <div style={{ position: "absolute", top: isMobile ? 62 : 16, left: "50%", transform: "translateX(-50%)", zIndex: 600, background: "#F97316", borderRadius: 12, padding: "10px 20px", boxShadow: "0 4px 20px rgba(249,115,22,0.4)", animation: "fadeDown 0.2s ease", whiteSpace: "nowrap" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", textAlign: "center" }}>{tr("safecity.reportMode.instruction")}</div>
            </div>
          )}
          {reportSent && (
            <div style={{ position: "absolute", top: isMobile ? 62 : 16, left: "50%", transform: "translateX(-50%)", zIndex: 600, background: "#16A34A", borderRadius: 12, padding: "10px 20px", boxShadow: "0 4px 20px rgba(22,163,74,0.4)", animation: "fadeDown 0.2s ease", whiteSpace: "nowrap" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{tr("safecity.reportMode.successMsg")}</div>
            </div>
          )}

          {reportPin && !reportSent && (
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 500, background: "#FFFFFF", borderRadius: isMobile ? "20px 20px 0 0" : 18, padding: isMobile ? "20px 16px 36px" : "20px 22px", boxShadow: "0 -4px 24px rgba(0,0,0,0.1)", animation: isMobile ? "slideUp 0.25s ease" : "fadeUp 0.2s ease" }}>
              {isMobile && <div style={{ width: 36, height: 4, background: "#E8E5DE", borderRadius: 2, margin: "0 auto 14px" }} />}
              <div style={{ fontSize: 16, fontWeight: 800, color: "#1A1814", marginBottom: 4 }}>{tr("safecity.reportMode.formTitle")}</div>
              <div style={{ fontSize: 12, color: "#9A9590", marginBottom: 16 }}>{tr("safecity.reportMode.locationLabel")} {reportPin.lat.toFixed(5)}, {reportPin.lng.toFixed(5)}</div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#9A9590", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 5 }}>{tr("safecity.reportMode.speedLabel")}</div>
                <div style={{ display: "flex", gap: 8 }}>
                  {["40", "50", "60", "80"].map(s => (
                    <button key={s} onClick={() => setReportForm(f => ({ ...f, maxspeed: s }))} style={{ flex: 1, padding: "8px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 700, border: `1.5px solid ${reportForm.maxspeed === s ? "#F97316" : "#E8E5DE"}`, background: reportForm.maxspeed === s ? "#FFF7ED" : "#F5F4F1", color: reportForm.maxspeed === s ? "#F97316" : "#9A9590", transition: "all 0.12s", fontFamily: "inherit" }}>{s}</button>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#9A9590", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 5 }}>{tr("safecity.reportMode.descLabel")}</div>
                <input type="text" placeholder={tr("safecity.reportMode.descPlaceholder")} value={reportForm.description} onChange={e => setReportForm(f => ({ ...f, description: e.target.value }))} style={{ width: "100%", padding: "9px 12px", borderRadius: 9, border: "1px solid #E8E5DE", background: "#F5F4F1", fontSize: 13, color: "#1A1814", outline: "none" }} />
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => { setReportPin(null); if (reportMarkerRef.current) { reportMarkerRef.current.remove(); reportMarkerRef.current = null; } }} style={{ flex: 1, padding: "10px", borderRadius: 9, border: "1px solid #E8E5DE", background: "#F5F4F1", color: "#9A9590", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>{tr("safecity.reportMode.cancel")}</button>
                <button onClick={submitReport} disabled={reportLoading} style={{ flex: 2, padding: "10px", borderRadius: 9, border: "none", background: "#F97316", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", opacity: reportLoading ? 0.7 : 1, fontFamily: "inherit" }}>{reportLoading ? tr("safecity.reportMode.submitting") : tr("safecity.reportMode.submit")}</button>
              </div>
            </div>
          )}

          {selectedCamera && !reportPin && (
            <div style={{ position: "absolute", bottom: isMobile ? 0 : 24, left: isMobile ? 0 : "50%", right: isMobile ? 0 : "auto", transform: isMobile ? "none" : "translateX(-50%)", zIndex: 500, background: "#FFFFFF", borderRadius: isMobile ? "20px 20px 0 0" : 18, padding: isMobile ? "16px 16px 36px" : "20px 22px", boxShadow: "0 -4px 24px rgba(0,0,0,0.1)", animation: isMobile ? "slideUp 0.25s ease" : "fadeUp 0.2s ease", minWidth: isMobile ? "auto" : 300, maxWidth: isMobile ? "100%" : 400 }}>
              {isMobile && <div style={{ width: 36, height: 4, background: "#E8E5DE", borderRadius: 2, margin: "0 auto 14px" }} />}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: selectedCamera.reported ? "#F97316" : "#DC2626", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>📷</div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: "#1A1814" }}>{tr("safecity.cameraPopup.title")}</div>
                    <div style={{ fontSize: 11, color: "#9A9590", marginTop: 2 }}>{selectedCamera.reported ? tr("safecity.cameraPopup.reported") : tr("safecity.cameraPopup.official")}</div>
                  </div>
                </div>
                <button onClick={() => setSelectedCamera(null)} style={{ background: "#F5F4F1", border: "1px solid #E8E5DE", borderRadius: 6, color: "#9A9590", fontSize: 14, cursor: "pointer", padding: "3px 8px", lineHeight: 1 }}>×</button>
              </div>
              {selectedCamera.maxspeed ? (
                <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 12, padding: "14px 16px", marginBottom: 14, display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ fontSize: 48, fontWeight: 800, color: "#DC2626", lineHeight: 1, letterSpacing: -2 }}>{selectedCamera.maxspeed}</div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#DC2626", letterSpacing: 1 }}>{tr("safecity.cameraPopup.kmh")}</div>
                    <div style={{ fontSize: 12, color: "#9A9590", marginTop: 2 }}>{tr("safecity.cameraPopup.maxSpeed")}</div>
                  </div>
                </div>
              ) : (
                <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 12, padding: "11px 14px", marginBottom: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#DC2626" }}>{tr("safecity.cameraPopup.warning")}</div>
                </div>
              )}
              <a href={`https://www.google.com/maps/dir/?api=1&destination=${selectedCamera.lat},${selectedCamera.lng}`} target="_blank" rel="noopener noreferrer" style={{ display: "block", textAlign: "center", background: "#F5F4F1", border: "1px solid #E8E5DE", borderRadius: 10, padding: "10px", color: "#4A4640", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>{tr("safecity.cameraPopup.googleMaps")}</a>
            </div>
          )}
        </div>
      </div>
    </>
  );
}