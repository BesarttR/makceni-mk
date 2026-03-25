import Head from "next/head";
import { useState, useEffect } from "react";

const C = {
  bg: "#F8F7F4", surface: "#FFFFFF", surface2: "#F1F0ED",
  border: "#E4E1DA", borderMid: "#C9C6BE",
  text: "#1C1917", textMid: "#57534E", muted: "#A8A29E",
  orange: "#F97316", orangeBg: "#FFF7ED", orangeBdr: "#FED7AA",
};

export default function Privatnost() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <>
      <Head>
        <title>Политика на приватност — МакЦени.мк</title>
        <meta name="description" content="Политика на приватност на МакЦени.мк — како ги собираме и користиме вашите податоци." />
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
              <h1 style={{ fontSize: "clamp(26px, 4vw, 40px)", fontWeight: 800, letterSpacing: -1.5, color: C.text, marginBottom: 10 }}>Политика на приватност</h1>
              <p style={{ fontSize: 14, color: C.muted, fontWeight: 500 }}>Последно ажурирање: март 2026</p>
            </div>

            <div style={{ height: 1, background: C.border, marginBottom: 36 }} />

            {[
              {
                title: "1. Кои сме ние",
                content: `МакЦени.мк е македонска информативна веб-страница за цени на горива. Оваа политика на приватност објаснува кои податоци ги собираме, зошто и како ги користиме.`
              },
              {
                title: "2. Какви податоци собираме",
                content: `Ние собираме анонимни аналитички податоци преку Google Analytics и Vercel Analytics. Ова вклучува: тип на уред и прелистувач, земја и јазик, страниците кои ги посетувате и времето поминато на нив, изворот од каде сте дошле на страницата. Ние НЕ собираме лични податоци како вашето име, адреса или број на телефон. Email адресата доставена за ценовни известувања се чува единствено за таа намена.`
              },
              {
                title: "3. Колачиња (Cookies)",
                content: `МакЦени.мк користи технички и аналитички колачиња. Техничките колачиња се неопходни за функционирање на страницата (пр. зачувување на вашиот профил на возило). Аналитичките колачиња (Google Analytics) ни помагаат да разбереме како корисниците ја користат страницата, со цел подобрување на услугата. Со продолжено користење на страницата, се согласувате со употребата на колачиња.`
              },
              {
                title: "4. Како ги користиме податоците",
                content: `Собраните аналитички податоци ги користиме исклучиво за: подобрување на содржините и функционалностите на страницата, разбирање на кои информации се најкорисни за нашите посетители, техничко одржување и оптимизација на перформансите. Ние НЕ ги продаваме вашите податоци на трети страни.`
              },
              {
                title: "5. Трети страни",
                content: `Користиме следните услуги на трети страни кои може да собираат анонимни податоци: Google Analytics (analytics.google.com) — аналитика на посети, Vercel Analytics — технички перформанси. Овие услуги имаат свои политики на приватност кои се независни од МакЦени.мк.`
              },
              {
                title: "6. Чување на податоците",
                content: `Аналитичките податоци се чуваат согласно политиките на Google Analytics и Vercel (најчесто 14 месеци). Email адреси за известувања се чуваат до барање за бришење. Локалните податоци (профил на возило) се чуваат само во вашиот прелистувач и можете да ги избришете во секое време.`
              },
              {
                title: "7. Вашите права (GDPR)",
                content: `Имате право да побарате пристап, корекција или бришење на вашите лични податоци. За барања поврзани со вашата приватност, контактирајте не на: besartr1995@gmail.com. Ќе одговориме во рок од 30 дена.`
              },
              {
                title: "8. Промени на политиката",
                content: `МакЦени.мк го задржува правото да ја ажурира оваа политика на приватност. Промените ќе бидат објавени на оваа страница со нов датум на ажурирање.`
              },
              {
                title: "9. Контакт",
                content: `За прашања поврзани со приватноста, пишете ни на: besartr1995@gmail.com`
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