// components/ReportDocument.jsx
import { Font } from "@react-pdf/renderer";
import { pdf } from "@react-pdf/renderer";
import { UnicodeCIDFont } from "@react-pdf/renderer";

Font.register({ family: "HeiseiKakuGo-W5", src: undefined });

import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

/** 日本語フォント登録（何度呼んでも上書きでOK） */
function registerJPFonts(fontBaseUrl = "") {
  const base = fontBaseUrl.replace(/\/$/, "");
  try {
    Font.register({
      family: "NotoSansJP",
      fonts: [
        { src: `${base}/NotoSansJP-Regular.ttf`, fontWeight: "normal" },
        { src: `${base}/NotoSansJP-Bold.ttf`, fontWeight: "bold" },
      ],
    });
    // 日本語はハイフン分割しない
    Font.registerHyphenationCallback((word) => [word]);
  } catch (e) {
    // すでに登録済みでも問題なし
  }
}

const styles = StyleSheet.create({
  page: {
    padding: 28,
    fontSize: 11,
    fontFamily: "NotoSansJP", // ← 登録した日本語フォントを必ず使う
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  robot: {
    width: 56,
    height: 56,
    marginRight: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
  },
  sub: {
    fontSize: 10,
    color: "#666",
    marginTop: 2,
  },
  section: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  dayTitle: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 4,
  },
  row: {
    marginBottom: 2,
    lineHeight: 1.3,
  },
  label: {
    fontWeight: "bold",
  },
  tips: {
    marginTop: 3,
    fontSize: 10,
    color: "#6b7280", // gray-500
  },
});

const JP = { mon: "月", tue: "火", wed: "水", thu: "木", fri: "金", sat: "土", sun: "日" };
const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const DEFAULT_TIPS = [
  "水分を200ml×6〜8回こまめに",
  "就寝90分前の入浴で深部体温リズム調整",
  "タンパク質を毎食20g目安",
  "よく噛んで20分以上かけて食事",
  "昼休みに10分散歩で日光を浴びる",
  "間食は素焼きナッツか高カカオ",
  "寝る前は画面の光を控えめに",
];

export default function ReportDocument({
  report = {},
  robotSrc,
  /** 例: https://your-domain.com/fonts */
  fontBaseUrl = "",
}) {
  // フォントを毎回確実に登録（フックは使わない）
  registerJPFonts(fontBaseUrl);

  const safe = (v) => (typeof v === "string" ? v : "");

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          {robotSrc ? <Image src={robotSrc} style={styles.robot} /> : null}
          <View>
            <Text style={styles.title}>AIヘルス週次プラン</Text>
            <Text style={styles.sub}>食事とワークアウトの7日メニュー（一般向け）</Text>
          </View>
        </View>

        {DAYS.map((d, idx) => {
          const v = report[d] || {};
          const tips = safe(v.tips) || DEFAULT_TIPS[idx % DEFAULT_TIPS.length];

          return (
            <View key={d} style={styles.section}>
              <Text style={styles.dayTitle}>{JP[d]}曜日</Text>

              <Text style={styles.row}>
                <Text style={styles.label}>朝食：</Text>
                {safe(v.breakfast)}
              </Text>
              <Text style={styles.row}>
                <Text style={styles.label}>昼食：</Text>
                {safe(v.lunch)}
              </Text>
              <Text style={styles.row}>
                <Text style={styles.label}>夕食：</Text>
                {safe(v.dinner)}
              </Text>
              <Text style={styles.row}>
                <Text style={styles.label}>運動：</Text>
                {safe(v.workout)}
              </Text>

              {/* Tips 行 */}
              <Text style={styles.tips}>Tips: {tips}</Text>
            </View>
          );
        })}
      </Page>
    </Document>
  );
}
