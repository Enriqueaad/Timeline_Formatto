"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const COLORS = {
  formatto: "#2B2B2B",
  subcontrato: "#D35132",
};

type AsignacionGanttProps = {
  asignaciones: Array<{
    nombre: string;
    cargo?: string | null;
    proyecto: string;
    proyectoId: string;
    fechaInicio: string;
    fechaFin: string | null;
    tipo: "FORMATTO" | "SUBCONTRATO";
  }>;
};

function mesesEntre(inicio: string, fin: string | null) {
  const start = new Date(inicio);
  const end = fin ? new Date(fin) : new Date();
  const diff = (end.getFullYear() - start.getFullYear()) * 12 + end.getMonth() - start.getMonth() + 1;
  return Math.max(diff, 1);
}

export function AsignacionGantt({ asignaciones }: AsignacionGanttProps) {
  const data = asignaciones.map((row) => ({
    nombre: row.nombre,
    meses: mesesEntre(row.fechaInicio, row.fechaFin),
    tipo: row.tipo,
    proyecto: row.proyecto,
    periodo: `${row.fechaInicio.slice(0, 10)} - ${row.fechaFin?.slice(0, 10) ?? "activo"}`,
    fill: row.tipo === "SUBCONTRATO" ? COLORS.subcontrato : COLORS.formatto,
  }));

  if (data.length === 0) {
    return <div className="bg-white border border-border p-6 text-formatto-umber">Sin asignaciones para graficar.</div>;
  }

  return (
    <div className="bg-white border border-border p-4 h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart layout="vertical" data={data} margin={{ left: 24, right: 24 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" tickFormatter={(value) => `${value}m`} />
          <YAxis type="category" dataKey="nombre" width={140} />
          <Tooltip formatter={(value, _name, item) => [`${value} meses · ${item.payload.proyecto}`, item.payload.periodo]} />
          <Bar dataKey="meses">
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
