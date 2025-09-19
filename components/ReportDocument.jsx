// components/ReportDocument.jsx
import React from "react";
import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 24, fontSize: 11, fontFamily: "Helvetica" },
  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  title: { fontSize: 18, fontWeight: 700 },
  sub: { color: "#666", marginTop: 4 },
  logo: { width: 48, height: 48, marginRight: 10 },
  table: {
    display: "table",
    width: "auto",
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "#ddd",
  },
  row: { flexDirection: "row" },
  th: {
    flex: 1,
    fontWeight: 700,
    backgroundColor: "#f5f5f5",
    padding: 6,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#ddd",
  },
  td: {
    flex: 1,
    padding: 6,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#ddd",
  },
  wDay: { width: 60 },
  wWorkout: { width: 180 },
  notes: { marginTop: 12 },
});

export default function ReportDocument({ plan = {} }) {
  const week = plan.week || [];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* ヘッダー */}
        <View style={styles.headerRow}>
          {/* 画像は DataURL を plan.robotDataUrl で渡す方式に限定 */}
          {plan.robotDataUrl ? <Image src={plan.robotDataUrl} style={styles.logo} /> : null}
          <View>
            <Text style={styles.title}>AI健康診断 7日間プラン</Text>
            {plan?.profile?.summary ? <Text style={styles.sub}>{plan.profile.summary}</Text> : null}
          </View>
        </View>

        {/* テーブル */}
        <View style={styles.table}>
          <View style={styles.row}>
            <Text style={[styles.th, styles.wDay]}>日</Text>
            <Text style={styles.th}>食事プラン</Text>
            <Text style={[styles.th, styles.wWorkout]}>運動プラン</Text>
          </View>

          {week.map((d, i) => (
            <View style={styles.row} key={i}>
              <Text style={[styles.td, styles.wDay]}>{d?.day ?? `Day${i + 1}`}</Text>
              <Text style={styles.td}>
                朝: {d?.meals?.breakfast || ""}{"\n"}
                昼: {d?.meals?.lunch || ""}{"\n"}
                夜: {d?.meals?.dinner || ""}{"\n"}
                間: {d?.meals?.snack || ""}
              </Text>
              <Text style={[styles.td, styles.wWorkout]}>
                {d?.workout?.menu || ""}{"\n"}
                目安 {d?.workout?.durationMin ?? ""} 分{"\n"}
                {d?.workout?.notes || ""}
              </Text>
            </View>
          ))}
        </View>

        {/* 注意点 */}
        {Array.isArray(plan?.notes) && plan.notes.length > 0 && (
          <View style={styles.notes}>
            <Text style={{ fontWeight: 700, marginBottom: 4 }}>注意点・補足</Text>
            {plan.notes.map((n, idx) => (
              <Text key={idx}>・{n}</Text>
            ))}
          </View>
        )}
      </Page>
    </Document>
  );
}
