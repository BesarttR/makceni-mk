// translations.js
// Usage: import { t, useLanguage } from "../translations";
// Supported: "mk" (Macedonian), "sq" (Albanian), "en" (English), "tr" (Turkish)

export const LANGUAGES = [
  { code: "mk", label: "МК", flag: "🇲🇰" },
  { code: "sq", label: "SQ", flag: "🇦🇱" },
  { code: "en", label: "EN", flag: "🇬🇧" },
  { code: "tr", label: "TR", flag: "🇹🇷" },
];

export const DEFAULT_LANG = "mk";

// ─── Hook ────────────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback, useRef, createContext, useContext } from "react";
const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(DEFAULT_LANG);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("makceni_lang");
      if (saved && LANGUAGES.find(l => l.code === saved)) setLangState(saved);
    } catch {}
  }, []);

  const setLang = useCallback((code) => {
    setLangState(code);
    try { localStorage.setItem("makceni_lang", code); } catch {}
  }, []);

  const tr = useCallback((key, vars = {}) => {
    const dict = translations[lang] || translations[DEFAULT_LANG];
    let str = key.split(".").reduce((o, k) => (o && o[k] !== undefined ? o[k] : null), dict);
    if (str === null) {
      str = key.split(".").reduce((o, k) => (o && o[k] !== undefined ? o[k] : null), translations[DEFAULT_LANG]);
    }
    if (str === null) return key;
    Object.entries(vars).forEach(([k, v]) => {
      str = str.replace(new RegExp(`{{${k}}}`, "g"), v);
    });
    return str;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, tr }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used inside <LanguageProvider>");
  return ctx;
}

// ─── LanguageSwitcher component ──────────────────────────────────────────────
const LANG_META = {
  mk: { flag: "🇲🇰", short: "МК", full: "Македонски" },
  sq: { flag: "🇦🇱", short: "SQ", full: "Shqip"       },
  en: { flag: "🇬🇧", short: "EN", full: "English"      },
  tr: { flag: "🇹🇷", short: "TR", full: "Türkçe"       },
};

