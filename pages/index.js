import ReactDOM from "react-dom";
import { useState, useEffect, useRef, createContext, useContext } from "react";
import Head from "next/head";
import { useLanguage, LanguageSwitcher } from "../translations";

// ── Design tokens ──────────────────────────────────────
const D = {
  bg:          "#000000",
  surface:     "#0C0C14",
  surface2:    "#111120",
  surface3:    "#16162A",
  border:      "#1E1E38",
  borderGlow:  "rgba(100,120,255,0.25)",
  borderHov:   "rgba(124,58,237,0.6)",
  text:        "#F0F0FF",
  textMid:     "#9090B8",
  muted:       "#50507A",
  violet:      "#7C3AED",
  violetLight: "#A78BFA",
  violetDim:   "rgba(124,58,237,0.15)",
  violetBdr:   "rgba(124,58,237,0.35)",
  violetGlow:  "rgba(124,58,237,0.25)",
  cyan:        "#2DD4BF",
  cyanDim:     "rgba(45,212,191,0.15)",
  green:       "#2DD4BF",
  greenBg:     "rgba(45,212,191,0.1)",
  greenBdr:    "rgba(45,212,191,0.25)",
  red:         "#F87171",
  redBg:       "rgba(248,113,113,0.1)",
  redBdr:      "rgba(248,113,113,0.25)",
  orange:      "#F97316",
  orangeBg:    "rgba(249,115,22,0.12)",
  orangeBdr:   "rgba(249,115,22,0.3)",
  glass:       "rgba(14,14,30,0.75)",
  glassBorder: "rgba(80,90,200,0.3)",
  glassBorderActive: "rgba(100,120,255,0.5)",
};

const L = {
  bg:          "#F2F0EB",
  surface:     "#FAFAF8",
  surface2:    "#F0EEE9",
  surface3:    "#E8E5DE",
  border:      "#DDD9D0",
  borderGlow:  "rgba(124,58,237,0.15)",
  borderHov:   "rgba(124,58,237,0.4)",
  text:        "#1A1815",
  textMid:     "#5C5850",
  muted:       "#9B9890",
  violet:      "#7C3AED",
 violetLight: "#6D28D9", 
  violetDim:   "rgba(124,58,237,0.08)",
  violetBdr:   "rgba(124,58,237,0.2)",
  violetGlow:  "rgba(124,58,237,0.15)",
  cyan:        "#0D9488",
  cyanDim:     "rgba(13,148,136,0.1)",
  green:       "#0D9488",
  greenBg:     "rgba(13,148,136,0.08)",
  greenBdr:    "rgba(13,148,136,0.2)",
  red:         "#DC2626",
  redBg:       "rgba(220,38,38,0.08)",
  redBdr:      "rgba(220,38,38,0.2)",
  orange:      "#EA580C",
  orangeBg:    "rgba(234,88,12,0.08)",
  orangeBdr:   "rgba(234,88,12,0.2)",
  glass:       "rgba(242,240,235,0.85)",
  glassBorder: "rgba(0,0,0,0.08)",
  glassBorderActive: "rgba(124,58,237,0.25)",
};

const ThemeCtx = createContext(D);
const useT = () => useContext(ThemeCtx);

const FUEL_ACCENT = {
  benzin95: "#F87171",
  benzin98: "#FCA5A5",
  dizel:    "#2DD4BF",
  lpg:      "#93C5FD",
  cng:      "#67E8F9",
  ekstra:   "#FED7AA",
  mazut:    "#D6D3D1",
};

const FALLBACK = [
  { key:"benzin95", label:"Бензин 95",   unit:"ден/л",  price:86.5, change:7.0,  history:[74,75,76,77,78,79,80,79,80,82,83,84,85,86,86.5], },
  { key:"benzin98", label:"Бензин 98+",  unit:"ден/л",  price:88.5, change:7.0,  history:[76,77,78,79,80,81,82,81,82,84,85,86,87,88,88.5], },
  { key:"dizel",    label:"Дизел",        unit:"ден/л",  price:92.0, change:6.5,  history:[78,79,80,81,82,83,84,83,84,86,87,88,90,91,92], },
  { key:"lpg",      label:"Плин LPG",     unit:"ден/л",  price:53.0, change:0,    history:[50,51,51,52,52,53,53,53,53,53,53,53,53,53,53],  },
  { key:"cng",      label:"Метан CNG",    unit:"ден/кг", price:60.0, change:0,    history:[58,58,59,59,60,60,60,60,60,60,60,60,60,60,60], },
  { key:"ekstra",   label:"Екстра Лесно", unit:"ден/л",  price:89.5, change:7.0,  history:[75,76,77,78,79,80,81,80,81,83,84,85,87,88,89.5],},
  { key:"mazut",    label:"Мазут",        unit:"ден/л",  price:47.5, change:4.9,  history:[38,39,40,40,41,42,42,43,43,44,45,45,46,47,47.5],},
];

const FALLBACK_HISTORY = {
  benzin95:{ "7д":[84.5,85.0,85.0,86.0,86.0,86.5,86.5],"30д":[80,81,81,82,82,83,83,84,84,84,85,85,85,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86.5],"6м":[72,73,74,75,76,77,78,79,80,80,81,82,83,84,85,86,86,86.5,86.5,86.5,86.5,86.5,86.5,86.5] },
  benzin98:{ "7д":[86.5,87.0,87.0,88.0,88.0,88.5,88.5],"30д":[82,83,83,84,84,85,85,86,86,86,87,87,87,88,88,88,88,88,88,88,88,88,88,88,88,88,88,88,88,88.5],"6м":[74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,88,88.5,88.5,88.5,88.5,88.5,88.5,88.5,88.5] },
  dizel:   { "7д":[90.0,90.5,91.0,91.0,91.5,92.0,92.0],"30д":[84,85,85,86,86,87,87,88,88,89,89,90,90,90,91,91,91,91,91,91,91,91,91,91,91,91,92,92,92,92],"6м":[76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,92,92,92,92,92,92,92] },
  lpg:     { "7д":[53,53,53,53,53,53,53],"30д":[52,52,52,52,52,52,52,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53],"6м":[50,50,51,51,51,52,52,52,52,52,53,53,53,53,53,53,53,53,53,53,53,53,53,53] },
  cng:     { "7д":[60,60,60,60,60,60,60],"30д":[59,59,59,59,59,59,59,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60],"6м":[58,58,58,59,59,59,59,59,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60] },
  ekstra:  { "7д":[87.5,88.0,88.0,89.0,89.0,89.5,89.5],"30д":[82,83,83,84,84,85,85,86,86,87,87,88,88,88,89,89,89,89,89,89,89,89,89,89,89,89,89,89,89,89.5],"6м":[73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,89,89.5,89.5,89.5,89.5,89.5,89.5] },
  mazut:   { "7д":[46.5,47.0,47.0,47.5,47.5,47.5,47.5],"30д":[43,43,44,44,44,45,45,45,46,46,46,46,47,47,47,47,47,47,47,47,47,47,47,47,47,47,47,47,47,47.5],"6м":[38,39,39,40,40,41,41,42,42,43,43,44,44,45,45,46,46,47,47,47.5,47.5,47.5,47.5,47.5] },
};

const FALLBACK_STATIONS = [
  { key:"makpetrol", name:"Makpetrol", logo:"/logos/makpetrol.png", prices:{ benzin95:80.5, benzin98:82.5, dizel:88.5, lpg:54.0 } },
  { key:"okta",      name:"Okta",      logo:"/logos/okta.png",      prices:{ benzin95:80.5, benzin98:82.5, dizel:88.5, lpg:54.0 } },
  { key:"lukoil",    name:"Lukoil",    logo:"/logos/lukoil.png",    prices:{ benzin95:80.5, benzin98:82.5, dizel:88.5, lpg:54.0 } },
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
function useScrolled(threshold = 20) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > threshold);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, [threshold]);
  return scrolled;
}
function SectionLabel({ id, label }) {
  const T = useT();
  return (
    <div id={id} style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
      <div style={{ width:3, height:16, borderRadius:2, background:`linear-gradient(180deg,${T.violet},${T.cyan})` }} />
      <span style={{ fontSize:11, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", color:T.muted, display:"flex", alignItems:"center", gap:6 }}>{label}</span>
    </div>
  );
}

function Divider() {
  const T = useT();
  return <div style={{ height:1, background:`linear-gradient(90deg,transparent,${T.border},transparent)`, margin:"40px 0" }} />;
}

function VBadge({ children, style={} }) {
  const T = useT();
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:5, background:T.violetDim, border:`1px solid ${T.violetBdr}`, borderRadius:100, padding:"3px 10px", fontSize:11, fontWeight:700, color:T.violetLight, ...style }}>
      {children}
    </span>
  );
}

function LiveDot({ color }) {
  const T = useT();
  const c = color || T.cyan;
  return (
    <span style={{ position:"relative", display:"inline-flex", alignItems:"center", justifyContent:"center", width:8, height:8 }}>
      <span style={{ position:"absolute", width:8, height:8, borderRadius:"50%", background:c, opacity:0.3, animation:"ping 1.8s ease-in-out infinite" }} />
      <span style={{ width:5, height:5, borderRadius:"50%", background:c, display:"inline-block" }} />
    </span>
  );
}

function GlassCard({ children, style={}, active=false, glow=false, isDark=true }) {
  const T = useT();
  return (
    <div style={{
      background: T.glass,
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      border: `1px solid ${active ? T.glassBorderActive : glow ? T.borderGlow : T.glassBorder}`,
      borderRadius: 20,
      overflow: "hidden",
      boxShadow: active
        ? isDark
          ? `0 0 0 1px rgba(100,120,255,0.3), 0 24px 80px rgba(0,0,30,0.7), inset 0 1px 0 rgba(255,255,255,0.06)`
          : `0 0 0 1px rgba(124,58,237,0.15), 0 24px 80px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.8)`
        : glow
        ? isDark
          ? `0 0 0 1px ${T.violetBdr}, 0 8px 40px rgba(0,0,20,0.6)`
          : `0 0 0 1px ${T.violetBdr}, 0 8px 40px rgba(0,0,0,0.08)`
        : isDark
          ? `0 4px 20px rgba(0,0,10,0.5)`
          : `0 4px 20px rgba(0,0,0,0.06)`,
      position: "relative",
      ...style,
    }}>
      <div style={{ position:"absolute", top:0, left:0, right:0, height:1, background:isDark?`linear-gradient(90deg,transparent,rgba(120,140,255,0.4),transparent)`:`linear-gradient(90deg,transparent,rgba(124,58,237,0.15),transparent)`, pointerEvents:"none" }} />
      {children}
    </div>
  );
}

function Sparkline({ data, color, height=56 }) {
  const width=260;
  const min=Math.min(...data), max=Math.max(...data), range=max-min||1;
  const pts=data.map((v,i)=>{ const x=(i/(data.length-1))*width; const y=height-6-((v-min)/range)*(height-12); return `${x},${y}`; });
  const gid=`sg${Math.random().toString(36).slice(2,6)}`;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ display:"block", width:"100%", height }} preserveAspectRatio="none">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.45" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${height} ${pts.join(" ")} ${width},${height}`} fill={`url(#${gid})`} />
      <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ShareButton({ fuel, tr }) {
  const T = useT();
  const [showMenu, setShowMenu] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });
  const btnRef = useRef(null);
  const ref = useRef(null);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target) && !btnRef.current.contains(e.target)) setShowMenu(false); };
    document.addEventListener("mousedown", h);
    document.addEventListener("touchstart", h);
    return () => { document.removeEventListener("mousedown", h); document.removeEventListener("touchstart", h); };
  }, []);

  const handleOpen = (e) => {
    e.stopPropagation();
    if (!showMenu && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setMenuPos({ top: rect.bottom + window.scrollY + 8, right: window.innerWidth - rect.right });
    }
    setShowMenu(m => !m);
  };

  const priceMsg = tr(`home.priceChange.${fuel.key}`);
  const hasPriceMsg = priceMsg !== `home.priceChange.${fuel.key}`;
  const changeText = fuel.change > 0
    ? tr("home.share.up", { change: fuel.change.toFixed(1) })
    : fuel.change < 0
    ? tr("home.share.down", { change: fuel.change.toFixed(1) })
    : hasPriceMsg ? priceMsg : tr("home.share.noChange");

    const siteLabel = tr("home.share.siteLabel");
