import { Analytics } from '@vercel/analytics/react';
import { GoogleAnalytics } from '@next/third-parties/google';
import { LanguageProvider } from '../translations';
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});

export default function App({ Component, pageProps }) {
  return (
    <LanguageProvider>
      <style>{`
        *, *::before, *::after {
          font-family: ${inter.style.fontFamily}, -apple-system, BlinkMacSystemFont, sans-serif;
          font-feature-settings: "cv02","cv03","cv04","tnum";
        }
      `}</style>
      <Component {...pageProps} />
      <Analytics />
      <GoogleAnalytics gaId="G-N04R25FKDK" />
    </LanguageProvider>
  );
}