export function LanguageSwitcher({ lang, setLang, isMobile = false, style = {}, isDark = true }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, []);

  const current = LANG_META[lang] || LANG_META.mk;

  return (
    <>
      <style>{`
        @keyframes langFadeUp {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div ref={ref} style={{ position: "relative", display: "inline-block", ...style }}>
        <button
          onClick={() => setOpen(o => !o)}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "6px 11px", borderRadius: 9,
    border: `1px solid ${open ? "rgba(124,58,237,0.5)" : isDark ? "rgba(60,70,140,0.4)" : "rgba(0,0,0,0.15)"}`,
background: open ? isDark ? "rgba(20,20,40,0.95)" : "rgba(255,255,255,0.95)" : isDark ? "rgba(10,10,22,0.85)" : "rgba(255,255,255,0.85)",
color: open ? "#7C3AED" : isDark ? "#9090B8" : "#57534E",
backdropFilter: "blur(12px)",
            fontSize: 13, fontWeight: 700, cursor: "pointer",
            fontFamily: "inherit", transition: "all 0.15s",
          }}
onMouseEnter={e => { if (!open) { e.currentTarget.style.borderColor = "rgba(100,120,255,0.5)"; e.currentTarget.style.color = "#F0F0FF"; } }}
onMouseLeave={e => { if (!open) { e.currentTarget.style.borderColor = "rgba(60,70,140,0.4)"; e.currentTarget.style.color = "#9090B8"; } }}
        >
          <span style={{ fontSize: 15, lineHeight: 1 }}>{current.flag}</span>
          <span>{current.short}</span>
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none"
            style={{ transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "rotate(0deg)", flexShrink: 0 }}>
            <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {open && (
          <div style={{
            position: "absolute", top: "calc(100% + 6px)", right: 0,
minWidth: 160, background: isDark ? "rgba(8,8,20,0.97)" : "rgba(255,255,255,0.98)",
backdropFilter: "blur(20px)",
WebkitBackdropFilter: "blur(20px)",
border: `1px solid ${isDark ? "rgba(60,70,140,0.4)" : "rgba(0,0,0,0.1)"}`, borderRadius: 12, overflow: "hidden",
boxShadow: isDark ? "0 16px 48px rgba(0,0,0,0.7), 0 0 0 1px rgba(100,120,255,0.1)" : "0 16px 48px rgba(0,0,0,0.1), 0 0 0 1px rgba(124,58,237,0.1)",
            animation: "langFadeUp 0.14s ease",
          }}>
            {LANGUAGES.map((l, i) => {
              const meta = LANG_META[l.code];
              const isActive = l.code === lang;
              return (
                <div
                  key={l.code}
                  onClick={() => { setLang(l.code); setOpen(false); }}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: isMobile ? "13px 16px" : "10px 14px",
                    cursor: "pointer",
                    fontSize: isMobile ? 14 : 13,
                    fontWeight: isActive ? 700 : 600,
                color: isActive ? "#7C3AED" : isDark ? "#9090B8" : "#57534E",
background: isActive ? "rgba(124,58,237,0.1)" : "transparent",
borderBottom: i < LANGUAGES.length - 1 ? `1px solid ${isDark ? "rgba(60,70,140,0.3)" : "rgba(0,0,0,0.07)"}` : "none", 
                    transition: "background 0.12s",
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
                >
                  <span style={{ fontSize: isMobile ? 18 : 16 }}>{meta.flag}</span>
                  <span>{meta.full}</span>
                  {isActive && (
                    <svg style={{ marginLeft: "auto", flexShrink: 0 }} width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M2.5 7l3 3 6-6" stroke="#A78BFA" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
// ─── Translations ─────────────────────────────────────────────────────────────

const translations = {

  // ══════════════════════════════════════════════════════════════════
  // MACEDONIAN (default)
  // ══════════════════════════════════════════════════════════════════
  mk: {
"home.share.message": " Цени на гориво — makceni.mk\n\n{label}: {price} ден/л\n{changeText}\n\nПровери ги сите цени: https://makceni.mk",
    stationPrices: {
    title: "Цени на горива",
    station: "Станица",
    benzin95: "Бензин 95",
    benzin98: "Бензин 98",
    dizel: "Дизел",
    lpg: "ТНГ",
  },
    fuels: {
  benzin95: "Бензин 95",
  benzin98: "Бензин 98+",
  dizel:    "Дизел",
  lpg:      "Плин LPG",
  cng:      "Метан CNG",
  ekstra:   "Екстра Лесно",
  mazut:    "Мазут",
},
    nav: {
      prices:      "Цени",
      calculator:  "Калкулатор",
      history:     "Историја",
      berza:       "Берза",
      news:        "Вести",
      gasStations: "Бензинcки",
      safeCity:    "Safe City",
      back:        "← Назад",
      live:        "Во живо",
      loading:     "Вчитување...",
      updated:     "Аж. {{time}}",
    },

   home: {
  priceChange: {
  benzin95: " +2.0 ден од полноќ",
  benzin98: " +2.0 ден од полноќ",
  dizel:    " -2.5 ден од полноќ",
  //lpg:      " +X.X ден од полноќ",
  //cng:      " +X.X ден од полноќ",
  ekstra:   " -1.0 ден од полноќ",
  mazut:    " +0.4 ден од полноќ",
},
  units: { perL: "ден/л", perKg: "ден/кг" },
  todayBadge:    "ДЕНЕС",
  heroTitle:     "Цени на горива · Македонија",
  swipeHint:     "← Повлечи лево/десно →",
  noChange:      "Нема промена",
  den:           "ден",

  stationTable: {
    title:     "Цени на пумпа",
    subtitle:  "Цени по бензински",
    subtitleWithTime: "Ажурирано {{time}} ·",
    station:   "Бензинска",
    disclaimer:"ⓘ Цените може да се разликуваат до 3 ден во однос на регулираните цени од РКЕ.",
  },

  cards: {
    gasStations: {
      title:    "Бензинcки",
      badge:    "350+ локации",
      desc:     "Пронајди ја најблиската бензинска станица — OKTA, Макпетрол, Лукоил и повеќе.",
      cta:      "Отвори мапа →",
    },
    safeCity: {
      title:    "Safe City",
      badge:    "218 камери",
      desc:     "Локации на Safe City камери за брзина во Скопје. Возете внимателно.",
      cta:      "Отвори мапа →",
    },
  },

  alerts: {
    title:       "Известувања за цени",
    desc:        "Прими известување кога цената ќе падне под твојот праг.",
    placeholder: "email@example.com",
    activate:    "Активирај",
    saved:       "✓ Зачувано!",
  },

  calculator: {
    litersUnit: "л",
    title:        "Калкулатор за пат",
    subtitle:     "Пресметај ги трошоците за патување",
    km:           "Километри",
    per100:       "л / 100км",
    fuelType:     "Вид гориво",
    totalCost:    "Вкупен трошок",
    liters:       "Литри",
  },

  carProfile: {
    title:       "Мојот автомобил",
    subtitle:    "Персонализирани трошоци за возење",
    modelLabel:  "Модел на возило",
    modelPlaceholder: "пр. VW Golf 5",
    consumption: "Потрошувачка (л/100км)",
    fuelType:    "Вид гориво",
    save:        "Зачувај профил →",
    saveChanges: "Зачувај промени",
    cancel:      "Откажи",
    edit:        "Промени",
    delete:      "Избриши",
    costPerKm:   "Трошок / км",
    costPer100:  "Трошок / 100км",
    summary:     "Твојот {{model}} чини {{cost}} ден/км денес со {{fuel} на {{price}} ден.",
  },

  priceHistory: {
    period7d: "7д",
    period30d: "30д",
    period6m: "6м",
    title:       "Историја на цени",
    subtitleReal:"Реални податоци ",
    subtitleFallback: "Движење на цените низ времето",
    current:     "Тековна",
    min:         "Минимум",
    max:         "Максимум",
    change:      "Промена",
    disclaimer:  "ⓘ Историски податоци се собираат од денес. Реалниот график ќе биде достапен по неколку дена.",
  },

  berza: {
    title:    "Берза",
    subtitle: "Ажурирано секој час од јавни API-ја",
    oil:      "Нафта",
    metals:   "Метали",
    crypto:   "Крипто",
    loading:  "Вчитување...",
    todayChange: "% денес",
    barrel:   "барел",
    gram:     "грам",
    gold:     "Злато",
    silver:   "Сребро",
  },

  news: {
    label:       "Вести",
    empty:       "Нема вести во моментов.",
    showMore:    "Прикажи повеќе вести →",
    showLess:    "← Прикажи помалку",
  },

 share: {
    button:    "Сподели",
    viber:     "Viber",
    whatsapp:  "WhatsApp",
    copy:      "Копирај",
    siteLabel: "Цени на гориво",
    checkAll:  "Провери ги сите цени",
    message:   "⛽ Цени на гориво — makceni.mk\n\n{{label}}: {{price}} ден/л\n{{changeText}}\n\nПровери ги сите цени: https://makceni.mk",
    up:        " +{{change}} ден промена",
    down:      " {{change}} ден промена",
    noChange:  "Нема промена",
  },

  footer: {
    disclaimer: "Цените се информативни и може да се разликуваат на точката на продажба.",
    terms:      "Услови",
    privacy:    "Приватност",
    contact:    "Контакт",
  },
},
    safecity: {
      pageTitle:    "Safe City — Makceni.mk",
      headerTitle:  "Safe City",
      camerasCount: "{{count}} камери",
      camerasCountMobile: "{{count}}",
      reportBtn:    "+ Пријави камера",
      cancelBtn:    "✕ Откажи",
      gasStationsBtn: "Бензинcки",

      sidebar: {
        title:    "Камери за брзина",
        desc:     "Локации на Safe City камери во Скопје.",
        legendCameras:  "Камери",
        legendReported: "Пријавени",
        legendYou:      "Ти",
        loadingText:    "Вчитување...",
        locationsCount: "{{count}} локации",
        warningLabel:   "Предупредување",
        gpsOn:          "GPS активен",
        gpsOff:         "Вклучи GPS",
        gpsHint:        "Вклучи GPS за да добиваш предупредувања за Safe City камери",
        soundHint:      "Ќе слушнете звук кога ќе се приближите до камера на {{dist}}м",
        soundLabel:     "Звук при приближување",
        osmLink:        "© OpenStreetMap",
      },

      mobileControls: {
        gpsOn:    "GPS Вклучен",
        gpsOff:   "GPS",
        report:   "+ Пријави",
        cancel:   "✕",
        hint:     "Вклучи GPS за предупредувања за камери",
        soundHint:"Звук при приближување до камера на {{dist}}м",
      },

      errors: {
        permissionDenied: "Дозволете пристап до локација.",
        unavailable:      "Локацијата не е достапна.",
        timeout:          "Истече времето за локација.",
      },

      reportMode: {
        instruction: "Кликни на мапата каде се наоѓа камерата",
        successMsg:  "✓ Камерата е пријавена — благодарам!",
        formTitle:   "Пријави камера",
        locationLabel: "Локација:",
        speedLabel:  "Ограничување на брзина",
        descLabel:   "Опис (опционално)",
        descPlaceholder: "пр. Бул. Партизански Одреди",
        cancel:      "Откажи",
        submit:      "Пријави камера →",
        submitting:  "Праќање...",
      },

      proximity: {
        title:       "Камера напред!",
        close:       "✕",
        meters:      "метри",
        kmh:         "КМ/ЧАС",
        limit:       "ограничување",
        slowDown:    "Намалете ја брзината",
      },

      speed: {
        unit: "км/ч",
      },

      cameraPopup: {
        title:       "Камера за брзина",
        reported:    "Пријавена од корисник",
        official:    "Safe City · OSM",
        kmh:         "КМ/ЧАС",
        maxSpeed:    "Максимална брзина",
        warning:     "⚠️ Возете внимателно",
        googleMaps:  "Отвори во Google Maps →",
      },
    },

 mapa: {
  pageTitle:   "Бензински — Македонија",
  headerTitle: "Бензински",
  loading:     "Вчитување бензински...",
  loadedCount: "Вчитани {{count}} станици",
  fallback:    "Недостапно — локални податоци",
  stations:    "{{filtered}} / {{total}} станици · {{cities}} општини",
  stationsCount: "{{count}} станици",

  filters: {
    brandLabel: "Бренд",
    fuelLabel:  "Гориво",
  },

  locate: {
    button:    "Најблиска бензинска",
    locating:  "Пронаоѓање...",
    found:     "✓ {{name}}",
    nearest:   "Најблиска",
    fromYou:   "{{dist}} од вас",
    error:     "Дозволете пристап до локација во Settings.",
  },

  popup: {
    directions: "🧭 Упатства",
    nearestBadge: "⭐ Најблиска · {{dist}}",
  },

  legend: {
    nearest: "Најблиска",
  },

  brands: { okta:"OKTA", makpetrol:"Макпетрол", lukoil:"Лукоил", eko:"ЕКО", nis:"НИС Петрол", shell:"Shell", bp:"BP", other:"Друго" },
  fuelList: { benzin95:"Бензин 95", benzin98:"Бензин 98+", dizel:"Дизел", lpg:"LPG", cng:"CNG" },
},
    // ── privatnost.js ────────────────────────────────────────────
    privatnost: {
      pageTitle:   "Политика на приватност — МакЦени.мк",
      metaDesc:    "Политика на приватност на МакЦени.мк — како ги собираме и користиме вашите податоци.",
      badge:       "Правни информации",
      heading:     "Политика на приватност",
      updated:     "Последно ажурирање: март 2026",
      sections: [
        {
          title:   "1. Кои сме ние",
          content: "МакЦени.мк е македонска информативна веб-страница за цени на горива. Оваа политика на приватност објаснува кои податоци ги собираме, зошто и како ги користиме.",
        },
        {
          title:   "2. Какви податоци собираме",
          content: "Ние собираме анонимни аналитички податоци преку Google Analytics и Vercel Analytics. Ова вклучува: тип на уред и прелистувач, земја и јазик, страниците кои ги посетувате и времето поминато на нив, изворот од каде сте дошле на страницата. Ние НЕ собираме лични податоци како вашето име, адреса или број на телефон. Email адресата доставена за ценовни известувања се чува единствено за таа намена.",
        },
        {
          title:   "3. Колачиња (Cookies)",
          content: "МакЦени.мк користи технички и аналитички колачиња. Техничките колачиња се неопходни за функционирање на страницата (пр. зачувување на вашиот профил на возило). Аналитичките колачиња (Google Analytics) ни помагаат да разбереме како корисниците ја користат страницата, со цел подобрување на услугата. Со продолжено користење на страницата, се согласувате со употребата на колачиња.",
        },
        {
          title:   "4. Како ги користиме податоците",
          content: "Собраните аналитички податоци ги користиме исклучиво за: подобрување на содржините и функционалностите на страницата, разбирање на кои информации се најкорисни за нашите посетители, техничко одржување и оптимизација на перформансите. Ние НЕ ги продаваме вашите податоци на трети страни.",
        },
        {
          title:   "5. Трети страни",
          content: "Користиме следните услуги на трети страни кои може да собираат анонимни податоци: Google Analytics (analytics.google.com) — аналитика на посети, Vercel Analytics — технички перформанси. Овие услуги имаат свои политики на приватност кои се независни од МакЦени.мк.",
        },
        {
          title:   "6. Чување на податоците",
          content: "Аналитичките податоци се чуваат согласно политиките на Google Analytics и Vercel (најчесто 14 месеци). Email адреси за известувања се чуваат до барање за бришење. Локалните податоци (профил на возило) се чуваат само во вашиот прелистувач и можете да ги избришете во секое време.",
        },
        {
          title:   "7. Вашите права (GDPR)",
          content: "Имате право да побарате пристап, корекција или бришење на вашите лични податоци. За барања поврзани со вашата приватност, контактирајте не на: besartr1995@gmail.com. Ќе одговориме во рок од 30 дена.",
        },
        {
          title:   "8. Промени на политиката",
          content: "МакЦени.мк го задржува правото да ја ажурира оваа политика на приватност. Промените ќе бидат објавени на оваа страница со нов датум на ажурирање.",
        },
        {
          title:   "9. Контакт",
          content: "За прашања поврзани со приватноста, пишете ни на: besartr1995@gmail.com",
        },
      ],
    },

    // ── uslovi.js ─────────────────────────────────────────────────
    uslovi: {
      pageTitle:   "Услови за користење — МакЦени.мк",
      metaDesc:    "Услови за користење на МакЦени.мк — информации за употреба на податоците и одговорност.",
      badge:       "Правни информации",
      heading:     "Услови за користење",
      updated:     "Последно ажурирање: март 2026",
      sections: [
        {
          title:   "1. Општи информации",
          content: "МакЦени.мк е информативна веб-страница која прикажува цени на горива во Македонија. Сите цени се прибираат од јавно достапни извори и се ажурираат редовно. Со пристапувањето на оваа страница, вие се согласувате со овие услови за користење.",
        },
        {
          title:   "2. Точност на податоците",
          content: "Цените прикажани на МакЦени.мк се информативни и се базираат на официјални регулирани цени од Регулаторна комисија за енергетика (РКЕ) и јавно достапни извори. Цените на одредени бензински станици може да се разликуваат до 3 денари во однос на прикажаните вредности. МакЦени.мк не гарантира дека прикажаните цени ги одразуваат актуелните цени на секоја бензинска станица.",
        },
        {
          title:   "3. Одговорност",
          content: "МакЦени.мк не сноси одговорност за евентуални разлики помеѓу прикажаните и вистинските цени на горива. Корисниците ги користат информациите на сопствена одговорност. Препорачуваме секогаш да ја потврдите цената директно на бензинската станица пред полнење.",
        },
        {
          title:   "4. Извори на податоци",
          content: "Цените на горива се преземаат и обработуваат врз основа на јавно достапни информации, вклучувајќи официјални соопштенија на РКЕ и партнерски портали. Берзански цени (нафта, метали, крипто) се прибираат од јавни API-ја и се само информативни — не претставуваат финансиски совет.",
        },
        {
          title:   "5. Интелектуална сопственост",
          content: "Сите содржини на МакЦени.мк, вклучувајќи дизајн, логоа, текстови и функционалности, се сопственост на МакЦени.мк. Забрането е копирање, дистрибуција или комерцијална употреба на содржините без претходна писмена согласност.",
        },
        {
          title:   "6. Употреба на услугата",
          content: "Забрането е користење на МакЦени.мк за автоматско прибирање на податоци (scraping) без писмена дозвола. Забрането е секакво злоупотребување на услугата кое може да предизвика штета на страницата или нејзините корисници.",
        },
        {
          title:   "7. Промени на условите",
          content: "МакЦени.мк го задржува правото да ги менува овие услови во секое време. Промените стапуваат на сила веднаш по објавувањето. Препорачуваме редовно да ја проверувате оваа страница.",
        },
        {
          title:   "8. Контакт",
          content: "За прашања во врска со условите за користење, можете да не контактирате на: besartr1995@gmail.com",
        },
      ],
    },
  },

  // ══════════════════════════════════════════════════════════════════
  // ALBANIAN
  // ══════════════════════════════════════════════════════════════════
  sq: {
 "home.share.message": " Çmimet e karburantit — makceni.mk\n\n{label}: {price} den/l\n{changeText}\n\nShiko të gjitha çmimet: https://makceni.mk",
    stationPrices: {
    title: "Çmimet e karburantit",
    station: "Stacioni",
    benzin95: "Benzinë 95",
    benzin98: "Benzinë 98",
    dizel: "Naftë",
    lpg: "GNP",
  },
    fuels: {
  benzin95: "Benzinë 95",
  benzin98: "Benzinë 98+",
  dizel:    "Naftë",
  lpg:      "Gaz LPG",
  cng:      "Metan CNG",
  ekstra:   "Ekstra e Lehtë",
  mazut:    "Mazut",
},
    nav: {
      prices:      "Çmimet",
      calculator:  "Kalkulator",
      history:     "Historia",
      berza:       "Bursë",
      news:        "Lajme",
      gasStations: "Pompat e benzinës",
      safeCity:    "Safe City",
      back:        "← Kthehu",
      live:        "Drejtpërdrejt",
      loading:     "Duke ngarkuar...",
      updated:     "Pёrd. {{time}}",
    },

    home: {
priceChange: {
  benzin95: " +2.0 den nga mesnata",
  benzin98: " +2.0 den nga mesnata",
  dizel:    " -2.5 den nga mesnata",
  //lpg:      " +X.X den nga mesnata",
  //cng:      " +X.X den nga mesnata",
  ekstra:   " -1.0 den nga mesnata",
  mazut:    " +0.4 den nga mesnata",
},
      units: { perL: "den/l", perKg: "den/kg" },
      todayBadge:    "SOT",
      heroTitle:     "Çmimet e karburantit · Maqedoni",
      swipeHint:     "← Rrëshqit majtas/djathtas →",
      noChange:      "Pa ndryshim",
      den:           "den",

      stationTable: {
        title:     "Çmimet në pompë",
        subtitle:  "Çmimet sipas pompave të benzinës",
        subtitleWithTime: "Përditësuar {{time}} · ",
        station:   "Pompa",
        disclaimer:"ⓘ Çmimet mund të ndryshojnë deri në 3 den nga çmimet e rregulluara të RKE.",
      },

      cards: {
        gasStations: {
          title:    "Pompat e benzinës",
          badge:    "350+ lokacione",
          desc:     "Gjej pompën e benzinës më të afërt — OKTA, Makpetrol, Lukoil dhe më shumë.",
          cta:      "Hap hartën →",
        },
        safeCity: {
          title:    "Safe City",
          badge:    "218 kamera",
          desc:     "Vendndodhja e kamerave të Safe City në Shkup. Drejtoni me kujdes.",
          cta:      "Hap hartën →",
        },
      },

      alerts: {
        title:       "Njoftimet e çmimeve",
        desc:        "Merr njoftim kur çmimi bie nën kufirin tënd.",
        placeholder: "email@example.com",
        activate:    "Aktivizo",
        saved:       "✓ Ruajtur!",
      },

      calculator: {
        litersUnit: "l",
        title:        "Kalkulator rruge",
        subtitle:     "Llogarit kostot e udhëtimit",
        km:           "Kilometra",
        per100:       "l / 100km",
        fuelType:     "Lloji i karburantit",
        totalCost:    "Kostoja totale",
        liters:       "Litra",
      },

      carProfile: {
        title:       "Makina ime",
        subtitle:    "Kostot personale të drejtimit",
        modelLabel:  "Modeli i automjetit",
        modelPlaceholder: "p.sh. VW Golf 5",
        consumption: "Konsumi (l/100km)",
        fuelType:    "Lloji i karburantit",
        save:        "Ruaj profilin →",
        saveChanges: "Ruaj ndryshimet",
        cancel:      "Anulo",
        edit:        "Ndrysho",
        delete:      "Fshi",
        costPerKm:   "Kosto / km",
        costPer100:  "Kosto / 100km",
        summary:     "{{model}} yt kushton {{cost}} den/km sot me {{fuel}} në {{price}} den.",
      },

      priceHistory: {
        period7d: "7d", 
        period30d: "30d", 
        period6m: "6m",
        title:       "Historia e çmimeve",
        subtitleReal:"Të dhëna reale",
        subtitleFallback: "Lëvizja e çmimeve me kalimin e kohës",
        current:     "Aktuale",
        min:         "Minimum",
        max:         "Maksimum",
        change:      "Ndryshimi",
        disclaimer:  "ⓘ Të dhënat historike mblidhen nga sot. Grafiku real do jetë i disponueshëm pas disa ditësh.",
      },
berza: {
  title:    "Bursë",
  subtitle: "Përditësohet çdo orë nga API-të publike",
  oil:      "Naftë",
  metals:   "Metale",
  crypto:   "Kripto",
  loading:  "Duke ngarkuar...",
  todayChange: "% sot",
  barrel:   "fuçi",
  gram:     "gram",
  gold:     "Ar",
  silver:   "Argjend",
},

      news: {
        label:       "Lajme",
        empty:       "Nuk ka lajme për momentin.",
        showMore:    "Shfaq më shumë lajme →",
        showLess:    "← Shfaq më pak",
      },

    share: {
        button:    "Shpërndaj",
        viber:     "Viber",
        whatsapp:  "WhatsApp",
        copy:      "Kopjo",
        siteLabel: "Çmimet e karburantit",
        checkAll:  "Shiko të gjitha çmimet",
        message:   "⛽ Çmimet e karburantit — makceni.mk\n\n{{label}}: {{price}} den/l\n{{changeText}}\n\nShiko të gjitha çmimet: https://makceni.mk",
        up:        " +{{change}} den ndryshim",
        down:      " {{change}} den ndryshim",
        noChange:  "Pa ndryshim",
      },

      footer: {
        disclaimer: "Çmimet janë informative dhe mund të ndryshojnë në pikën e shitjes.",
        terms:      "Kushtet",
        privacy:    "Privatësia",
        contact:    "Kontakt",
      },
    },

    safecity: {
      pageTitle:    "Safe City — Makceni.mk",
      headerTitle:  "Safe City",
      camerasCount: "{{count}} kamera",
      camerasCountMobile: "{{count}}",
      reportBtn:    "+ Raporto kamerë",
      cancelBtn:    "✕ Anulo",
      gasStationsBtn: "Benzinore",

      sidebar: {
        title:    "Kamerat e shpejtësisë",
        desc:     "Vendndodhja e kamerave Safe City në Shkup.",
        legendCameras:  "Kamerat",
        legendReported: "Raportuara",
        legendYou:      "Ti",
        loadingText:    "Duke ngarkuar...",
        locationsCount: "{{count}} lokacione",
        warningLabel:   "Paralajmërim",
        gpsOn:          "GPS aktiv",
        gpsOff:         "Aktivizo GPS",
        gpsHint:        "Aktivizo GPS për të marrë paralajmërime për kamerat Safe City",
        soundHint:      "Do dëgjoni zë kur i afroheni një kamere në {{dist}}m",
        soundLabel:     "Zë gjatë afrimit",
        osmLink:        "© OpenStreetMap",
      },

      mobileControls: {
        gpsOn:    "GPS Aktiv",
        gpsOff:   "GPS",
        report:   "+ Raporto",
        cancel:   "✕",
        hint:     "Aktivizo GPS për paralajmërime kamerash",
        soundHint:"Zë kur i afrohesh kamerës në {{dist}}m",
      },

      errors: {
        permissionDenied: "Lejoni aksesin në vendndodhje.",
        unavailable:      "Vendndodhja nuk është e disponueshme.",
        timeout:          "Koha e vendndodhjes skadoi.",
      },

      reportMode: {
        instruction: "Kliko në hartë ku ndodhet kamera",
        successMsg:  "✓ Kamera u raportua — faleminderit!",
        formTitle:   "Raporto kamerë",
        locationLabel: "Vendndodhja:",
        speedLabel:  "Kufiri i shpejtësisë",
        descLabel:   "Përshkrim (opsional)",
        descPlaceholder: "p.sh. Bul. Partizanski Odredi",
        cancel:      "Anulo",
        submit:      "Raporto kamerën →",
        submitting:  "Duke dërguar...",
      },

      proximity: {
        title:       "Kamerë përpara!",
        close:       "✕",
        meters:      "metra",
        kmh:         "KM/ORË",
        limit:       "kufiri",
        slowDown:    "Ngadalësoni shpejtësinë",
      },

      speed: {
        unit: "km/h",
      },

      cameraPopup: {
        title:       "Kamerë shpejtësie",
        reported:    "Raportuar nga përdoruesi",
        official:    "Safe City · OSM",
        kmh:         "KM/ORË",
        maxSpeed:    "Shpejtësia maksimale",
        warning:     "⚠️ Drejtoni me kujdes",
        googleMaps:  "Hap në Google Maps →",
      },
    },

mapa: {
  pageTitle:   "Pompat e benzinës — Maqedoni",
  headerTitle: "Pompat e benzinës",
  loading:     "Duke ngarkuar pompat e benzinës...",
  loadedCount: "U ngarkuan {{count}} stacione",
  fallback:    "I padisponueshëm — të dhëna lokale",
  stations:    "{{filtered}} / {{total}} stacione · {{cities}} komuna",
  stationsCount: "{{count}} stacione",

  filters: {
    brandLabel: "Marka",
    fuelLabel:  "Karburanti",
  },

  locate: {
    button:    "Pompa e benzinës më e afërt",
    locating:  "Duke gjetur...",
    found:     "✓ {{name}}",
    nearest:   "Më e afërt",
    fromYou:   "{{dist}} prej jush",
    error:     "Lejoni aksesin në vendndodhje në Cilësimet.",
  },

  popup: {
    directions: "🧭 Udhëzime",
    nearestBadge: "⭐ Më e afërt · {{dist}}",
  },

  legend: {
    nearest: "Më e afërt",
  },

  brands: { okta:"OKTA", makpetrol:"Makpetrol", lukoil:"Lukoil", eko:"EKO", nis:"NIS Petrol", shell:"Shell", bp:"BP", other:"Tjetër" },
  fuelList: { benzin95:"Benzinë 95", benzin98:"Benzinë 98+", dizel:"Naftë", lpg:"LPG", cng:"CNG" },
},
    privatnost: {
      pageTitle:   "Politika e Privatësisë — MakÇeni.mk",
      metaDesc:    "Politika e privatësisë së MakÇeni.mk — si i mbledhim dhe përdorim të dhënat tuaja.",
      badge:       "Informacion Ligjor",
      heading:     "Politika e Privatësisë",
      updated:     "Përditësimi i fundit: mars 2026",
      sections: [
        {
          title:   "1. Kush jemi ne",
          content: "MakÇeni.mk është një faqe interneti informuese maqedonase për çmimet e karburantit. Kjo politikë privatësie shpjegon cilat të dhëna mbledhim, pse dhe si i përdorim ato.",
        },
        {
          title:   "2. Çfarë të dhënash mbledhim",
          content: "Ne mbledhim të dhëna anonime analitike përmes Google Analytics dhe Vercel Analytics. Kjo përfshin: llojin e pajisjes dhe shfletuesit, vendin dhe gjuhën, faqet që vizitoni dhe kohën e kaluar në to, burimin nga ku keni ardhur në faqe. Ne NUK mbledhim të dhëna personale si emri, adresa ose numri juaj i telefonit. Adresa e email-it e dhënë për njoftime çmimesh ruhet vetëm për atë qëllim.",
        },
        {
          title:   "3. Cookies (Biskotat)",
          content: "MakÇeni.mk përdor cookies teknike dhe analitike. Cookies teknike janë të nevojshme për funksionimin e faqes (p.sh. ruajtja e profilit tuaj të automjetit). Cookies analitike (Google Analytics) na ndihmojnë të kuptojmë si e përdorin faqen përdoruesit, me qëllim përmirësimin e shërbimit. Duke vazhduar të përdorni faqen, pranoni përdorimin e cookies.",
        },
        {
          title:   "4. Si i përdorim të dhënat",
          content: "Të dhënat analitike të mbledhura i përdorim ekskluzivisht për: përmirësimin e përmbajtjeve dhe funksionaliteteve të faqes, kuptimin se cilat informacione janë më të dobishme për vizitorët tanë, mirëmbajtjen teknike dhe optimizimin e performancës. Ne NUK i shesim të dhënat tuaja tek palët e treta.",
        },
        {
          title:   "5. Palët e treta",
          content: "Përdorim shërbimet e mëposhtme të palëve të treta që mund të mbledhin të dhëna anonime: Google Analytics (analytics.google.com) — analitikë vizitash, Vercel Analytics — performancë teknike. Këto shërbime kanë politikat e tyre të privatësisë që janë të pavarura nga MakÇeni.mk.",
        },
        {
          title:   "6. Ruajtja e të dhënave",
          content: "Të dhënat analitike ruhen sipas politikave të Google Analytics dhe Vercel (zakonisht 14 muaj). Adresat e email-it për njoftime ruhen deri në kërkesë për fshirje. Të dhënat lokale (profili i automjetit) ruhen vetëm në shfletuesin tuaj dhe mund t'i fshini në çdo kohë.",
        },
        {
          title:   "7. Të drejtat tuaja (GDPR)",
          content: "Keni të drejtë të kërkoni akses, korrigjim ose fshirje të të dhënave tuaja personale. Për kërkesa të lidhura me privatësinë tuaj, kontaktoni na në: besartr1995@gmail.com. Do të përgjigjemi brenda 30 ditësh.",
        },
        {
          title:   "8. Ndryshimet e politikës",
          content: "MakÇeni.mk rezervon të drejtën të përditësojë këtë politikë privatësie. Ndryshimet do të publikohen në këtë faqe me datën e re të përditësimit.",
        },
        {
          title:   "9. Kontakt",
          content: "Për pyetje të lidhura me privatësinë, shkruani na në: besartr1995@gmail.com",
        },
      ],
    },

    uslovi: {
      pageTitle:   "Kushtet e Përdorimit — MakÇeni.mk",
      metaDesc:    "Kushtet e përdorimit të MakÇeni.mk — informacion mbi përdorimin e të dhënave dhe përgjegjësinë.",
      badge:       "Informacion Ligjor",
      heading:     "Kushtet e Përdorimit",
      updated:     "Përditësimi i fundit: mars 2026",
      sections: [
        {
          title:   "1. Informacion i përgjithshëm",
          content: "MakÇeni.mk është një faqe interneti informuese që shfaq çmimet e karburantit në Maqedoni. Të gjitha çmimet mblidhen nga burime të disponueshme publikisht dhe përditësohen rregullisht. Duke hyrë në këtë faqe, ju pranoni këto kushte përdorimi.",
        },
        {
          title:   "2. Saktësia e të dhënave",
          content: "Çmimet e shfaqura në MakÇeni.mk janë informative dhe bazohen në çmimet zyrtare të rregulluara nga Komisioni Rregullator i Energjisë (RKE) dhe burime publike. Çmimet në disa pompa benzine mund të ndryshojnë deri në 3 denarë nga vlerat e shfaqura. MakÇeni.mk nuk garanton që çmimet e shfaqura pasqyrojnë çmimet aktuale të çdo pompë benzine.",
        },
        {
          title:   "3. Përgjegjësia",
          content: "MakÇeni.mk nuk mban përgjegjësi për ndonjë ndryshim të mundshëm midis çmimeve të shfaqura dhe çmimeve reale të karburantit. Përdoruesit e përdorin informacionin nën përgjegjësinë e tyre. Rekomandojmë gjithmonë të konfirmoni çmimin drejtpërdrejt në pompën e benzinës para se të mbushni.",
        },
        {
          title:   "4. Burimet e të dhënave",
          content: "Çmimet e karburantit merren dhe përpunohen bazuar në informacione të disponueshme publikisht, duke përfshirë njoftimet zyrtare të RKE dhe portalet partnere. Çmimet e bursës (naftë, metale, kripto) mblidhen nga API-të publike dhe janë vetëm informative — nuk përfaqësojnë këshilla financiare.",
        },
        {
          title:   "5. Pronësia intelektuale",
          content: "Të gjitha përmbajtjet e MakÇeni.mk, duke përfshirë dizajnin, logot, tekstet dhe funksionalitetet, janë pronë e MakÇeni.mk. Kopjimi, shpërndarja ose përdorimi komercial i përmbajtjeve pa pëlqimin e mëparshëm me shkrim është i ndaluar.",
        },
        {
          title:   "6. Përdorimi i shërbimit",
          content: "Është e ndaluar përdorimi i MakÇeni.mk për mbledhjen automatike të të dhënave (scraping) pa leje me shkrim. Çdo keqpërdorim i shërbimit që mund të shkaktojë dëm ndaj faqes ose përdoruesve të saj është i ndaluar.",
        },
        {
          title:   "7. Ndryshimet e kushteve",
          content: "MakÇeni.mk rezervon të drejtën të ndryshojë këto kushte në çdo kohë. Ndryshimet hyjnë në fuqi menjëherë pas publikimit. Rekomandojmë të kontrolloni rregullisht këtë faqe.",
        },
        {
          title:   "8. Kontakt",
          content: "Për pyetje në lidhje me kushtet e përdorimit, mund të na kontaktoni në: besartr1995@gmail.com",
        },
      ],
    },
  },

  // ══════════════════════════════════════════════════════════════════
  // ENGLISH
  // ══════════════════════════════════════════════════════════════════
  en: {
  "home.share.message": " Fuel prices — makceni.mk\n\n{label}: {price} den/L\n{changeText}\n\nCheck all prices: https://makceni.mk",
    stationPrices: {
    title: "Fuel Prices",
    station: "Station",
    benzin95: "Petrol 95",
    benzin98: "Petrol 98",
    dizel: "Diesel",
    lpg: "LPG",
  },
    fuels: {
  benzin95: "Petrol 95",
  benzin98: "Petrol 98+",
  dizel:    "Diesel",
  lpg:      "LPG Gas",
  cng:      "CNG Methane",
  ekstra:   "Extra Light",
  mazut:    "Mazut",
},
    nav: {
      prices:      "Prices",
      calculator:  "Calculator",
      history:     "History",
      berza:       "Markets",
      news:        "News",
      gasStations: "Gas Stations",
      safeCity:    "Safe City",
      back:        "← Back",
      live:        "Live",
      loading:     "Loading...",
      updated:     "Upd. {{time}}",
    },

    home: {
priceChange: {
  benzin95: " +2.0 den from midnight",
  benzin98: " +2.0 den from midnight",
  dizel:    " -2.5 den from midnight",
  //lpg:      " -X.X den from midnight",
  //cng:      " -X.X den from midnight",
  ekstra:   " -1.0 den from midnight",
  mazut:    " +0.4 den from midnight",
},
      units: { perL: "den/L", perKg: "den/kg" },
      todayBadge:    "TODAY",
      heroTitle:     "Fuel Prices · Macedonia",
      swipeHint:     "← Swipe left/right →",
      noChange:      "No change",
      den:           "den",

      stationTable: {
        title:     "Pump Prices",
        subtitle:  "Prices by gas station",
        subtitleWithTime: "Updated {{time}} ",
        station:   "Gas Station",
        disclaimer:"ⓘ Prices may differ by up to 3 den from RKE regulated prices.",
      },

      cards: {
        gasStations: {
          title:    "Gas Stations",
          badge:    "350+ locations",
          desc:     "Find the nearest gas station — OKTA, Makpetrol, Lukoil and more.",
          cta:      "Open map →",
        },
        safeCity: {
          title:    "Safe City",
          badge:    "218 cameras",
          desc:     "Safe City speed camera locations in Skopje. Drive carefully.",
          cta:      "Open map →",
        },
      },

      alerts: {
        title:       "Price Alerts",
        desc:        "Get notified when the price drops below your threshold.",
        placeholder: "email@example.com",
        activate:    "Activate",
        saved:       "✓ Saved!",
      },

      calculator: {
        litersUnit: "L",
        title:        "Trip Calculator",
        subtitle:     "Calculate your travel costs",
        km:           "Kilometers",
        per100:       "L / 100km",
        fuelType:     "Fuel type",
        totalCost:    "Total cost",
        liters:       "Liters",
      },

      carProfile: {
        title:       "My Car",
        subtitle:    "Personalized driving costs",
        modelLabel:  "Vehicle model",
        modelPlaceholder: "e.g. VW Golf 5",
        consumption: "Consumption (L/100km)",
        fuelType:    "Fuel type",
        save:        "Save profile →",
        saveChanges: "Save changes",
        cancel:      "Cancel",
        edit:        "Edit",
        delete:      "Delete",
        costPerKm:   "Cost / km",
        costPer100:  "Cost / 100km",
        summary:     "Your {{model}} costs {{cost}} den/km today with {{fuel}} at {{price}} den.",
      },

      priceHistory: {
        period7d: "7d", 
        period30d: "30d", 
        period6m: "6m",
        title:       "Price History",
        subtitleReal:"Real data ",
        subtitleFallback: "Price movement over time",
        current:     "Current",
        min:         "Minimum",
        max:         "Maximum",
        change:      "Change",
        disclaimer:  "ⓘ Historical data is being collected from today. The real chart will be available in a few days.",
      },

     berza: {
  title:    "Markets",
  subtitle: "Updated every hour from public APIs",
  oil:      "Oil",
  metals:   "Metals",
  crypto:   "Crypto",
  loading:  "Loading...",
  todayChange: "% today",
  barrel:   "barrel",
  gram:     "gram",
  gold:     "Gold",
  silver:   "Silver",
},

      news: {
        label:       "News",
        empty:       "No news at the moment.",
        showMore:    "Show more news →",
        showLess:    "← Show less",
      },

share: {
        button:    "Share",
        viber:     "Viber",
        whatsapp:  "WhatsApp",
        copy:      "Copy",
        siteLabel: "Fuel prices",
        checkAll:  "Check all prices",
        message:   "⛽ Fuel prices — makceni.mk\n\n{{label}}: {{price}} den/L\n{{changeText}}\n\nCheck all prices: https://makceni.mk",
        up:        " +{{change}} den change",
        down:      " {{change}} den change",
        noChange:  "No change",
      },  

      footer: {
        disclaimer: "Prices are indicative and may differ at the point of sale.",
        terms:      "Terms",
        privacy:    "Privacy",
        contact:    "Contact",
      },
    },

    safecity: {
      pageTitle:    "Safe City — Makceni.mk",
      headerTitle:  "Safe City",
      camerasCount: "{{count}} cameras",
      camerasCountMobile: "{{count}}",
      reportBtn:    "+ Report camera",
      cancelBtn:    "✕ Cancel",
      gasStationsBtn: "Gas Stations",

      sidebar: {
        title:    "Speed Cameras",
        desc:     "Safe City speed camera locations in Skopje.",
        legendCameras:  "Cameras",
        legendReported: "Reported",
        legendYou:      "You",
        loadingText:    "Loading...",
        locationsCount: "{{count}} locations",
        warningLabel:   "Warning",
        gpsOn:          "GPS active",
        gpsOff:         "Enable GPS",
        gpsHint:        "Enable GPS to receive Safe City camera warnings",
        soundHint:      "You will hear a sound when within {{dist}}m of a camera",
        soundLabel:     "Sound on approach",
        osmLink:        "© OpenStreetMap",
      },

      mobileControls: {
        gpsOn:    "GPS On",
        gpsOff:   "GPS",
        report:   "+ Report",
        cancel:   "✕",
        hint:     "Enable GPS for camera warnings",
        soundHint:"Sound when approaching camera at {{dist}}m",
      },

      errors: {
        permissionDenied: "Please allow location access.",
        unavailable:      "Location is not available.",
        timeout:          "Location request timed out.",
      },

      reportMode: {
        instruction: "Click on the map where the camera is located",
        successMsg:  "✓ Camera reported — thank you!",
        formTitle:   "Report Camera",
        locationLabel: "Location:",
        speedLabel:  "Speed limit",
        descLabel:   "Description (optional)",
        descPlaceholder: "e.g. Partizanski Odredi Blvd.",
        cancel:      "Cancel",
        submit:      "Report camera →",
        submitting:  "Sending...",
      },

      proximity: {
        title:       "Camera ahead!",
        close:       "✕",
        meters:      "meters",
        kmh:         "KM/H",
        limit:       "limit",
        slowDown:    "Slow down",
      },

      speed: {
        unit: "km/h",
      },

      cameraPopup: {
        title:       "Speed Camera",
        reported:    "Reported by user",
        official:    "Safe City · OSM",
        kmh:         "KM/H",
        maxSpeed:    "Maximum speed",
        warning:     "⚠️ Drive carefully",
        googleMaps:  "Open in Google Maps →",
      },
    },

    mapa: {
  pageTitle:   "Gas Stations — Macedonia",
  headerTitle: "Gas Stations",
  loading:     "Loading gas stations...",
  loadedCount: "Loaded {{count}} stations",
  fallback:    "Unavailable — local data",
  stations:    "{{filtered}} / {{total}} stations · {{cities}} municipalities",
  stationsCount: "{{count}} stations",

  filters: {
    brandLabel: "Brand",
    fuelLabel:  "Fuel",
  },

  locate: {
    button:    "Nearest gas station",
    locating:  "Finding...",
    found:     "✓ {{name}}",
    nearest:   "Nearest",
    fromYou:   "{{dist}} from you",
    error:     "Please allow location access in Settings.",
  },

  popup: {
    directions: "🧭 Directions",
    nearestBadge: "⭐ Nearest · {{dist}}",
  },

  legend: {
    nearest: "Nearest",
  },

  brands: { okta:"OKTA", makpetrol:"Makpetrol", lukoil:"Lukoil", eko:"EKO", nis:"NIS Petrol", shell:"Shell", bp:"BP", other:"Other" },
  fuelList: { benzin95:"Petrol 95", benzin98:"Petrol 98+", dizel:"Diesel", lpg:"LPG", cng:"CNG" },
},

    privatnost: {
      pageTitle:   "Privacy Policy — MakCeni.mk",
      metaDesc:    "Privacy policy of MakCeni.mk — how we collect and use your data.",
      badge:       "Legal Information",
      heading:     "Privacy Policy",
      updated:     "Last updated: March 2026",
      sections: [
        {
          title:   "1. Who we are",
          content: "MakCeni.mk is a Macedonian informational website about fuel prices. This privacy policy explains what data we collect, why, and how we use it.",
        },
        {
          title:   "2. What data we collect",
          content: "We collect anonymous analytics data through Google Analytics and Vercel Analytics. This includes: device and browser type, country and language, pages you visit and time spent on them, the source from which you arrived at the site. We do NOT collect personal data such as your name, address, or phone number. Email addresses submitted for price alerts are stored solely for that purpose.",
        },
        {
          title:   "3. Cookies",
          content: "MakCeni.mk uses technical and analytical cookies. Technical cookies are necessary for the site to function (e.g. saving your vehicle profile). Analytical cookies (Google Analytics) help us understand how users use the site, in order to improve the service. By continuing to use the site, you agree to the use of cookies.",
        },
        {
          title:   "4. How we use the data",
          content: "The collected analytics data is used exclusively for: improving the content and functionality of the site, understanding which information is most useful to our visitors, technical maintenance and performance optimization. We do NOT sell your data to third parties.",
        },
        {
          title:   "5. Third parties",
          content: "We use the following third-party services which may collect anonymous data: Google Analytics (analytics.google.com) — visit analytics, Vercel Analytics — technical performance. These services have their own privacy policies that are independent of MakCeni.mk.",
        },
        {
          title:   "6. Data retention",
          content: "Analytics data is retained according to Google Analytics and Vercel policies (typically 14 months). Email addresses for notifications are retained until a deletion request is made. Local data (vehicle profile) is stored only in your browser and can be deleted at any time.",
        },
        {
          title:   "7. Your rights (GDPR)",
          content: "You have the right to request access, correction, or deletion of your personal data. For requests related to your privacy, contact us at: besartr1995@gmail.com. We will respond within 30 days.",
        },
        {
          title:   "8. Policy changes",
          content: "MakCeni.mk reserves the right to update this privacy policy. Changes will be published on this page with a new update date.",
        },
        {
          title:   "9. Contact",
          content: "For questions related to privacy, write to us at: besartr1995@gmail.com",
        },
      ],
    },

    uslovi: {
      pageTitle:   "Terms of Use — MakCeni.mk",
      metaDesc:    "Terms of use of MakCeni.mk — information on data usage and liability.",
      badge:       "Legal Information",
      heading:     "Terms of Use",
      updated:     "Last updated: March 2026",
      sections: [
        {
          title:   "1. General information",
          content: "MakCeni.mk is an informational website that displays fuel prices in Macedonia. All prices are collected from publicly available sources and updated regularly. By accessing this site, you agree to these terms of use.",
        },
        {
          title:   "2. Data accuracy",
          content: "The prices displayed on MakCeni.mk are informational and are based on official regulated prices from the Energy Regulatory Commission (RKE) and publicly available sources. Prices at certain gas stations may differ by up to 3 denars from the displayed values. MakCeni.mk does not guarantee that the displayed prices reflect the current prices at every gas station.",
        },
        {
          title:   "3. Liability",
          content: "MakCeni.mk is not responsible for any differences between the displayed and actual fuel prices. Users use the information at their own risk. We recommend always confirming the price directly at the gas station before refueling.",
        },
        {
          title:   "4. Data sources",
          content: "Fuel prices are obtained and processed based on publicly available information, including official RKE announcements and partner portals. Market prices (oil, metals, crypto) are collected from public APIs and are informational only — they do not constitute financial advice.",
        },
        {
          title:   "5. Intellectual property",
          content: "All content on MakCeni.mk, including design, logos, text, and functionality, is the property of MakCeni.mk. Copying, distribution, or commercial use of the content without prior written consent is prohibited.",
        },
        {
          title:   "6. Use of the service",
          content: "Using MakCeni.mk for automated data collection (scraping) without written permission is prohibited. Any misuse of the service that may cause harm to the site or its users is prohibited.",
        },
        {
          title:   "7. Changes to the terms",
          content: "MakCeni.mk reserves the right to change these terms at any time. Changes take effect immediately upon publication. We recommend checking this page regularly.",
        },
        {
          title:   "8. Contact",
          content: "For questions regarding the terms of use, you can contact us at: besartr1995@gmail.com",
        },
      ],
    },
  },

  // ══════════════════════════════════════════════════════════════════
  // TURKISH
  // ══════════════════════════════════════════════════════════════════
  tr: {
"home.share.message": " Yakıt fiyatları — makceni.mk\n\n{label}: {price} den/L\n{changeText}\n\nTüm fiyatları gör: https://makceni.mk",
      stationPrices: {
    title: "Yakıt Fiyatları",
    station: "İstasyon",
    benzin95: "Benzin 95",
    benzin98: "Benzin 98",
    dizel: "Dizel",
    lpg: "LPG",
  },
    fuels: {
  benzin95: "Benzin 95",
  benzin98: "Benzin 98+",
  dizel:    "Dizel",
  lpg:      "LPG Gazı",
  cng:      "Metan CNG",
  ekstra:   "Ekstra Hafif",
  mazut:    "Mazut",
},
    nav: {
      prices:      "Fiyatlar",
      calculator:  "Hesaplayıcı",
      history:     "Geçmiş",
      berza:       "Borsa",
      news:        "Haberler",
      gasStations: "Benzinlikler",
      safeCity:    "Safe City",
      back:        "← Geri",
      live:        "Canlı",
      loading:     "Yükleniyor...",
      updated:     "Güncl. {{time}}",
    },

    home: {
priceChange: {
  benzin95: " +2.0 den geceyarısından itibaren",
  benzin98: " +2.0 den geceyarısından itibaren",
  dizel:    " -2.5 den geceyarısından itibaren",
  //lpg:      " -X.X den geceyarısından itibaren",
  //cng:      " -X.X den geceyarısından itibaren",
  ekstra:   " -1.0 den geceyarısından itibaren",
  mazut:    " +0.4 den geceyarısından itibaren",
},
      units: { perL: "den/L", perKg: "den/kg" },
      todayBadge:    "BUGÜN",
      heroTitle:     "Yakıt Fiyatları · Makedonya",
      swipeHint:     "← Sola/sağa kaydır →",
      noChange:      "Değişim yok",
      den:           "den",

      stationTable: {
        title:     "Pompa Fiyatları",
        subtitle:  "İstasyona göre fiyatlar",
        subtitleWithTime: "Güncellendi {{time}} ·",
        station:   "Benzinlik",
        disclaimer:"ⓘ Fiyatlar RKE düzenlenmiş fiyatlardan 3 den'e kadar farklılık gösterebilir.",
      },

      cards: {
        gasStations: {
          title:    "Benzinlikler",
          badge:    "350+ konum",
          desc:     "En yakın benzinliği bul — OKTA, Makpetrol, Lukoil ve daha fazlası.",
          cta:      "Haritayı aç →",
        },
        safeCity: {
          title:    "Safe City",
          badge:    "218 kamera",
          desc:     "Üsküp'teki Safe City hız kamera konumları. Dikkatli sürün.",
          cta:      "Haritayı aç →",
        },
      },

      alerts: {
        title:       "Fiyat Bildirimleri",
        desc:        "Fiyat eşiğinizin altına düştüğünde bildirim alın.",
        placeholder: "email@example.com",
        activate:    "Etkinleştir",
        saved:       "✓ Kaydedildi!",
      },

      calculator: {
        litersUnit: "L",
        title:        "Yol Hesaplayıcı",
        subtitle:     "Seyahat masraflarınızı hesaplayın",
        km:           "Kilometre",
        per100:       "L / 100km",
        fuelType:     "Yakıt türü",
        totalCost:    "Toplam maliyet",
        liters:       "Litre",
      },

      carProfile: {
        title:       "Arabam",
        subtitle:    "Kişiselleştirilmiş sürüş maliyetleri",
        modelLabel:  "Araç modeli",
        modelPlaceholder: "örn. VW Golf 5",
        consumption: "Tüketim (L/100km)",
        fuelType:    "Yakıt türü",
        save:        "Profili kaydet →",
        saveChanges: "Değişiklikleri kaydet",
        cancel:      "İptal",
        edit:        "Düzenle",
        delete:      "Sil",
        costPerKm:   "Maliyet / km",
        costPer100:  "Maliyet / 100km",
        summary:     "{{model}} aracınız bugün {{price}} den'de {{fuel}} ile {{cost}} den/km'ye mal oluyor.",
      },

      priceHistory: {
        period7d: "7g", 
        period30d: "30g",
        period6m: "6a",
        title:       "Fiyat Geçmişi",
        subtitleReal:"Gerçek veriler",
        subtitleFallback: "Zamanla fiyat hareketi",
        current:     "Güncel",
        min:         "Minimum",
        max:         "Maksimum",
        change:      "Değişim",
        disclaimer:  "ⓘ Geçmiş veriler bugünden itibaren toplanmaktadır. Gerçek grafik birkaç gün içinde kullanılabilir olacak.",
      },

    berza: {
  title:    "Borsa",
  subtitle: "Her saat genel API'lerden güncellenir",
  oil:      "Petrol",
  metals:   "Metaller",
  crypto:   "Kripto",
  loading:  "Yükleniyor...",
  todayChange: "% bugün",
  barrel:   "varil",
  gram:     "gram",
  gold:     "Altın",
  silver:   "Gümüş",
},

      news: {
        label:       "Haberler",
        empty:       "Şu anda haber yok.",
        showMore:    "Daha fazla haber →",
        showLess:    "← Daha az göster",
      },

share: {
        button:    "Paylaş",
        viber:     "Viber",
        whatsapp:  "WhatsApp",
        copy:      "Kopyala",
        siteLabel: "Yakıt fiyatları",
        checkAll:  "Tüm fiyatları gör",
        message:   "⛽ Yakıt fiyatları — makceni.mk\n\n{{label}}: {{price}} den/L\n{{changeText}}\n\nTüm fiyatları kontrol et: https://makceni.mk",
        up:        " +{{change}} den değişim",
        down:      " {{change}} den değişim",
        noChange:  "Değişim yok",
      },

      footer: {
        disclaimer: "Fiyatlar bilgilendirme amaçlıdır ve satış noktasında farklılık gösterebilir.",
        terms:      "Koşullar",
        privacy:    "Gizlilik",
        contact:    "İletişim",
      },
    },

    safecity: {
      pageTitle:    "Safe City — Makceni.mk",
      headerTitle:  "Safe City",
      camerasCount: "{{count}} kamera",
      camerasCountMobile: "{{count}}",
      reportBtn:    "+ Kamera bildir",
      cancelBtn:    "✕ İptal",
      gasStationsBtn: "Benzinlikler",

      sidebar: {
        title:    "Hız Kameraları",
        desc:     "Üsküp'teki Safe City hız kamera konumları.",
        legendCameras:  "Kameralar",
        legendReported: "Bildirilenler",
        legendYou:      "Sen",
        loadingText:    "Yükleniyor...",
        locationsCount: "{{count}} konum",
        warningLabel:   "Uyarı",
        gpsOn:          "GPS etkin",
        gpsOff:         "GPS'i etkinleştir",
        gpsHint:        "Safe City kamera uyarıları almak için GPS'i etkinleştir",
        soundHint:      "Kameraya {{dist}}m yaklaştığında ses duyacaksınız",
        soundLabel:     "Yaklaşırken ses",
        osmLink:        "© OpenStreetMap",
      },

      mobileControls: {
        gpsOn:    "GPS Açık",
        gpsOff:   "GPS",
        report:   "+ Bildir",
        cancel:   "✕",
        hint:     "Kamera uyarıları için GPS'i etkinleştir",
        soundHint:"{{dist}}m'deki kameraya yaklaşırken ses",
      },

      errors: {
        permissionDenied: "Lütfen konum erişimine izin verin.",
        unavailable:      "Konum mevcut değil.",
        timeout:          "Konum isteği zaman aşımına uğradı.",
      },

      reportMode: {
        instruction: "Kameranın bulunduğu yere haritada tıklayın",
        successMsg:  "✓ Kamera bildirildi — teşekkürler!",
        formTitle:   "Kamera Bildir",
        locationLabel: "Konum:",
        speedLabel:  "Hız sınırı",
        descLabel:   "Açıklama (isteğe bağlı)",
        descPlaceholder: "örn. Partizanski Odredi Bulvarı",
        cancel:      "İptal",
        submit:      "Kamerayı bildir →",
        submitting:  "Gönderiliyor...",
      },

      proximity: {
        title:       "İleride kamera!",
        close:       "✕",
        meters:      "metre",
        kmh:         "KM/S",
        limit:       "sınır",
        slowDown:    "Hızınızı azaltın",
      },

      speed: {
        unit: "km/s",
      },

      cameraPopup: {
        title:       "Hız Kamerası",
        reported:    "Kullanıcı tarafından bildirildi",
        official:    "Safe City · OSM",
        kmh:         "KM/S",
        maxSpeed:    "Maksimum hız",
        warning:     "⚠️ Dikkatli sürün",
        googleMaps:  "Google Maps'te aç →",
      },
    },

  mapa: {
  pageTitle:   "Benzinlikler — Makedonya",
  headerTitle: "Benzinlikler",
  loading:     "Benzinlikler yükleniyor...",
  loadedCount: "{{count}} istasyon yüklendi",
  fallback:    "Mevcut değil — yerel veriler",
  stations:    "{{filtered}} / {{total}} istasyon · {{cities}} belediye",
  stationsCount: "{{count}} istasyon",

  filters: {
    brandLabel: "Marka",
    fuelLabel:  "Yakıt",
  },

  locate: {
    button:    "En yakın benzinlik",
    locating:  "Bulunuyor...",
    found:     "✓ {{name}}",
    nearest:   "En yakın",
    fromYou:   "Sizden {{dist}}",
    error:     "Lütfen Ayarlar'da konum erişimine izin verin.",
  },

  popup: {
    directions: "🧭 Yol tarifi",
    nearestBadge: "⭐ En yakın · {{dist}}",
  },

  legend: {
    nearest: "En yakın",
  },

  brands: { okta:"OKTA", makpetrol:"Makpetrol", lukoil:"Lukoil", eko:"EKO", nis:"NIS Petrol", shell:"Shell", bp:"BP", other:"Diğer" },
  fuelList: { benzin95:"Benzin 95", benzin98:"Benzin 98+", dizel:"Dizel", lpg:"LPG", cng:"CNG" },
},

    privatnost: {
      pageTitle:   "Gizlilik Politikası — MakCeni.mk",
      metaDesc:    "MakCeni.mk gizlilik politikası — verilerinizi nasıl topluyor ve kullanıyoruz.",
      badge:       "Hukuki Bilgi",
      heading:     "Gizlilik Politikası",
      updated:     "Son güncelleme: Mart 2026",
      sections: [
        {
          title:   "1. Biz kimiz",
          content: "MakCeni.mk, yakıt fiyatları hakkında Makedonya merkezli bir bilgi web sitesidir. Bu gizlilik politikası hangi verileri topladığımızı, neden ve nasıl kullandığımızı açıklar.",
        },
        {
          title:   "2. Hangi verileri topluyoruz",
          content: "Google Analytics ve Vercel Analytics aracılığıyla anonim analitik veriler topluyoruz. Bunlar şunları içerir: cihaz ve tarayıcı türü, ülke ve dil, ziyaret ettiğiniz sayfalar ve geçirdiğiniz süre, siteye nereden geldiğinizin kaynağı. Adınız, adresiniz veya telefon numaranız gibi kişisel verileri TOPLAMIYORUZ. Fiyat bildirimleri için sağlanan e-posta adresi yalnızca bu amaç için saklanır.",
        },
        {
          title:   "3. Çerezler (Cookies)",
          content: "MakCeni.mk teknik ve analitik çerezler kullanır. Teknik çerezler sitenin çalışması için gereklidir (örn. araç profilinizin kaydedilmesi). Analitik çerezler (Google Analytics), hizmeti iyileştirmek amacıyla kullanıcıların siteyi nasıl kullandığını anlamamıza yardımcı olur. Siteyi kullanmaya devam ederek çerez kullanımını kabul etmiş olursunuz.",
        },
        {
          title:   "4. Verileri nasıl kullanıyoruz",
          content: "Toplanan analitik veriler yalnızca şunlar için kullanılır: sitenin içerik ve işlevselliğinin iyileştirilmesi, ziyaretçilerimiz için en yararlı bilgilerin belirlenmesi, teknik bakım ve performans optimizasyonu. Verilerinizi üçüncü taraflara SATMIYORUZ.",
        },
        {
          title:   "5. Üçüncü taraflar",
          content: "Anonim veri toplayabilecek aşağıdaki üçüncü taraf hizmetleri kullanıyoruz: Google Analytics (analytics.google.com) — ziyaret analitiği, Vercel Analytics — teknik performans. Bu hizmetlerin MakCeni.mk'dan bağımsız gizlilik politikaları bulunmaktadır.",
        },
        {
          title:   "6. Veri saklama",
          content: "Analitik veriler Google Analytics ve Vercel politikalarına göre saklanır (genellikle 14 ay). Bildirimler için e-posta adresleri silme talebine kadar saklanır. Yerel veriler (araç profili) yalnızca tarayıcınızda saklanır ve istediğiniz zaman silebilirsiniz.",
        },
        {
          title:   "7. Haklarınız (GDPR)",
          content: "Kişisel verilerinize erişim, düzeltme veya silme talebinde bulunma hakkına sahipsiniz. Gizliliğinizle ilgili talepler için bize ulaşın: besartr1995@gmail.com. 30 gün içinde yanıt vereceğiz.",
        },
        {
          title:   "8. Politika değişiklikleri",
          content: "MakCeni.mk bu gizlilik politikasını güncelleme hakkını saklı tutar. Değişiklikler yeni bir güncelleme tarihiyle bu sayfada yayınlanacaktır.",
        },
        {
          title:   "9. İletişim",
          content: "Gizlilikle ilgili sorularınız için bize yazın: besartr1995@gmail.com",
        },
      ],
    },

    uslovi: {
      pageTitle:   "Kullanım Koşulları — MakCeni.mk",
      metaDesc:    "MakCeni.mk kullanım koşulları — veri kullanımı ve sorumluluk hakkında bilgi.",
      badge:       "Hukuki Bilgi",
      heading:     "Kullanım Koşulları",
      updated:     "Son güncelleme: Mart 2026",
      sections: [
        {
          title:   "1. Genel bilgiler",
          content: "MakCeni.mk, Makedonya'daki yakıt fiyatlarını gösteren bir bilgi web sitesidir. Tüm fiyatlar kamuya açık kaynaklardan toplanır ve düzenli olarak güncellenir. Bu siteye erişerek bu kullanım koşullarını kabul etmiş olursunuz.",
        },
        {
          title:   "2. Veri doğruluğu",
          content: "MakCeni.mk'da görüntülenen fiyatlar bilgilendirme amaçlıdır ve Enerji Düzenleyici Komisyonu (RKE) tarafından belirlenen resmi düzenlenmiş fiyatlara ve kamuya açık kaynaklara dayanmaktadır. Belirli benzinliklerdeki fiyatlar görüntülenen değerlerden 3 denara kadar farklılık gösterebilir. MakCeni.mk, görüntülenen fiyatların her benzinlikteki güncel fiyatları yansıttığını garanti etmez.",
        },
        {
          title:   "3. Sorumluluk",
          content: "MakCeni.mk, görüntülenen ve gerçek yakıt fiyatları arasındaki olası farklılıklardan sorumlu değildir. Kullanıcılar bilgileri kendi sorumluluklarında kullanır. Yakıt doldurmadan önce fiyatı doğrudan benzinlikte onaylamanızı öneririz.",
        },
        {
          title:   "4. Veri kaynakları",
          content: "Yakıt fiyatları, resmi RKE duyuruları ve ortak portallar dahil olmak üzere kamuya açık bilgiler temel alınarak elde edilir ve işlenir. Borsa fiyatları (petrol, metaller, kripto) kamuya açık API'lerden toplanır ve yalnızca bilgilendirme amaçlıdır — finansal tavsiye niteliği taşımaz.",
        },
        {
          title:   "5. Fikri mülkiyet",
          content: "Tasarım, logolar, metinler ve işlevsellik dahil MakCeni.mk'daki tüm içerikler MakCeni.mk'ın mülkiyetindedir. Önceden yazılı izin alınmadan içeriklerin kopyalanması, dağıtılması veya ticari amaçlarla kullanılması yasaktır.",
        },
        {
          title:   "6. Hizmetin kullanımı",
          content: "Yazılı izin olmaksızın otomatik veri toplama (scraping) amacıyla MakCeni.mk kullanımı yasaktır. Siteye veya kullanıcılarına zarar verebilecek her türlü hizmet kötüye kullanımı yasaktır.",
        },
        {
          title:   "7. Koşullardaki değişiklikler",
          content: "MakCeni.mk bu koşulları istediği zaman değiştirme hakkını saklı tutar. Değişiklikler yayınlanmasının hemen ardından yürürlüğe girer. Bu sayfayı düzenli olarak kontrol etmenizi öneririz.",
        },
        {
          title:   "8. İletişim",
          content: "Kullanım koşullarıyla ilgili sorularınız için bize ulaşabilirsiniz: besartr1995@gmail.com",
        },
      ],
    },
  },
};

export default translations;