const checkAll = tr("home.share.checkAll");
  const msg = `⛽ ${siteLabel} — makceni.mk\n\n${fuel.label}: ${fuel.price.toFixed(1)} ${tr("home.den")}/${fuel.unit.split("/")[1] || "л"}\n${changeText}\n\n${checkAll}: https://makceni.mk`;
  const enc = encodeURIComponent(msg);

  const menu = showMenu ? (
    <div ref={ref} style={{
      position: "absolute",
      top: menuPos.top,
      right: menuPos.right,
      background: T.surface,
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      border: `1px solid ${T.border}`,
      borderRadius: 12,
      overflow: "hidden",
      boxShadow: `0 16px 48px rgba(0,0,0,0.5), 0 0 0 1px ${T.violetBdr}`,
      zIndex: 99999,
      minWidth: 160,
      animation: "fadeUp 0.15s ease",
    }}>
      {[
        { icon: "💬", label: tr("home.share.viber"), href: `viber://forward?text=${enc}` },
        { icon: "🟢", label: tr("home.share.whatsapp"), href: `https://api.whatsapp.com/send?text=${enc}` }
      ].map((item, i) => (
        <div key={i}>
          <div
            onClick={() => { window.location.href = item.href; setShowMenu(false); }}
            style={{ display:"flex", alignItems:"center", gap:10, padding:"11px 16px", color:T.text, fontSize:13, fontWeight:600, cursor:"pointer" }}
            onMouseEnter={e => e.currentTarget.style.background = T.surface2}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          ><span style={{ fontSize: 17 }}>{item.icon}</span>{item.label}</div>
          <div style={{ height: 1, background: T.border }} />
        </div>
      ))}
      <div
        onClick={() => { navigator.clipboard?.writeText(msg); setShowMenu(false); }}
        style={{ display:"flex", alignItems:"center", gap:10, padding:"11px 16px", color:T.text, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}
        onMouseEnter={e => e.currentTarget.style.background = T.surface2}
        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
      ><span style={{ fontSize: 17 }}>📋</span>{tr("home.share.copy")}</div>
    </div>
  ) : null;

  return (
    <>
      <button ref={btnRef} onClick={handleOpen}
        style={{ background:"rgba(124,58,237,0.2)", border:"1px solid rgba(124,58,237,0.35)", borderRadius:8, padding:"4px 9px", cursor:"pointer", fontSize:11, fontWeight:600, color:T.violetLight, display:"flex", alignItems:"center", gap:4, transition:"all 0.15s", backdropFilter:"blur(8px)" }}
        onMouseEnter={e => e.currentTarget.style.background = "rgba(124,58,237,0.35)"}
        onMouseLeave={e => e.currentTarget.style.background = "rgba(124,58,237,0.2)"}
      ><span style={{ fontSize: 13 }}>📤</span>{tr("home.share.button")}</button>
      {typeof document !== "undefined" && menu && ReactDOM.createPortal(menu, document.body)}
    </>
  );
}
function CarouselCard({ fuel, position, onClick, timeStr, loading, tr, isDark }) {
  const T = useT();
  if (Math.abs(position) >= 3) return null;
  const isCenter = position === 0;
  const isAdj    = Math.abs(position) === 1;
  const accent = FUEL_ACCENT[fuel.key] || "#A78BFA";
  const pct    = fuel.price > 0 && fuel.change !== 0 ? ((fuel.change / (fuel.price - fuel.change)) * 100).toFixed(1) : null;
  const hasChange = Math.abs(fuel.change) >= 0.05;
  const CARD_W=340, PEEK_AMOUNT=150, ADJ_X=PEEK_AMOUNT-CARD_W;
  const CENTER_Y=-30, ADJ_Y=10, FAR_Y=30, FAR_EXTRA_X=30;
  const xOff = isCenter?0:isAdj?(position<0?ADJ_X:-ADJ_X):(position<0?ADJ_X-FAR_EXTRA_X:-ADJ_X+FAR_EXTRA_X);
  const yOff = isCenter?CENTER_Y:isAdj?ADJ_Y:FAR_Y;
  const zIdx = isCenter?10:isAdj?5:1;
  const cardBg = isDark ? "rgba(10,10,28,0.88)" : "rgba(255,255,255,0.92)";
  const cardBorder = isDark ? "1.5px solid rgba(90,110,220,0.62)" : `1.5px solid rgba(124,58,237,0.2)`;
const cardShadow = isCenter
    ? isDark
      ? `0 0 0 1px rgba(100,120,255,.28), 0 32px 80px rgba(0,0,20,.85), 0 0 60px ${accent}28, inset 0 1px 0 rgba(255,255,255,.07)`
      : `0 0 0 1px rgba(124,58,237,.15), 0 32px 80px rgba(0,0,0,.12), 0 0 40px ${accent}18, inset 0 1px 0 rgba(255,255,255,.9)`
    : isDark ? `0 0 0 1px rgba(90,110,220,0.3), inset 0 1px 0 rgba(255,255,255,.05)` : `0 0 0 1px rgba(124,58,237,0.1), inset 0 1px 0 rgba(255,255,255,.8)`;
  const priceColor = isDark ? "#fff" : T.text;
  const decColor = isDark ? "rgba(255,255,255,0.6)" : T.muted;
  const timeColor = isDark ? "rgba(255,255,255,0.3)" : T.muted;
  const msgColor = isDark ? "rgba(255,255,255,0.2)" : T.muted;
  const labelColor = isDark ? "rgba(255,255,255,0.95)" : T.text;
  return (
    <div onClick={() => isAdj && onClick()} style={{ position:"absolute", left:"50%", top:"50%", width:CARD_W, transform:`translate(calc(-50% + ${xOff}px), calc(-50% + ${yOff}px))`, transition:"all 0.5s cubic-bezier(0.34,1.56,0.64,1)", zIndex:zIdx, cursor:isAdj?"pointer":"default" }}>
      {isCenter && <div style={{ position:"absolute", inset:-20, borderRadius:32, background:`radial-gradient(ellipse at center, ${accent}18 0%, transparent 70%)`, pointerEvents:"none", zIndex:-1 }} />}
      <div style={{ background:cardBg, backdropFilter:"blur(28px)", WebkitBackdropFilter:"blur(28px)", borderRadius:24, padding:"26px 26px 18px", minHeight:295, display:"flex", flexDirection:"column", justifyContent:"space-between", position:"relative", overflow:"visible", border:cardBorder, boxShadow:cardShadow }}>
        <div style={{ position:"absolute", top:0, left:0, right:0, height:1, background:isDark?`linear-gradient(90deg,transparent,rgba(140,160,255,.65),transparent)`:`linear-gradient(90deg,transparent,rgba(124,58,237,.2),transparent)`, pointerEvents:"none" }} />
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
          <span style={{ fontSize:22, fontWeight:700, color:labelColor, letterSpacing:-0.3 }}>{fuel.label}</span>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            {isCenter && <ShareButton fuel={fuel} tr={tr} />}
            <span style={{ fontSize:11, color:timeColor, fontWeight:500 }}>Ц {timeStr || "—"}</span>
          </div>
        </div>
        <div style={{ marginBottom:6 }}>
          <div style={{ display:"flex", alignItems:"baseline", gap:8, marginBottom:4 }}>
            <span style={{ fontSize:60, fontWeight:800, color:priceColor, letterSpacing:-3, lineHeight:1, display:"flex", alignItems:"baseline" }}>
              {loading ? "—" : (() => { const [whole, dec] = fuel.price.toFixed(2).split("."); return (<>{whole}<span style={{ fontSize:32, fontWeight:700, color:decColor, letterSpacing:-1, marginLeft:2 }}>.{dec}</span></>); })()}
            </span>
            <span style={{ fontSize:18, fontWeight:600, color:isDark?"rgba(255,255,255,0.45)":T.muted, letterSpacing:1 }}>MKD</span>
          </div>
     {hasChange && (
            <div style={{ display:"flex", alignItems:"baseline", gap:6, marginTop:4 }}>
              <span style={{ fontSize:24, fontWeight:700, color:fuel.change>0?T.red:T.cyan, letterSpacing:-0.5 }}>{fuel.change>0?"+":"-"}{Math.abs(parseFloat(pct))}%</span>
              <span style={{ fontSize:13, color:isDark?"rgba(255,255,255,0.3)":T.muted, fontWeight:500 }}>{fuel.change>0?"↑":"↓"} {Math.abs(fuel.change).toFixed(1)} {tr("home.den")}</span>
            </div>
          )}
          {tr(`home.priceChange.${fuel.key}`) !== `home.priceChange.${fuel.key}` && (
            <div style={{ fontSize:13, color:msgColor, marginTop:4 }}>
              {tr(`home.priceChange.${fuel.key}`)}
            </div>
          )}
        </div>
        <div style={{ marginTop:"auto", paddingTop:14, borderTop:isDark?"1px solid rgba(255,255,255,0.06)":`1px solid ${T.border}` }}>
          <Sparkline data={fuel.history} color={accent} height={54} />
        </div>
      </div>
    </div>
  );
}

