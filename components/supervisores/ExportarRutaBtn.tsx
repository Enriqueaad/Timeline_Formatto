"use client";

import { Button } from "@/components/ui/Button";
import { DIAS_PLANIFICACION, type ParadaPlan } from "./types";
import { formatSemana } from "@/lib/rutas/date";

type ExportarRutaBtnProps = {
  supervisor: string;
  semana: string;
  paradas: ParadaPlan[];
};

const PDF_COLORS = {
  grafito: "#2B2B2B",
  bark: "#8C7355",
  cream: "#F5F0E8",
  sand: "#D4C9B0",
  rojo: "#CE4620",
  white: "#FFFFFF",
};

export function ExportarRutaBtn({ supervisor, semana, paradas }: ExportarRutaBtnProps) {
  async function exportar() {
    const { Document, Page, Text, View, StyleSheet, pdf } = await import("@react-pdf/renderer");
    const styles = StyleSheet.create({
      page: { padding: 32, fontSize: 10, color: PDF_COLORS.grafito },
      header: { backgroundColor: PDF_COLORS.cream, border: `1 solid ${PDF_COLORS.sand}`, padding: 16, marginBottom: 18 },
      brand: { fontSize: 18, fontWeight: 700, marginBottom: 6 },
      title: { fontSize: 14, marginBottom: 4 },
      day: { borderTop: `1 solid ${PDF_COLORS.sand}`, paddingTop: 10, marginTop: 10 },
      dayTitle: { color: PDF_COLORS.bark, fontSize: 10, marginBottom: 6 },
      stop: { marginBottom: 5 },
    });

    const doc = (
      <Document>
        <Page size="A4" style={styles.page}>
          <View style={styles.header}>
            <Text style={styles.brand}>formatto</Text>
            <Text style={styles.title}>Ruta de Visitas - {supervisor}</Text>
            <Text>Semana: {formatSemana(semana)}</Text>
          </View>
          {DIAS_PLANIFICACION.map((dia) => {
            const delDia = paradas.filter((parada) => parada.diaVisita === dia).sort((a, b) => a.orden - b.orden);
            return (
              <View key={dia} style={styles.day}>
                <Text style={styles.dayTitle}>{dia}</Text>
                {delDia.length === 0 ? (
                  <Text style={styles.stop}>Sin paradas</Text>
                ) : delDia.map((parada, index) => (
                  <Text key={`${dia}-${index}`} style={styles.stop}>
                    - {parada.horaEstimada || "Sin hora"}  {parada.proyectoNombre}{parada.observacion ? ` · ${parada.observacion}` : ""}
                  </Text>
                ))}
              </View>
            );
          })}
        </Page>
      </Document>
    );

    const blob = await pdf(doc).toBlob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ruta_${semana}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return <Button type="button" variant="secondary" onClick={exportar}>Descargar PDF</Button>;
}
