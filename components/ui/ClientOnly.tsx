"use client";

import { useEffect, useState, type ReactNode } from "react";

// Renderiza children solo después de montar en el cliente. Necesario para Recharts:
// su ResponsiveContainer mide el DOM y al renderizar en SSR (Next 16 / Turbopack /
// React 19) crashea el worker con "width(-1) height(-1)". Con esto los gráficos
// nunca se renderizan en el servidor.
export function ClientOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return <>{mounted ? children : fallback}</>;
}