function MobileCarousel({ fuelData, activeIdx, onSelect, timeStr, loading, tr, isDark }) {
  const T = useT();
  const n = fuelData.length;
  const containerRef = useRef(null);
  const stateRef = useRef({ startX:0, startY:0, startTime:0, isDragging:false, lockedAxis:null });
  const [dragX, setDragX] = useState(0);
  const CARD_W=300, PEEK=30, CENTER_Y=-12, SIDE_Y=18, SIDE_SCALE=0.88;
  const prev = (activeIdx-1+n)%n;
  const next = (activeIdx+1)%n;
  const dragProgress = Math.min(Math.abs(dragX)/(CARD_W-PEEK),1);
  const lerp = (a,b,t) => a+(b-a)*t;
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onTouchStart=(e)=>{ stateRef.current.startX=e.touches[0].clientX; stateRef.current.startY=e.touches[0].clientY; stateRef.current.startTime=Date.now(); stateRef.current.isDragging=true; stateRef.current.lockedAxis=null; };
    const onTouchMove=(e)=>{ if(!stateRef.current.isDragging) return; const dx=e.touches[0].clientX-stateRef.current.startX; const dy=e.touches[0].clientY-stateRef.current.startY; if(!stateRef.current.lockedAxis){ if(Math.abs(dx)<4&&Math.abs(dy)<4) return; stateRef.current.lockedAxis=Math.abs(dx)>Math.abs(dy)?"h":"v"; } if(stateRef.current.lockedAxis==="v") return; e.preventDefault(); setDragX(dx*0.78); };
    const onTouchEnd=(e)=>{ if(!stateRef.current.isDragging) return; stateRef.current.isDragging=false; if(stateRef.current.lockedAxis!=="h"){ setDragX(0); return; } const dx=e.changedTouches[0].clientX-stateRef.current.startX; const dt=Date.now()-stateRef.current.startTime; const threshold=dt<220?20:60; setDragX(0); if(dx<-threshold) onSelect((activeIdx+1)%n); else if(dx>threshold) onSelect((activeIdx-1+n)%n); };
    el.addEventListener("touchstart",onTouchStart,{passive:true});
    el.addEventListener("touchmove",onTouchMove,{passive:false});
    el.addEventListener("touchend",onTouchEnd,{passive:true});
    return()=>{ el.removeEventListener("touchstart",onTouchStart); el.removeEventListener("touchmove",onTouchMove); el.removeEventListener("touchend",onTouchEnd); };
  }, [activeIdx,n,onSelect]);

  const renderCard=(fuel,position)=>{
    const isCenter=position===0;
    const accent=FUEL_ACCENT[fuel.key]||"#A78BFA";
    const pct=fuel.price>0&&fuel.change!==0?((fuel.change/(fuel.price-fuel.change))*100).toFixed(1):null;
    const hasChange=Math.abs(fuel.change)>=0.05;
    const isEntering=(dragX<0&&position===1)||(dragX>0&&position===-1);
    const scale=isCenter?lerp(1.0,SIDE_SCALE,dragProgress):isEntering?lerp(SIDE_SCALE,1.0,dragProgress):SIDE_SCALE;
    const yOff=isCenter?lerp(CENTER_Y,SIDE_Y,dragProgress):isEntering?lerp(SIDE_Y,CENTER_Y,dragProgress):SIDE_Y;
    const zIdx=isCenter?10:isEntering&&dragProgress>0.5?9:2;
    const xOff=isCenter?0:position*(CARD_W-PEEK);
    const cardBg=isDark?"rgba(10,10,28,0.90)":"rgba(255,255,255,0.92)";
    const cardBorder=isDark?"1.5px solid rgba(90,110,220,0.62)":`1.5px solid rgba(124,58,237,0.2)`;
    const cardShadow=isCenter?(isDark?`0 0 0 1px rgba(100,120,255,.28), 0 24px 60px rgba(0,0,20,.85), 0 0 48px ${accent}22, inset 0 1px 0 rgba(255,255,255,.07)`:`0 0 0 1px rgba(124,58,237,.12), 0 24px 60px rgba(0,0,0,.1), 0 0 32px ${accent}14, inset 0 1px 0 rgba(255,255,255,.9)`):(isDark?`0 0 0 1px rgba(90,110,220,0.25), inset 0 1px 0 rgba(255,255,255,.04)`:`0 0 0 1px rgba(124,58,237,0.08), inset 0 1px 0 rgba(255,255,255,.8)`);
    const priceColor=isDark?"#fff":T.text;
    const decColor=isDark?"rgba(255,255,255,0.6)":T.muted;
    const labelColor=isDark?"rgba(255,255,255,0.95)":T.text;
    const msgColor=isDark?"rgba(255,255,255,0.2)":T.muted;
    return (
      <div key={fuel.key} onClick={()=>!isCenter&&onSelect(position===-1?prev:next)} style={{ position:"absolute", top:"50%", left:"50%", width:CARD_W, transform:`translate(calc(-50% + ${xOff+dragX}px), calc(-50% + ${yOff}px)) scale(${scale})`, transition:dragX!==0?"none":"transform 0.45s cubic-bezier(0.34,1.4,0.64,1)", zIndex:zIdx, cursor:isCenter?"default":"pointer", willChange:"transform", transformOrigin:"center center" }}>
        <div style={{ background:cardBg, backdropFilter:"blur(28px)", WebkitBackdropFilter:"blur(28px)", border:cardBorder, borderRadius:22, padding:"20px 20px 14px", minHeight:260, display:"flex", flexDirection:"column", justifyContent:"space-between", position:"relative", overflow:"visible", boxShadow:cardShadow }}>
          <div style={{ position:"absolute", top:0, left:0, right:0, height:1, background:isDark?`linear-gradient(90deg,transparent,rgba(140,160,255,.6),transparent)`:`linear-gradient(90deg,transparent,rgba(124,58,237,.15),transparent)`, pointerEvents:"none" }} />
          {isCenter&&<div style={{ position:"absolute", inset:-16, borderRadius:30, background:`radial-gradient(ellipse at center,${accent}14 0%,transparent 68%)`, pointerEvents:"none", zIndex:0 }} />}
          <div style={{ position:"relative", zIndex:1, display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
            <span style={{ fontSize:19, fontWeight:700, color:labelColor, letterSpacing:-0.2 }}>{fuel.label}</span>
            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
              {isCenter&&<ShareButton fuel={fuel} tr={tr} />}
              <span style={{ fontSize:10, color:isDark?"rgba(255,255,255,0.25)":T.muted }}>Ц {timeStr||"—"}</span>
            </div>
          </div>
          <div style={{ position:"relative", zIndex:1, marginBottom:4 }}>
            <div style={{ display:"flex", alignItems:"baseline", gap:6, marginBottom:3 }}>
              <span style={{ fontSize:60, fontWeight:800, color:priceColor, letterSpacing:-3, lineHeight:1, display:"flex", alignItems:"baseline" }}>
                {loading?"—":(() => { const [whole,dec]=fuel.price.toFixed(2).split("."); return (<>{whole}<span style={{ fontSize:32, fontWeight:700, color:decColor, letterSpacing:-1, marginLeft:2 }}>.{dec}</span></>); })()}
              </span>
              <span style={{ fontSize:14, fontWeight:600, color:isDark?"rgba(255,255,255,0.4)":T.muted, letterSpacing:0.8 }}>MKD</span>
            </div>
       {hasChange && (
              <div style={{ display:"flex", alignItems:"baseline", gap:5 }}>
                <span style={{ fontSize:20, fontWeight:700, color:fuel.change>0?T.red:T.cyan }}>{fuel.change>0?"+":"-"}{Math.abs(parseFloat(pct))}%</span>
                <span style={{ fontSize:11, color:isDark?"rgba(255,255,255,0.25)":T.muted }}>{Math.abs(fuel.change).toFixed(1)} {tr("home.den")}</span>
              </div>
            )}
            {tr(`home.priceChange.${fuel.key}`) !== `home.priceChange.${fuel.key}` && (
              <div style={{ fontSize:11, color:msgColor }}>
                {tr(`home.priceChange.${fuel.key}`)}
              </div>
            )}
          </div>
          <div style={{ position:"relative", zIndex:1, marginTop:"auto", paddingTop:10, borderTop:isDark?"1px solid rgba(255,255,255,0.06)":`1px solid ${T.border}` }}>
            <Sparkline data={fuel.history} color={accent} height={44} />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ position:"relative" }}>
      <div ref={containerRef} style={{ position:"relative", height:310, overflow:"visible", userSelect:"none", WebkitUserSelect:"none", touchAction:"pan-y" }}>
        {renderCard(fuelData[prev],-1)}
        {renderCard(fuelData[next],1)}
        {renderCard(fuelData[activeIdx],0)}
      </div>
      <div style={{ textAlign:"center", marginTop:8 }}>
        <span style={{ fontSize:12, color:T.muted, fontWeight:500 }}>{tr("home.swipeHint")}</span>
      </div>
      <div style={{ display:"flex", justifyContent:"center", gap:6, marginTop:12, flexWrap:"wrap" }}>
        {fuelData.map((f,i)=>{ const isActive=i===activeIdx; const fa=FUEL_ACCENT[f.key]; return (
          <button key={f.key} onClick={()=>onSelect(i)} style={{ padding:"5px 13px", borderRadius:8, fontSize:12, fontWeight:isActive?700:500, border:`1px solid ${isActive?fa+"55":"rgba(60,70,140,0.3)"}`, background:isActive?`${fa}18`:isDark?"rgba(10,10,20,0.5)":T.surface2, color:isActive?fa:T.muted, cursor:"pointer", transition:"all 0.18s", boxShadow:isActive?`0 0 10px ${fa}2a`:"none", fontFamily:"inherit" }}>{f.label}</button>
        ); })}
      </div>
    </div>
  );
}

function PriceHistory({ fuelData, isMobile, tr, lang, isDark }) {
  const T = useT();
  const [activeFuel,setActiveFuel]=useState("benzin95");
  const [activePeriodKey,setActivePeriodKey]=useState("7д");
  const [historyData,setHistoryData]=useState(null);
  const [historyLoading,setHistoryLoading]=useState(false);
  const canvasRef=useRef(null); const chartRef=useRef(null);
  const localeMap={mk:"mk-MK",sq:"sq-AL",en:"en-GB",tr:"tr-TR"};
  const locale=localeMap[lang]||"mk-MK";
  const periodOptions=[{key:"7д",label:tr("home.priceHistory.period7d")},{key:"30д",label:tr("home.priceHistory.period30d")},{key:"6м",label:tr("home.priceHistory.period6m")}];
  const fuel=fuelData.find(f=>f.key===activeFuel)||fuelData[0];
  const accent=FUEL_ACCENT[activeFuel]||"#A78BFA";
  useEffect(()=>{ const pm={"7д":"7d","30д":"30d","6м":"6m"}; setHistoryLoading(true); fetch(`/api/prices?history=1&period=${pm[activePeriodKey]}`).then(r=>r.json()).then(d=>{ const e=d.history||[]; setHistoryData(e.length>=2?e:null); setHistoryLoading(false); }).catch(()=>{ setHistoryData(null); setHistoryLoading(false); }); },[activePeriodKey]);
  const expectedPoints=activePeriodKey==="7д"?7:activePeriodKey==="30д"?30:24;
  const data=(()=>{ if(historyData&&historyData.length>=2){ const p=historyData.map(e=>e.prices?.[activeFuel]).filter(p=>typeof p==="number"); if(p.length>=2){ const withLast=[...p.slice(0,-1),fuel.price]; if(withLast.length<expectedPoints){ const raw=FALLBACK_HISTORY[activeFuel]?.[activePeriodKey]||fuel.history; return [...raw.slice(0,expectedPoints-withLast.length),...withLast]; } return withLast; } } const raw=FALLBACK_HISTORY[activeFuel]?.[activePeriodKey]||fuel.history; return [...raw.slice(0,-1),fuel.price]; })();
  const isRealData=historyData&&historyData.length>=2;
  useEffect(()=>{
    if(!canvasRef.current||historyLoading) return;
    const render=()=>{
      if(chartRef.current){ chartRef.current.destroy(); chartRef.current=null; }
      if(!canvasRef.current) return;
      const ctx=canvasRef.current.getContext("2d");
      const labels=data.map((_,i)=>{ const d=new Date(); if(activePeriodKey==="7д"){ d.setDate(d.getDate()-(data.length-1-i)); return d.toLocaleDateString(locale,{weekday:"short"}); } if(activePeriodKey==="30д"){ d.setDate(d.getDate()-(data.length-1-i)); return i%5===0?d.toLocaleDateString(locale,{day:"numeric",month:"short"}):""; } d.setMonth(d.getMonth()-(data.length-1-i)); return i%4===0?d.toLocaleDateString(locale,{month:"short"}):""; });
      chartRef.current=new window.Chart(ctx,{ type:"bar", data:{ labels, datasets:[{ data, backgroundColor:(ctx2)=>{ const g=ctx2.chart.ctx.createLinearGradient(0,0,0,200); g.addColorStop(0,accent+"cc"); g.addColorStop(1,accent+"22"); return g; }, hoverBackgroundColor:accent, borderColor:accent+"00", borderWidth:0, borderRadius:4, borderSkipped:false }] }, options:{ responsive:true, maintainAspectRatio:false, interaction:{ intersect:false, mode:"index" }, plugins:{ legend:{display:false}, tooltip:{ backgroundColor:isDark?"rgba(10,10,22,0.97)":"rgba(255,255,255,0.97)", titleColor:T.muted, bodyColor:T.text, bodyFont:{size:14,weight:"700"}, padding:12, cornerRadius:10, borderColor:isDark?"rgba(255,255,255,0.08)":T.border, borderWidth:1, callbacks:{label:(c)=>` ${c.raw.toFixed(2)} MKD`} } }, scales:{ x:{ grid:{display:false}, ticks:{color:T.muted,font:{size:11}}, border:{display:false} }, y:{ grid:{color:isDark?"rgba(255,255,255,0.04)":T.border,lineWidth:1,drawTicks:false}, ticks:{color:T.muted,font:{size:11},padding:8,callback:v=>`${v}`}, border:{display:false} } } } });
    };
    if(window.Chart){ render(); } else { const s=document.createElement("script"); s.src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"; s.onload=render; document.head.appendChild(s); }
    return ()=>{ if(chartRef.current){ chartRef.current.destroy(); chartRef.current=null; } };
  },[activeFuel,activePeriodKey,data,historyLoading,isDark]);
  const minP=data.length?Math.min(...data).toFixed(1):"—"; const maxP=data.length?Math.max(...data).toFixed(1):"—"; const curP=fuel.price.toFixed(2);
  const diff=data.length>=2?(data[data.length-1]-data[0]).toFixed(1):"0"; const dp=parseFloat(diff)>0; const dn=parseFloat(diff)<0;
  const tabBtn=(active)=>({ padding:"6px 16px", borderRadius:8, border:"none", cursor:"pointer", fontSize:12, fontWeight:700, fontFamily:"inherit", background:active?isDark?"rgba(255,255,255,0.08)":T.surface3:"transparent", color:active?T.text:T.muted, transition:"all 0.15s" });
  return (
    <GlassCard glow isDark={isDark} style={{ borderRadius:20, overflow:"hidden" }}>
      <div style={{ padding:"22px 24px 0" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:12, marginBottom:20 }}>
          <div>
         <div style={{ fontSize:16, fontWeight:700, color:T.text, marginBottom:3, display:"flex", alignItems:"center", gap:8 }}><img src="/icons/chart.png" style={{width:32,height:32,objectFit:"contain", filter:isDark?"none":"invert(1)"}}/>{tr("home.priceHistory.title")}</div>
<div style={{ fontSize:12, color:T.muted }}>{isRealData?tr("home.priceHistory.subtitleReal"):tr("home.priceHistory.subtitleFallback")}</div>
 </div>
          <div style={{ display:"flex", gap:2, background:isDark?"rgba(255,255,255,0.04)":T.surface2, borderRadius:10, padding:"3px" }}>
            {periodOptions.map(p=><button key={p.key} onClick={()=>setActivePeriodKey(p.key)} style={tabBtn(activePeriodKey===p.key)}>{p.label}</button>)}
          </div>
        </div>
        <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:20 }}>
          {fuelData.map(f=>{ const isActive=f.key===activeFuel; const fa=FUEL_ACCENT[f.key]; return (
            <button key={f.key} onClick={()=>setActiveFuel(f.key)} style={{ padding:"4px 12px", borderRadius:20, fontSize:11, fontWeight:600, cursor:"pointer", transition:"all 0.12s", fontFamily:"inherit", border:`1px solid ${isActive?fa+"66":isDark?"rgba(255,255,255,0.08)":T.border}`, background:isActive?`${fa}18`:"transparent", color:isActive?fa:T.muted, boxShadow:isActive?`0 0 10px ${fa}22`:"none" }}>{f.label}</button>
          ); })}
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:0, marginBottom:4, borderTop:`1px solid ${isDark?"rgba(255,255,255,0.05)":T.border}`, paddingTop:16 }}>
          {[{label:tr("home.priceHistory.current"),value:curP,unit:"MKD",color:T.text},{label:tr("home.priceHistory.min"),value:minP,unit:"MKD",color:T.cyan},{label:tr("home.priceHistory.max"),value:maxP,unit:"MKD",color:T.red},{label:tr("home.priceHistory.change"),value:`${dp?"+":""}${diff}`,unit:"MKD",color:dp?T.red:dn?T.cyan:T.muted}].map(({label,value,unit,color},i,arr)=>(
            <div key={label} style={{ paddingRight:16, borderRight:i<arr.length-1?`1px solid ${isDark?"rgba(255,255,255,0.05)":T.border}`:"none", paddingLeft:i>0?16:0 }}>
              <div style={{ fontSize:10, fontWeight:600, color:T.muted, letterSpacing:1, textTransform:"uppercase", marginBottom:6 }}>{label}</div>
              <div style={{ display:"flex", alignItems:"baseline", gap:4 }}>
                <span style={{ fontSize:isMobile?15:18, fontWeight:800, color, letterSpacing:-0.5 }}>{value}</span>
                <span style={{ fontSize:10, color:T.muted, fontWeight:500 }}>{unit}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ height:240, position:"relative", padding:"8px 16px 16px" }}>
        {historyLoading&&<div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", background:isDark?"rgba(0,0,10,0.7)":"rgba(242,240,235,0.7)", zIndex:2, borderRadius:8 }}><div style={{ width:20, height:20, border:`2px solid ${T.violet}`, borderTopColor:"transparent", borderRadius:"50%", animation:"spin 0.7s linear infinite" }} /></div>}
        <canvas ref={canvasRef} />
      </div>
      {!isRealData&&<div style={{ padding:"0 24px 14px", fontSize:11, color:T.muted }}>{tr("home.priceHistory.disclaimer")}</div>}
    </GlassCard>
  );
}

