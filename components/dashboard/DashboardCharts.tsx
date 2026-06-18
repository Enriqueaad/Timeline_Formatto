"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ClientOnly } from "@/components/ui/ClientOnly";

type AvanceProyecto = {
  nombre: string;
  avance: number;
};

type CostoMensual = {
  mes: string;
  costo: number;
};

type DashboardChartsProps = {
  avances: AvanceProyecto[];
  costos: CostoMensual[];
};

function formatCLP(value: number) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value);
}

export function DashboardCharts({ avances, costos }: DashboardChartsProps) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <section className="bg-white border border-border p-5">
        <div className="mb-5">
          <p className="text-2xs font-semibold uppercase tracking-widest text-formatto-bark">Avance por proyecto</p>
          <p className="text-sm text-formatto-umber">Ultimo registro de avance disponible.</p>
        </div>
        {avances.length === 0 ? (
          <div className="bg-white border border-border p-6 text-formatto-umber">Sin avances registrados.</div>
        ) : (
          <div className="h-80">
            <ClientOnly fallback={<div className="w-full h-full" />}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={avances} margin={{ top: 10, right: 10, bottom: 55, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="nombre" angle={-30} textAnchor="end" interval={0} height={70} tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                <Tooltip formatter={(value) => `${Number(value).toFixed(0)}%`} />
                <Bar dataKey="avance" name="% avance" fill="#D35132" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            </ClientOnly>
          </div>
        )}
      </section>

      <section className="bg-white border border-border p-5">
        <div className="mb-5">
          <p className="text-2xs font-semibold uppercase tracking-widest text-formatto-bark">Costo mensual de dotacion</p>
          <p className="text-sm text-formatto-umber">Suma de asignaciones iniciadas por mes.</p>
        </div>
        {costos.length === 0 ? (
          <div className="bg-white border border-border p-6 text-formatto-umber">Sin costos para graficar.</div>
        ) : (
          <div className="h-80">
            <ClientOnly fallback={<div className="w-full h-full" />}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={costos} margin={{ top: 10, right: 20, bottom: 10, left: 12 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis tickFormatter={(value) => `$${Math.round(Number(value) / 1000000)}M`} />
                <Tooltip formatter={(value) => formatCLP(Number(value))} />
                <Line type="monotone" dataKey="costo" name="Costo total" stroke="#2B2B2B" strokeWidth={2} dot={{ fill: "#D35132" }} />
              </LineChart>
            </ResponsiveContainer>
            </ClientOnly>
          </div>
        )}
      </section>
    </div>
  );
}
