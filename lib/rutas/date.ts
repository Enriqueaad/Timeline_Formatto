export function toLunes(dateInput: string | Date) {
  const date = typeof dateInput === "string" ? new Date(`${dateInput}T00:00:00`) : new Date(dateInput);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date.toISOString().slice(0, 10);
}

export function addDays(dateInput: string, days: number) {
  const date = new Date(`${dateInput}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export function formatSemana(semana: string) {
  const start = new Date(`${semana}T00:00:00`);
  const end = new Date(start);
  end.setDate(start.getDate() + 4);
  const startText = new Intl.DateTimeFormat("es-CL", { day: "2-digit", month: "short" }).format(start);
  const endText = new Intl.DateTimeFormat("es-CL", { day: "2-digit", month: "short", year: "numeric" }).format(end);
  return `${startText} - ${endText}`;
}
