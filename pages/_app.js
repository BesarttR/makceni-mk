import { Analytics } from '@vercel/analytics/react';
import { GoogleAnalytics } from '@next/third-parties/google';
import { LanguageProvider } from '../translations';

export default function App({ Component, pageProps }) {
  return (
    <LanguageProvider>
      <Component {...pageProps} />
      <Analytics />
      <GoogleAnalytics gaId="G-N04R25FKDK" />
    </LanguageProvider>
  );
}