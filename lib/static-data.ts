import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

export type TimelineData = {
  config: { cutoffDate: string };
  estados: Record<string, { estado: string; fin: string }>;
  personal: Array<Record<string, unknown>>;
  subcontratos: Array<Record<string, unknown>>;
  evalColors: Record<string, string>;
  evalOrder: Record<string, number>;
  source: "static" | "supabase";
  warning?: string;
};

function toIsoDate(value: unknown): unknown {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return value;
}

function normalizeRecord(record: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(record).map(([key, value]) => [key, toIsoDate(value)]));
}

export function getStaticTimelineData(warning?: string): TimelineData {
  const dataPath = path.join(process.cwd(), "assets", "js", "data.js");
  const source = fs.readFileSync(dataPath, "utf8");
  const sandbox = {
    window: { TIMELINE_CONFIG: { cutoffDate: "2026-05-27" } },
    console
  };

  const script = new vm.Script(`${source}
    ;({
      TIMELINE_CONFIG,
      ESTADOS_MAP,
      PERSONAL,
      SUBCONTRATOS,
      EVAL_COLORS,
      EVAL_ORDER
    });`);
  const result = script.runInNewContext(sandbox) as {
    TIMELINE_CONFIG: { cutoffDate: string };
    ESTADOS_MAP: Record<string, { estado: string; fin: Date }>;
    PERSONAL: Array<Record<string, unknown>>;
    SUBCONTRATOS: Array<Record<string, unknown>>;
    EVAL_COLORS: Record<string, string>;
    EVAL_ORDER: Record<string, number>;
  };

  return {
    config: result.TIMELINE_CONFIG,
    estados: Object.fromEntries(
      Object.entries(result.ESTADOS_MAP).map(([obra, value]) => [
        obra,
        { estado: value.estado, fin: value.fin.toISOString().slice(0, 10) }
      ])
    ),
    personal: result.PERSONAL.map(normalizeRecord),
    subcontratos: result.SUBCONTRATOS.map(normalizeRecord),
    evalColors: result.EVAL_COLORS,
    evalOrder: result.EVAL_ORDER,
    source: "static",
    warning
  };
}
