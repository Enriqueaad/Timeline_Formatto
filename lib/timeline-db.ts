import { getStaticTimelineData, type TimelineData } from "./static-data";
import { getSupabaseAnon } from "./supabase";

type DbObra = {
  id: string;
  nombre: string;
  supervisor: string | null;
  estado: string;
  fin: string;
};

type DbPersonal = {
  id: string;
  obra_id: string | null;
  obra_nombre: string | null;
  nombre: string;
  cargo: string | null;
  cant: number | null;
  costo: number | null;
  eval: string | null;
  supervisor: string | null;
  fin: string | null;
  desde: string | null;
};

type DbSubcontrato = {
  id: string;
  obra_id: string | null;
  obra_nombre: string | null;
  nombre: string;
  cant: number | null;
  fin: string | null;
};

export async function getTimelineData(): Promise<TimelineData> {
  const supabase = getSupabaseAnon();
  if (!supabase) return getStaticTimelineData("Modo demo: faltan variables de Supabase.");

  const [configRes, obrasRes, personalRes, subsRes] = await Promise.all([
    supabase.from("configuracion").select("key,value"),
    supabase.from("obras").select("id,nombre,supervisor,estado,fin").order("fin", { ascending: true }),
    supabase.from("personal").select("id,obra_id,obra_nombre,nombre,cargo,cant,costo,eval,supervisor,fin,desde"),
    supabase.from("subcontratos").select("id,obra_id,obra_nombre,nombre,cant,fin")
  ]);

  const firstError = configRes.error || obrasRes.error || personalRes.error || subsRes.error;
  if (firstError) return getStaticTimelineData(`Supabase respondio con error: ${firstError.message}`);

  const obras = (obrasRes.data || []) as DbObra[];
  if (obras.length === 0) return getStaticTimelineData("Supabase esta conectado, pero aun no tiene obras cargadas.");

  const obraById = new Map(obras.map((obra) => [obra.id, obra]));
  const cutoffDate =
    (configRes.data || []).find((row: { key: string; value: string }) => row.key === "cutoffDate")?.value ||
    "2026-05-27";

  const estados = Object.fromEntries(
    obras.map((obra) => [obra.nombre, { estado: obra.estado, fin: obra.fin }])
  );

  const personal = ((personalRes.data || []) as DbPersonal[]).map((persona) => {
    const obra = persona.obra_id ? obraById.get(persona.obra_id) : null;
    return {
      id: persona.id,
      nombre: persona.nombre,
      cargo: persona.cargo || "",
      obra: obra?.nombre || persona.obra_nombre || "",
      cant: persona.cant || 0,
      costo: persona.costo || 0,
      eval: persona.eval || "B",
      supervisor: persona.supervisor || obra?.supervisor || "",
      fin: persona.fin || obra?.fin || cutoffDate,
      ...(persona.desde ? { desde: persona.desde } : {})
    };
  });

  const subcontratos = ((subsRes.data || []) as DbSubcontrato[]).map((sub) => {
    const obra = sub.obra_id ? obraById.get(sub.obra_id) : null;
    return {
      id: sub.id,
      obra: obra?.nombre || sub.obra_nombre || "",
      nombre: sub.nombre,
      cant: sub.cant || 0,
      fin: sub.fin || obra?.fin || cutoffDate
    };
  });

  return {
    config: { cutoffDate },
    estados,
    personal,
    subcontratos,
    evalColors: { MB: "#1B4F8A", B: "#3A7D58", R: "#CE4620", M: "#9E4E00" },
    evalOrder: { M: 0, R: 1, B: 2, MB: 3 },
    source: "supabase"
  };
}
