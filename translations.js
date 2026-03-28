// translations.js — makceni.mk
// Languages: mk (Macedonian), sq (Albanian), en (English), tr (Turkish)

export const LANGS = [
  { code: "mk", label: "МК", flag: "🇲🇰" },
  { code: "sq", label: "SQ", flag: "🇦🇱" },
  { code: "en", label: "EN", flag: "🇬🇧" },
  { code: "tr", label: "TR", flag: "🇹🇷" },
];

// ── Storage helpers ────────────────────────────────────
const LANG_KEY = "makceni_lang";

export function getLang() {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved && LANGS.find(l => l.code === saved)) return saved;
  } catch {}
  return "mk";
}

export function setLang(code) {
  try { localStorage.setItem(LANG_KEY, code); } catch {}
}

// ── Helper: resolve a string or function translation ──
export function t(entry, lang) {
  if (!entry) return "";
  if (typeof entry === "string") return entry;
  if (typeof entry === "object") return entry[lang] || entry["mk"] || "";
  return "";
}

// ── All translations ───────────────────────────────────
export const T = {

  // ── Common labels used across multiple pages ─────────
  common: {
    loading:          { mk: "Се вчитува...",      sq: "Duke ngarkuar...",  en: "Loading...",       tr: "Yükleniyor..."     },
    updated:          { mk: "Ажурирано",           sq: "Përditësuar",       en: "Updated",          tr: "Güncellendi"       },
    liveLabel:        { mk: "Во живо",             sq: "Drejtpërdrejt",     en: "Live",             tr: "Canlı"             },
    today:            { mk: "ДЕНЕС",               sq: "SOT",               en: "TODAY",            tr: "BUGÜN"             },
    noChange:         { mk: "Без промена",         sq: "Pa ndryshim",       en: "No change",        tr: "Değişim yok"       },
    share:            { mk: "Сподели",             sq: "Ndaj",              en: "Share",            tr: "Paylaş"            },
    copy:             { mk: "Копирај",             sq: "Kopjo",             en: "Copy",             tr: "Kopyala"           },
    edit:             { mk: "Измени",              sq: "Ndrysho",           en: "Edit",             tr: "Düzenle"           },
    delete:           { mk: "Избриши",             sq: "Fshi",              en: "Delete",           tr: "Sil"               },
    cancel:           { mk: "Откажи",              sq: "Anulo",             en: "Cancel",           tr: "İptal"             },
    save:             { mk: "Зачувај",             sq: "Ruaj",              en: "Save",             tr: "Kaydet"            },
    saveChanges:      { mk: "Зачувај промени",     sq: "Ruaj ndryshimet",   en: "Save changes",     tr: "Değişiklikleri kaydet" },
    saved:            { mk: "✓ Зачувано!",         sq: "✓ Ruajtur!",        en: "✓ Saved!",         tr: "✓ Kaydedildi!"     },
    activate:         { mk: "Активирај",           sq: "Aktivizo",          en: "Activate",         tr: "Etkinleştir"       },
    showMore:         { mk: "Прикажи повеќе",      sq: "Shfaq më shumë",    en: "Show more",        tr: "Daha fazla göster" },
    showLess:         { mk: "Прикажи помалку",     sq: "Shfaq më pak",      en: "Show less",        tr: "Daha az göster"    },
    footerDisclaimer: { mk: "Цените се информативни. Проверете кај бензинската.",  sq: "Çmimet janë informative. Kontrolloni në pikën e karburantit.", en: "Prices are indicative. Verify at the pump.", tr: "Fiyatlar bilgi amaçlıdır. Pompayla doğrulayın." },
    terms:            { mk: "Услови",              sq: "Kushtet",           en: "Terms",            tr: "Koşullar"          },
    privacy:          { mk: "Приватност",          sq: "Privatësia",        en: "Privacy",          tr: "Gizlilik"          },
    contact:          { mk: "Контакт",             sq: "Kontakt",           en: "Contact",          tr: "İletişim"          },
  },

  // ── Navigation ───────────────────────────────────────
  nav: {
    prices:    { mk: "Цени",            sq: "Çmimet",          en: "Prices",           tr: "Fiyatlar"          },
    calculator:{ mk: "Калкулатор",      sq: "Kalkulator",      en: "Calculator",       tr: "Hesap makinesi"    },
    history:   { mk: "Историја",        sq: "Historia",        en: "History",          tr: "Geçmiş"            },
    berza:     { mk: "Берза",           sq: "Bursa",           en: "Exchange",         tr: "Borsa"             },
    news:      { mk: "Вести",           sq: "Lajmet",          en: "News",             tr: "Haberler"          },
    benzinski: { mk: "Бензински",       sq: "Pikat e karb.",   en: "Gas Stations",     tr: "Benzin istasyonları" },
    safeCity:  { mk: "Safe City",       sq: "Safe City",       en: "Safe City",        tr: "Safe City"         },
  },

  // ── Index page ───────────────────────────────────────
  index: {
    pageTitle:   { mk: "makceni.mk — Цени на горива во Македонија", sq: "makceni.mk — Çmimet e karburantit në Maqedoni", en: "makceni.mk — Fuel prices in Macedonia", tr: "makceni.mk — Makedonya yakıt fiyatları" },
    metaDesc:    { mk: "Следете ги цените на бензин, дизел, LPG и CNG во Македонија во реално време.", sq: "Ndiqni çmimet e benzinës, naftës, LPG dhe CNG në Maqedoni në kohë reale.", en: "Track petrol, diesel, LPG and CNG prices in Macedonia in real time.", tr: "Makedonya'daki benzin, dizel, LPG ve CNG fiyatlarını gerçek zamanlı takip edin." },

   h1: {
  mk: "Цени на горива · Македонија",
  sq: "Çmimet e karburantit · Maqedoni",
  en: "Fuel prices · Macedonia",
  tr: "Yakıt fiyatları · Makedonya",
},
    swipeHint: { mk: "Лизгај за повеќе горива",  sq: "Rrëshqit për më shumë karburante", en: "Swipe for more fuels", tr: "Daha fazla yakıt için kaydırın" },

    // ── Station Prices page (/pages/station-prices.js) ───
stationPage: {
  title:   { mk: "Цени на горива",  sq: "Çmimet e karburantit", en: "Fuel Prices",  tr: "Yakıt Fiyatları" },
  station: { mk: "Бензинска",       sq: "Stacioni",             en: "Station",      tr: "İstasyon"        },
  b95:     { mk: "Бензин 95",       sq: "Benzinë 95",           en: "Petrol 95",    tr: "Benzin 95"       },
  b98:     { mk: "Бензин 98+",      sq: "Benzinë 98+",          en: "Petrol 98+",   tr: "Benzin 98+"      },
  dizel:   { mk: "Дизел",           sq: "Naftë",                en: "Diesel",       tr: "Dizel"           },
  lpg:     { mk: "Плин LPG",        sq: "Gaz LPG",              en: "LPG Gas",      tr: "LPG Gazı"        },
},

    // Share message builder — receives (label, price, unit, change, lang)
    shareMsg: (label, price, unit, change, lang) => {
      const changeStr = Math.abs(change) >= 0.05
        ? (change > 0 ? ` (▲ +${change.toFixed(1)} ден)` : ` (▼ ${change.toFixed(1)} ден)`)
        : "";
      const msgs = {
        mk: `⛽ ${label}: ${price.toFixed(1)} ${unit}${changeStr}\n📊 Следи ги цените на makceni.mk`,
        sq: `⛽ ${label}: ${price.toFixed(1)} ${unit}${changeStr}\n📊 Ndiq çmimet në makceni.mk`,
        en: `⛽ ${label}: ${price.toFixed(1)} ${unit}${changeStr}\n📊 Track prices at makceni.mk`,
        tr: `⛽ ${label}: ${price.toFixed(1)} ${unit}${changeStr}\n📊 Fiyatları makceni.mk'da takip edin`,
      };
      return msgs[lang] || msgs.mk;
    },

    // Price history section
    historyTitle:       { mk: "Историја на цени",               sq: "Historia e çmimeve",           en: "Price history",            tr: "Fiyat geçmişi"             },
    historySubReal:     { mk: "Реални податоци",                 sq: "Të dhëna reale",               en: "Real data",                tr: "Gerçek veriler"            },
    historySubFallback: { mk: "Индикативни податоци",            sq: "Të dhëna indikative",          en: "Indicative data",          tr: "Gösterge verileri"         },
    historyNoData:      { mk: "* Историјата е индикативна и служи само за ориентација.", sq: "* Historia është indikative dhe shërben vetëm si orientim.", en: "* History is indicative and for reference only.", tr: "* Geçmiş veriler yalnızca gösterge niteliğindedir." },

    statCurrent: { mk: "Сегашна",  sq: "Aktuale",  en: "Current",  tr: "Güncel"  },
    statMin:     { mk: "Минимум",  sq: "Minimum",  en: "Minimum",  tr: "Minimum" },
    statMax:     { mk: "Максимум", sq: "Maksimum", en: "Maximum",  tr: "Maksimum"},
    statChange:  { mk: "Промена",  sq: "Ndryshim", en: "Change",   tr: "Değişim" },

    // Calculator
    calcTitle:    { mk: "Калкулатор на трошоци",    sq: "Kalkulator i shpenzimeve",  en: "Cost calculator",         tr: "Maliyet hesaplayıcı"      },
    calcSubtitle: { mk: "Пресметај колку ќе потрошиш за патувањето", sq: "Llogarit sa do të shpenzosh për udhëtimin", en: "Calculate how much your trip will cost", tr: "Yolculuğunuzun maliyetini hesaplayın" },
    calcKm:       { mk: "Растојание (км)",          sq: "Distanca (km)",             en: "Distance (km)",           tr: "Mesafe (km)"              },
    calcLper100:  { mk: "Потрошувачка (л/100км)",   sq: "Konsumi (l/100km)",         en: "Consumption (L/100km)",   tr: "Tüketim (L/100km)"        },
    calcFuelType: { mk: "Вид на гориво",            sq: "Lloji i karburantit",       en: "Fuel type",               tr: "Yakıt türü"               },
    calcTotal:    { mk: "Вкупен трошок",            sq: "Kostoja totale",            en: "Total cost",              tr: "Toplam maliyet"           },
    calcLiters:   { mk: "Литри потребни",           sq: "Litra të nevojshme",        en: "Litres needed",           tr: "Gereken litre"            },

    // Car profile
    carTitle:             { mk: "Мојот автомобил",           sq: "Makina ime",                en: "My car",                  tr: "Arabam"                   },
    carSubtitle:          { mk: "Зачувај го твоето возило за брза пресметка", sq: "Ruaj automjetin tënd për llogaritje të shpejtë", en: "Save your vehicle for quick cost estimates", tr: "Hızlı maliyet tahmini için aracınızı kaydedin" },
    carModel:             { mk: "Модел на возило",           sq: "Modeli i automjetit",       en: "Vehicle model",           tr: "Araç modeli"              },
    carModelPlaceholder:  { mk: "пр. VW Golf 1.6 TDI",      sq: "p.sh. VW Golf 1.6 TDI",    en: "e.g. VW Golf 1.6 TDI",    tr: "ör. VW Golf 1.6 TDI"      },
    carConsumption:       { mk: "Потрошувачка (л/100км)",   sq: "Konsumi (l/100km)",         en: "Consumption (L/100km)",   tr: "Tüketim (L/100km)"        },
    carFuelKind:          { mk: "Вид на гориво",            sq: "Lloji i karburantit",       en: "Fuel type",               tr: "Yakıt türü"               },
    carCostPerKm:         { mk: "ТРОШОК / КМ",             sq: "KOSTO / KM",               en: "COST / KM",               tr: "MALİYET / KM"             },
    carCostPer100:        { mk: "ТРОШОК / 100КМ",          sq: "KOSTO / 100KM",            en: "COST / 100KM",            tr: "MALİYET / 100KM"          },

    // carSummary is a function that returns an HTML string
    carSummary: (model, costPerKmHtml, fuelLabel, priceHtml, lang) => {
      const msgs = {
        mk: `${model} троши ${costPerKmHtml} ден/км при тековна цена на ${fuelLabel} од ${priceHtml} ден.`,
        sq: `${model} konsumon ${costPerKmHtml} den/km me çmimin aktual të ${fuelLabel} prej ${priceHtml} den.`,
        en: `${model} costs ${costPerKmHtml} den/km at the current ${fuelLabel} price of ${priceHtml} den.`,
        tr: `${model}, mevcut ${fuelLabel} fiyatı ${priceHtml} den ile ${costPerKmHtml} den/km'ye mal olmaktadır.`,
      };
      return msgs[lang] || msgs.mk;
    },

    // Berza (exchange) section
    berzaTitle:      { mk: "Светска берза",           sq: "Bursa botërore",         en: "World exchange",         tr: "Dünya borsası"           },
    berzaSource:     { mk: "Извор: Yahoo Finance",    sq: "Burimi: Yahoo Finance",  en: "Source: Yahoo Finance",  tr: "Kaynak: Yahoo Finance"   },
    berzaOil:        { mk: "Нафта",                   sq: "Nafta",                  en: "Oil",                    tr: "Petrol"                  },
    berzaMetals:     { mk: "Метали",                  sq: "Metalet",                en: "Metals",                 tr: "Metaller"                },
    berzaCrypto:     { mk: "Крипто",                  sq: "Kripto",                 en: "Crypto",                 tr: "Kripto"                  },
    berzaToday:      { mk: "денес",                   sq: "sot",                    en: "today",                  tr: "bugün"                   },
    berzaLoadingRow: { mk: "се вчитува...",            sq: "duke ngarkuar...",       en: "loading...",             tr: "yükleniyor..."           },

    // Alert / email notification banner
    alertTitle: { mk: "🔔 Добивај известувања за промена на цени", sq: "🔔 Merr njoftime për ndryshimet e çmimeve", en: "🔔 Get notified when prices change", tr: "🔔 Fiyat değişikliklerinde bildirim alın" },
    alertDesc:  { mk: "Внеси го твојот е-мејл и ќе те известиме секогаш кога ќе се сменат цените на горивата.", sq: "Vendos emailin tënd dhe do të njoftohesh sa herë që ndryshojnë çmimet e karburantit.", en: "Enter your email and we'll notify you every time fuel prices change.", tr: "E-postanızı girin ve yakıt fiyatları her değiştiğinde sizi bilgilendirelim." },

    // Gas station cards
    benzCardsBadge: { mk: "ИНТЕРАКТИВНА МАПА",    sq: "HARTË INTERAKTIVE",      en: "INTERACTIVE MAP",        tr: "İNTERAKTİF HARİTA"       },
    benzCardsDesc:  { mk: "Пронајди ги сите бензински станици во Македонија на една мапа.", sq: "Gjej të gjitha pikat e karburantit në Maqedoni në një hartë.", en: "Find all fuel stations in Macedonia on one map.", tr: "Makedonya'daki tüm yakıt istasyonlarını tek bir haritada bulun." },
    benzCardsOpen:  { mk: "Отвори мапи →",        sq: "Hap hartën →",           en: "Open map →",             tr: "Haritayı aç →"            },

    safeGityCameraBadge: { mk: "КАМЕРИ ВО ЖИВО",   sq: "KAMERA NË DREJTPËRDREJTË", en: "LIVE CAMERAS",         tr: "CANLI KAMERALAR"          },
    safeCityDesc:        { mk: "Прегледај ги Safe City камерите во Скопје и следи го сообраќајот.", sq: "Shiko kamerat Safe City në Shkup dhe ndiq trafikun.", en: "View Safe City cameras in Skopje and monitor traffic.", tr: "Üsküp'teki Safe City kameralarını izleyin ve trafiği takip edin." },
    safeCityOpen:        { mk: "Отвори камери →",  sq: "Hap kamerat →",          en: "Open cameras →",         tr: "Kameraları aç →"          },

    // Station prices table
    stationTableTitle:      { mk: "Цени по бензинска",         sq: "Çmimet sipas stacionit",     en: "Prices by station",         tr: "İstasyona göre fiyatlar"    },
    stationTableSubDesktop: { mk: "Официјални цени · gorivo.mk", sq: "Çmime zyrtare · gorivo.mk", en: "Official prices · gorivo.mk", tr: "Resmi fiyatlar · gorivo.mk" },
    stationTableDisclaimer: { mk: "Цените се официјални и можат да се разликуваат меѓу локациите.", sq: "Çmimet janë zyrtare dhe mund të ndryshojnë ndërmjet vendndodhjeve.", en: "Prices are official and may vary between locations.", tr: "Fiyatlar resmidir ve lokasyonlar arasında farklılık gösterebilir." },
    stationColHeader:       { mk: "Бензинска",                  sq: "Stacioni",                   en: "Station",                   tr: "İstasyon"                   },

    // News section
    newsLabel: { mk: "ВЕСТИ",   sq: "LAJMET",   en: "NEWS",   tr: "HABERLER" },
    newsEmpty: { mk: "Нема вести во моментов.", sq: "Nuk ka lajme momentalisht.", en: "No news at the moment.", tr: "Şu an haber yok." },
  },
};