import { useState, useEffect, useRef } from "react";
import Head from "next/head";
import { useLanguage, LanguageSwitcher } from "../translations";

const FUEL_COLORS = {
  benzin95: { bg: "#1C1917", text: "#fff", accent: "#F87171", spark: "#F87171" },
  benzin98: { bg: "#1C1917", text: "#fff", accent: "#FCA5A5", spark: "#FCA5A5" },
  dizel:    { bg: "#15803D", text: "#fff", accent: "#86EFAC", spark: "#86EFAC" },
  lpg:      { bg: "#1D4ED8", text: "#fff", accent: "#93C5FD", spark: "#93C5FD" },
  cng:      { bg: "#0E7490", text: "#fff", accent: "#67E8F9", spark: "#67E8F9" },
  ekstra:   { bg: "#C2410C", text: "#fff", accent: "#FED7AA", spark: "#FED7AA" },
  mazut:    { bg: "#44403C", text: "#fff", accent: "#D6D3D1", spark: "#D6D3D1" },
};

const C = {
  bg: "#F8F7F4", surface: "#FFFFFF", surface2: "#F1F0ED",
  border: "#E4E1DA", borderMid: "#C9C6BE",
  text: "#1C1917", textMid: "#57534E", muted: "#A8A29E",
  orange: "#F97316", orangeBg: "#FFF7ED", orangeBdr: "#FED7AA",
  green: "#15803D", greenBg: "#F0FDF4", greenBdr: "#BBF7D0",
  red: "#DC2626", redBg: "#FEF2F2", redBdr: "#FECACA",
};

const FALLBACK = [
  { key: "benzin95", label: "Бензин 95",   unit: "ден/л",  price: 86.5, change: 7.0, history: [74,75,76,77,78,79,80,79,80,82,83,84,85,86,86.5] },
  { key: "benzin98", label: "Бензин 98+",  unit: "ден/л",  price: 88.5, change: 7.0, history: [76,77,78,79,80,81,82,81,82,84,85,86,87,88,88.5] },
  { key: "dizel",    label: "Дизел",        unit: "ден/л",  price: 92.0, change: 6.5, history: [78,79,80,81,82,83,84,83,84,86,87,88,90,91,92]   },
  { key: "lpg",      label: "Плин LPG",     unit: "ден/л",  price: 53.0, change: 0,   history: [50,51,51,52,52,53,53,53,53,53,53,53,53,53,53]   },
  { key: "cng",      label: "Метан CNG",    unit: "ден/кг", price: 60.0, change: 0,   history: [58,58,59,59,60,60,60,60,60,60,60,60,60,60,60]   },
  { key: "ekstra",   label: "Екстра Лесно", unit: "ден/л",  price: 89.5, change: 7.0, history: [75,76,77,78,79,80,81,80,81,83,84,85,87,88,89.5] },
  { key: "mazut",    label: "Мазут",        unit: "ден/л",  price: 47.5, change: 4.9, history: [38,39,40,40,41,42,42,43,43,44,45,45,46,47,47.5] },
];

const FALLBACK_HISTORY = {
  benzin95: { "7д": [84.5,85.0,85.0,86.0,86.0,86.5,86.5], "30д": [80,81,81,82,82,83,83,84,84,84,85,85,85,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86.5], "6м": [72,73,74,75,76,77,78,79,80,80,81,82,83,84,85,86,86,86.5,86.5,86.5,86.5,86.5,86.5,86.5] },
  benzin98: { "7д": [86.5,87.0,87.0,88.0,88.0,88.5,88.5], "30д": [82,83,83,84,84,85,85,86,86,86,87,87,87,88,88,88,88,88,88,88,88,88,88,88,88,88,88,88,88,88.5], "6м": [74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,88,88.5,88.5,88.5,88.5,88.5,88.5,88.5,88.5] },
  dizel:    { "7д": [90.0,90.5,91.0,91.0,91.5,92.0,92.0], "30д": [84,85,85,86,86,87,87,88,88,89,89,90,90,90,91,91,91,91,91,91,91,91,91,91,91,91,92,92,92,92],   "6м": [76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,92,92,92,92,92,92,92] },
  lpg:      { "7д": [53,53,53,53,53,53,53], "30д": [52,52,52,52,52,52,52,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53], "6м": [50,50,51,51,51,52,52,52,52,52,53,53,53,53,53,53,53,53,53,53,53,53,53,53] },
  cng:      { "7д": [60,60,60,60,60,60,60], "30д": [59,59,59,59,59,59,59,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60], "6м": [58,58,58,59,59,59,59,59,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60] },
  ekstra:   { "7д": [87.5,88.0,88.0,89.0,89.0,89.5,89.5], "30д": [82,83,83,84,84,85,85,86,86,87,87,88,88,88,89,89,89,89,89,89,89,89,89,89,89,89,89,89,89,89.5], "6м": [73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,89,89.5,89.5,89.5,89.5,89.5,89.5] },
  mazut:    { "7д": [46.5,47.0,47.0,47.5,47.5,47.5,47.5], "30д": [43,43,44,44,44,45,45,45,46,46,46,46,47,47,47,47,47,47,47,47,47,47,47,47,47,47,47,47,47,47.5], "6м": [38,39,39,40,40,41,41,42,42,43,43,44,44,45,45,46,46,47,47,47.5,47.5,47.5,47.5,47.5] },
};

const FALLBACK_STATIONS = [
  { key: "makpetrol", name: "Makpetrol", logo: "/logos/makpetrol.png", prices: { benzin95: 84.5, benzin98: 86.5, dizel: 93.5, lpg: 59.0 } },
  { key: "okta",      name: "Okta",      logo: "/logos/okta.png",      prices: { benzin95: 84.5, benzin98: 86.5, dizel: 92.5, lpg: 59.0 } },
  { key: "lukoil",    name: "Lukoil",    logo: "/logos/lukoil.png",    prices: { benzin95: 84.5, benzin98: 86.5, dizel: 93.5, lpg: 57.0 } },
];



function useWindowWidth() {
  const [w, setW] = useState(undefined);
  useEffect(() => {
    setW(window.innerWidth);
    const h = () => setW(window.innerWidth);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return w;
}

function Sparkline({ data, color, height = 56 }) {
  const width = 260;
  const min = Math.min(...data), max = Math.max(...data), range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - 6 - ((v - min) / range) * (height - 12);
    return `${x},${y}`;
  });
  const gid = `sg${Math.random().toString(36).slice(2, 6)}`;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ display: "block", width: "100%", height }} preserveAspectRatio="none">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${height} ${pts.join(" ")} ${width},${height}`} fill={`url(#${gid})`} />
      <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LiveDot({ color = C.green }) {
  return (
    <span style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center", width: 8, height: 8 }}>
      <span style={{ position: "absolute", width: 8, height: 8, borderRadius: "50%", background: color, opacity: 0.3, animation: "ping 1.8s ease-in-out infinite" }} />
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: color, display: "inline-block" }} />
    </span>
  );
}

function ShareButton({ fuel, tr }) {
  const [showMenu, setShowMenu] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setShowMenu(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const changeText = fuel.change > 0
    ? tr("home.share.up", { change: fuel.change.toFixed(1) })
    : fuel.change < 0
    ? tr("home.share.down", { change: fuel.change.toFixed(1) })
    : tr("home.share.noChange");

  const message = `⛽ Цени на гориво — makceni.mk\n\n${fuel.label}: ${fuel.price.toFixed(1)} ден/л\n${changeText}\n\nПровери ги сите цени: https://makceni.mk`;
  const encodedMsg = encodeURIComponent(message);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={(e) => { e.stopPropagation(); setShowMenu(m => !m); }}
        style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8, padding: "5px 10px", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "#fff", display: "flex", alignItems: "center", gap: 5, transition: "all 0.15s" }}
        onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.25)"}
        onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.15)"}
      >
        <span style={{ fontSize: 14 }}>📤</span> {tr("home.share.button")}
      </button>
      {showMenu && (
        <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, background: "#fff", border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden", boxShadow: "0 8px 32px rgba(0,0,0,0.12)", zIndex: 100, minWidth: 160, animation: "fadeUp 0.15s ease" }}>
          <a href={`viber://forward?text=${encodedMsg}`} target="_blank" rel="noopener noreferrer"
            style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", textDecoration: "none", color: C.text, fontSize: 13, fontWeight: 600 }}
            onMouseEnter={e => e.currentTarget.style.background = C.surface2}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          ><span style={{ fontSize: 18 }}>💬</span> {tr("home.share.viber")}</a>
          <div style={{ height: 1, background: C.border }} />
          <a href={`https://wa.me/?text=${encodedMsg}`} target="_blank" rel="noopener noreferrer"
            style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", textDecoration: "none", color: C.text, fontSize: 13, fontWeight: 600 }}
            onMouseEnter={e => e.currentTarget.style.background = C.surface2}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          ><span style={{ fontSize: 18 }}>🟢</span> {tr("home.share.whatsapp")}</a>
          <div style={{ height: 1, background: C.border }} />
          <button onClick={() => { navigator.clipboard?.writeText(message); setShowMenu(false); }}
            style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", width: "100%", background: "none", border: "none", cursor: "pointer", color: C.text, fontSize: 13, fontWeight: 600, fontFamily: "inherit" }}
            onMouseEnter={e => e.currentTarget.style.background = C.surface2}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          ><span style={{ fontSize: 18 }}>📋</span> {tr("home.share.copy")}</button>
        </div>
      )}
    </div>
  );
}

