// app/(drawer)/professors/professor-details.tsx
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useTheme } from "../../../../components/ThemeContext";
import PieChart from "../../../../components/PieChart";
import ProgressBar from "../../../../components/ProgressBar";

type School = { id: string; name: string };

type Teacher = {
  __typename?: "Teacher";
  id: string;
  legacyId?: number | null;
  firstName: string;
  lastName: string;
  department?: string | null;
  avgRating?: number | null;
  avgDifficulty?: number | null;
  numRatings?: number | null;
  wouldTakeAgainPercent?: number | null;
  school?: School | null;
};

// ---------- helpers ----------
function coerceTeacher(paramValue: unknown): Teacher | null {
  if (!paramValue) return null;
  const raw = Array.isArray(paramValue) ? (paramValue.length ? paramValue[0] : "") : paramValue;
  try {
    if (typeof raw === "string") {
      if (raw.trim().startsWith("{")) {
        const obj = JSON.parse(raw);
        return obj && obj.id ? (obj as Teacher) : null;
      }
      return null;
    }
    const obj = raw as Partial<Teacher>;
    return obj && obj.id ? (obj as Teacher) : null;
  } catch {
    return null;
  }
}

function fmt1(n: number | null | undefined): string {
  return typeof n === "number" && Number.isFinite(n) ? n.toFixed(1) : "—";
}
function pct(n: number | null | undefined): string {
  return typeof n === "number" && Number.isFinite(n) ? `${Math.round(n)}%` : "—";
}
function intStr(n: number | null | undefined): string {
  return typeof n === "number" && Number.isFinite(n) ? String(n) : "—";
}
function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

function Stars({ value }: { value: number | null | undefined }) {
  const rounded = typeof value === "number" ? clamp(Math.round(value), 0, 5) : 0;
  return (
    <Text style={{ fontSize: 16 }}>
      {"★".repeat(rounded)}
      {"☆".repeat(5 - rounded)}
    </Text>
  );
}

function Bar({
  value,                // 0..max
  max = 5,
  themeFill,
  themeBg,
}: {
  value: number | null | undefined;
  max?: number;
  themeFill: string;
  themeBg: string;
}) {
  const safe = typeof value === "number" && Number.isFinite(value) ? value : 0;
  const pctVal = (clamp(safe, 0, max) / max) * 100;
  return (
    <View style={[styles.barBg, { backgroundColor: themeBg }]}>
      <View style={[styles.barFill, { width: `${pctVal}%`, backgroundColor: themeFill }]} />
    </View>
  );
}

function PercentBar({
  value,               // 0..100
  themeFill,
  themeBg,
}: {
  value: number | null | undefined;
  themeFill: string;
  themeBg: string;
}) {
  const safe = typeof value === "number" && Number.isFinite(value) ? value : 0;
  const pctVal = clamp(safe, 0, 100);
  return (
    <View style={[styles.barBg, { backgroundColor: themeBg }]}>
      <View style={[styles.barFill, { width: `${pctVal}%`, backgroundColor: themeFill }]} />
    </View>
  );
}

