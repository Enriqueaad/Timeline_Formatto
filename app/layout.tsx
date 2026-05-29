import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "Formatto - Dotacion de Personal",
  description: "Timeline y CRUD de dotacion Formatto conectado a Supabase."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Titillium+Web:wght@200;300;400;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
        <Script id="timeline-config" strategy="beforeInteractive">
          {`window.TIMELINE_CONFIG={cutoffDate:'2026-05-27'};`}
        </Script>
        <Script src="/assets/js/data.js" strategy="beforeInteractive" />
        <Script src="/assets/js/app.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
