"use client";

import { Button } from "@/components/ui/Button";

type PersonalReporte = {
  nombre: string;
  cargo: string;
  tipo: "FORMATTO" | "SUBCONTRATO";
  fechaInicio: string;
  costoMensual: number;
  evaluacion: number | null;
};

type ReporteDotacionBtnProps = {
  proyecto: string;
  personal: PersonalReporte[];
  costoTotal: number;
  fecha: string;
};

const PDF_COLORS = {
  grafito: "#2B2B2B",
  bark: "#8C7355",
  cream: "#F5F0E8",
  sand: "#D4C9B0",
  rojo: "#CE4620",
  white: "#FFFFFF",
};

function formatCLP(value: number) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-CL", { month: "short", year: "2-digit" }).format(new Date(value));
}

function slug(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function ReporteDotacionBtn({ proyecto, personal, costoTotal, fecha }: ReporteDotacionBtnProps) {
  async function exportar() {
    const { Document, Page, Text, View, StyleSheet, pdf } = await import("@react-pdf/renderer");
    const styles = StyleSheet.create({
      page: { padding: 32, fontSize: 9, color: PDF_COLORS.grafito },
      header: { backgroundColor: PDF_COLORS.cream, border: `1 solid ${PDF_COLORS.sand}`, padding: 16, marginBottom: 16 },
      headerRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
      brand: { fontSize: 18, fontWeight: 700 },
      title: { fontSize: 14, color: PDF_COLORS.rojo, marginBottom: 5 },
      section: { borderTop: `1 solid ${PDF_COLORS.sand}`, paddingTop: 10, marginTop: 12 },
      sectionTitle: { fontSize: 11, fontWeight: 700, marginBottom: 6 },
      tableHead: { flexDirection: "row", backgroundColor: PDF_COLORS.cream, padding: 5 },
      row: { flexDirection: "row", borderBottom: `1 solid ${PDF_COLORS.sand}`, padding: 5 },
      nombre: { width: "34%" },
      cargo: { width: "24%" },
      inicio: { width: "14%" },
      costo: { width: "18%", textAlign: "right" },
      eval: { width: "10%", textAlign: "right" },
      total: { marginTop: 18, border: `1 solid ${PDF_COLORS.sand}`, padding: 10, fontSize: 11, fontWeight: 700 },
    });

    const renderGrupo = (tipo: "FORMATTO" | "SUBCONTRATO") => {
      const grupo = personal.filter((persona) => persona.tipo === tipo);
      return (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{tipo}</Text>
          <View style={styles.tableHead}>
            <Text style={styles.nombre}>Nombre</Text>
            <Text style={styles.cargo}>Cargo</Text>
            <Text style={styles.inicio}>Inicio</Text>
            <Text style={styles.costo}>Costo/mes</Text>
            <Text style={styles.eval}>Eval.</Text>
          </View>
          {grupo.length === 0 ? (
            <View style={styles.row}>
              <Text>Sin personal registrado.</Text>
            </View>
          ) : grupo.map((persona, index) => (
            <View key={`${tipo}-${persona.nombre}-${index}`} style={styles.row}>
              <Text style={styles.nombre}>{persona.nombre}</Text>
              <Text style={styles.cargo}>{persona.cargo}</Text>
              <Text style={styles.inicio}>{formatDate(persona.fechaInicio)}</Text>
              <Text style={styles.costo}>{formatCLP(persona.costoMensual)}</Text>
              <Text style={styles.eval}>{persona.evaluacion ?? "-"}</Text>
            </View>
          ))}
        </View>
      );
    };

    const doc = (
      <Document>
        <Page size="A4" style={styles.page}>
          <View style={styles.header}>
            <View style={styles.headerRow}>
              <Text style={styles.brand}>formatto</Text>
              <Text>{new Intl.DateTimeFormat("es-CL").format(new Date(fecha))}</Text>
            </View>
            <Text style={styles.title}>REPORTE DE DOTACION</Text>
            <Text>Proyecto: {proyecto}</Text>
          </View>
          {renderGrupo("FORMATTO")}
          {renderGrupo("SUBCONTRATO")}
          <Text style={styles.total}>Costo mensual total: {formatCLP(costoTotal)}</Text>
        </Page>
      </Document>
    );

    const blob = await pdf(doc).toBlob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `dotacion_${slug(proyecto)}_${new Date(fecha).toISOString().slice(0, 10)}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Button type="button" variant="secondary" onClick={exportar}>
      Reporte PDF
    </Button>
  );
}
