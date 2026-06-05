import Script from "next/script";

export default function LegacyLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      {children}
      <Script id="timeline-config" strategy="beforeInteractive">
        {`window.TIMELINE_CONFIG={cutoffDate:'2026-05-27'};`}
      </Script>
      <Script src="/assets/js/data.js" strategy="beforeInteractive" />
      <Script src="/assets/js/app.js" strategy="afterInteractive" />
    </>
  );
}