function CarouselCard({ fuel, position, onClick, timeStr, loading, tr }) {
  const isCenter = position === 0;
  const isAdjacent = Math.abs(position) === 1;
  if (Math.abs(position) >= 2) return null;
  const fc = FUEL_COLORS[fuel.key] || FUEL_COLORS.mazut;
  return (
    <div onClick={() => !isCenter && onClick()} style={{ position: "absolute", left: "50%", top: "50%", width: 340, transform: `translateX(calc(-50% + ${position * 310}px)) translateY(-50%) scale(${isCenter ? 1 : 0.78})`, transition: "all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)", opacity: isCenter ? 1 : 0.6, filter: isAdjacent ? "blur(1.5px)" : "none", zIndex: isCenter ? 10 : 5, cursor: isCenter ? "default" : "pointer" }}>
      <div style={{ background: fc.bg, borderRadius: 24, padding: "28px 28px 20px", boxShadow: isCenter ? `0 28px 70px ${fc.bg}55, 0 0 0 1px rgba(255,255,255,0.1)` : "0 12px 32px rgba(0,0,0,0.15)", minHeight: 280, display: "flex", flexDirection: "column", justifyContent: "space-between", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -50, right: -50, width: 180, height: 180, borderRadius: "50%", background: "rgba(255,255,255,0.06)", pointerEvents: "none" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div><div style={{ fontSize: 22, fontWeight: 800, color: "#fff", letterSpacing: -0.3 }}>{fuel.label}</div></div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {isCenter && <ShareButton fuel={fuel} tr={tr} />}
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", fontWeight: 500 }}>{timeStr || "—"}</div>
          </div>
        </div>
        <div style={{ marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontSize: 64, fontWeight: 800, color: "#fff", letterSpacing: -3, lineHeight: 1 }}>{loading ? "—" : fuel.price.toFixed(1)}</span>
            <span style={{ fontSize: 18, fontWeight: 600, color: "rgba(255,255,255,0.5)" }}>{tr("home.den")}</span>
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 3 }}>{fuel.unit}</div>
          {["benzin95","benzin98","mazut","ekstra"].includes(fuel.key)
            ? <div style={{ fontSize: 13, fontWeight: 700, color: fuel.key === "ekstra" ? "#ff4d4d" : "#4dff91", marginTop: 8 }}>
                {tr(`home.priceChange.${fuel.key}`)}
              </div>
            : <div style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", marginTop: 8 }}>{tr("home.noChange")}</div>}
        </div>
        <div style={{ marginTop: "auto", paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          <Sparkline data={fuel.history} color={fc.spark} height={52} />
        </div>
      </div>
    </div>
  );
}

function MobileCarousel({ fuelData, activeIdx, onSelect, timeStr, loading, tr }) {
  const n = fuelData.length;
  const PEEK = 36, GAP = 12;

  const [dragOffset, setDragOffset] = useState(0);
  const [dragging, setDragging] = useState(false);

  const startX = useRef(0);
  const containerRef = useRef(null);

  const cloned = [...fuelData, ...fuelData, ...fuelData];
  const [visualIdx, setVisualIdx] = useState(n + activeIdx);

  useEffect(() => {
    setVisualIdx((vi) => {
      const mod = ((vi % n) + n) % n;
      if (mod === activeIdx) return vi;
      return n + activeIdx;
    });
  }, [activeIdx, n]);

  const getCardWidth = () =>
    containerRef.current ? containerRef.current.offsetWidth : 300;

  const handleTouchStart = (e) => {
    startX.current = e.touches[0].clientX;
    setDragging(true);
    setDragOffset(0);
  };

  const handleTouchMove = (e) => {
    if (!dragging) return;
    setDragOffset(e.touches[0].clientX - startX.current);
  };

  const handleTouchEnd = (e) => {
    if (!dragging) return;

    setDragging(false);

    const diff = startX.current - e.changedTouches[0].clientX;
    const threshold = getCardWidth() * 0.25;

    let newVisual = visualIdx;

    if (diff > threshold) newVisual = visualIdx + 1;
    else if (diff < -threshold) newVisual = visualIdx - 1;

    let finalVisual = newVisual;

    if (finalVisual < n) finalVisual += n;
    if (finalVisual >= n * 2) finalVisual -= n;

    setVisualIdx(finalVisual);
    setDragOffset(0);

    onSelect(((finalVisual % n) + n) % n);
  };

  const cardW = `calc(100% - ${PEEK * 2}px)`;

  const liveTranslate = dragging
    ? `calc(${PEEK}px - ${visualIdx} * (${cardW} + ${GAP}px) + ${dragOffset}px)`
    : `calc(${PEEK}px - ${visualIdx} * (${cardW} + ${GAP}px))`;

  return (
    <div style={{ position: "relative" }}>
      <div
        ref={containerRef}
        style={{ overflow: "hidden" }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          style={{
            display: "flex",
            gap: GAP,
            transition: dragging
              ? "none"
              : "transform 0.42s cubic-bezier(0.34, 1.2, 0.64, 1)",
            transform: `translateX(${liveTranslate})`,
            willChange: "transform",
          }}
        >
          {cloned.map((fuel, i) => {
            const fc = FUEL_COLORS[fuel.key] || FUEL_COLORS.mazut;
            const isActive = i === visualIdx;
            const hasChange = Math.abs(fuel.change) >= 0.05;

            const customMsg = {
              benzin95: { text: "Се намалува за 2.5 ден од полноќ", color: "#4dff91" },
              benzin98: { text: "Се намалува за 3 ден од полноќ", color: "#4dff91" },
              mazut:    { text: "Се намалува за 0.7 ден од полноќ", color: "#4dff91" },
              ekstra:   { text: "Се зголемува за 0.5 ден од полноќ", color: "#ff4d4d" },
            };

            return (
              <div
                key={`${fuel.key}-${i}`}
                style={{
                  flex: `0 0 ${cardW}`,
                  transition: dragging ? "none" : "opacity 0.3s, transform 0.3s",
                  opacity: isActive ? 1 : 0.45,
                  transform: isActive ? "scale(1)" : "scale(0.95)",
                }}
              >
                <div
                  style={{
                    background: fc.bg,
                    borderRadius: 20,
                    padding: "22px 22px 16px",
                    boxShadow: isActive
                      ? `0 18px 48px ${fc.bg}55, 0 0 0 1px rgba(255,255,255,0.1)`
                      : "0 6px 18px rgba(0,0,0,0.1)",
                    minHeight: 250,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    position: "relative",
                    overflow: "hidden",
                    userSelect: "none",
                    WebkitUserSelect: "none",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: -40,
                      right: -40,
                      width: 150,
                      height: 150,
                      borderRadius: "50%",
                      background: "rgba(255,255,255,0.05)",
                      pointerEvents: "none",
                    }}
                  />

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: 12,
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 20,
                          fontWeight: 800,
                          color: "#fff",
                          letterSpacing: -0.3,
                        }}
                      >
                        {fuel.label}
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-end",
                        gap: 4,
                      }}
                    >
                      {isActive && <ShareButton fuel={fuel} tr={tr} />}

                      <div
                        style={{
                          fontSize: 11,
                          color: "rgba(255,255,255,0.4)",
                          fontWeight: 500,
                        }}
                      >
                        {timeStr || "—"}
                      </div>
                    </div>
                  </div>

                  <div style={{ marginBottom: 6 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "baseline",
                        gap: 6,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 54,
                          fontWeight: 800,
                          color: "#fff",
                          letterSpacing: -2,
                          lineHeight: 1,
                        }}
                      >
                        {loading ? "—" : fuel.price.toFixed(1)}
                      </span>

                      <span
                        style={{
                          fontSize: 16,
                          fontWeight: 600,
                          color: "rgba(255,255,255,0.5)",
                        }}
                      >
                        {tr("home.den")}
                      </span>
                    </div>

                    <div
                      style={{
                        fontSize: 11,
                        color: "rgba(255,255,255,0.35)",
                        marginTop: 2,
                      }}
                    >
                      {fuel.unit}
                    </div>

                    {customMsg[fuel.key] ? (
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: customMsg[fuel.key].color,
                          marginTop: 6,
                        }}
                      >
                        {customMsg[fuel.key].text}
                      </div>
                    ) : (
                      <div
                        style={{
                          fontSize: 12,
                          color: "rgba(255,255,255,0.3)",
                          marginTop: 6,
                        }}
                      >
                        {tr("home.noChange")}
                      </div>
                    )}
                  </div>

                  <div
                    style={{
                      marginTop: "auto",
                      paddingTop: 10,
                      borderTop: "1px solid rgba(255,255,255,0.1)",
                    }}
                  >
                    <Sparkline data={fuel.history} color={fc.spark} height={44} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ textAlign: "center", marginTop: 8, marginBottom: 2 }}>
        <span style={{ fontSize: 14, color: C.muted, fontWeight: 500 }}>
          {tr("home.swipeHint")}
        </span>
      </div>

      <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 14 }}>
        {fuelData.map((_, i) => (
          <button
            key={i}
            onClick={() => onSelect(i)}
            style={{
              width: i === activeIdx ? 22 : 6,
              height: 6,
              borderRadius: 3,
              border: "none",
              cursor: "pointer",
              padding: 0,
              background: i === activeIdx ? C.orange : C.borderMid,
              transition: "all 0.3s ease",
            }}
          />
        ))}
      </div>
    </div>
  );
}
function PriceHistory({ fuelData, isMobile, tr, lang }) {
  const [activeFuel, setActiveFuel] = useState("benzin95");
  const [activePeriod, setActivePeriod] = useState("7д");
  const [historyData, setHistoryData] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const canvasRef = useRef(null);
  const chartRef = useRef(null);
const localeMap = { mk: "mk-MK", sq: "sq-AL", en: "en-GB", tr: "tr-TR" };
const locale = localeMap[lang] || "mk-MK";
const periods = [tr("home.priceHistory.period7d"), tr("home.priceHistory.period30d"), tr("home.priceHistory.period6m")];
  const fuel = fuelData.find(f => f.key === activeFuel) || fuelData[0];
  const fc = FUEL_COLORS[activeFuel] || FUEL_COLORS.mazut;

  useEffect(() => {
    const periodMap = { "7д": "7d", "30д": "30d", "6м": "6m" };
    setHistoryLoading(true);
    fetch(`/api/prices?history=1&period=${periodMap[activePeriod]}`)
      .then(r => r.json())
      .then(d => { const entries = d.history || []; setHistoryData(entries.length >= 2 ? entries : null); setHistoryLoading(false); })
      .catch(() => { setHistoryData(null); setHistoryLoading(false); });
  }, [activePeriod]);

  const data = (() => {
    if (historyData && historyData.length >= 2) {
      const prices = historyData.map(e => e.prices?.[activeFuel]).filter(p => typeof p === "number");
      if (prices.length >= 2) return [...prices.slice(0, -1), fuel.price];
    }
    const raw = FALLBACK_HISTORY[activeFuel]?.[activePeriod] || fuel.history;
    return [...raw.slice(0, -1), fuel.price];
  })();

  const isRealData = historyData && historyData.length >= 2;

  useEffect(() => {
    if (!canvasRef.current || historyLoading) return;
    const renderChart = () => {
      if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; }
      if (!canvasRef.current) return;
      const ctx = canvasRef.current.getContext("2d");
      const labels = isRealData && historyData
        ? historyData.map(entry => {
            const d = new Date(entry.date);
            if (activePeriod === "7д") return d.toLocaleDateString(locale, { weekday: "short" });
            if (activePeriod === "30д") return d.toLocaleDateString(locale, { day: "numeric", month: "short" });
            return d.toLocaleDateString(locale, { month: "short" });
          })
        : data.map((_, i) => {
            if (activePeriod === "7д") { const d = new Date(); d.setDate(d.getDate() - (data.length - 1 - i)); return d.toLocaleDateString(locale, { weekday: "short" }); }
            if (activePeriod === "30д") return i % 5 === 0 ? `${i + 1}д` : "";
            return i % 4 === 0 ? `${Math.floor(i / 4) + 1}н` : "";
          });

      const lineColor = fc.accent === "#F87171" ? "#EF4444" : fc.accent;
      chartRef.current = new window.Chart(ctx, {
        type: "line",
        data: {
          labels,
          datasets: [{
            data,
            borderColor: lineColor,
            backgroundColor: (context) => {
              const gradient = context.chart.ctx.createLinearGradient(0, 0, 0, 200);
              gradient.addColorStop(0, lineColor + "33");
              gradient.addColorStop(1, lineColor + "00");
              return gradient;
            },
            borderWidth: 2.5,
            pointRadius: activePeriod === "7д" ? 4 : 0,
            pointHoverRadius: 6,
            pointBackgroundColor: "#fff",
            pointBorderColor: lineColor,
            pointBorderWidth: 2,
            tension: 0.4,
            fill: true,
          }],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          interaction: { intersect: false, mode: "index" },
          plugins: {
            legend: { display: false },
            tooltip: { backgroundColor: "#1C1917", titleColor: "#A8A29E", bodyColor: "#fff", bodyFont: { size: 14, weight: "700" }, padding: 10, cornerRadius: 8, callbacks: { label: (ctx) => ` ${ctx.raw.toFixed(1)} ${tr("home.den")}` } },
          },
          scales: {
            x: { grid: { display: false }, ticks: { color: "#A8A29E", font: { size: 11 } }, border: { display: false } },
            y: { grid: { color: "#E4E1DA", lineWidth: 1 }, ticks: { color: "#A8A29E", font: { size: 11 }, callback: (v) => `${v}` }, border: { display: false, dash: [4, 4] } },
          },
        },
      });
    };
    if (window.Chart) { renderChart(); }
    else {
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js";
      script.onload = renderChart;
      document.head.appendChild(script);
    }
    return () => { if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; } };
  }, [activeFuel, activePeriod, data, historyLoading]);

  const minPrice = data.length ? Math.min(...data).toFixed(1) : "—";
  const maxPrice = data.length ? Math.max(...data).toFixed(1) : "—";
  const currentPrice = fuel.price.toFixed(1);
  const diff = data.length >= 2 ? (data[data.length - 1] - data[0]).toFixed(1) : "0";
  const diffPositive = parseFloat(diff) > 0;
  const diffNegative = parseFloat(diff) < 0;

  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden" }}>
      <div style={{ padding: "16px 20px", background: C.surface2, borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{tr("home.priceHistory.title")}</div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 1 }}>{isRealData ? tr("home.priceHistory.subtitleReal") : tr("home.priceHistory.subtitleFallback")}</div>
        </div>
        <div style={{ display: "flex", gap: 4, background: C.border, borderRadius: 8, padding: 3 }}>
          {periods.map(p => (
            <button key={p} onClick={() => setActivePeriod(p)} style={{ padding: "5px 14px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700, fontFamily: "inherit", background: activePeriod === p ? C.surface : "transparent", color: activePeriod === p ? C.text : C.muted, boxShadow: activePeriod === p ? "0 1px 3px rgba(0,0,0,0.08)" : "none", transition: "all 0.15s" }}>{p}</button>
          ))}
        </div>
      </div>
      <div style={{ padding: "12px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", gap: 6, flexWrap: "wrap" }}>
        {fuelData.map(f => {
          const isActive = f.key === activeFuel;
          const ffc = FUEL_COLORS[f.key];
          return <button key={f.key} onClick={() => setActiveFuel(f.key)} style={{ padding: "4px 12px", borderRadius: 6, border: `1px solid ${isActive ? ffc.bg + "88" : C.border}`, background: isActive ? ffc.bg : C.surface2, color: isActive ? "#fff" : C.muted, fontSize: 11, fontWeight: 600, cursor: "pointer", transition: "all 0.12s", fontFamily: "inherit" }}>{f.label}</button>;
        })}
      </div>
      <div style={{ padding: "14px 20px", borderBottom: `1px solid ${C.border}`, display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
        {[
      { label: tr("home.priceHistory.current"), value: `${currentPrice} ${tr("home.den")}`, color: C.text },
{ label: tr("home.priceHistory.min"),     value: `${minPrice} ${tr("home.den")}`, sub: activePeriod, color: C.green },
{ label: tr("home.priceHistory.max"),     value: `${maxPrice} ${tr("home.den")}`, sub: activePeriod, color: C.red },
{ label: tr("home.priceHistory.change"),  value: `${diffPositive ? "+" : ""}${diff} ${tr("home.den")}`, color: diffPositive ? C.red : diffNegative ? C.green : C.text },
        ].map(({ label, value, sub, color }) => (
          <div key={label} style={{ background: C.surface2, borderRadius: 10, padding: "10px 12px" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: isMobile ? 13 : 15, fontWeight: 800, color }}>{value}</div>
            {sub && <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{sub}</div>}
          </div>
        ))}
      </div>
      <div style={{ padding: "16px 20px 20px", height: 200, position: "relative" }}>
        {historyLoading && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.8)", zIndex: 2 }}>
            <div style={{ width: 20, height: 20, border: `2px solid ${C.orange}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
          </div>
        )}
        <canvas ref={canvasRef} />
      </div>
      {!isRealData && (
        <div style={{ padding: "8px 20px 12px", fontSize: 11, color: C.muted, borderTop: `1px solid ${C.border}` }}>
          {tr("home.priceHistory.disclaimer")}
        </div>
      )}
    </div>
  );
}

function CarProfile({ fuelData, tr }) {
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ model: "", consumption: "7.5", fuelKey: "benzin95" });

  useEffect(() => {
    try { const saved = localStorage.getItem("makceni_car_profile"); if (saved) { const p = JSON.parse(saved); setProfile(p); setForm(p); } } catch {}
  }, []);

  const save = () => {
    if (!form.model.trim()) return;
    const p = { ...form, consumption: parseFloat(form.consumption) || 7.5 };
    try { localStorage.setItem("makceni_car_profile", JSON.stringify(p)); } catch {}
    setProfile(p); setEditing(false);
  };

  const clear = () => {
    try { localStorage.removeItem("makceni_car_profile"); } catch {}
    setProfile(null); setForm({ model: "", consumption: "7.5", fuelKey: "benzin95" }); setEditing(false);
  };

  const fuel = fuelData.find(f => f.key === (profile?.fuelKey || form.fuelKey)) || fuelData[0];
  const cons = parseFloat(profile?.consumption || form.consumption) || 7.5;
  const costPerKm = fuel ? ((cons / 100) * fuel.price).toFixed(2) : "—";
  const costPer100 = fuel ? ((cons / 100) * fuel.price * 100).toFixed(0) : "—";
  const inp = { background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 9, padding: "9px 12px", color: C.text, fontSize: 13, fontWeight: 500, width: "100%", outline: "none", fontFamily: "inherit" };

  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden" }}>
      <div style={{ padding: "16px 20px", background: C.surface2, borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{tr("home.carProfile.title")}</div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 1 }}>{tr("home.carProfile.subtitle")}</div>
        </div>
        {profile && !editing && (
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => setEditing(true)} style={{ padding: "5px 12px", borderRadius: 7, border: `1px solid ${C.border}`, background: C.surface, color: C.textMid, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>{tr("home.carProfile.edit")}</button>
            <button onClick={clear} style={{ padding: "5px 12px", borderRadius: 7, border: `1px solid ${C.redBdr}`, background: C.redBg, color: C.red, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>{tr("home.carProfile.delete")}</button>
          </div>
        )}
      </div>
      <div style={{ padding: "18px 20px" }}>
        {!profile || editing ? (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 5 }}>{tr("home.carProfile.modelLabel")}</div>
                <input type="text" placeholder={tr("home.carProfile.modelPlaceholder")} value={form.model} onChange={e => setForm(f => ({ ...f, model: e.target.value }))} style={inp} />
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 5 }}>{tr("home.carProfile.consumption")}</div>
                <input type="number" step="0.1" min="3" max="25" value={form.consumption} onChange={e => setForm(f => ({ ...f, consumption: e.target.value }))} style={inp} />
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 5 }}>{tr("home.carProfile.fuelType")}</div>
              <select value={form.fuelKey} onChange={e => setForm(f => ({ ...f, fuelKey: e.target.value }))} style={{ ...inp, cursor: "pointer" }}>
                {fuelData.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
              </select>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {editing && <button onClick={() => setEditing(false)} style={{ flex: 1, padding: "10px", borderRadius: 9, border: `1px solid ${C.border}`, background: C.surface2, color: C.textMid, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>{tr("home.carProfile.cancel")}</button>}
              <button onClick={save} style={{ flex: 2, padding: "10px", borderRadius: 9, border: "none", background: C.orange, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>{editing ? tr("home.carProfile.saveChanges") : tr("home.carProfile.save")}</button>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: C.orangeBg, border: `1px solid ${C.orangeBdr}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>🚗</div>
              <div>
                <div style={{ fontSize: 17, fontWeight: 800, color: C.text }}>{profile.model}</div>
                <div style={{ fontSize: 12, color: C.muted }}>{profile.consumption} л/100км · {fuel.label}</div>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
              <div style={{ background: C.orangeBg, border: `1px solid ${C.orangeBdr}`, borderRadius: 12, padding: "14px 16px" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: C.orange, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 4 }}>{tr("home.carProfile.costPerKm")}</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: C.orange, letterSpacing: -1, lineHeight: 1 }}>{costPerKm}</div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>ден/км</div>
              </div>
              <div style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 16px" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 4 }}>{tr("home.carProfile.costPer100")}</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: C.text, letterSpacing: -1, lineHeight: 1 }}>{costPer100}</div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>ден</div>
              </div>
            </div>
            <div style={{ background: `linear-gradient(135deg, ${C.orangeBg}, #FFF0E0)`, border: `1px solid ${C.orangeBdr}`, borderRadius: 10, padding: "12px 14px" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.text, lineHeight: 1.6 }}>
                Твојот <strong>{profile.model}</strong> чини <strong style={{ color: C.orange }}>{costPerKm} ден/км</strong> денес со {fuel.label} на <strong style={{ color: C.orange }}>{fuel.price.toFixed(1)} ден</strong>.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function useDrawer() {
  const [open, setOpen] = useState(false);
  return { open, toggle: () => setOpen(o => !o), close: () => setOpen(false) };
}

function HamburgerButton({ open, toggle }) {
  return (
    <button onClick={toggle} aria-label="Menu" style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: 5, width: 40, height: 40, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, cursor: "pointer", padding: 0, flexShrink: 0 }}>
      <span style={{ width: 18, height: 2, background: open ? C.orange : C.text, borderRadius: 2, transition: "all 0.22s", transform: open ? "rotate(45deg) translate(5px, 5px)" : "none", display: "block" }} />
      <span style={{ width: 18, height: 2, background: open ? C.orange : C.text, borderRadius: 2, transition: "all 0.22s", opacity: open ? 0 : 1, display: "block" }} />
      <span style={{ width: 18, height: 2, background: open ? C.orange : C.text, borderRadius: 2, transition: "all 0.22s", transform: open ? "rotate(-45deg) translate(5px, -5px)" : "none", display: "block" }} />
    </button>
  );
}

function MobileDrawer({ open, close, loading, timeStr, tr }) {
  return (
    <>
      <div onClick={close} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)", zIndex: 998, opacity: open ? 1 : 0, pointerEvents: open ? "auto" : "none", transition: "opacity 0.3s ease" }} />
      <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: "80%", maxWidth: 300, background: C.surface, zIndex: 999, boxShadow: "-12px 0 48px rgba(0,0,0,0.18)", transform: open ? "translateX(0)" : "translateX(100%)", transition: "transform 0.32s cubic-bezier(0.16,1,0.3,1)", display: "flex", flexDirection: "column", overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px 14px", borderBottom: `1px solid ${C.border}` }}>
          <a href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center" }}>
            <img src="/logo.png" alt="makceni.mk" style={{ height: 32, width: "auto" }} />
          </a>
          <button onClick={close} style={{ width: 34, height: 34, borderRadius: 9, border: `1px solid ${C.border}`, background: C.surface2, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", color: C.text }}>✕</button>
        </div>
        <div style={{ padding: "10px 20px", background: C.surface2, borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 7 }}>
          {loading ? <div style={{ width: 7, height: 7, borderRadius: "50%", border: `2px solid ${C.orange}`, borderTopColor: "transparent", animation: "spin 0.7s linear infinite" }} /> : <LiveDot />}
          <span style={{ fontSize: 12, color: C.muted, fontWeight: 500 }}>{loading ? tr("nav.loading") : timeStr ? `${tr("nav.updated", { time: timeStr })}` : tr("nav.live")}</span>
        </div>
        <nav style={{ padding: "8px 14px" }}>
          {[
            [tr("nav.prices"), "#ceni"],
            [tr("nav.calculator"), "#calculator"],
            [tr("nav.history"), "#history"],
            [tr("nav.berza"), "#berza"],
            [tr("nav.news"), "#news"],
          ].map(([label, href]) => (
            <a key={label} href={href} onClick={close} style={{ display: "flex", alignItems: "center", padding: "15px 10px", fontSize: 16, fontWeight: 600, color: C.text, textDecoration: "none", borderBottom: `1px solid ${C.border}`, transition: "background 0.15s" }}
              onTouchStart={e => e.currentTarget.style.background = C.surface2}
              onTouchEnd={e => e.currentTarget.style.background = "transparent"}
            >{label}</a>
          ))}
        </nav>
        <div style={{ padding: "14px 14px", display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}>
          <a href="/mapa" onClick={close} style={{ display: "flex", alignItems: "center", gap: 12, padding: "15px 18px", borderRadius: 13, background: "#FEF3C7", border: "1px solid #FDE68A", textDecoration: "none", fontWeight: 700, fontSize: 16, color: "#92400E" }}><span style={{ fontSize: 22 }}>⛽</span>{tr("nav.gasStations")}</a>
          <a href="/safecity" onClick={close} style={{ display: "flex", alignItems: "center", gap: 12, padding: "15px 18px", borderRadius: 13, background: "#FEF2F2", border: "1px solid #FECACA", textDecoration: "none", fontWeight: 700, fontSize: 16, color: "#991B1B" }}><span style={{ fontSize: 22 }}>📷</span>{tr("nav.safeCity")}</a>
        </div>
      </div>
    </>
  );
}

// Replace the entire Berza function in index.js with this:

function Berza({ tr }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/berza")
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // Use live data if present; usd/mkd will be null if the fetch failed —
  // the Row component renders "—" for null values rather than stale numbers.
  const oil = (data?.oil || [
    { name: "Brent Crude", usd: null, mkd: null, change: 0, unit: "barrel" },
    { name: "WTI Crude",   usd: null, mkd: null, change: 0, unit: "barrel" },
  ]).map(o => ({ ...o, unit: tr("home.berza.barrel") }));

  const metals = (data?.metals || [
    { name: "gold",   usd: null, mkd: null, change: 0, unit: "gram" },
    { name: "silver", usd: null, mkd: null, change: 0, unit: "gram" },
  ]).map(m => ({
    ...m,
    name: m.name === "gold" ? tr("home.berza.gold") : m.name === "silver" ? tr("home.berza.silver") : m.name,
    unit: tr("home.berza.gram"),
  }));

  const crypto = data?.crypto || [
    { name: "Bitcoin",  usd: null, mkd: null, change: 0, unit: "BTC" },
    { name: "Ethereum", usd: null, mkd: null, change: 0, unit: "ETH" },
  ];

  const Row = ({ item, last }) => {
    const usdDisplay = item.usd != null ? `$${typeof item.usd === "number" ? item.usd.toLocaleString() : item.usd}` : "—";
    const mkdDisplay = item.mkd != null ? `${typeof item.mkd === "number" ? item.mkd.toLocaleString() : item.mkd} ден / ${item.unit}` : tr("home.berza.loading");

    return (
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: last ? "none" : `1px solid ${C.border}` }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{item.name}</div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
            {loading ? tr("home.berza.loading") : mkdDisplay}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: C.text }}>
            {loading ? "—" : usdDisplay}
          </div>
          {!loading && typeof item.change === "number" && item.change !== 0 && (
            <div style={{ fontSize: 11, fontWeight: 700, color: item.change > 0 ? C.red : C.green, marginTop: 2 }}>
              {item.change > 0 ? "▲ +" : "▼ "}{Math.abs(item.change)}{tr("home.berza.todayChange")}
            </div>
          )}
        </div>
      </div>
    );
  };

  const Section = ({ emoji, title, items, border }) => (
    <div style={{ padding: "0 20px", borderBottom: border ? `1px solid ${C.border}` : "none" }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: 1, textTransform: "uppercase", paddingTop: 12, paddingBottom: 2 }}>{emoji} {title}</div>
      {items.map((item, i) => <Row key={item.name} item={item} last={i === items.length - 1} />)}
    </div>
  );

  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden" }}>
      <div style={{ padding: "16px 20px", background: C.surface2, borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{tr("home.berza.title")}</div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 1 }}>
            {data?.stale ? tr("home.berza.unavailable") : tr("home.berza.subtitle")}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5, background: data?.stale ? C.surface2 : C.greenBg, border: `1px solid ${data?.stale ? C.border : C.greenBdr}`, borderRadius: 20, padding: "3px 9px" }}>
          {data?.stale ? null : <LiveDot />}
          <span style={{ fontSize: 11, fontWeight: 700, color: data?.stale ? C.muted : C.green }}>
            {data?.stale ? "—" : tr("nav.live")}
          </span>
        </div>
      </div>
      <Section emoji="⛽" title={tr("home.berza.oil")}    items={oil}    border={true} />
      <Section emoji="🪙" title={tr("home.berza.metals")} items={metals} border={true} />
      <Section emoji="₿"  title={tr("home.berza.crypto")} items={crypto} border={false} />
    </div>
  );
}

