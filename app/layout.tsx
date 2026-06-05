import type { Metadata } from "next";
import { SessionProvider } from "@/components/layout/SessionProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Formatto — Gestión de Instalaciones",
  description: "Dashboard interno Formatto para gestión de proyectos, dotación e instalaciones.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Titillium+Web:ital,wght@0,200;0,300;0,400;0,600;0,700;1,300&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}

