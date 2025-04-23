import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  // Define CSP that allows WebSocket connections to Supabase
  const cspContent = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline' https://gaphbnspyqosmklayzvj.supabase.co;
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: blob: https://*.supabase.co;
    font-src 'self' data:;
    connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.openai.com;
    frame-src 'self';
    object-src 'none';
  `.replace(/\s+/g, ' ').trim();

  return (
    <Html lang="en">
      <Head>
        {/* Apply CSP at the document level */}
        <meta
          httpEquiv="Content-Security-Policy"
          content={cspContent}
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
