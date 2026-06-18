"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ClientOnly } from "@/components/ui/ClientOnly";

const COLORS = {
  formatto: "#2B2B2B",
  subcontrato: "#D35132",
};

type CostoChartProps = {
  datos: Array<{ mes: string; formatto: number; subcontrato: number }>;
};

function formatCLP(value: number) {
  return `$${Math.round(value / 1000)}k`;
}

export function CostoChart({ datos }: CostoChartProps) {
  if (datos.length === 0) {
    return <div className="bg-white border border-border p-6 text-formatto-umber">Sin costos para graficar.</div>;
  }

  return (
    <div className="bg-white border border-border p-4 h-80">
      <ClientOnly fallback={<div className="w-full h-full" />}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={datos}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="mes" />
          <YAxis tickFormatter={formatCLP} />
          <Tooltip formatter={(value) => formatCLP(Number(value))} />
          <Legend />
          <Bar dataKey="formatto" stackId="costos" fill={COLORS.formatto} name="FORMATTO" />
          <Bar dataKey="subcontrato" stackId="costos" fill={COLORS.subcontrato} name="SUBCONTRATO" />
        </BarChart>
      </ResponsiveContainer>
      </ClientOnly>
    </div>
  );
}