function CarProfile({ fuelData, tr, isDark }) {
  const T = useT();
  const [editing,setEditing]=useState(false); const [profile,setProfile]=useState(null); const [form,setForm]=useState({model:"",consumption:"7.5",fuelKey:"benzin95"});
  useEffect(()=>{ try{ const s=localStorage.getItem("makceni_car_profile"); if(s){ const p=JSON.parse(s); setProfile(p); setForm(p); } }catch{} },[]);
  const save=()=>{ if(!form.model.trim()) return; const p={...form,consumption:parseFloat(form.consumption)||7.5}; try{ localStorage.setItem("makceni_car_profile",JSON.stringify(p)); }catch{} setProfile(p); setEditing(false); };
  const clear=()=>{ try{ localStorage.removeItem("makceni_car_profile"); }catch{} setProfile(null); setForm({model:"",consumption:"7.5",fuelKey:"benzin95"}); setEditing(false); };
  const fuel=fuelData.find(f=>f.key===(profile?.fuelKey||form.fuelKey))||fuelData[0];
  const cons=parseFloat(profile?.consumption||form.consumption)||7.5;
  const costPerKm=fuel?((cons/100)*fuel.price).toFixed(2):"—"; const costPer100=fuel?((cons/100)*fuel.price*100).toFixed(0):"—";
  const inp={ background:isDark?"rgba(0,0,0,0.4)":T.surface, border:`1px solid ${T.border}`, borderRadius:9, padding:"9px 12px", color:T.text, fontSize:13, fontWeight:500, width:"100%", outline:"none", fontFamily:"inherit", backdropFilter:"blur(8px)" };
  return (
    <GlassCard glow isDark={isDark} style={{ borderRadius:20, overflow:"hidden" }}>
      <div style={{ padding:"18px 22px", background:isDark?"rgba(12,12,24,0.8)":T.surface2, borderBottom:`1px solid ${T.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div><div style={{ fontSize:15, fontWeight:700, color:T.text, display:"flex", alignItems:"center", gap:8 }}><img src="/icons/car.png" style={{width:32,height:32,objectFit:"contain", filter:isDark?"none":"invert(1)"}}/>{tr("home.carProfile.title")}</div><div style={{ fontSize:12, color:T.muted, marginTop:2 }}>{tr("home.carProfile.subtitle")}</div></div>
        {profile&&!editing&&<div style={{display:"flex",gap:6}}>
          <button onClick={()=>setEditing(true)} style={{ padding:"5px 12px", borderRadius:8, border:`1px solid ${T.border}`, background:isDark?"rgba(0,0,0,0.4)":T.surface, color:T.textMid, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>{tr("home.carProfile.edit")}</button>
          <button onClick={clear} style={{ padding:"5px 12px", borderRadius:8, border:`1px solid ${T.redBdr}`, background:T.redBg, color:T.red, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>{tr("home.carProfile.delete")}</button>
        </div>}
      </div>
      <div style={{padding:"20px 22px"}}>
        {!profile||editing?(
          <div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
              <div><div style={{ fontSize:10, fontWeight:700, color:T.muted, letterSpacing:0.8, textTransform:"uppercase", marginBottom:5 }}>{tr("home.carProfile.modelLabel")}</div><input type="text" placeholder={tr("home.carProfile.modelPlaceholder")} value={form.model} onChange={e=>setForm(f=>({...f,model:e.target.value}))} style={inp} /></div>
              <div><div style={{ fontSize:10, fontWeight:700, color:T.muted, letterSpacing:0.8, textTransform:"uppercase", marginBottom:5 }}>{tr("home.carProfile.consumption")}</div><input type="number" step="0.1" min="3" max="25" value={form.consumption} onChange={e=>setForm(f=>({...f,consumption:e.target.value}))} style={inp} /></div>
            </div>
            <div style={{marginBottom:16}}><div style={{ fontSize:10, fontWeight:700, color:T.muted, letterSpacing:0.8, textTransform:"uppercase", marginBottom:5 }}>{tr("home.carProfile.fuelType")}</div><select value={form.fuelKey} onChange={e=>setForm(f=>({...f,fuelKey:e.target.value}))} style={{...inp,cursor:"pointer"}}>{fuelData.map(f=><option key={f.key} value={f.key}>{f.label}</option>)}</select></div>
            <div style={{display:"flex",gap:8}}>
              {editing&&<button onClick={()=>setEditing(false)} style={{ flex:1, padding:"10px", borderRadius:9, border:`1px solid ${T.border}`, background:isDark?"rgba(0,0,0,0.4)":T.surface, color:T.textMid, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>{tr("home.carProfile.cancel")}</button>}
              <button onClick={save} style={{ flex:2, padding:"10px", borderRadius:9, border:"none", background:`linear-gradient(135deg,${T.violet},#4C1D95)`, color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit", boxShadow:`0 0 20px ${T.violetGlow}` }}>{editing?tr("home.carProfile.saveChanges"):tr("home.carProfile.save")}</button>
            </div>
          </div>
        ):(
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:18 }}>
              <div style={{ width:44, height:44, borderRadius:12, background:T.violetDim, border:`1px solid ${T.violetBdr}`, display:"flex", alignItems:"center", justifyContent:"center" }}><img src="/icons/car.png" style={{width:28,height:28,objectFit:"contain", filter:isDark?"none":"invert(1)"}}/></div>
              <div><div style={{ fontSize:17, fontWeight:800, color:T.text }}>{profile.model}</div><div style={{ fontSize:12, color:T.muted }}>{profile.consumption} л/100км · {fuel.label}</div></div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
              <div style={{ background:T.violetDim, border:`1px solid ${T.violetBdr}`, borderRadius:12, padding:"14px 16px" }}>
                <div style={{ fontSize:10, fontWeight:700, color:T.violetLight, letterSpacing:0.8, textTransform:"uppercase", marginBottom:4 }}>{tr("home.carProfile.costPerKm")}</div>
                <div style={{ fontSize:28, fontWeight:800, color:T.violetLight, letterSpacing:-1, lineHeight:1 }}>{costPerKm}</div>
                <div style={{ fontSize:11, color:T.muted, marginTop:2 }}>ден/км</div>
              </div>
              <div style={{ background:isDark?"rgba(0,0,0,0.4)":T.surface2, border:`1px solid ${T.border}`, borderRadius:12, padding:"14px 16px" }}>
                <div style={{ fontSize:10, fontWeight:700, color:T.muted, letterSpacing:0.8, textTransform:"uppercase", marginBottom:4 }}>{tr("home.carProfile.costPer100")}</div>
                <div style={{ fontSize:28, fontWeight:800, color:T.text, letterSpacing:-1, lineHeight:1 }}>{costPer100}</div>
                <div style={{ fontSize:11, color:T.muted, marginTop:2 }}>ден</div>
              </div>
            </div>
            <div style={{ background:T.violetDim, border:`1px solid ${T.violetBdr}`, borderRadius:10, padding:"12px 14px" }}>
              <div style={{ fontSize:13, fontWeight:600, color:T.text, lineHeight:1.6 }}>Твојот <strong>{profile.model}</strong> чини <strong style={{color:T.violetLight}}>{costPerKm} ден/км</strong> денес со {fuel.label} на <strong style={{color:T.violetLight}}>{fuel.price.toFixed(2)} MKD</strong>.</div>
            </div>
          </div>
        )}
      </div>
    </GlassCard>
  );
}

function useDrawer() { const [open,setOpen]=useState(false); return { open, toggle:()=>setOpen(o=>!o), close:()=>setOpen(false) }; }

function HamburgerButton({ open, toggle }) {
  const T = useT();
  return (
    <button onClick={toggle} aria-label="Menu" style={{ display:"flex", flexDirection:"column", justifyContent:"center", alignItems:"center", gap:5, width:40, height:40, background:T.surface, backdropFilter:"blur(12px)", border:`1px solid ${open?T.borderGlow:T.border}`, borderRadius:10, cursor:"pointer", padding:0, flexShrink:0 }}>
      {[open?"rotate(45deg) translate(5px,5px)":"none","none",open?"rotate(-45deg) translate(5px,-5px)":"none"].map((t,i)=>(
        <span key={i} style={{ width:18, height:2, background:open?T.violetLight:T.text, borderRadius:2, transition:"all 0.22s", transform:t, opacity:i===1&&open?0:1, display:"block" }} />
      ))}
    </button>
  );
}

