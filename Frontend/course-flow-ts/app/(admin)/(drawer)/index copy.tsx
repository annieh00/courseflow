// app/(advisor)/(drawer)/index.tsx
import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useTheme } from "../../../components/ThemeContext";

type RiskStatus = "on-track" | "off-track" | "at-risk";

type Advisee = {
  id: string;
  name: string;
  netid: string;
  gpa?: number;
  creditsCompleted: number;
  creditsRequired: number;
  graduationYear?: number | null;
};

// ---- MOCK DATA (you can plug in real data later) ----

const MOCK_ADVISEES: Advisee[] = [
  {
    id: "1",
    name: "Sarah Johnson",
    netid: "sjohnson",
    gpa: 3.72,
    creditsCompleted: 84,
    creditsRequired: 128,
    graduationYear: 2026,
  },
  {
    id: "2",
    name: "Kevin Lee",
    netid: "klee",
    gpa: 2.35,
    creditsCompleted: 46,
    creditsRequired: 128,
    graduationYear: 2027,
  },
  {
    id: "3",
    name: "Maria Garcia",
    netid: "mgarcia",
    gpa: 1.94,
    creditsCompleted: 115,
    creditsRequired: 128,
    graduationYear: 2025,
  },
];

function getProgress(a: Advisee): number {
  return a.creditsRequired > 0 ? a.creditsCompleted / a.creditsRequired : 0;
}

function getRiskStatus(a: Advisee): RiskStatus {
  const gpa = a.gpa ?? 0;
  const progress = getProgress(a);

  if (gpa < 2.0 || progress < 0.5) return "at-risk";
  if (progress < 0.75) return "off-track";
  return "on-track";
}

export default function AdvisorDashboard() {
  const { theme } = useTheme();
  const router = useRouter();

  // ---- derived dashboard stats ----
  const metrics = useMemo(() => {
    const total = MOCK_ADVISEES.length;

    let atRisk = 0;
    let offTrack = 0;
    let onTrack = 0;
    let gpaSum = 0;
    let gpaCount = 0;
    const gradYears: number[] = [];

    for (const a of MOCK_ADVISEES) {
      const status = getRiskStatus(a);
      if (status === "at-risk") atRisk++;
      else if (status === "off-track") offTrack++;
      else onTrack++;

      if (typeof a.gpa === "number") {
        gpaSum += a.gpa;
        gpaCount++;
      }
      if (typeof a.graduationYear === "number") {
        gradYears.push(a.graduationYear);
      }
    }

    const avgGpa = gpaCount ? gpaSum / gpaCount : null;

    gradYears.sort((a, b) => a - b);
    let medianGrad: number | null = null;
    if (gradYears.length) {
      const mid = Math.floor(gradYears.length / 2);
      if (gradYears.length % 2 === 1) {
        medianGrad = gradYears[mid];
      } else {
        medianGrad = Math.round((gradYears[mid - 1] + gradYears[mid]) / 2);
      }
    }

    return {
      total,
      atRisk,
      offTrack,
      onTrack,
      avgGpa,
      medianGrad,
    };
  }, []);

  const primary = theme.primary ?? "#3B82F6";

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={{ padding: 20, paddingBottom: 24 }}
    >
      {/* Top "hero" header */}
      <View style={[styles.hero, { backgroundColor: primary }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.heroTitle, { color: theme.background }]}>
            Advisor Dashboard
          </Text>
          <Text style={[styles.heroSubtitle, { color: theme.background }]}>
            See how your advisees are doing at a glance.
          </Text>
        </View>

        {/* Quick stats bubble */}
        <View style={styles.heroBubble}>
          <Text style={styles.heroBubbleNumber}>{metrics.total}</Text>
          <Text style={styles.heroBubbleLabel}>Advisees</Text>
        </View>
      </View>

      {/* Overview tiles */}
      {/* <View style={styles.tilesRow}>
        <OverviewTile
          icon="person-outline"
          label="At risk"
          value={String(metrics.atRisk)}
          theme={theme}
        />
        <OverviewTile
          icon="trending-down-outline"
          label="Off track"
          value={String(metrics.offTrack)}
          theme={theme}
        />
        <OverviewTile
          icon="checkmark-circle-outline"
          label="On track"
          value={String(metrics.onTrack)}
          theme={theme}
        />
      </View> */}

      <View style={styles.tilesRow}>
        <OverviewTile
          icon="school-outline"
          label="Avg GPA"
          value={
            typeof metrics.avgGpa === "number"
              ? metrics.avgGpa.toFixed(2)
              : "—"
          }
          theme={theme}
        />
        <OverviewTile
          icon="calendar-outline"
          label="Median grad year"
          value={metrics.medianGrad ? String(metrics.medianGrad) : "—"}
          theme={theme}
        />
      </View>

      {/* Alerts */}
      <View
        style={[
          styles.card,
          { backgroundColor: theme.card, borderColor: theme.border },
        ]}
      >
        <View style={styles.cardHeaderRow}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Ionicons
              name="alert-circle-outline"
              size={18}
              color={primary}
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.cardTitle, { color: theme.text }]}>
              Alerts
            </Text>
          </View>
          <Text style={{ fontSize: 12, color: theme.muted }}>
            Prioritize these this week
          </Text>
        </View>

        {/* You can wire these to real queries later */}
        <DashboardRow
          label="Students below GPA 2.0"
          value={`${metrics.atRisk}`}
          theme={theme}
        />
        <DashboardRow
          label="Students off track for graduation"
          value={`${metrics.offTrack}`}
          theme={theme}
        />
        <DashboardRow
          label="Graduating this year"
          value={
            MOCK_ADVISEES.filter(
              (a) => a.graduationYear === metrics.medianGrad
            ).length || "—"
          }
          theme={theme}
        />
      </View>

      {/* Quick navigation actions */}
      <View
        style={[
          styles.card,
          { backgroundColor: theme.card, borderColor: theme.border },
        ]}
      >
        <View style={styles.cardHeaderRow}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Ionicons
              name="flash-outline"
              size={18}
              color={primary}
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.cardTitle, { color: theme.text }]}>
              Quick actions
            </Text>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <QuickActionButton
            icon="people-outline"
            label="View advisees"
            theme={theme}
            onPress={() => router.push("/advisees")}
          />
          <QuickActionButton
            icon="document-text-outline"
            label="Review plans"
            theme={theme}
            onPress={() => router.push("/plans")}
          />
        </View>

        <View style={styles.actionsRow}>
          <QuickActionButton
            icon="mail-outline"
            label="Follow up"
            theme={theme}
            onPress={() => router.push("/advisees")} // later: messaging overview
          />
          <QuickActionButton
            icon="analytics-outline"
            label="Reports"
            theme={theme}
            onPress={() => {
              // placeholder; later route to /reports
            }}
          />
        </View>
      </View>

      {/* Suggested talking points */}
      <View
        style={[
          styles.card,
          { backgroundColor: theme.card, borderColor: theme.border },
        ]}
      >
        <View style={styles.cardHeaderRow}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={18}
              color={primary}
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.cardTitle, { color: theme.text }]}>
              Suggested talking points
            </Text>
          </View>
        </View>

        <Text style={[styles.bulletText, { color: theme.text }]}>
          Ask about internship or co-op options for next summer, especially for
          juniors.
        </Text>
        <Text style={[styles.bulletText, { color: theme.text }]}>
          Encourage students with lower GPAs to retake key weed-out courses
          before moving on.
        </Text>
        <Text style={[styles.bulletText, { color: theme.text }]}>
          For seniors, confirm graduation requirements and remind them about
          application deadlines.
        </Text>
      </View>
    </ScrollView>
  );
}

