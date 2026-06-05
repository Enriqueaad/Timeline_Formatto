"use client";

import { Button } from "@/components/ui/Button";

type UnidadActa = {
  piso: string;
  dpto: string;
  tipo: string | null;
  items: Array<{
    sku: string | null;
    descripcion: string | null;
    cantidad: number;
  }>;
};

type ActaConformidadBtnProps = {
  proyecto: string;
  unidades: UnidadActa[];
};

const PDF_COLORS = {
  grafito: "#2B2B2B",
  bark: "#8C7355",
  cream: "#F5F0E8",
  sand: "#D4C9B0",
  rojo: "#CE4620",
  white: "#FFFFFF",
};

function slug(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function ActaConformidadBtn({ proyecto, unidades }: ActaConformidadBtnProps) {
  async function exportar() {
    const { Document, Page, Text, View, StyleSheet, pdf } = await import("@react-pdf/renderer");
    const fecha = new Date().toLocaleDateString("es-CL");
    const styles = StyleSheet.create({
      page: { padding: 32, fontSize: 9, color: PDF_COLORS.grafito },
      header: { backgroundColor: PDF_COLORS.cream, border: `1 solid ${PDF_COLORS.sand}`, padding: 16, marginBottom: 16 },
      headerRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
      brand: { fontSize: 18, fontWeight: 700 },
      title: { fontSize: 14, color: PDF_COLORS.rojo, marginBottom: 5 },
      unidad: { borderTop: `1 solid ${PDF_COLORS.sand}`, paddingTop: 10, marginTop: 10 },
      unidadTitle: { fontSize: 11, fontWeight: 700, marginBottom: 4 },
      tableHead: { flexDirection: "row", backgroundColor: PDF_COLORS.cream, padding: 5, marginTop: 6 },
      row: { flexDirection: "row", borderBottom: `1 solid ${PDF_COLORS.sand}`, padding: 5 },
      sku: { width: "24%" },
      desc: { width: "62%" },
      cant: { width: "14%", textAlign: "right" },
      firmas: { borderTop: `1 solid ${PDF_COLORS.sand}`, marginTop: 24, paddingTop: 18, flexDirection: "row", justifyContent: "space-between" },
      firma: { width: "45%" },
    });

    const doc = (
      <Document>
        <Page size="A4" style={styles.page}>
          <View style={styles.header}>
            <View style={styles.headerRow}>
              <Text style={styles.brand}>formatto</Text>
              <Text>{fecha}</Text>
            </View>
            <Text style={styles.title}>ACTA DE ENTREGA Y CONFORMIDAD</Text>
            <Text>Proyecto: {proyecto}</Text>
          </View>

          {unidades.map((unidad, index) => (
            <View key={`${unidad.piso}-${unidad.dpto}-${index}`} style={styles.unidad}>
              <Text style={styles.unidadTitle}>Unidad: Piso {unidad.piso} - Dpto {unidad.dpto}</Text>
              <Text>Tipo: {unidad.tipo ?? "Sin tipo"}</Text>
              <View style={styles.tableHead}>
                <Text style={styles.sku}>SKU</Text>
                <Text style={styles.desc}>Descripcion</Text>
                <Text style={styles.cant}>Cant.</Text>
              </View>
              {unidad.items.map((item, itemIndex) => (
                <View key={`${item.sku ?? "sku"}-${itemIndex}`} style={styles.row}>
                  <Text style={styles.sku}>{item.sku ?? "-"}</Text>
                  <Text style={styles.desc}>{item.descripcion ?? "-"}</Text>
                  <Text style={styles.cant}>{item.cantidad}</Text>
                </View>
              ))}
            </View>
          ))}

          <View style={styles.firmas}>
            <Text style={styles.firma}>Firma cliente: __________________________</Text>
            <Text style={styles.firma}>Firma supervisor: _______________________</Text>
          </View>
        </Page>
      </Document>
    );

    const blob = await pdf(doc).toBlob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `acta_${slug(proyecto)}_${new Date().toISOString().slice(0, 10)}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Button type="button" variant="secondary" onClick={exportar}>
      Acta PDF
    </Button>
  );
}
