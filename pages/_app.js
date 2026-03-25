// pages/_app.js
import { Analytics } from "@vercel/analytics/react";
import '../styles/globals.css'; // keep your global CSS if you have it

export default function App({ Component, pageProps }) {
  return (
    <>
      <Component {...pageProps} />
      <Analytics />
    </>
  );
}