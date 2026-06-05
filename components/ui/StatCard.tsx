"use client";

interface StatCardProps {
  eyebrow: string;
  value: string | number;
  valueColor?: "default" | "rojo";
  sub?: string;
}

export function StatCard({ eyebrow, value, valueColor = "default", sub }: StatCardProps) {
  return (
    <div className="bg-white border border-border p-6 flex flex-col gap-2">
      <span className="text-2xs font-semibold text-formatto-bark uppercase tracking-widest">
        — {eyebrow}
      </span>
      <span
        className={`text-5xl font-black leading-none ${
          valueColor === "rojo" ? "text-primary" : "text-formatto-grafito"
        }`}
      >
        {value}
      </span>
      {sub && <span className="text-xs font-light text-formatto-bark">{sub}</span>}
    </div>
  );
}
