import Head from "next/head";
import "../styles/globals.css";
import { LoadingProvider } from "../context/loading-context";
import { ThemeProvider } from "../context/theme-context";

function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />
        <meta name="theme-color" content="#0070f3" />
        <meta
          name="description"
          content="Employee and visitor check-in system for canteen"
        />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <title>Canteen Check-in</title>
      </Head>
      <ThemeProvider>
        <LoadingProvider>
          <Component {...pageProps} />
        </LoadingProvider>
      </ThemeProvider>
    </>
  );
}

export default MyApp;