function MobileDrawer({ open, close, loading, timeStr, tr, isDark }) {
  const T = useT();
  return (
    <>
      <div onClick={close} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", backdropFilter:"blur(6px)", WebkitBackdropFilter:"blur(6px)", zIndex:998, opacity:open?1:0, pointerEvents:open?"auto":"none", transition:"opacity 0.3s" }} />
      <div style={{ position:"fixed", top:0, right:0, bottom:0, width:"80%", maxWidth:300, background:isDark?"rgba(10,10,22,0.97)":T.surface, backdropFilter:"blur(24px)", WebkitBackdropFilter:"blur(24px)", zIndex:999, boxShadow:`-1px 0 0 ${T.border},-16px 0 60px rgba(0,0,0,0.15)`, transform:open?"translateX(0)":"translateX(100%)", transition:"transform 0.32s cubic-bezier(0.16,1,0.3,1)", display:"flex", flexDirection:"column", overflowY:"auto" }}>
        <div style={{ position:"absolute", top:0, left:0, right:0, height:1, background:`linear-gradient(90deg,transparent,${T.violetBdr},transparent)` }} />
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"18px 20px 14px", borderBottom:`1px solid ${T.border}` }}>
          <a href="/" style={{textDecoration:"none"}}><img src={isDark ? "/logo2.png" : "/logo.png"} alt="makceni.mk" style={{height:92,width:"auto"}} /></a>
          <button onClick={close} style={{ width:34, height:34, borderRadius:9, border:`1px solid ${T.border}`, background:isDark?"rgba(0,0,0,0.4)":T.surface2, cursor:"pointer", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center", color:T.text }}>✕</button>
        </div>
        <div style={{ padding:"10px 20px", background:isDark?"rgba(0,0,0,0.3)":T.surface2, borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", gap:7 }}>
          {loading?<div style={{ width:7, height:7, borderRadius:"50%", border:`2px solid ${T.violet}`, borderTopColor:"transparent", animation:"spin 0.7s linear infinite" }} />:<LiveDot />}
          <span style={{ fontSize:12, color:T.muted, fontWeight:500 }}>{loading?tr("nav.loading"):timeStr?tr("nav.updated",{time:timeStr}):tr("nav.live")}</span>
        </div>
        <nav style={{padding:"8px 14px"}}>
          {[[tr("nav.prices"),"#ceni"],[tr("nav.calculator"),"#calculator"],[tr("nav.history"),"#history"],[tr("nav.berza"),"#berza"],[tr("nav.news"),"#news"]].map(([label,href])=>(
            <a key={label} href={href} onClick={close} style={{ display:"flex", alignItems:"center", padding:"15px 10px", fontSize:16, fontWeight:600, color:T.text, textDecoration:"none", borderBottom:`1px solid ${T.border}` }}
              onTouchStart={e=>e.currentTarget.style.background=T.surface2}
              onTouchEnd={e=>e.currentTarget.style.background="transparent"}
            >{label}</a>
          ))}
        </nav>
        <div style={{padding:"14px",display:"flex",flexDirection:"column",gap:10}}>
          <a href="/mapa" onClick={close} style={{ display:"flex", alignItems:"center", padding:"15px 10px", fontSize:16, fontWeight:600, color:T.text, textDecoration:"none", borderBottom:`1px solid ${T.border}`, gap:12 }} onTouchStart={e=>e.currentTarget.style.background=T.surface2} onTouchEnd={e=>e.currentTarget.style.background="transparent"}><img src={isDark?"/icons/gasstation1.png":"/icons/gasstation.png"} style={{ width:24, height:24, objectFit:"cover", borderRadius:4 }} />{tr("nav.gasStations")}</a>
          <a href="/safecity" onClick={close} style={{ display:"flex", alignItems:"center", padding:"15px 10px", fontSize:16, fontWeight:600, color:T.text, textDecoration:"none", borderBottom:`1px solid ${T.border}`, gap:12 }} onTouchStart={e=>e.currentTarget.style.background=T.surface2} onTouchEnd={e=>e.currentTarget.style.background="transparent"}><img src={isDark?"/icons/safecity1.png":"/icons/safecity.png"} style={{ width:24, height:24, objectFit:"cover", borderRadius:4 }} />{tr("nav.safeCity")}</a>
        </div>
      </div>
    </>
  );
}

function Berza({ tr, isDark }) {
  const T = useT();
  const [data,setData]=useState(null); const [loading,setLoading]=useState(true);
  useEffect(()=>{ fetch("/api/berza").then(r=>r.json()).then(d=>{ setData(d); setLoading(false); }).catch(()=>setLoading(false)); },[]);
  const oil=(data?.oil||[{name:"Brent Crude",usd:null,mkd:null,change:0,unit:"barrel"},{name:"WTI Crude",usd:null,mkd:null,change:0,unit:"barrel"}]).map(o=>({...o,unit:tr("home.berza.barrel")}));
  const metals=(data?.metals||[{name:"gold",usd:null,mkd:null,change:0,unit:"gram"},{name:"silver",usd:null,mkd:null,change:0,unit:"gram"}]).map(m=>({...m,name:m.name==="gold"?tr("home.berza.gold"):m.name==="silver"?tr("home.berza.silver"):m.name,unit:tr("home.berza.gram")}));
  const crypto=data?.crypto||[{name:"Bitcoin",usd:null,mkd:null,change:0,unit:"BTC"},{name:"Ethereum",usd:null,mkd:null,change:0,unit:"ETH"}];
  const Row=({item,last})=>{ const usd=item.usd!=null?`$${typeof item.usd==="number"?item.usd.toLocaleString():item.usd}`:"—"; const mkd=item.mkd!=null?`${typeof item.mkd==="number"?item.mkd.toLocaleString():item.mkd} ден / ${item.unit}`:tr("home.berza.loading"); return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 0", borderBottom:last?"none":`1px solid ${T.border}` }}>
      <div><div style={{ fontSize:14, fontWeight:600, color:T.text }}>{item.name}</div><div style={{ fontSize:12, color:T.muted, marginTop:2 }}>{loading?tr("home.berza.loading"):mkd}</div></div>
      <div style={{textAlign:"right"}}><div style={{ fontSize:20, fontWeight:800, color:T.text }}>{loading?"—":usd}</div>{!loading&&typeof item.change==="number"&&item.change!==0&&<div style={{ fontSize:11, fontWeight:700, color:item.change>0?T.red:T.cyan, marginTop:2 }}>{item.change>0?"▲ +":"▼ "}{Math.abs(item.change)}{tr("home.berza.todayChange")}</div>}</div>
    </div>
  ); };
  const Section=({emoji,title,items,border})=>(
    <div style={{ padding:"0 22px", borderBottom:border?`1px solid ${T.border}`:"none" }}>
      <div style={{ fontSize:10, fontWeight:700, color:T.muted, letterSpacing:1, textTransform:"uppercase", paddingTop:12, paddingBottom:2 }}>{emoji} {title}</div>
      {items.map((item,i)=><Row key={item.name} item={item} last={i===items.length-1} />)}
    </div>
  );
  return (
    <GlassCard glow isDark={isDark} style={{ borderRadius:20, overflow:"hidden" }}>
      <div style={{ padding:"18px 22px", background:isDark?"rgba(12,12,24,0.8)":T.surface2, borderBottom:`1px solid ${T.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div><div style={{ fontSize:15, fontWeight:700, color:T.text, display:"flex", alignItems:"center", gap:8 }}><img src="/icons/berza.png" style={{width:32,height:32,objectFit:"contain", filter:isDark?"none":"invert(1)"}}/>{tr("home.berza.title")}</div><div style={{ fontSize:12, color:T.muted, marginTop:2 }}>{data?.stale?tr("home.berza.unavailable"):tr("home.berza.subtitle")}</div></div>
        <div style={{ display:"flex", alignItems:"center", gap:5, background:data?.stale?isDark?"rgba(0,0,0,0.3)":T.surface2:T.greenBg, border:`1px solid ${data?.stale?T.border:T.greenBdr}`, borderRadius:20, padding:"3px 9px" }}>
          {!data?.stale&&<LiveDot color={T.cyan} />}
          <span style={{ fontSize:11, fontWeight:700, color:data?.stale?T.muted:T.cyan }}>{data?.stale?"—":tr("nav.live")}</span>
        </div>
      </div>
      <Section emoji={<img src={isDark?"/icons/gasstation1.png":"/icons/gasstation.png"} style={{width:20,height:18,objectFit:"contain"}}/>} title={tr("home.berza.oil")} items={oil} border={true} />
      <Section emoji="🪙" title={tr("home.berza.metals")} items={metals} border={true} />
      <Section emoji="₿" title={tr("home.berza.crypto")} items={crypto} border={false} />
    </GlassCard>
  );
}

function AlertBanner({ tr, isDark }) {
  const T = useT();
  const [email,setEmail]=useState(""); const [sent,setSent]=useState(false);
  return (
    <div style={{ background:isDark?"rgba(124,58,237,0.12)":T.surface2, border:`1px solid ${T.violetBdr}`, borderRadius:16, padding:"24px", position:"relative", overflow:"hidden", backdropFilter:"blur(12px)", boxShadow:isDark?`0 0 40px rgba(124,58,237,0.15)`:`0 4px 20px rgba(0,0,0,0.06)` }}>
      <div style={{ position:"absolute", top:0, left:0, right:0, height:1, background:`linear-gradient(90deg,transparent,${T.violet},transparent)` }} />
      {isDark && <div style={{ position:"absolute", top:-40, right:-40, width:150, height:150, borderRadius:"50%", background:"rgba(124,58,237,0.15)", filter:"blur(40px)", pointerEvents:"none" }} />}
      <div style={{position:"relative"}}>
        <div style={{marginBottom:10, display:"flex", alignItems:"center", gap:6}}><img src="/icons/notification.png" style={{width:16,height:16,objectFit:"contain", filter:isDark?"none":"invert(1)"}}/><span style={{fontSize:14, fontWeight:700, color:T.text}}>{tr("home.alerts.title")}</span></div>
        <div style={{ fontSize:13, color:T.textMid, lineHeight:1.6, marginTop:8, marginBottom:14 }}>{tr("home.alerts.desc")}</div>
        {sent?<div style={{ fontSize:15, fontWeight:600, color:T.cyan }}>✓ {tr("home.alerts.saved")}</div>:(
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            <input type="email" placeholder={tr("home.alerts.placeholder")} value={email} onChange={e=>setEmail(e.target.value)} style={{ flex:"1 1 160px", padding:"10px 14px", borderRadius:9, border:`1px solid ${T.violetBdr}`, background:isDark?"rgba(0,0,0,0.1)":T.surface, color:T.text, fontSize:14, outline:"none", fontFamily:"inherit", backdropFilter:"blur(8px)" }} />
            <button onClick={()=>setSent(true)} style={{ padding:"10px 20px", borderRadius:9, background:`linear-gradient(135deg,${T.violet},#4C1D95)`, color:"#fff", fontSize:14, fontWeight:700, border:"none", cursor:"pointer", whiteSpace:"nowrap", fontFamily:"inherit", boxShadow:`0 0 20px ${T.violetGlow}` }}>{tr("home.alerts.activate")}</button>
          </div>
        )}
      </div>
    </div>
  );
}

function Calculator({ fuelData, tr, isDark }) {
  const T = useT();
  const [km,setKm]=useState("100"); const [cons,setCons]=useState("7.5"); const [fuelKey,setFuelKey]=useState("benzin95");
  const fuel=fuelData.find(f=>f.key===fuelKey)||fuelData[0];
  const cost=fuel&&parseFloat(km)&&parseFloat(cons)?((parseFloat(km)/100)*parseFloat(cons)*fuel.price).toFixed(0):"—";
  const liters=parseFloat(km)&&parseFloat(cons)?((parseFloat(km)/100)*parseFloat(cons)).toFixed(1):"—";
  const bi=(e)=>{ if(["e","E","+","-"].includes(e.key)) e.preventDefault(); };
  const inp={ background:isDark?"rgba(0,0,0,0.4)":T.surface, border:`1px solid ${T.border}`, borderRadius:9, padding:"10px 13px", color:T.text, fontSize:14, fontWeight:600, width:"100%", outline:"none", fontFamily:"inherit", backdropFilter:"blur(8px)" };
  return (
    <GlassCard glow isDark={isDark} style={{ borderRadius:20, overflow:"hidden" }}>
      <div style={{ padding:"18px 22px", background:isDark?"rgba(12,12,24,0.8)":T.surface2, borderBottom:`1px solid ${T.border}` }}><div style={{ fontSize:15, fontWeight:700, color:T.text, display:"flex", alignItems:"center", gap:8 }}><img src="/icons/calculator.png" style={{width:24,height:24,objectFit:"contain", filter:isDark?"none":"invert(1)"}}/>{tr("home.calculator.title")}</div><div style={{ fontSize:12, color:T.muted, marginTop:2 }}>{tr("home.calculator.subtitle")}</div></div>
      <div style={{padding:"20px 22px"}}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
          <div><div style={{ fontSize:10, fontWeight:700, color:T.muted, letterSpacing:0.8, textTransform:"uppercase", marginBottom:5 }}>{tr("home.calculator.km")}</div><input type="number" inputMode="numeric" placeholder="100" value={km} onChange={e=>setKm(e.target.value)} onFocus={e=>{ if(e.target.value==="100") setKm(""); }} onBlur={e=>{ if(e.target.value==="") setKm("100"); }} onKeyDown={bi} style={inp} /></div>
          <div><div style={{ fontSize:10, fontWeight:700, color:T.muted, letterSpacing:0.8, textTransform:"uppercase", marginBottom:5 }}>{tr("home.calculator.per100")}</div><input type="number" inputMode="decimal" step="0.1" placeholder="7.5" value={cons} onChange={e=>setCons(e.target.value)} onFocus={e=>{ if(e.target.value==="7.5") setCons(""); }} onBlur={e=>{ if(e.target.value==="") setCons("7.5"); }} onKeyDown={bi} style={inp} /></div>
        </div>
        <div style={{marginBottom:16}}><div style={{ fontSize:10, fontWeight:700, color:T.muted, letterSpacing:0.8, textTransform:"uppercase", marginBottom:5 }}>{tr("home.calculator.fuelType")}</div><select value={fuelKey} onChange={e=>setFuelKey(e.target.value)} style={{...inp,cursor:"pointer"}}>{fuelData.map(f=><option key={f.key} value={f.key}>{f.label} — {f.price} MKD/{f.unit.split("/")[1]}</option>)}</select></div>
        <div style={{ background:"rgba(124,58,237,0.15)", border:`1px solid ${T.violetBdr}`, borderRadius:12, padding:"16px 18px", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:10, backdropFilter:"blur(8px)", boxShadow:`0 0 24px ${T.violetGlow}` }}>
          <div><div style={{ fontSize:10, fontWeight:700, color:T.violetLight, letterSpacing:0.8, textTransform:"uppercase", marginBottom:4 }}>{tr("home.calculator.totalCost")}</div><div style={{ fontSize:42, fontWeight:800, color:T.violetLight, letterSpacing:-2, lineHeight:1 }}>{cost}<span style={{ fontSize:14, fontWeight:400, color:T.muted, marginLeft:4 }}>ден</span></div></div>
          <div style={{textAlign:"right"}}><div style={{ fontSize:10, fontWeight:700, color:T.muted, letterSpacing:0.8, textTransform:"uppercase", marginBottom:4 }}>{tr("home.calculator.liters")}</div><div style={{ fontSize:26, fontWeight:800, color:T.text, letterSpacing:-1 }}>{liters}<span style={{ fontSize:12, fontWeight:400, color:T.muted, marginLeft:2 }}>{tr("home.calculator.litersUnit")}</span></div></div>
        </div>
      </div>
    </GlassCard>
  );
}

function NewsCard({ n, i, isDark }) {
  const T = useT();
  const [hov,setHov]=useState(false);
  return (
    <a href={n.url} target="_blank" rel="noopener noreferrer" onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{ display:"block", textDecoration:"none", background:hov?isDark?"rgba(14,14,30,0.9)":T.surface:isDark?"rgba(10,10,22,0.8)":T.surface, backdropFilter:"blur(16px)", WebkitBackdropFilter:"blur(16px)", border:`1px solid ${hov?T.borderHov:T.glassBorder}`, borderRadius:14, padding:"16px 18px", transition:"all 0.2s", transform:hov?"translateY(-3px)":"none", boxShadow:hov?`0 8px 32px rgba(0,0,0,0.1),0 0 0 1px ${T.violetBdr}`:"none", animation:`fadeUp 0.45s ${i*0.06}s both` }}
    >
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8, gap:8 }}>
        <VBadge style={{fontSize:10}}>{n.source}</VBadge>
        <span style={{ fontSize:11, color:T.muted, flexShrink:0 }}>{n.time}</span>
      </div>
      <div style={{ fontSize:14, fontWeight:600, color:T.text, lineHeight:1.55 }}>{n.title}</div>
    </a>
  );
}

