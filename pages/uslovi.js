import Head from "next/head";
import { useState, useEffect } from "react";
import { useLanguage, LanguageSwitcher } from "../translations";

const D = {
  bg: "#000000",
  surface: "#0C0C14",
  surface2: "#111120",
  border: "#1E1E38",
  borderMid: "rgba(100,120,255,0.25)",
  text: "#F0F0FF",
  textMid: "#9090B8",
  muted: "#50507A",
  orange: "#A78BFA",
  orangeBg: "rgba(124,58,237,0.15)",
  orangeBdr: "rgba(124,58,237,0.35)",
};

const L = {
  bg: "#F2F0EB",
  surface: "#FAFAF8",
  surface2: "#F0EEE9",
  border: "#DDD9D0",
  borderMid: "rgba(124,58,237,0.2)",
  text: "#1A1815",
  textMid: "#5C5850",
  muted: "#9B9890",
  orange: "#7C3AED",
  orangeBg: "rgba(124,58,237,0.08)",
  orangeBdr: "rgba(124,58,237,0.2)",
};

export default function Uslovi() {
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const { lang, setLang, tr } = useLanguage();

  useEffect(() => {
    setMounted(true);
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setIsDark(mq.matches);
    const handler = (e) => setIsDark(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const C = isDark ? D : L;
  const sections = tr("uslovi.sections");

  return (
    <>
      <Head>
        <title>{tr("uslovi.pageTitle")}</title>
        <meta name="description" content={tr("uslovi.metaDesc")} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <style>{`
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
          html, body { background: ${C.bg}; color: ${C.text}; font-family: inherit; -webkit-font-smoothing: antialiased; }
          ::selection { background: rgba(124,58,237,0.3); color: #A78BFA; }
          ::-webkit-scrollbar { width: 5px; background: ${C.bg}; }
          ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 3px; }
        `}</style>
      </Head>

      <div style={{ minHeight: "100vh", background: C.bg }}>

        {/* Header */}
        <header style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, background: isDark ? "rgba(0,0,0,0.75)" : "rgba(242,240,235,0.85)", backdropFilter: "blur(28px)", WebkitBackdropFilter: "blur(28px)", borderBottom: `1px solid ${C.border}` }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg,transparent,${isDark ? "rgba(100,120,255,0.5)" : "rgba(124,58,237,0.2)"},transparent)` }} />
          <div style={{ maxWidth: 1180, margin: "0 auto", padding: "0 24px", height: 62, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <a href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center" }}>
              <img src={isDark ? "/logo2.png" : "/logo.png"} alt="makceni.mk" style={{ height: 124, width: "auto", display: "block" }} />
            </a>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <LanguageSwitcher lang={lang} setLang={setLang} isDark={isDark} />
              <a
                href="/"
                style={{ padding: "7px 16px", borderRadius: 9, fontSize: 14, fontWeight: 600, color: C.textMid, textDecoration: "none", border: `1px solid ${C.border}`, background: "transparent", transition: "all 0.15s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = C.borderMid; e.currentTarget.style.color = C.text; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textMid; }}
              >{tr("nav.back")}</a>
            </div>
          </div>
        </header>

        {/* Content */}
        <main style={{ maxWidth: 760, margin: "0 auto", padding: "100px 24px 80px" }}>
          <div style={{ opacity: mounted ? 1 : 0, transform: mounted ? "none" : "translateY(14px)", transition: "all 0.5s ease" }}>

            <div style={{ marginBottom: 36 }}>
              <div style={{ display: "inline-block", background: C.orangeBg, border: `1px solid ${C.orangeBdr}`, borderRadius: 8, padding: "3px 12px", fontSize: 11, fontWeight: 700, color: C.orange, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 14 }}>
                {tr("uslovi.badge")}
              </div>
              <h1 style={{ fontSize: "clamp(26px, 4vw, 40px)", fontWeight: 800, letterSpacing: -1.5, color: C.text, marginBottom: 10 }}>
                {tr("uslovi.heading")}
              </h1>
              <p style={{ fontSize: 14, color: C.muted, fontWeight: 500 }}>
                {tr("uslovi.updated")}
              </p>
            </div>

            <div style={{ height: 1, background: C.border, marginBottom: 36 }} />

            {Array.isArray(sections) && sections.map(({ title, content }) => (
              <div key={title} style={{ marginBottom: 32 }}>
                <h2 style={{ fontSize: 17, fontWeight: 800, color: C.text, marginBottom: 10 }}>{title}</h2>
                <p style={{ fontSize: 15, color: C.textMid, lineHeight: 1.75 }}>{content}</p>
              </div>
            ))}

          </div>
        </main>

        {/* Footer */}
        <footer style={{ borderTop: `1px solid ${C.border}`, background: isDark ? "rgba(0,0,0,0.8)" : C.surface, backdropFilter: "blur(20px)" }}>
          <div style={{ maxWidth: 1180, margin: "0 auto", padding: "20px 24px", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <a href="/" style={{ fontWeight: 800, fontSize: 16, color: C.orange, textDecoration: "none" }}>makceni.mk</a>
            <div style={{ fontSize: 12, color: C.muted }}>{tr("home.footer.disclaimer")}</div>
            <div style={{ display: "flex", gap: 20 }}>
              {[
                { labelKey: "home.footer.terms", href: "/uslovi" },
                { labelKey: "home.footer.privacy", href: "/privatnost" },
                { labelKey: "home.footer.contact", href: "mailto:besartr1995@gmail.com" },
              ].map(l => (
                <a key={l.labelKey} href={l.href} style={{ fontSize: 12, color: C.muted, textDecoration: "none", transition: "color 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.color = C.orange}
                  onMouseLeave={e => e.currentTarget.style.color = C.muted}
                >{tr(l.labelKey)}</a>
              ))}
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}