// ---------- screen ----------
export default function ProfessorDetailScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const teacher = coerceTeacher(params?.teacher);

  const goBackToProfessors = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/professors"); // fallback to list route
  };

  const openRmp = () => {
    if (teacher?.legacyId) {
      const url = `https://www.ratemyprofessors.com/professor/${teacher.legacyId}`;
      Linking.openURL(url).catch(() => Alert.alert("Couldn't open link", url));
    } else {
      Alert.alert("No RateMyProfessors link for this professor.");
    }
  };

  const headerLeft = () => (
    <TouchableOpacity
      onPress={goBackToProfessors}
      style={{ paddingHorizontal: 8, flexDirection: "row", alignItems: "center" }}
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
    >
      <Ionicons name="chevron-back" size={22} color={theme.background} />
      <Text style={{ marginLeft: 2, fontWeight: "700", color: theme.background }}>Back</Text>
    </TouchableOpacity>
  );

  const primary = theme.primary ?? "#3b82f6";
  const barBg = (theme as any).backgroundAlt ?? "#e5e7eb";

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen
        options={{
          title: "Professor Details",
          headerLeft,
        }}
      />

      {!teacher ? (
        <Text style={{ color: "red" }}>No teacher data.</Text>
      ) : (
        <>
          {/* Header Card */}
          <View style={[styles.card, { borderColor: theme.border, backgroundColor: theme.card }]}>
            <Text style={[styles.name, { color: theme.text }]}>
              {teacher.firstName} {teacher.lastName}
            </Text>
            <Text style={{ color: theme.muted, marginTop: 4 }}>
              {teacher.department ?? "—"} • {teacher.school?.name ?? "—"}
            </Text>

            <View style={styles.topRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.bigNumber, { color: theme.text }]}>{fmt1(teacher.avgRating)}</Text>
                <Text style={{ color: theme.muted, fontSize: 12, marginTop: 2 }}>
                  Overall Quality
                </Text>
                <View style={{ marginTop: 8 }}>
                  <Bar value={teacher.avgRating ?? null} max={5} themeFill={primary} themeBg={barBg} />
                </View>
              </View>

              <View style={{ alignItems: "flex-end" }}>
                <Stars value={teacher.avgRating ?? null} />
                <View style={styles.badgeWrap}>
                  <Text style={[styles.badge, { backgroundColor: primary, color: "#fff" }]}>
                    {intStr(teacher.numRatings)} rating{(teacher.numRatings ?? 0) === 1 ? "" : "s"}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Stat Grid */}
          <View style={styles.grid}>
            <View style={[styles.tile, { borderColor: theme.border, backgroundColor: theme.card }]}>
              <Text style={[styles.tileLabel, { color: theme.muted }]}>Difficulty</Text>
              <Text style={[styles.tileValue, { color: theme.text }]}>
                {fmt1(teacher.avgDifficulty)} / 5.0
              </Text>
              <View style={{ marginTop: 8 }}>
                <Bar value={teacher.avgDifficulty ?? null} max={5} themeFill={primary} themeBg={barBg} />
              </View>
            </View>

            <View style={[styles.tile, { borderColor: theme.border, backgroundColor: theme.card }]}>
              <Text style={[styles.tileLabel, { color: theme.muted }]}>Would take again</Text>
              <Text style={[styles.tileValue, { color: theme.text }]}>
                {pct(teacher.wouldTakeAgainPercent)}
              </Text>
              <View style={{ marginTop: 8 }}>
                <PercentBar
                  value={
                    typeof teacher.wouldTakeAgainPercent === "number"
                      ? teacher.wouldTakeAgainPercent
                      : null
                  }
                  themeFill={primary}
                  themeBg={barBg}
                />
              </View>
            </View>
          </View>

          {/* Action
          <TouchableOpacity onPress={openRmp} style={[styles.cta, { backgroundColor: primary }]}>
            <Text style={{ color: "#fff", fontWeight: "700" }}>Open on RateMyProfessors</Text>
          </TouchableOpacity> */}
        </>
      )}
    </View>
  );
}

// ---------- styles ----------
const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },

  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  name: { fontSize: 22, fontWeight: "800" },

  topRow: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 16,
  },
  bigNumber: { fontSize: 40, fontWeight: "900", lineHeight: 44 },

  badgeWrap: { marginTop: 6 },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontSize: 12,
    borderRadius: 999,
    overflow: "hidden",
    fontWeight: "800",
  },

  grid: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
  tile: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  tileLabel: { fontSize: 12, textTransform: "uppercase", letterSpacing: 0.6 },
  tileValue: { fontSize: 18, fontWeight: "800", marginTop: 6 },

  barBg: { height: 8, borderRadius: 6, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 6 },

  cta: {
    marginTop: 16,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 12,
  },
});