function StationPricesTable({ isMobile, tr, isDark }) {
  const T = useT();
  const LABELS=[{key:"benzin95",label:tr("stationPrices.benzin95"),color:"#F87171"},{key:"benzin98",label:tr("stationPrices.benzin98"),color:"#FCA5A5"},{key:"dizel",label:tr("stationPrices.dizel"),color:"#2DD4BF"},{key:"lpg",label:tr("stationPrices.lpg"),color:"#93C5FD"}];
  const [stations,setStations]=useState(FALLBACK_STATIONS); const [loading,setLoading]=useState(true); const [updatedAt,setUpdatedAt]=useState(null);
  useEffect(()=>{ fetch("/api/station-prices").then(r=>r.json()).then(d=>{ if(d.stations?.length>0) setStations(d.stations); if(d.updatedAt) setUpdatedAt(d.updatedAt); setLoading(false); }).catch(()=>setLoading(false)); },[]);
  const timeStr=updatedAt?new Date(updatedAt).toLocaleTimeString("mk-MK",{hour:"2-digit",minute:"2-digit"}):null;
  const Hdr=()=>(<div style={{ padding:"18px 22px", background:isDark?"rgba(12,12,24,0.8)":T.surface2, borderBottom:`1px solid ${T.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}><div><div style={{ fontSize:15, fontWeight:700, color:T.text, display:"flex", alignItems:"center", gap:8 }}><img src={isDark?"/icons/gasstation1.png":"/icons/gasstation.png"} style={{width:32,height:32,objectFit:"contain"}}/>{tr("home.stationTable.title")}</div><div style={{ fontSize:12, color:T.muted, marginTop:2 }}>{timeStr?tr("home.stationTable.subtitleWithTime",{time:timeStr}):tr("home.stationTable.subtitle")}</div></div>{loading?<div style={{ width:7, height:7, borderRadius:"50%", border:`2px solid ${T.violet}`, borderTopColor:"transparent", animation:"spin 0.7s linear infinite" }} />:<div style={{ display:"flex", alignItems:"center", gap:5, background:T.greenBg, border:`1px solid ${T.greenBdr}`, borderRadius:20, padding:"3px 9px" }}><LiveDot color={T.cyan} /><span style={{ fontSize:11, fontWeight:700, color:T.cyan }}>{tr("nav.live")}</span></div>}</div>);
  if(isMobile) return (
    <GlassCard glow isDark={isDark} style={{ borderRadius:20, overflow:"hidden" }}><Hdr />
      <div style={{padding:"14px 16px",display:"flex",flexDirection:"column",gap:12}}>
        {stations.map(s=>(
          <div key={s.key} style={{ background:isDark?"rgba(0,0,0,0.4)":T.surface2, border:`1px solid ${T.border}`, borderRadius:14, overflow:"hidden", backdropFilter:"blur(8px)" }}>
            <div style={{ padding:"11px 14px", borderBottom:`1px solid ${T.border}` }}><img src={s.logo} alt={s.name} style={{ height:s.key==="lukoil"?54:26, width:"auto", maxWidth:110, objectFit:"contain", filter:"opacity(0.85)" }} onError={e=>{ e.currentTarget.style.display="none"; }} /></div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr"}}>
              {LABELS.map((f,fi)=>(
                <div key={f.key} style={{ padding:"10px 14px", borderRight:fi%2===0?`1px solid ${T.border}`:"none", borderBottom:fi<2?`1px solid ${T.border}`:"none" }}>
                  <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:3}}><span style={{ width:6, height:6, borderRadius:"50%", background:f.color, display:"inline-block", boxShadow:`0 0 5px ${f.color}88` }} /><div style={{ fontSize:10, fontWeight:700, color:T.muted, textTransform:"uppercase", letterSpacing:0.4 }}>{f.label}</div></div>
                  <div style={{ fontSize:17, fontWeight:800, color:T.text }}>{loading?"—":s.prices[f.key]!=null?s.prices[f.key].toFixed(1):"—"}<span style={{ fontSize:10, fontWeight:500, color:T.muted, marginLeft:2 }}>ден</span></div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div style={{ padding:"8px 22px 12px", fontSize:11, color:T.muted, borderTop:`1px solid ${T.border}` }}>{tr("home.stationTable.disclaimer")}</div>
    </GlassCard>
  );
  return (
    <GlassCard glow isDark={isDark} style={{ borderRadius:20, overflow:"hidden" }}><Hdr />
      <div style={{overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead><tr style={{background:isDark?"rgba(0,0,0,0.3)":T.surface2}}>
            <th style={{ padding:"12px 22px", textAlign:"left", fontSize:11, fontWeight:700, color:T.muted, textTransform:"uppercase", letterSpacing:0.8, borderBottom:`1px solid ${T.border}` }}>{tr("home.stationTable.station")}</th>
            {LABELS.map(f=><th key={f.key} style={{ padding:"12px 22px", textAlign:"right", fontSize:11, fontWeight:700, color:T.muted, textTransform:"uppercase", letterSpacing:0.8, borderBottom:`1px solid ${T.border}` }}><span style={{display:"inline-flex",alignItems:"center",gap:5}}><span style={{ width:8, height:8, borderRadius:"50%", background:f.color, display:"inline-block", boxShadow:`0 0 5px ${f.color}88` }} />{f.label}</span></th>)}
          </tr></thead>
          <tbody>{stations.map((s,si)=>(
            <tr key={s.key} style={{ borderBottom:si<stations.length-1?`1px solid ${T.border}`:"none", transition:"background 0.15s" }} onMouseEnter={e=>e.currentTarget.style.background=isDark?"rgba(255,255,255,0.02)":T.surface2} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <td style={{padding:"16px 22px"}}><img src={s.logo} alt={s.name} style={{ height:s.key==="lukoil"?54:26, width:"auto", maxWidth:90, objectFit:"contain", filter:"opacity(0.85)" }} onError={e=>{ e.currentTarget.style.display="none"; }} /></td>
              {LABELS.map(f=><td key={f.key} style={{padding:"16px 22px",textAlign:"right"}}>{loading?<span style={{fontSize:18,fontWeight:800,color:T.muted}}>—</span>:<><span style={{fontSize:20,fontWeight:800,color:T.text}}>{s.prices[f.key]!=null?s.prices[f.key].toFixed(1):"—"}</span><span style={{fontSize:11,color:T.muted,marginLeft:4}}>ден</span></>}</td>)}
            </tr>
          ))}</tbody>
        </table>
      </div>
      <div style={{ padding:"8px 22px 12px", fontSize:11, color:T.muted, borderTop:`1px solid ${T.border}` }}>{tr("home.stationTable.disclaimer")}</div>
    </GlassCard>
  );
}

function FeatureCard({ card, isDark }) {
  const T = useT();
  const [hov,setHov]=useState(false);
  return (
    <a href={card.href} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{ textDecoration:"none", display:"block", background:hov?isDark?"rgba(14,14,30,0.9)":T.surface:isDark?"rgba(10,10,22,0.8)":T.surface, backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)", border:`1px solid ${hov?card.borderColor+"55":T.glassBorder}`, borderRadius:20, overflow:"hidden", transition:"all 0.25s", transform:hov?"translateY(-4px)":"none", boxShadow:hov?`0 20px 48px rgba(0,0,0,0.1),0 0 0 1px ${card.borderColor}33`:"none" }}
    >
      <div style={{ height:120, background:`linear-gradient(135deg,${card.g0},${card.g1})`, position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, backgroundImage:"radial-gradient(circle at 1px 1px,rgba(255,255,255,0.04) 1px,transparent 0)", backgroundSize:"28px 28px" }} />
        {hov&&<div style={{ position:"absolute", inset:0, background:`radial-gradient(ellipse at center,${card.glowColor} 0%,transparent 70%)` }} />}
        <img src={card.icon} style={{ position:"absolute", top:"50%", right:-10, transform:"translateY(-50%)", width:108, height:108, objectFit:"cover", borderRadius:12, opacity:0.06, pointerEvents:"none" }} />
        <div style={{ position:"absolute", bottom:14, left:18, display:"flex", alignItems:"center", gap:10 }}>
          <img src={card.icon} style={{ width:58, height:58, objectFit:"contain" }} />
          <span style={{ fontSize:20, fontWeight:800, color:isDark?"#fff":T.text }}>{card.title}</span>
        </div>
        <div style={{ position:"absolute", top:14, right:14, background:isDark?"rgba(255,255,255,0.07)":"rgba(0,0,0,0.08)", color:isDark?"rgba(255,255,255,0.55)":T.textMid, border:`1px solid ${isDark?"rgba(255,255,255,0.1)":"rgba(0,0,0,0.1)"}`, fontSize:11, fontWeight:700, borderRadius:6, padding:"3px 9px", backdropFilter:"blur(8px)" }}>{card.badge}</div>
      </div>
      <div style={{padding:"16px 20px"}}>
        <div style={{ fontSize:13, color:T.muted, lineHeight:1.6, marginBottom:8 }}>{card.desc}</div>
        <div style={{ fontSize:13, fontWeight:700, color:card.borderColor }}>{card.cta}</div>
      </div>
    </a>
  );
}
function ThemeToggle({ isDark, setIsDark }) {
  const T = useT();
  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem("makceni_theme", next ? "dark" : "light");
  };
  return (
    <button
      onClick={toggle}
      title={isDark ? "Light mode" : "Dark mode"}
      style={{
        width: 36, height: 36,
        borderRadius: 9,
        border: `1px solid ${T.border}`,
        background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        transition: "all 0.2s",
        color: isDark ? "#FCD34D" : T.violet,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = T.borderGlow;
        e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = T.border;
        e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)";
      }}
    >
      {isDark ? (
        // Sun — shown in dark mode, click to go light
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
          strokeWidth={1.5} stroke="currentColor" style={{ width:18, height:18 }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
        </svg>
      ) : (
        // Moon — shown in light mode, click to go dark
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
          strokeWidth={1.5} stroke="currentColor" style={{ width:18, height:18 }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
        </svg>
      )}
    </button>
  );
}
export default function Home() {
  const { lang, setLang, tr } = useLanguage();
  const scrolled = useScrolled();
  const [isDark, setIsDark] = useState(true);
  const [mounted,setMounted]=useState(false);
  const [fuelData,setFuelData]=useState(()=>FALLBACK.map(f=>({...f,label:tr(`fuels.${f.key}`),unit:f.key==="cng"?tr("home.units.perKg"):tr("home.units.perL")})));
  const [loading,setLoading]=useState(true); const [updatedAt,setUpdatedAt]=useState(null);
  const [activeIdx,setActiveIdx]=useState(0); const [autoRotate,setAutoRotate]=useState(true);
  const [news,setNews]=useState([]); const [originalNews,setOriginalNews]=useState([]); const [newsLoading,setNewsLoading]=useState(true); const [showAllNews,setShowAllNews]=useState(false);
  const drawer=useDrawer();
  const width=useWindowWidth();
  const isMobile=width!==undefined&&width<640;
  const isTablet=width!==undefined&&width>=640&&width<1024;
  const px=isMobile?"16px":isTablet?"24px":"40px";

  const T = isDark ? D : L;

useEffect(()=>{
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  if (isMobile) {
    // Mobile: always follow OS
    setIsDark(mq.matches);
    const handler = (e) => setIsDark(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  } else {
    // Desktop: check localStorage first, fall back to OS
    const saved = localStorage.getItem("makceni_theme");
    if (saved) setIsDark(saved === "dark");
    else setIsDark(mq.matches);
  }
}, [isMobile]);

useEffect(()=>{
    setMounted(true);
    window.scrollTo(0, 0);
    fetch("/api/prices").then(r=>r.json()).then(d=>{ if(d.prices?.length){ const m=FALLBACK.map(f=>{ const live=d.prices.find(p=>p.key===f.key); return live?{...f,price:live.price,change:live.change}:f; }); setFuelData(m); setUpdatedAt(d.updatedAt); } setLoading(false); }).catch(()=>setLoading(false));
  },[]);
  useEffect(()=>{
    const um={mk:{perL:"ден/л",perKg:"ден/кг"},sq:{perL:"den/l",perKg:"den/kg"},en:{perL:"den/L",perKg:"den/kg"},tr:{perL:"den/L",perKg:"den/kg"}};
    const u=um[lang]||um.mk;
    setFuelData(prev=>prev.map(f=>({...f,label:tr(`fuels.${f.key}`),unit:f.key==="cng"?u.perKg:u.perL})));
  },[lang]);
  useEffect(()=>{ fetch("/api/news").then(r=>r.json()).then(d=>{ const f=d.news||[]; setNews(f); setOriginalNews(f); setNewsLoading(false); }).catch(()=>setNewsLoading(false)); },[]);
  const loadMoreNews=()=>{ if(showAllNews){ setNews(originalNews); setShowAllNews(false); return; } fetch("/api/news?all=1").then(r=>r.json()).then(d=>{ setNews(d.news||[]); setShowAllNews(true); }).catch(()=>setShowAllNews(true)); };
  useEffect(()=>{ if(!autoRotate) return; const id=setInterval(()=>setActiveIdx(p=>(p+1)%fuelData.length),7000); return ()=>clearInterval(id); },[autoRotate,fuelData.length]);
  const handleSelect=(i)=>{ setActiveIdx(i); setAutoRotate(false); };
  const lm={mk:"mk-MK",sq:"sq-AL",en:"en-GB",tr:"tr-TR"};
  const today=new Date().toLocaleDateString(lm[lang]||"mk-MK",{day:"numeric",month:"long",year:"numeric"});
  const timeStr=updatedAt?new Date(updatedAt).toLocaleTimeString("mk-MK",{hour:"2-digit",minute:"2-digit"}):null;
  const activeFc=fuelData[activeIdx];
  const activeAccent=activeFc?FUEL_ACCENT[activeFc.key]:"#7C3AED";

const featureCards=[
    { href:"/mapa", g0:isDark?"#0A0600":"#FFF3E0", g1:isDark?"#140E00":"#FFE0B2", borderColor:T.orange, icon:isDark?"/icons/gasstation1.png":"/icons/gasstation.png", title:tr("home.cards.gasStations.title"), badge:tr("home.cards.gasStations.badge"), desc:tr("home.cards.gasStations.desc"), cta:tr("home.cards.gasStations.cta"), glowColor:"rgba(249,115,22,0.2)" },
    { href:"/safecity", g0:isDark?"#0A0000":"#FFF0F0", g1:isDark?"#140000":"#FFD6D6", borderColor:T.red, icon:isDark?"/icons/safecity1.png":"/icons/safecity.png", title:tr("home.cards.safeCity.title"), badge:tr("home.cards.safeCity.badge"), desc:tr("home.cards.safeCity.desc"), cta:tr("home.cards.safeCity.cta"), glowColor:"rgba(248,113,113,0.2)" },
  ];

  return (
    <ThemeCtx.Provider value={T}>
      <>
        <Head>
          <title>МакЦени.мк — Цени на Гориво во Македонија | Бензин, Дизел, ЛПГ</title>
          <meta name="description" content="Споредете цени на гориво во Македонија — бензин, дизел, ЛПГ, метан. Ажурирани цени од сите бензински станици: Макпетрол, Окта, Лукоил." />
          <meta name="keywords" content="цени на гориво македонија, бензин цена, дизел цена, ЛПГ цена, макпетрол, окта, лукоил, гориво македонија, makceni" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <meta name="robots" content="index, follow" />
          <link rel="canonical" href="https://makceni.mk" />
          <meta property="og:title" content="МакЦени.мк — Цени на Гориво во Македонија" />
          <meta property="og:description" content="Споредете цени на бензин, дизел и ЛПГ во сите бензински станици низ Македонија. Ажурирано во реално време." />
          <meta property="og:url" content="https://makceni.mk" />
          <meta property="og:image" content="https://makceni.mk/og-image.png" />
          <meta property="og:type" content="website" />
          <meta name="twitter:title" content="МакЦени.мк — Цени на Гориво во Македонија" />
          <meta name="twitter:description" content="Споредете цени на бензин, дизел и ЛПГ во сите бензински станици низ Македонија." />
          <meta name="twitter:image" content="https://makceni.mk/og-image.png" />
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({"@context":"https://schema.org","@type":"WebPage","name":"МакЦени — Цени на гориво во Македонија","description":"Споредете цени на бензин, дизел, ЛПГ и метан во Македонија во реално време.","url":"https://makceni.mk","inLanguage":["mk","sq","en","tr"],"publisher":{"@type":"Organization","name":"МакЦени","url":"https://makceni.mk","logo":{"@type":"ImageObject","url":"https://makceni.mk/logo2.png"}}}) }} />
          <link rel="icon" type="image/x-icon" href="/favicon.ico" />
          <style>{`
            *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
            html,body{background:${T.bg};color:${T.text};font-family:inherit;-webkit-font-smoothing:antialiased;}
            input,select,button,a,option{font-family:inherit;}
            option{background:${T.surface};color:${T.text};}
            ::selection{background:rgba(124,58,237,0.3);color:${T.violetLight};}
            ::-webkit-scrollbar{width:5px;background:${T.bg};}
            ::-webkit-scrollbar-thumb{background:${T.border};border-radius:3px;}
            body::before{content:'';position:fixed;inset:0;background-image:radial-gradient(circle,${isDark?"rgba(60,70,140,0.25)":"rgba(124,58,237,0.04)"} 1px,transparent 1px);background-size:40px 40px;pointer-events:none;z-index:0;}
            @keyframes fadeUp{from{opacity:0;transform:translateY(16px);}to{opacity:1;transform:translateY(0);}}
            @keyframes ping{0%{transform:scale(1);opacity:0.3;}75%,100%{transform:scale(2.2);opacity:0;}}
            @keyframes spin{to{transform:rotate(360deg);}}
            @keyframes heroIn{from{opacity:0;transform:translateY(24px);}to{opacity:1;transform:translateY(0);}}
            @keyframes glowPulse{0%,100%{opacity:0.4;}50%{opacity:0.85;}}
            input:focus,select:focus{border-color:rgba(124,58,237,0.6)!important;box-shadow:0 0 0 3px rgba(124,58,237,0.12);}
            input[type=number]::-webkit-inner-spin-button,input[type=number]::-webkit-outer-spin-button{opacity:1;}
          `}</style>
        </Head>

        <div style={{ minHeight:"100vh", background:T.bg, position:"relative" }}>
          <div style={{ position:"fixed", top:0, left:"50%", transform:"translateX(-50%)", width:"100%", height:"65vh", background:`radial-gradient(ellipse 60% 50% at 50% 0%,${activeAccent}${isDark?"20":"12"} 0%,transparent 70%)`, pointerEvents:"none", zIndex:0, transition:"background 1s ease", animation:"glowPulse 5s ease-in-out infinite" }} />

          {/* Navbar */}
<header style={{
  position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
background: scrolled
    ? isDark ? "rgba(0,0,0,0.45)" : "rgba(242,240,235,0.55)"
    : "transparent",
  backdropFilter: scrolled ? "blur(40px)" : "blur(0px)",
  WebkitBackdropFilter: scrolled ? "blur(40px)" : "blur(0px)",
  borderBottom: `1px solid ${scrolled ? T.border : "transparent"}`,
  transition: "all 0.35s cubic-bezier(0.16,1,0.3,1)",
}}>
  <div style={{ position:"absolute", top:0, left:0, right:0, height:1, background:`linear-gradient(90deg,transparent,${isDark?"rgba(100,120,255,0.5)":"rgba(124,58,237,0.2)"},transparent)`, opacity: scrolled ? 1 : 0, transition: "opacity 0.35s" }} />
  <div style={{ maxWidth:1200, margin:"0 auto", padding:`0 ${px}`, height: scrolled ? 46 : 62, display:"flex", alignItems:"center", justifyContent:"space-between", gap:16, transition:"height 0.35s cubic-bezier(0.16,1,0.3,1)" }}>
    <a href="/" style={{ textDecoration:"none", flexShrink:0 }}>
      <img src={isDark?"/logo2.png":"/logo.png"} alt="makceni.mk" style={{ height:isMobile?154:162, width:"auto", display:"block" }} />
    </a>
    {!isMobile&&(
      <nav style={{ display:"flex", alignItems:"center", gap:2, flex:1, justifyContent:"center" }}>
        {[[tr("nav.prices"),"#ceni"],[tr("nav.calculator"),"#calculator"],[tr("nav.history"),"#history"],[tr("nav.berza"),"#berza"],[tr("nav.news"),"#news"]].map(([l,href])=>(
          <a key={l} href={href} style={{ padding:"7px 13px", borderRadius:8, fontSize:isTablet?13:14, fontWeight:600, color:T.textMid, textDecoration:"none", transition:"all 0.15s", border:"1px solid transparent" }}
            onMouseEnter={e=>{ e.currentTarget.style.background=isDark?"rgba(255,255,255,0.04)":T.surface2; e.currentTarget.style.borderColor=T.border; e.currentTarget.style.color=T.text; }}
            onMouseLeave={e=>{ e.currentTarget.style.background="transparent"; e.currentTarget.style.borderColor="transparent"; e.currentTarget.style.color=T.textMid; }}
          >{l}</a>
        ))}
      </nav>
    )}
    <div style={{ display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
      {!isMobile&&(
        <>
          <a href="/mapa" style={{ padding:"7px 13px", borderRadius:8, fontSize:14, fontWeight:600, color:T.textMid, textDecoration:"none", transition:"all 0.15s", border:"1px solid transparent", display:"flex", alignItems:"center", gap:6 }} onMouseEnter={e=>{ e.currentTarget.style.background=isDark?"rgba(255,255,255,0.04)":T.surface2; e.currentTarget.style.borderColor=T.border; e.currentTarget.style.color=T.text; }} onMouseLeave={e=>{ e.currentTarget.style.background="transparent"; e.currentTarget.style.borderColor="transparent"; e.currentTarget.style.color=T.textMid; }}><img src={isDark?"/icons/gasstation1.png":"/icons/gasstation.png"} style={{ width:22, height:22, objectFit:"cover", borderRadius:4 }} />{tr("nav.gasStations")}</a>
          <a href="/safecity" style={{ padding:"7px 13px", borderRadius:8, fontSize:14, fontWeight:600, color:T.textMid, textDecoration:"none", transition:"all 0.15s", border:"1px solid transparent", display:"flex", alignItems:"center", gap:6 }} onMouseEnter={e=>{ e.currentTarget.style.background=isDark?"rgba(255,255,255,0.04)":T.surface2; e.currentTarget.style.borderColor=T.border; e.currentTarget.style.color=T.text; }} onMouseLeave={e=>{ e.currentTarget.style.background="transparent"; e.currentTarget.style.borderColor="transparent"; e.currentTarget.style.color=T.textMid; }}><img src={isDark?"/icons/safecity1.png":"/icons/safecity.png"} style={{ width:22, height:22, objectFit:"cover", borderRadius:4 }} />{tr("nav.safeCity")}</a>
          <div style={{ width:1, height:18, background:T.border }} />
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            {loading?<div style={{ width:6, height:6, borderRadius:"50%", border:`2px solid ${T.violet}`, borderTopColor:"transparent", animation:"spin 0.7s linear infinite" }} />:<LiveDot />}
            <span style={{ fontSize:12, color:T.muted, fontWeight:500 }}>{loading?tr("nav.loading"):timeStr?tr("nav.updated",{time:timeStr}):tr("nav.live")}</span>
          </div>
          <LanguageSwitcher lang={lang} setLang={setLang} isDark={isDark} />
          <ThemeToggle isDark={isDark} setIsDark={setIsDark} />
        </>
      )}
      {isMobile&&(
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <LanguageSwitcher lang={lang} setLang={setLang} isDark={isDark} />
          {loading?<div style={{ width:6, height:6, borderRadius:"50%", border:`2px solid ${T.violet}`, borderTopColor:"transparent", animation:"spin 0.7s linear infinite" }} />:<LiveDot />}
          <HamburgerButton open={drawer.open} toggle={drawer.toggle} />
        </div>
      )}
    </div>
  </div>
</header>

          {isMobile&&<MobileDrawer open={drawer.open} close={drawer.close} loading={loading} timeStr={timeStr} tr={tr} isDark={isDark} />}

          {/* Hero */}
          <div id="ceni" style={{ position:"relative", zIndex:1, maxWidth:1200, margin:"0 auto", padding:`${isMobile?"82px":"100px"} ${px} 0`, scrollMarginTop:80 }}>
            <div style={{ display:"flex", justifyContent:"center", marginBottom:20, animation:"heroIn 0.6s 0.1s both", opacity:mounted?1:0 }}>
              <VBadge>
                <LiveDot />
                <span>{mounted?today:""}</span>
                <span style={{ width:1, height:10, background:T.violetBdr }} />
                <span style={{ color:T.muted, fontWeight:500 }}>{loading?tr("nav.loading"):timeStr?tr("nav.updated",{time:timeStr}):tr("nav.live")}</span>
              </VBadge>
            </div>
            <h1 style={{ textAlign:"center", fontSize:isMobile?"clamp(28px,8vw,40px)":"clamp(40px,5vw,64px)", fontWeight:800, letterSpacing:isMobile?-1.5:-3, lineHeight:1.05, color:T.text, marginBottom:10, animation:"heroIn 0.6s 0.2s both" }}>
              {tr("home.heroTitle").split(" · ")[0]}
              <br />
              <span style={{ background: mounted ? `linear-gradient(90deg,${T.violetLight},${T.cyan})` : "none", WebkitBackgroundClip: mounted ? "text" : "unset", WebkitTextFillColor: mounted ? "transparent" : T.violet, backgroundClip: mounted ? "text" : "unset" }}>
                {tr("home.heroTitle").split(" · ")[1]}
              </span>
            </h1>
            <p style={{ textAlign:"center", fontSize:isMobile?14:16, color:T.muted, marginBottom:isMobile?36:60, animation:"heroIn 0.6s 0.3s both" }}>
              Цени во реално време · Регулирани од РКЕ
            </p>
            <div style={{ animation:"heroIn 0.7s 0.4s both" }}>
              {isMobile?(
               <div style={{marginBottom:32, marginLeft:`-${px}`, marginRight:`-${px}`, overflowX:"hidden"}}>
  <MobileCarousel fuelData={fuelData} activeIdx={activeIdx} onSelect={handleSelect} timeStr={timeStr} loading={loading} tr={tr} isDark={isDark} />
</div>
              ):(
                <>
                  <div style={{ position:"relative", height:400, marginBottom:40, overflow:"visible" }}>
                    {fuelData.map((fuel,i)=>{ const pos=i-activeIdx; const wrapped=pos>Math.floor(fuelData.length/2)?pos-fuelData.length:pos<-Math.floor(fuelData.length/2)?pos+fuelData.length:pos; return <CarouselCard key={fuel.key} fuel={fuel} position={wrapped} timeStr={timeStr} loading={loading} onClick={()=>handleSelect(i)} tr={tr} isDark={isDark} />; })}
                  </div>
                  <div style={{ display:"flex", justifyContent:"center", gap:8, marginBottom:64, flexWrap:"wrap" }}>
                    {fuelData.map((fuel,i)=>{ const fa=FUEL_ACCENT[fuel.key]; const isActive=activeIdx===i; return (
                      <button key={fuel.key} onClick={()=>handleSelect(i)} style={{ padding:"7px 16px", borderRadius:9, fontSize:13, fontWeight:isActive?700:500, border:`1px solid ${isActive?fa+"55":isDark?"rgba(60,70,140,0.3)":T.border}`, background:isActive?`${fa}18`:isDark?"rgba(10,10,20,0.6)":T.surface2, color:isActive?fa:T.muted, cursor:"pointer", transition:"all 0.18s", backdropFilter:"blur(8px)", boxShadow:isActive?`0 0 14px ${fa}33`:"none" }}>{fuel.label}</button>
                    ); })}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Body */}
          <main style={{ position:"relative", zIndex:1, maxWidth:1200, margin:"0 auto", padding:`0 ${px} 80px` }}>
            <div style={{marginBottom:40}}><StationPricesTable isMobile={isMobile} tr={tr} isDark={isDark} /></div>
            <Divider />
            <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr":"1fr 1fr", gap:16, marginBottom:40 }}>
              {featureCards.map(card=><FeatureCard key={card.href} card={card} isDark={isDark} />)}
            </div>
            <Divider />
            <div style={{marginBottom:40}}><AlertBanner tr={tr} isDark={isDark} /></div>
            <Divider />
            <div id="calculator" style={{marginBottom:40, scrollMarginTop:isMobile?100:80}}><Calculator fuelData={fuelData} tr={tr} isDark={isDark} /></div>
            <Divider />
            <div style={{marginBottom:40}}><CarProfile fuelData={fuelData} tr={tr} isDark={isDark} /></div>
            <Divider />
            <div id="history" style={{marginBottom:40, scrollMarginTop:isMobile?100:80}}><PriceHistory fuelData={fuelData} isMobile={isMobile} tr={tr} lang={lang} isDark={isDark} /></div>
            <Divider />
            <div id="berza" style={{marginBottom:40, scrollMarginTop:isMobile?100:80}}><Berza tr={tr} isDark={isDark} /></div>
            <Divider />
            <SectionLabel id="news" label={tr("home.news.label")} />
            {newsLoading?(
              <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr":"repeat(auto-fill,minmax(260px,1fr))", gap:12 }}>
                {[...Array(4)].map((_,i)=>(
                  <div key={i} style={{ background:isDark?"rgba(10,10,22,0.7)":T.surface, backdropFilter:"blur(12px)", border:`1px solid ${T.border}`, borderRadius:14, padding:"16px 18px", animation:`fadeUp 0.3s ${i*0.05}s both` }}>
                    {[40,100,80].map((w,j)=><div key={j} style={{ height:j===0?10:13, width:`${w}%`, background:T.surface2, borderRadius:6, marginBottom:j<2?j===0?12:6:0 }} />)}
                  </div>
                ))}
              </div>
            ):news.length===0?(
              <div style={{ textAlign:"center", padding:"40px 20px", color:T.muted, fontSize:14 }}>{tr("home.news.empty")}</div>
            ):(
              <>
                <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr":"repeat(auto-fill,minmax(260px,1fr))", gap:12 }}>
                  {news.map((n,i)=><NewsCard key={n.url} n={n} i={i} isDark={isDark} />)}
                </div>
                <div style={{ display:"flex", justifyContent:"center", marginTop:24 }}>
                  <button onClick={loadMoreNews}
                    style={{ padding:"11px 28px", borderRadius:10, fontSize:13, fontWeight:700, background:showAllNews?isDark?"rgba(10,10,22,0.8)":T.surface:`linear-gradient(135deg,${T.violet},#4C1D95)`, backdropFilter:"blur(12px)", color:showAllNews?T.textMid:"#fff", border:`1px solid ${showAllNews?T.border:T.violetBdr}`, cursor:"pointer", fontFamily:"inherit", boxShadow:showAllNews?"none":`0 0 20px ${T.violetGlow}`, transition:"all 0.2s" }}
                    onMouseEnter={e=>{ e.currentTarget.style.opacity="0.85"; e.currentTarget.style.transform="translateY(-2px)"; }}
                    onMouseLeave={e=>{ e.currentTarget.style.opacity="1"; e.currentTarget.style.transform="none"; }}
                  >{showAllNews?tr("home.news.showLess"):tr("home.news.showMore")}</button>
                </div>
              </>
            )}
          </main>

          {/* Footer */}
          <footer style={{ borderTop:`1px solid ${T.border}`, background:isDark?"rgba(0,0,0,0.8)":T.surface, backdropFilter:"blur(20px)", position:"relative", zIndex:1 }}>
            <div style={{ position:"absolute", top:0, left:0, right:0, height:1, background:`linear-gradient(90deg,transparent,${isDark?"rgba(100,120,255,0.3)":"rgba(124,58,237,0.1)"},transparent)` }} />
            <div style={{ maxWidth:1200, margin:"0 auto", padding:`22px ${px}`, display:"flex", flexDirection:isMobile?"column":"row", alignItems:isMobile?"flex-start":"center", justifyContent:"space-between", gap:12 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
             <span style={{ 
  fontWeight:800, fontSize:15,
  background: mounted ? `linear-gradient(90deg,${T.violetLight},${T.cyan})` : "none",
  WebkitBackgroundClip: mounted ? "text" : "unset",
  WebkitTextFillColor: mounted ? "transparent" : T.violetLight,
  backgroundClip: mounted ? "text" : "unset",
  display:"inline-block"
}}>makceni.mk</span>
 </div>
              <div style={{ fontSize:12, color:T.muted, maxWidth:360 }}>{tr("home.footer.disclaimer")}</div>
              <div style={{display:"flex",gap:18}}>
                {[{label:tr("home.footer.terms"),href:"/uslovi"},{label:tr("home.footer.privacy"),href:"/privatnost"},{label:tr("home.footer.contact"),href:"mailto:besartr1995@gmail.com"}].map(l=>(
                  <a key={l.label} href={l.href} style={{ fontSize:12, color:T.muted, textDecoration:"none", transition:"color 0.15s" }}
                    onMouseEnter={e=>e.currentTarget.style.color=T.cyan}
                    onMouseLeave={e=>e.currentTarget.style.color=T.muted}
                  >{l.label}</a>
                ))}
              </div>
            </div>
          </footer>
        </div>
      </>
    </ThemeCtx.Provider>
  );
}
export async function getServerSideProps() {
  return { props: {} };
}