function AlertBanner({ tr }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  return (
    <div style={{ background: `linear-gradient(135deg, ${C.orangeBg}, #FFF0E0)`, border: `1px solid ${C.orangeBdr}`, borderRadius: 16, padding: "22px 22px" }}>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 4 }}>{tr("home.alerts.title")}</div>
        <div style={{ fontSize: 13, color: C.textMid, lineHeight: 1.6 }}>{tr("home.alerts.desc")}</div>
      </div>
      {sent ? <div style={{ fontSize: 15, fontWeight: 600, color: C.green }}>{tr("home.alerts.saved")}</div> : (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input type="email" placeholder={tr("home.alerts.placeholder")} value={email} onChange={e => setEmail(e.target.value)} style={{ flex: "1 1 160px", padding: "10px 14px", borderRadius: 9, border: `1px solid ${C.orangeBdr}`, background: "#fff", fontSize: 14, outline: "none" }} />
          <button onClick={() => setSent(true)} style={{ padding: "10px 20px", borderRadius: 9, background: C.orange, color: "#fff", fontSize: 14, fontWeight: 700, border: "none", cursor: "pointer", whiteSpace: "nowrap" }}>{tr("home.alerts.activate")}</button>
        </div>
      )}
    </div>
  );
}

function Calculator({ fuelData, tr }) {
  const [km, setKm] = useState("100");
  const [cons, setCons] = useState("7.5");
  const [fuelKey, setFuelKey] = useState("benzin95");

  const fuel = fuelData.find(f => f.key === fuelKey) || fuelData[0];
  const kmVal = parseFloat(km) || 0;
  const consVal = parseFloat(cons) || 0;
  const cost = fuel && kmVal && consVal ? ((kmVal / 100) * consVal * fuel.price).toFixed(0) : "—";
  const liters = kmVal && consVal ? ((kmVal / 100) * consVal).toFixed(1) : "—";

  const blockInvalid = (e) => { if (["e", "E", "+", "-"].includes(e.key)) e.preventDefault(); };
  const inp = { background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 9, padding: "10px 13px", color: C.text, fontSize: 14, fontWeight: 600, width: "100%", outline: "none" };

  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden" }}>
      <div style={{ padding: "16px 20px", background: C.surface2, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{tr("home.calculator.title")}</div>
        <div style={{ fontSize: 12, color: C.muted, marginTop: 1 }}>{tr("home.calculator.subtitle")}</div>
      </div>
      <div style={{ padding: "18px 20px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 5 }}>{tr("home.calculator.km")}</div>
            <input type="number" inputMode="numeric" placeholder="100" value={km} onChange={e => setKm(e.target.value)} onFocus={e => { if (e.target.value === "100") setKm(""); }} onBlur={e => { if (e.target.value === "") setKm("100"); }} onKeyDown={blockInvalid} style={inp} />
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 5 }}>{tr("home.calculator.per100")}</div>
            <input type="number" inputMode="decimal" step="0.1" placeholder="7.5" value={cons} onChange={e => setCons(e.target.value)} onFocus={e => { if (e.target.value === "7.5") setCons(""); }} onBlur={e => { if (e.target.value === "") setCons("7.5"); }} onKeyDown={blockInvalid} style={inp} />
          </div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 5 }}>{tr("home.calculator.fuelType")}</div>
          <select value={fuelKey} onChange={e => setFuelKey(e.target.value)} style={{ ...inp, cursor: "pointer" }}>
            {fuelData.map(f => <option key={f.key} value={f.key}>{f.label} — {f.price} {tr("home.den")}/{f.unit.split("/")[1]}</option>)}
          </select>
        </div>
        <div style={{ background: C.orangeBg, border: `1px solid ${C.orangeBdr}`, borderRadius: 12, padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.orange, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 4 }}>{tr("home.calculator.totalCost")}</div>
            <div style={{ fontSize: 42, fontWeight: 800, color: C.orange, letterSpacing: -2, lineHeight: 1 }}>
              {cost}<span style={{ fontSize: 14, fontWeight: 400, color: C.muted, marginLeft: 4 }}>{tr("home.den")}</span>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 4 }}>{tr("home.calculator.liters")}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: C.text, letterSpacing: -1 }}>
              {liters}<span style={{ fontSize: 12, fontWeight: 400, color: C.muted, marginLeft: 2 }}>{tr("home.calculator.litersUnit")}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function NewsCard({ n, i }) {
  const [hov, setHov] = useState(false);
  return (
    <a href={n.url} target="_blank" rel="noopener noreferrer"
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display: "block", textDecoration: "none", background: C.surface, border: `1px solid ${hov ? C.borderMid : C.border}`, borderRadius: 13, padding: "16px 18px", transition: "all 0.2s ease", transform: hov ? "translateY(-3px)" : "none", boxShadow: hov ? "0 10px 28px rgba(0,0,0,0.07)" : "0 1px 4px rgba(0,0,0,0.04)", animation: `fadeUp 0.45s ${i * 0.06}s both` }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, gap: 8 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: C.orange, background: C.orangeBg, border: `1px solid ${C.orangeBdr}`, borderRadius: 5, padding: "2px 8px", whiteSpace: "nowrap" }}>{n.source}</span>
        <span style={{ fontSize: 11, color: C.muted, flexShrink: 0 }}>{n.time}</span>
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color: C.text, lineHeight: 1.55 }}>{n.title}</div>
    </a>
  );
}

