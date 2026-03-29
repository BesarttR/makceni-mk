import { Html, Head, Body, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="mk">
      <Head>
        {/* Google Analytics */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-N04R25FKDK"></script>
        <script dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-N04R25FKDK');
          `
        }} />

        {/* SEO - Global */}
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="index, follow" />
        <meta name="author" content="МакЦени" />
        <meta name="theme-color" content="#16a34a" />
        <link rel="icon" href="/favicon.ico" />

        {/* Open Graph fallbacks (overridden per-page) */}
        <meta property="og:site_name" content="МакЦени" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://makceni.mk/og-image.png" />
        <meta property="og:locale" content="mk_MK" />
        <meta property="og:locale:alternate" content="sq_AL" />
        <meta property="og:locale:alternate" content="en_US" />
        <meta property="og:locale:alternate" content="tr_TR" />

        {/* Twitter Card fallbacks */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="https://makceni.mk/og-image.png" />

        {/* JSON-LD Site Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "МакЦени",
              "url": "https://makceni.mk",
              "description": "Цени на гориво во Македонија — бензин, дизел, ТНГ",
              "inLanguage": ["mk", "sq", "en", "tr"],
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://makceni.mk/?q={search_term_string}",
                "query-input": "required name=search_term_string"
              }
            })
          }}
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}