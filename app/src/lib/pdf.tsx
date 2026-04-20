import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import type { PhaseSelection } from "@/store/configStore";
import type { Lang } from "@/data/types";
import { PHASE_LABELS } from "@/lib/constants";

Font.register({
  family: "Inter",
  fonts: [
    { src: "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff", fontWeight: 400 },
    { src: "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuI6fAZ9hiJ-Ek-_EeA.woff", fontWeight: 700 },
  ],
});

const s = StyleSheet.create({
  page: { fontFamily: "Inter", fontSize: 10, padding: 40, color: "#1a1a1a" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24, borderBottomWidth: 2, borderBottomColor: "#1e3a5f", paddingBottom: 12 },
  logo: { fontSize: 16, fontWeight: 700, color: "#1e3a5f" },
  logoSub: { fontSize: 9, color: "#666", marginTop: 2 },
  date: { fontSize: 9, color: "#888" },
  title: { fontSize: 18, fontWeight: 700, color: "#1e3a5f", marginBottom: 8 },
  subtitle: { fontSize: 11, color: "#555", marginBottom: 24 },
  sectionTitle: { fontSize: 12, fontWeight: 700, color: "#1e3a5f", marginBottom: 10, marginTop: 16, borderBottomWidth: 1, borderBottomColor: "#e5e7eb", paddingBottom: 4 },
  row: { flexDirection: "row", marginBottom: 6, padding: 8, backgroundColor: "#f9fafb", borderRadius: 4 },
  rowLabel: { width: 100, fontSize: 9, color: "#6b7280", fontWeight: 700, textTransform: "uppercase" },
  rowContent: { flex: 1 },
  rowName: { fontSize: 10, fontWeight: 700, color: "#1a1a1a" },
  rowCode: { fontSize: 9, color: "#6b7280", fontFamily: "Courier", marginTop: 2 },
  contactSection: { marginTop: 24, padding: 12, backgroundColor: "#eff6ff", borderRadius: 4 },
  contactTitle: { fontSize: 11, fontWeight: 700, color: "#1e3a5f", marginBottom: 6 },
  contactRow: { fontSize: 9, color: "#374151", marginBottom: 3 },
  footer: { position: "absolute", bottom: 30, left: 40, right: 40, flexDirection: "row", justifyContent: "space-between", fontSize: 8, color: "#9ca3af", borderTopWidth: 1, borderTopColor: "#e5e7eb", paddingTop: 8 },
  legalNote: { marginTop: 24, fontSize: 8, color: "#9ca3af" },
});

interface Props {
  selections: PhaseSelection[];
  contact: { name: string; email: string; phone?: string; message?: string };
  lang: Lang;
}

export function ConfiguratorPDF({ selections, contact, lang }: Props) {
  const filled = selections.filter((s) => s.selectedProduct);
  const date = new Date().toLocaleDateString("de-DE", { year: "numeric", month: "long", day: "numeric" });

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.logo}>KW PV Solutions</Text>
            <Text style={s.logoSub}>KW Baustoffe GmbH · Drensteinfurt</Text>
          </View>
          <Text style={s.date}>{date}</Text>
        </View>

        {/* Title */}
        <Text style={s.title}>PV-Konfiguration</Text>
        <Text style={s.subtitle}>Zusammenfassung Ihrer Komponentenauswahl</Text>

        {/* Products */}
        <Text style={s.sectionTitle}>Ausgewählte Komponenten</Text>
        {filled.map((sel) => (
          <View key={sel.phase} style={s.row}>
            <Text style={s.rowLabel}>
              {(PHASE_LABELS as Record<string, Record<string, string>>)[sel.phase]?.[lang] ?? sel.phase}
            </Text>
            <View style={s.rowContent}>
              <Text style={s.rowName}>{sel.selectedProduct?.value}</Text>
              <Text style={s.rowCode}>{sel.selectedProduct?.product_name}</Text>
              <Text style={s.rowCode}>Art.-Nr.: {sel.selectedProduct?.product_code}</Text>
            </View>
          </View>
        ))}

        {/* Contact */}
        <View style={s.contactSection}>
          <Text style={s.contactTitle}>Kontaktdaten</Text>
          <Text style={s.contactRow}>Name: {contact.name}</Text>
          <Text style={s.contactRow}>E-Mail: {contact.email}</Text>
          {contact.phone && <Text style={s.contactRow}>Telefon: {contact.phone}</Text>}
          {contact.message && <Text style={s.contactRow}>Nachricht: {contact.message}</Text>}
        </View>

        {/* Legal */}
        <Text style={s.legalNote}>
          Diese Konfiguration ist unverbindlich. Preise und Verfügbarkeit auf Anfrage. KW Baustoffe GmbH, Drensteinfurt · Kd-Nr. 108204
        </Text>

        {/* Footer */}
        <View style={s.footer}>
          <Text>KW PV Solutions – PV-Konfigurator</Text>
          <Text>{date}</Text>
        </View>
      </Page>
    </Document>
  );
}
