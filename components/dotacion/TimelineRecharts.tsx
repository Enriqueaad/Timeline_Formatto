"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const COLORS = {
  formatto: "#2B2B2B",
  subcontrato: "#8C7355",
};

type TimelineRechartsProps = {
  datos: Array<{
    proyecto: string;
    formatto: number;
    subcontrato: number;
    costo: number;
  }>;
};

function formatCLP(value: number) {
  return `$${Math.round(value / 1000000)}M`;
}

export function TimelineRecharts({ datos }: TimelineRechartsProps) {
  if (datos.length === 0) {
    return <div className="bg-white border border-border p-6 text-formatto-umber">Sin asignaciones activas para visualizar.</div>;
  }

  return (
    <div className="bg-white border border-border p-4 rounded-none h-[520px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart layout="vertical" data={datos} margin={{ left: 60, right: 24 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" />
          <YAxis type="category" dataKey="proyecto" width={160} />
          <Tooltip formatter={(value, name, item) => [`${value} personas · ${formatCLP(item.payload.costo)}`, name]} />
          <Legend />
          <Bar dataKey="formatto" stackId="dotacion" fill={COLORS.formatto} name="FORMATTO" />
          <Bar dataKey="subcontrato" stackId="dotacion" fill={COLORS.subcontrato} name="SUBCONTRATO" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