// ---------- Subcomponents ----------

function OverviewTile({
  icon,
  label,
  value,
  theme,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  theme: any;
}) {
  return (
    <View
      style={[
        styles.tile,
        { backgroundColor: theme.card, borderColor: theme.border },
      ]}
    >
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Ionicons
          name={icon}
          size={18}
          color={theme.primary}
          style={{ marginRight: 6 }}
        />
        <Text style={[styles.tileLabel, { color: theme.muted }]}>{label}</Text>
      </View>
      <Text style={[styles.tileValue, { color: theme.text }]}>{value}</Text>
    </View>
  );
}

function DashboardRow({
  label,
  value,
  theme,
}: {
  label: string;
  value: string | number;
  theme: any;
}) {
  return (
    <View style={styles.rowBetween}>
      <Text style={{ color: theme.text, fontSize: 14 }}>{label}</Text>
      <Text style={{ color: theme.muted, fontWeight: "600", fontSize: 14 }}>
        {value}
      </Text>
    </View>
  );
}

function QuickActionButton({
  icon,
  label,
  theme,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  theme: any;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.quickAction,
        { borderColor: theme.border, backgroundColor: theme.card },
      ]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Ionicons
        name={icon}
        size={20}
        color={theme.primary}
        style={{ marginBottom: 4 }}
      />
      <Text
        style={{
          color: theme.text,
          fontSize: 13,
          fontWeight: "600",
          textAlign: "center",
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ---------- styles ----------

const styles = StyleSheet.create({
  container: { flex: 1 },

  hero: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  heroSubtitle: {
    fontSize: 13,
    marginTop: 4,
    opacity: 0.9,
  },
  heroBubble: {
    marginLeft: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroBubbleNumber: {
    fontSize: 18,
    fontWeight: "800",
    color: "#fff",
  },
  heroBubbleLabel: {
    fontSize: 11,
    color: "#F9FAFB",
  },

  tilesRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
  tile: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  tileLabel: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  tileValue: {
    fontSize: 18,
    fontWeight: "800",
    marginTop: 6,
  },

  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginTop: 12,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
  },

  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },

  actionsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
  quickAction: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  bulletText: {
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
});
