import Head from "next/head";
import { useState, useEffect } from "react";

const C = {
  bg: "#F8F7F4", surface: "#FFFFFF", surface2: "#F1F0ED",
  border: "#E4E1DA", borderMid: "#C9C6BE",
  text: "#1C1917", textMid: "#57534E", muted: "#A8A29E",
  orange: "#F97316", orangeBg: "#FFF7ED", orangeBdr: "#FED7AA",
};

export default function Uslovi() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <>
      <Head>
        <title>Услови за користење — МакЦени.мк</title>
        <meta name="description" content="Услови за користење на МакЦени.мк — информации за употреба на податоците и одговорност." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <style>{`
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
          html, body { background: ${C.bg}; color: ${C.text}; font-family: 'DM Sans', sans-serif; -webkit-font-smoothing: antialiased; }
          ::selection { background: ${C.orangeBg}; color: ${C.orange}; }
        `}</style>
      </Head>

      <div style={{ minHeight: "100vh", background: C.bg }}>

        {/* Header */}
        <header style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, background: "rgba(248,247,244,0.96)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderBottom: `1px solid ${C.border}` }}>
          <div style={{ maxWidth: 1180, margin: "0 auto", padding: "0 24px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <a href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center" }}>
              <img src="/logo.png" alt="makceni.mk" style={{ height: 152, width: "auto", display: "block" }} />
            </a>
            <a href="/" style={{ padding: "7px 16px", borderRadius: 9, fontSize: 14, fontWeight: 600, color: C.textMid, textDecoration: "none", border: `1px solid ${C.border}`, background: C.surface, transition: "all 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = C.borderMid}
              onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
            >← Назад</a>
          </div>
        </header>

        {/* Content */}
        <main style={{ maxWidth: 760, margin: "0 auto", padding: "100px 24px 80px" }}>

          <div style={{ opacity: mounted ? 1 : 0, transform: mounted ? "none" : "translateY(14px)", transition: "all 0.5s ease" }}>

            <div style={{ marginBottom: 36 }}>
              <div style={{ display: "inline-block", background: C.orangeBg, border: `1px solid ${C.orangeBdr}`, borderRadius: 8, padding: "3px 12px", fontSize: 11, fontWeight: 700, color: C.orange, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 14 }}>Правни информации</div>
              <h1 style={{ fontSize: "clamp(26px, 4vw, 40px)", fontWeight: 800, letterSpacing: -1.5, color: C.text, marginBottom: 10 }}>Услови за користење</h1>
              <p style={{ fontSize: 14, color: C.muted, fontWeight: 500 }}>Последно ажурирање: март 2026</p>
            </div>

            <div style={{ height: 1, background: C.border, marginBottom: 36 }} />

            {[
              {
                title: "1. Општи информации",
                content: `МакЦени.мк е информативна веб-страница која прикажува цени на горива во Македонија. Сите цени се прибираат од јавно достапни извори и се ажурираат редовно. Со пристапувањето на оваа страница, вие се согласувате со овие услови за користење.`
              },
              {
                title: "2. Точност на податоците",
                content: `Цените прикажани на МакЦени.мк се информативни и се базираат на официјални регулирани цени од Регулаторна комисија за енергетика (РКЕ) и јавно достапни извори. Цените на одредени бензински станици може да се разликуваат до 3 денари во однос на прикажаните вредности. МакЦени.мк не гарантира дека прикажаните цени ги одразуваат актуелните цени на секоја бензинска станица.`
              },
              {
                title: "3. Одговорност",
                content: `МакЦени.мк не сноси одговорност за евентуални разлики помеѓу прикажаните и вистинските цени на горива. Корисниците ги користат информациите на сопствена одговорност. Препорачуваме секогаш да ја потврдите цената директно на бензинската станица пред полнење.`
              },
              {
                title: "4. Извори на податоци",
                content: `Цените на горива се преземаат и обработуваат врз основа на јавно достапни информации, вклучувајќи официјални соопштенија на РКЕ и партнерски портали. Берзански цени (нафта, метали, крипто) се прибираат од јавни API-ја и се само информативни — не претставуваат финансиски совет.`
              },
              {
                title: "5. Интелектуална сопственост",
                content: `Сите содржини на МакЦени.мк, вклучувајќи дизајн, логоа, текстови и функционалности, се сопственост на МакЦени.мк. Забрането е копирање, дистрибуција или комерцијална употреба на содржините без претходна писмена согласност.`
              },
              {
                title: "6. Употреба на услугата",
                content: `Забрането е користење на МакЦени.мк за автоматско прибирање на податоци (scraping) без писмена дозвола. Забрането е секакво злоупотребување на услугата кое може да предизвика штета на страницата или нејзините корисници.`
              },
              {
                title: "7. Промени на условите",
                content: `МакЦени.мк го задржува правото да ги менува овие услови во секое време. Промените стапуваат на сила веднаш по објавувањето. Препорачуваме редовно да ја проверувате оваа страница.`
              },
              {
                title: "8. Контакт",
                content: `За прашања во врска со условите за користење, можете да не контактирате на: besartr1995@gmail.com`
              },
            ].map(({ title, content }) => (
              <div key={title} style={{ marginBottom: 32 }}>
                <h2 style={{ fontSize: 17, fontWeight: 800, color: C.text, marginBottom: 10 }}>{title}</h2>
                <p style={{ fontSize: 15, color: C.textMid, lineHeight: 1.75 }}>{content}</p>
              </div>
            ))}

          </div>
        </main>

        {/* Footer */}
        <footer style={{ borderTop: `1px solid ${C.border}`, background: C.surface }}>
          <div style={{ maxWidth: 1180, margin: "0 auto", padding: "20px 24px", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <a href="/" style={{ fontWeight: 800, fontSize: 16, color: C.orange, textDecoration: "none" }}>makceni.mk</a>
            <div style={{ fontSize: 12, color: C.muted }}>Цените се информативни и може да се разликуваат на точката на продажба.</div>
            <div style={{ display: "flex", gap: 20 }}>
              {[{ label: "Услови", href: "/uslovi" }, { label: "Приватност", href: "/privatnost" }, { label: "Контакт", href: "mailto:besartr1995@gmail.com" }].map(l => (
                <a key={l.label} href={l.href} style={{ fontSize: 12, color: C.muted, textDecoration: "none" }}
                  onMouseEnter={e => e.currentTarget.style.color = C.orange}
                  onMouseLeave={e => e.currentTarget.style.color = C.muted}
                >{l.label}</a>
              ))}
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}