function StationPricesTable({ isMobile, tr }) {
// CORRECT - uses tr()
const STATION_FUEL_LABELS = [
  { key: "benzin95", label: tr("stationPrices.benzin95"), color: "#F87171" },
  { key: "benzin98", label: tr("stationPrices.benzin98"), color: "#FCA5A5" },
  { key: "dizel",    label: tr("stationPrices.dizel"),    color: "#86EFAC" },
  { key: "lpg",      label: tr("stationPrices.lpg"),      color: "#93C5FD" },
];
  const [stations, setStations] = useState(FALLBACK_STATIONS);
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState(null);

  useEffect(() => {
    fetch("/api/station-prices").then(r => r.json()).then(d => {
      if (d.stations && d.stations.length > 0) setStations(d.stations);
      if (d.updatedAt) setUpdatedAt(d.updatedAt);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const timeStr = updatedAt ? new Date(updatedAt).toLocaleTimeString("mk-MK", { hour: "2-digit", minute: "2-digit" }) : null;

  if (isMobile) {
    return (
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", background: C.surface2, borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{tr("home.stationTable.title")}</div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 1 }}>{timeStr ? tr("home.stationTable.subtitleWithTime", { time: timeStr }) : tr("home.stationTable.subtitle")}</div>
          </div>
          {loading ? <div style={{ width: 7, height: 7, borderRadius: "50%", border: `2px solid ${C.orange}`, borderTopColor: "transparent", animation: "spin 0.7s linear infinite" }} />
            : <div style={{ display: "flex", alignItems: "center", gap: 5, background: C.greenBg, border: `1px solid ${C.greenBdr}`, borderRadius: 20, padding: "3px 9px" }}><LiveDot /><span style={{ fontSize: 11, fontWeight: 700, color: C.green }}>{tr("nav.live")}</span></div>}
        </div>
        <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
          {stations.map(station => (
            <div key={station.key} style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 13, overflow: "hidden" }}>
              <div style={{ padding: "11px 14px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 8 }}>
                <img src={station.logo} alt={station.name} style={{ height: 28, width: "auto", maxWidth: 90, objectFit: "contain" }} onError={e => { e.currentTarget.style.display = "none"; }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
                {STATION_FUEL_LABELS.map((f, fi) => (
                  <div key={f.key} style={{ padding: "10px 14px", borderRight: fi % 2 === 0 ? `1px solid ${C.border}` : "none", borderBottom: fi < 2 ? `1px solid ${C.border}` : "none" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3 }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: f.color, display: "inline-block", flexShrink: 0 }} />
                      <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 0.4 }}>{f.label}</div>
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: C.text }}>
                      {loading ? "—" : station.prices[f.key] != null ? station.prices[f.key].toFixed(1) : "—"}
                      <span style={{ fontSize: 10, fontWeight: 500, color: C.muted, marginLeft: 2 }}>ден</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div style={{ padding: "8px 20px 12px", fontSize: 11, color: C.muted, borderTop: `1px solid ${C.border}` }}>{tr("home.stationTable.disclaimer")}</div>
      </div>
    );
  }

  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden" }}>
      <div style={{ padding: "16px 20px", background: C.surface2, borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{tr("home.stationTable.title")}</div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 1 }}>{timeStr ? tr("home.stationTable.subtitleWithTime", { time: timeStr }) : tr("home.stationTable.subtitle")}</div>
        </div>
        {loading ? <div style={{ width: 7, height: 7, borderRadius: "50%", border: `2px solid ${C.orange}`, borderTopColor: "transparent", animation: "spin 0.7s linear infinite" }} />
          : <div style={{ display: "flex", alignItems: "center", gap: 5, background: C.greenBg, border: `1px solid ${C.greenBdr}`, borderRadius: 20, padding: "3px 9px" }}><LiveDot /><span style={{ fontSize: 11, fontWeight: 700, color: C.green }}>{tr("nav.live")}</span></div>}
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: C.surface2 }}>
              <th style={{ padding: "12px 20px", textAlign: "left", fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 0.8, borderBottom: `1px solid ${C.border}` }}>{tr("home.stationTable.station")}</th>
              {STATION_FUEL_LABELS.map(f => (
                <th key={f.key} style={{ padding: "12px 20px", textAlign: "right", fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 0.8, borderBottom: `1px solid ${C.border}` }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: f.color, display: "inline-block" }} />{f.label}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {stations.map((station, si) => (
              <tr key={station.key} style={{ borderBottom: si < stations.length - 1 ? `1px solid ${C.border}` : "none", transition: "background 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.background = C.surface2}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <td style={{ padding: "16px 20px" }}>
                  <img src={station.logo} alt={station.name} style={{ height: 32, width: "auto", maxWidth: 110, objectFit: "contain" }} onError={e => { e.currentTarget.style.display = "none"; }} />
                </td>
                {STATION_FUEL_LABELS.map(f => (
                  <td key={f.key} style={{ padding: "16px 20px", textAlign: "right" }}>
                    {loading ? <span style={{ fontSize: 18, fontWeight: 800, color: C.muted }}>—</span> : (
                      <><span style={{ fontSize: 20, fontWeight: 800, color: C.text }}>{station.prices[f.key] != null ? station.prices[f.key].toFixed(1) : "—"}</span><span style={{ fontSize: 11, color: C.muted, marginLeft: 4 }}>ден</span></>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ padding: "8px 20px 12px", fontSize: 11, color: C.muted, borderTop: `1px solid ${C.border}` }}>{tr("home.stationTable.disclaimer")}</div>
    </div>
  );
}

export default function Home() {
  const { lang, setLang, tr } = useLanguage();
  const [mounted, setMounted] = useState(false);
 const [fuelData, setFuelData] = useState(() => FALLBACK.map(f => ({
  ...f,
  label: tr(`fuels.${f.key}`),
  unit: f.key === "cng" ? tr("home.units.perKg") : tr("home.units.perL"),
})));
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const [autoRotate, setAutoRotate] = useState(true);
  const [news, setNews] = useState([]);
  const [originalNews, setOriginalNews] = useState([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [showAllNews, setShowAllNews] = useState(false);
  const drawer = useDrawer();
  const width = useWindowWidth();
  const isMobile = width !== undefined && width < 640;
  const isTablet = width !== undefined && width >= 640 && width < 1024;
  const px = isMobile ? "16px" : isTablet ? "24px" : "36px";

  useEffect(() => {
    setMounted(true);
    fetch("/api/prices").then(r => r.json()).then(d => {
      if (d.prices?.length) {
        const merged = FALLBACK.map(f => { const live = d.prices.find(p => p.key === f.key); return live ? { ...f, price: live.price, change: live.change } : f; });
        setFuelData(merged); setUpdatedAt(d.updatedAt);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);
 
  // Retranslate fuel labels whenever language changes
useEffect(() => {
  const unitMap = { mk: { perL: "ден/л", perKg: "ден/кг" }, sq: { perL: "den/l", perKg: "den/kg" }, en: { perL: "den/L", perKg: "den/kg" }, tr: { perL: "den/L", perKg: "den/kg" } };
  const units = unitMap[lang] || unitMap.mk;
  setFuelData(prev => prev.map(f => ({
    ...f,
    label: tr(`fuels.${f.key}`),
    unit: f.key === "cng" ? units.perKg : units.perL,
  })));
}, [lang]);
  useEffect(() => {
    fetch("/api/news").then(r => r.json()).then(d => { const fetched = d.news || []; setNews(fetched); setOriginalNews(fetched); setNewsLoading(false); }).catch(() => setNewsLoading(false));
  }, []);

  const loadMoreNews = () => {
    if (showAllNews) { setNews(originalNews); setShowAllNews(false); return; }
    fetch("/api/news?all=1").then(r => r.json()).then(d => { setNews(d.news || []); setShowAllNews(true); }).catch(() => setShowAllNews(true));
  };

  useEffect(() => {
    if (!autoRotate) return;
    const id = setInterval(() => setActiveIdx(p => (p + 1) % fuelData.length), 7000);
    return () => clearInterval(id);
  }, [autoRotate, fuelData.length]);

  const handleSelect = (i) => { setActiveIdx(i); setAutoRotate(false); };
  const localeMap = { mk: "mk-MK", sq: "sq-AL", en: "en-GB", tr: "tr-TR" };
const today = new Date().toLocaleDateString(localeMap[lang] || "mk-MK", { day: "numeric", month: "long", year: "numeric" });
  const timeStr = updatedAt ? new Date(updatedAt).toLocaleTimeString("mk-MK", { hour: "2-digit", minute: "2-digit" }) : null;
  const activeFc = fuelData[activeIdx] ? FUEL_COLORS[fuelData[activeIdx].key] : null;

  return (
    <>
    <Head>
  <title>МакЦени.мк — Цени на Гориво во Македонија | Бензин, Дизел, ЛПГ</title>
  <meta name="description" content="Споредете цени на гориво во Македонија — бензин, дизел, ЛПГ, метан. Ажурирани цени од сите бензински станици: Макпетрол, Окта, Лукоил." />
  <meta name="keywords" content="цени на гориво македонија, бензин цена, дизел цена, ЛПГ цена, макпетрол, окта, лукоил, гориво македонија, makceni" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="index, follow" />
  <link rel="canonical" href="https://makceni.mk" />

  {/* Open Graph */}
  <meta property="og:title" content="МакЦени.мк — Цени на Гориво во Македонија" />
  <meta property="og:description" content="Споредете цени на бензин, дизел и ЛПГ во сите бензински станици низ Македонија. Ажурирано во реално време." />
  <meta property="og:url" content="https://makceni.mk" />
  <meta property="og:image" content="https://makceni.mk/og-image.png" />
  <meta property="og:type" content="website" />

  {/* Twitter */}
  <meta name="twitter:title" content="МакЦени.мк — Цени на Гориво во Македонија" />
  <meta name="twitter:description" content="Споредете цени на бензин, дизел и ЛПГ во сите бензински станици низ Македонија." />
  <meta name="twitter:image" content="https://makceni.mk/og-image.png" />

  {/* JSON-LD */}
  <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "МакЦени — Цени на гориво во Македонија",
    "description": "Споредете цени на бензин, дизел, ЛПГ и метан во Македонија во реално време.",
    "url": "https://makceni.mk",
    "inLanguage": ["mk", "sq", "en", "tr"],
    "publisher": {
      "@type": "Organization",
      "name": "МакЦени",
      "url": "https://makceni.mk",
      "logo": { "@type": "ImageObject", "url": "https://makceni.mk/logo.png" }
    }
  })}} />

  <link rel="icon" type="image/x-icon" href="/favicon.ico" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
  <style>{`
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
          html, body { background: ${C.bg}; color: ${C.text}; font-family: 'DM Sans', sans-serif; -webkit-font-smoothing: antialiased; overflow-x: hidden; }
          input, select, button, a { font-family: 'DM Sans', sans-serif; }
          ::selection { background: ${C.orangeBg}; color: ${C.orange}; }
          ::-webkit-scrollbar { width: 5px; background: ${C.bg}; }
          ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 3px; }
          @keyframes fadeUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
          @keyframes ping { 0%{transform:scale(1);opacity:0.3} 75%,100%{transform:scale(2.2);opacity:0} }
          @keyframes spin { to { transform: rotate(360deg); } }
          input:focus, select:focus { border-color: ${C.orange} !important; box-shadow: 0 0 0 3px ${C.orangeBg}; }
          input[type=number]::-webkit-inner-spin-button, input[type=number]::-webkit-outer-spin-button { opacity: 1; }
        `}</style>
      </Head>

      <div style={{ minHeight: "100vh", background: C.bg }}>
        <div style={{ position: "fixed", top: 0, left: "50%", transform: "translateX(-50%)", width: "100%", height: "50vh", background: activeFc ? `radial-gradient(ellipse at top, ${activeFc.bg}12 0%, transparent 65%)` : "none", pointerEvents: "none", zIndex: 0, transition: "background 0.8s ease" }} />

        <header style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, background: "rgba(248,247,244,0.96)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderBottom: `1px solid ${C.border}` }}>
          <div style={{ maxWidth: 1180, margin: "0 auto", padding: `0 ${px}`, height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <a href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", transition: "opacity 0.15s" }} onMouseEnter={e => e.currentTarget.style.opacity = "0.75"} onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
              <img src="/logo.png" alt="makceni.mk" style={{ height: isMobile ? 152 : 158, width: "auto", display: "block" }} />
            </a>
            {!isMobile && (
              <nav style={{ display: "flex", alignItems: "center", gap: 4 }}>
                {[[tr("nav.prices"), "#ceni"], [tr("nav.calculator"), "#calculator"], [tr("nav.history"), "#history"], [tr("nav.berza"), "#berza"], [tr("nav.news"), "#news"]].map(([l, href]) => (
                  <a key={l} href={href} style={{ padding: "8px 14px", borderRadius: 9, fontSize: isTablet ? 13 : 15, fontWeight: 600, color: C.textMid, textDecoration: "none", transition: "all 0.15s", border: "1px solid transparent" }}
                    onMouseEnter={e => { e.currentTarget.style.background = C.surface; e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.text; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "transparent"; e.currentTarget.style.color = C.textMid; }}
                  >{l}</a>
                ))}
                <div style={{ width: 1, height: 20, background: C.border, margin: "0 4px" }} />
                <a href="/mapa" style={{ padding: "7px 13px", borderRadius: 9, fontSize: isTablet ? 13 : 15, fontWeight: 700, color: "#92400E", background: "#FEF3C7", border: "1px solid #FDE68A", textDecoration: "none" }}>{tr("nav.gasStations")}</a>
                <a href="/safecity" style={{ padding: "7px 13px", borderRadius: 9, fontSize: isTablet ? 13 : 15, fontWeight: 700, color: "#991B1B", background: "#FEF2F2", border: "1px solid #FECACA", textDecoration: "none" }}>{tr("nav.safeCity")}</a>
              </nav>
            )}
            {!isMobile && (
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  {loading ? <div style={{ width: 7, height: 7, borderRadius: "50%", border: `2px solid ${C.orange}`, borderTopColor: "transparent", animation: "spin 0.7s linear infinite" }} /> : <LiveDot />}
                  <span style={{ fontSize: 13, color: C.muted, fontWeight: 500 }}>{loading ? tr("nav.loading") : timeStr ? tr("nav.updated", { time: timeStr }) : tr("nav.live")}</span>
                </div>
                <LanguageSwitcher lang={lang} setLang={setLang} />
              </div>
            )}
            {isMobile && (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <LanguageSwitcher lang={lang} setLang={setLang} />
                {loading ? <div style={{ width: 7, height: 7, borderRadius: "50%", border: `2px solid ${C.orange}`, borderTopColor: "transparent", animation: "spin 0.7s linear infinite" }} /> : <LiveDot />}
                <HamburgerButton open={drawer.open} toggle={drawer.toggle} />
              </div>
            )}
          </div>
        </header>

        {isMobile && <MobileDrawer open={drawer.open} close={drawer.close} loading={loading} timeStr={timeStr} tr={tr} />}

        <div id="ceni" style={{ position: "relative", zIndex: 1, maxWidth: 1180, margin: "0 auto", padding: `${isMobile ? "80px" : "100px"} ${px} 0` }}>
          <div style={{ textAlign: "center", marginBottom: isMobile ? 24 : 44, opacity: mounted ? 1 : 0, transform: mounted ? "none" : "translateY(14px)", transition: "all 0.6s cubic-bezier(0.16,1,0.3,1)" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 10, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 100, padding: "4px 14px 4px 6px", marginBottom: 14 }}>
              <span style={{ background: C.orange, color: "#fff", borderRadius: 100, padding: "2px 10px", fontSize: 10, fontWeight: 800, letterSpacing: 0.8 }}>{tr("home.todayBadge")}</span>
              <span style={{ fontSize: 12, color: C.muted, fontWeight: 500 }}>{mounted ? today : ""}</span>
            </div>
            <h1 style={{ fontSize: isMobile ? "24px" : "clamp(28px, 4vw, 48px)", fontWeight: 800, letterSpacing: isMobile ? -1 : -2, lineHeight: 1.08, color: C.text }}>
              {tr("home.heroTitle").split(" · ")[0]} · <span style={{ color: C.orange }}>{tr("home.heroTitle").split(" · ")[1]}</span>
            </h1>
          </div>

          {isMobile ? (
            <div style={{ marginBottom: 32 }}>
              <MobileCarousel fuelData={fuelData} activeIdx={activeIdx} onSelect={handleSelect} timeStr={timeStr} loading={loading} tr={tr} />
            </div>
          ) : (
            <>
              <div style={{ position: "relative", height: 360, marginBottom: 36 }}>
                {fuelData.map((fuel, i) => {
                  const pos = i - activeIdx;
                  const wrapped = pos > fuelData.length / 2 ? pos - fuelData.length : pos < -fuelData.length / 2 ? pos + fuelData.length : pos;
                  return <CarouselCard key={fuel.key} fuel={fuel} position={wrapped} timeStr={timeStr} loading={loading} onClick={() => handleSelect(i)} tr={tr} />;
                })}
              </div>
              <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 48, flexWrap: "wrap" }}>
                {fuelData.map((fuel, i) => {
                  const fc = FUEL_COLORS[fuel.key];
                  const isActive = activeIdx === i;
                  return <button key={fuel.key} onClick={() => handleSelect(i)} style={{ padding: "8px 18px", borderRadius: 10, fontSize: isTablet ? 13 : 14, fontWeight: isActive ? 800 : 600, border: `2px solid ${isActive ? fc.bg : C.border}`, background: isActive ? fc.bg : C.surface, color: isActive ? "#fff" : C.textMid, cursor: "pointer", transition: "all 0.18s ease", transform: isActive ? "translateY(-2px)" : "none", boxShadow: isActive ? `0 6px 20px ${fc.bg}40` : "0 1px 3px rgba(0,0,0,0.04)" }}>{fuel.label}</button>;
                })}
              </div>
            </>
          )}
        </div>

        <div style={{ maxWidth: 1180, margin: "0 auto", padding: `0 ${px}` }}>
          <div style={{ height: 1, background: C.border }} />
        </div>

        <main style={{ position: "relative", zIndex: 1, maxWidth: 1180, margin: "0 auto", padding: `36px ${px} 80px` }}>

          <div style={{ marginBottom: 36 }}><StationPricesTable isMobile={isMobile} tr={tr} /></div>
          <div style={{ height: 1, background: C.border, marginBottom: 36 }} />

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 14, marginBottom: 40 }}>
            <a href="/mapa" style={{ textDecoration: "none", display: "block", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden", transition: "all 0.2s ease" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.borderColor = "#FDE68A"; e.currentTarget.style.boxShadow = "0 12px 32px rgba(0,0,0,0.08)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.borderColor = C.border; e.currentTarget.style.boxShadow = "none"; }}>
              <div style={{ height: 130, background: "linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", bottom: 14, left: 16, display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#D97706", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, boxShadow: "0 4px 12px rgba(217,119,6,0.4)" }}>⛽</div>
                  <span style={{ fontSize: 20, fontWeight: 800, color: "#92400E" }}>{tr("home.cards.gasStations.title")}</span>
                </div>
                <div style={{ position: "absolute", top: 14, right: 14, background: "#92400E", color: "#FEF3C7", fontSize: 11, fontWeight: 700, borderRadius: 6, padding: "3px 9px" }}>{tr("home.cards.gasStations.badge")}</div>
              </div>
              <div style={{ padding: "14px 18px" }}>
                <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6, marginBottom: 8 }}>{tr("home.cards.gasStations.desc")}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#D97706" }}>{tr("home.cards.gasStations.cta")}</div>
              </div>
            </a>
            <a href="/safecity" style={{ textDecoration: "none", display: "block", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden", transition: "all 0.2s ease" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.borderColor = "#FECACA"; e.currentTarget.style.boxShadow = "0 12px 32px rgba(0,0,0,0.08)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.borderColor = C.border; e.currentTarget.style.boxShadow = "none"; }}>
              <div style={{ height: 130, background: "linear-gradient(135deg, #FEF2F2 0%, #FECACA 100%)", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", bottom: 14, left: 16, display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#DC2626", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, boxShadow: "0 4px 12px rgba(220,38,38,0.4)" }}>📷</div>
                  <span style={{ fontSize: 20, fontWeight: 800, color: "#991B1B" }}>{tr("home.cards.safeCity.title")}</span>
                </div>
                <div style={{ position: "absolute", top: 14, right: 14, background: "#991B1B", color: "#FEF2F2", fontSize: 11, fontWeight: 700, borderRadius: 6, padding: "3px 9px" }}>{tr("home.cards.safeCity.badge")}</div>
              </div>
              <div style={{ padding: "14px 18px" }}>
                <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6, marginBottom: 8 }}>{tr("home.cards.safeCity.desc")}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#DC2626" }}>{tr("home.cards.safeCity.cta")}</div>
              </div>
            </a>
          </div>

          <div style={{ height: 1, background: C.border, marginBottom: 36 }} />
          <div style={{ marginBottom: 36 }}><AlertBanner tr={tr} /></div>
          <div style={{ height: 1, background: C.border, marginBottom: 36 }} />
          <div id="calculator" style={{ marginBottom: 36 }}><Calculator fuelData={fuelData} tr={tr} /></div>
          <div style={{ height: 1, background: C.border, marginBottom: 36 }} />
          <div style={{ marginBottom: 36 }}><CarProfile fuelData={fuelData} tr={tr} /></div>
          <div style={{ height: 1, background: C.border, marginBottom: 36 }} />
          <div id="history" style={{ marginBottom: 36 }}><PriceHistory fuelData={fuelData} isMobile={isMobile} tr={tr} lang={lang} /></div>
          <div style={{ height: 1, background: C.border, marginBottom: 36 }} />
          <div id="berza" style={{ marginBottom: 36 }}><Berza tr={tr} /></div>
          <div style={{ height: 1, background: C.border, marginBottom: 36 }} />

          <div style={{ marginBottom: 14 }}>
            <span id="news" style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: C.muted }}>{tr("home.news.label")}</span>
          </div>

          {newsLoading ? (
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
              {[...Array(4)].map((_, i) => (
                <div key={i} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 13, padding: "16px 18px", animation: `fadeUp 0.3s ${i * 0.05}s both` }}>
                  <div style={{ height: 10, width: "40%", background: C.surface2, borderRadius: 6, marginBottom: 12 }} />
                  <div style={{ height: 13, width: "100%", background: C.surface2, borderRadius: 6, marginBottom: 6 }} />
                  <div style={{ height: 13, width: "80%", background: C.surface2, borderRadius: 6, marginBottom: 6 }} />
                  <div style={{ height: 13, width: "60%", background: C.surface2, borderRadius: 6 }} />
                </div>
              ))}
            </div>
          ) : news.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px", color: C.muted, fontSize: 14 }}>{tr("home.news.empty")}</div>
          ) : (
            <>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
                {news.map((n, i) => <NewsCard key={n.url} n={n} i={i} />)}
              </div>
              <div style={{ display: "flex", justifyContent: "center", marginTop: 20 }}>
                <button onClick={loadMoreNews} style={{ padding: "12px 32px", borderRadius: 12, fontSize: 14, fontWeight: 700, background: showAllNews ? C.surface : C.orange, color: showAllNews ? C.textMid : "#fff", border: `2px solid ${showAllNews ? C.border : C.orange}`, cursor: "pointer", transition: "all 0.2s ease" }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(249,115,22,0.3)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}
                >{showAllNews ? tr("home.news.showLess") : tr("home.news.showMore")}</button>
              </div>
            </>
          )}
        </main>

        <footer style={{ borderTop: `1px solid ${C.border}`, background: C.surface }}>
          <div style={{ maxWidth: 1180, margin: "0 auto", padding: `20px ${px}`, display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "flex-start" : "center", justifyContent: "space-between", gap: isMobile ? 10 : 0 }}>
            <a href="/" style={{ fontWeight: 800, fontSize: 16, color: C.orange, textDecoration: "none" }}>makceni.mk</a>
            <div style={{ fontSize: 12, color: C.muted }}>{tr("home.footer.disclaimer")}</div>
            <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
              {[{ label: tr("home.footer.terms"), href: "/uslovi" }, { label: tr("home.footer.privacy"), href: "/privatnost" }, { label: tr("home.footer.contact"), href: "mailto:besartr1995@gmail.com" }].map(l => (
                <a key={l.label} href={l.href} style={{ fontSize: 12, color: C.muted, cursor: "pointer", textDecoration: "none" }} onMouseEnter={e => e.currentTarget.style.color = C.orange} onMouseLeave={e => e.currentTarget.style.color = C.muted}>{l.label}</a>
              ))}
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}