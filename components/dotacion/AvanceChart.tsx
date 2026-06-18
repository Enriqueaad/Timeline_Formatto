"use client";

import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ClientOnly } from "@/components/ui/ClientOnly";

const COLORS = {
  formatto: "#2B2B2B",
  rojo: "#D35132",
};

type AvanceChartProps = {
  datos: Array<{ fecha: string; porcentaje: number }>;
};

export function AvanceChart({ datos }: AvanceChartProps) {
  if (datos.length === 0) {
    return <div className="bg-white border border-border p-6 text-formatto-umber">Sin avances registrados.</div>;
  }

  return (
    <div className="bg-white border border-border p-4 h-80">
      <ClientOnly fallback={<div className="w-full h-full" />}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={datos}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="fecha" />
          <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
          <Tooltip formatter={(value) => `${value}%`} />
          <ReferenceLine y={100} stroke={COLORS.rojo} />
          <Line type="monotone" dataKey="porcentaje" stroke={COLORS.formatto} dot={{ fill: COLORS.rojo }} />
        </LineChart>
      </ResponsiveContainer>
      </ClientOnly>
    </div>
  );
}
