// app/(advisor)/(drawer)/index.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useTheme } from "../../../components/ThemeContext";
import { useAuth } from "../../../auth/AuthContext";
import api, { rootApi } from "../../../services/api";

type RiskStatus = "on-track" | "off-track" | "at-risk";
type QueuePriority = "high" | "medium" | "low";

type Advisee = {
  id: string;
  name: string;
  netid: string;
  creditsCompleted: number;
  creditsRequired: number;
  graduationYear?: number | null;
  planCount: number;
};

type BackendScheduleItem = {
  id: number | string;
  studentNetid?: string | null;
  studentName?: string | null;
  student_netid?: string | null;
  student_name?: string | null;
  slotDate?: string;
  startTime?: string;
  endTime?: string;
  slot_date?: string;
  start_time?: string;
  end_time?: string;
  status?: string;
};

type Meeting = {
  id: string;
  studentName: string;
  studentNetid: string;
  rawDate: string;
  startTime: string;
  endTime: string;
  status: string;
};

type WorkQueueItem = {
  id: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  priority: QueuePriority;
  actionLabel: string;
  onPress: () => void;
};

function pickFirstNumberField(obj: any, candidates: string[], fallback: number) {
  for (const key of candidates) {
    const raw = obj?.[key];
    if (raw !== undefined && raw !== null && raw !== "") {
      const parsed = Number(raw);
      if (!Number.isNaN(parsed)) return parsed;
    }
  }
  return fallback;
}

function pickFirstStringField(obj: any, candidates: string[], fallback = "") {
  for (const key of candidates) {
    const raw = obj?.[key];
    if (raw === undefined || raw === null) continue;
    if (Array.isArray(raw)) {
      const joined = raw.map((v) => String(v).trim()).filter(Boolean).join(", ");
      if (joined) return joined;
    }
    const value = String(raw).trim();
    if (value) return value;
  }
  return fallback;
}

function mapAdvisee(raw: any, index: number): Advisee {
  const netid = pickFirstStringField(raw, ["netid", "studentNetid", "student_netid"]);
  const name = pickFirstStringField(
    raw,
    ["fullName", "full_name", "displayName", "display_name", "name"],
    netid || "Unknown Student"
  );
  const creditsCompleted = pickFirstNumberField(raw, ["completedCredits", "completed_credits", "creditsCompleted", "credits_completed", "earnedCredits", "earned_credits", "totalCompletedCredits", "total_completed_credits"], 0);
  const creditsRequired = pickFirstNumberField(raw, ["requiredCredits", "required_credits", "creditsRequired", "credits_required", "totalRequiredCredits", "total_required_credits", "degreeCreditsRequired", "degree_credits_required"], 128);
  const graduationYear = pickFirstNumberField(raw, ["graduationYear", "graduation_year", "expectedGraduationYear", "expected_graduation_year", "gradYear", "grad_year"], NaN);
  return {
    id: String(raw?.id ?? netid ?? index),
    name,
    netid,
    creditsCompleted,
    creditsRequired,
    graduationYear: Number.isNaN(graduationYear) ? null : graduationYear,
    planCount: 0,
  };
}

function getProgress(a: Advisee): number {
  if (a.creditsRequired <= 0) return 0;
  return Math.max(0, Math.min(1, a.creditsCompleted / a.creditsRequired));
}

function getRiskStatus(a: Advisee): RiskStatus {
  const progress = getProgress(a);
  if (progress < 0.5) return "at-risk";
  if (progress < 0.75) return "off-track";
  return "on-track";
}

function formatTime(time: string) {
  const [hourStr, minuteStr] = time.split(":");
  let hour = Number(hourStr);
  const suffix = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12;
  return `${hour}:${minuteStr ?? "00"} ${suffix}`;
}

function formatMeetingLabel(meeting: Meeting) {
  const date = new Date(`${meeting.rawDate}T00:00:00`);
  const dateLabel = date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  return `${dateLabel}, ${formatTime(meeting.startTime)}`;
}

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function toDateTimeValue(rawDate?: string, rawTime?: string) {
  if (!rawDate) return Number.MAX_SAFE_INTEGER;
  return new Date(`${rawDate}T${rawTime ?? "00:00:00"}`).getTime();
}

function isUpcoming(rawDate?: string, rawTime?: string) {
  if (!rawDate) return false;
  return toDateTimeValue(rawDate, rawTime) >= Date.now();
}

function priorityColor(priority: QueuePriority) {
  if (priority === "high") return "#DC2626";
  if (priority === "medium") return "#F59E0B";
  return "#0EA5E9";
}

export default function AdvisorDashboard() {
  const { user } = useAuth();
  const advisorNetid = (user as any)?.userId ?? (user as any)?.netid ?? (user as any)?.id ?? "";
  const firstName = user?.name ? user.name.split(" ")[0] : "Advisor";
  const { theme } = useTheme();
  const router = useRouter();

  const [advisees, setAdvisees] = useState<Advisee[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async (showLoader = true) => {
    if (!advisorNetid) {
      setAdvisees([]);
      setMeetings([]);
      setLoading(false);
      return;
    }

    try {
      if (showLoader) setLoading(true);
      setRefreshing(true);
      setError(null);

      const [adviseeRes, scheduleRes] = await Promise.all([
        api.get(`/advisor/${encodeURIComponent(advisorNetid)}/advisees`),
        api.get(`/schedule/${encodeURIComponent(advisorNetid)}`),
      ]);

      const adviseeData: any[] = Array.isArray(adviseeRes.data) ? adviseeRes.data : [];
      const scheduleData: BackendScheduleItem[] = Array.isArray(scheduleRes.data) ? scheduleRes.data : [];

      const mappedAdvisees = adviseeData.map(mapAdvisee);

      const planCounts = await Promise.all(
        mappedAdvisees.map(async (advisee) => {
          if (!advisee.netid) return { netid: advisee.netid, count: 0 };
          try {
            const res = await rootApi.get(`/coursePlan/${encodeURIComponent(advisee.netid)}/plans`);
            return { netid: advisee.netid, count: Array.isArray(res.data) ? res.data.length : 0 };
          } catch {
            return { netid: advisee.netid, count: 0 };
          }
        })
      );

      const planCountByNetid = new Map(planCounts.map((item) => [item.netid, item.count]));
      const adviseesWithPlans = mappedAdvisees.map((a) => ({ ...a, planCount: planCountByNetid.get(a.netid) ?? 0 }));

      const mappedMeetings = scheduleData
        .map((item) => {
          const rawDate = item.slotDate ?? item.slot_date;
          const startTime = item.startTime ?? item.start_time;
          const endTime = item.endTime ?? item.end_time;
          const status = (item.status ?? "").toUpperCase();
          if (!rawDate || !startTime || !endTime) return null;
          return {
            id: String(item.id),
            studentName: item.studentName?.trim() || item.student_name?.trim() || "Unknown Student",
            studentNetid: item.studentNetid?.trim() || item.student_netid?.trim() || "",
            rawDate, startTime, endTime, status,
          } satisfies Meeting;
        })
        .filter((item): item is Meeting => Boolean(item))
        .sort((a, b) => toDateTimeValue(a.rawDate, a.startTime) - toDateTimeValue(b.rawDate, b.startTime));

      setAdvisees(adviseesWithPlans);
      setMeetings(mappedMeetings);
    } catch (err) {
      console.error("Error loading advisor dashboard:", err);
      setError("Could not load the advisor dashboard.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [advisorNetid]);

  useEffect(() => { loadDashboard(true); }, [loadDashboard]);
  useFocusEffect(useCallback(() => { loadDashboard(false); }, [loadDashboard]));

  const metrics = useMemo(() => {
    const total = advisees.length;
    const todayKey = toDateKey(new Date());
    const currentYear = new Date().getFullYear();
    let atRisk = 0, offTrack = 0, onTrack = 0, progressSum = 0, graduatingThisYear = 0;

    for (const a of advisees) {
      const status = getRiskStatus(a);
      if (status === "at-risk") atRisk++;
      else if (status === "off-track") offTrack++;
      else onTrack++;
      progressSum += getProgress(a);
      if (a.graduationYear === currentYear) graduatingThisYear++;
    }

    const booked = meetings.filter((m) => m.status === "BOOKED");
    const todayMeetings = booked.filter((m) => m.rawDate === todayKey);
    const upcomingMeetings = booked.filter((m) => isUpcoming(m.rawDate, m.startTime));
    const missingPlans = advisees.filter((a) => a.planCount === 0);

    return { total, atRisk, offTrack, onTrack, avgProgress: total ? progressSum / total : 0, graduatingThisYear, todayMeetings, upcomingMeetings, missingPlans };
  }, [advisees, meetings]);

  const workQueue = useMemo<WorkQueueItem[]>(() => {
    const queue: WorkQueueItem[] = [];
    const nextMeeting = metrics.upcomingMeetings[0];

    if (metrics.todayMeetings.length > 0) {
      queue.push({
        id: "today-meetings",
        title: `${metrics.todayMeetings.length} meeting${metrics.todayMeetings.length === 1 ? "" : "s"} today`,
        subtitle: nextMeeting ? `Next up: ${nextMeeting.studentName} at ${formatTime(nextMeeting.startTime)}` : "Review student profiles before appointments.",
        icon: "calendar-outline", priority: "high", actionLabel: "Open schedule",
        onPress: () => router.push("/schedule"),
      });
    }
    if (metrics.missingPlans.length > 0) {
      queue.push({
        id: "missing-plans",
        title: `${metrics.missingPlans.length} advisee${metrics.missingPlans.length === 1 ? "" : "s"} without plans`,
        subtitle: "Help these students create or submit a degree plan.",
        icon: "document-text-outline", priority: "high", actionLabel: "Review plans",
        onPress: () => router.push("/plans"),
      });
    }
    if (metrics.atRisk > 0) {
      queue.push({
        id: "at-risk",
        title: `${metrics.atRisk} advisee${metrics.atRisk === 1 ? "" : "s"} below progress expectations`,
        subtitle: "Prioritize outreach before registration decisions stack up.",
        icon: "alert-circle-outline", priority: "medium", actionLabel: "View advisees",
        onPress: () => router.push("/advisees"),
      });
    }
    if (metrics.upcomingMeetings.length > 0) {
      queue.push({
        id: "upcoming-plan-review",
        title: `${metrics.upcomingMeetings.length} upcoming booked meeting${metrics.upcomingMeetings.length === 1 ? "" : "s"}`,
        subtitle: nextMeeting ? `Prepare for ${nextMeeting.studentName} on ${formatMeetingLabel(nextMeeting)}.` : "Open plan review before your next advising slot.",
        icon: "clipboard-outline", priority: "low", actionLabel: "Prepare",
        onPress: () => router.push("/plans"),
      });
    }
    return queue;
  }, [metrics, router]);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => loadDashboard(false)} tintColor={theme.primary} />
      }
    >
      {/* Hero */}
      <View style={[styles.hero, { backgroundColor: theme.primary }]}>
        <View style={styles.heroOrbLarge} />
        <View style={styles.heroOrbSmall} />
        <View style={styles.heroCopy}>
          <Text style={styles.heroEyebrow}>ADVISOR DASHBOARD</Text>
          <Text style={styles.heroGreeting}>Welcome back,{"\n"}{firstName}.</Text>
          <Text style={styles.heroSub}>Your advising queue and student health at a glance.</Text>
        </View>
        <View style={styles.heroBubble}>
          <Text style={styles.heroBubbleNumber}>{metrics.total}</Text>
          <Text style={styles.heroBubbleLabel}>Advisees</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading dashboard…</Text>
        </View>
      ) : (
        <>
          {error && (
            <View style={[styles.noticeCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Ionicons name="warning-outline" size={18} color="#F59E0B" />
              <Text style={[styles.noticeText, { color: theme.text }]}>{error}</Text>
              <TouchableOpacity onPress={() => loadDashboard(true)}>
                <Text style={[styles.retryText, { color: theme.primary }]}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Stat tiles */}
          <View style={styles.tilesRow}>
            <StatTile icon="trending-up-outline" label="Avg Progress" value={`${Math.round(metrics.avgProgress * 100)}%`} theme={theme} />
            <StatTile icon="calendar-outline" label="Today" value={String(metrics.todayMeetings.length)} theme={theme} />
          </View>
          <View style={styles.tilesRow}>
            <StatTile icon="alert-circle-outline" label="At Risk" value={String(metrics.atRisk)} theme={theme} accent="#DC2626" />
            <StatTile icon="document-text-outline" label="No Plan" value={String(metrics.missingPlans.length)} theme={theme} accent="#F59E0B" />
          </View>

          {/* Work queue */}
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <View style={[styles.cardIconWrap, { backgroundColor: `${theme.primary}18` }]}>
                  <Ionicons name="flash-outline" size={16} color={theme.primary} />
                </View>
                <Text style={[styles.cardTitle, { color: theme.text }]}>This Week</Text>
              </View>
              <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>What needs attention</Text>
            </View>

            {workQueue.length === 0 ? (
              <View style={styles.emptyQueue}>
                <Ionicons name="checkmark-circle-outline" size={32} color="#22C55E" />
                <Text style={[styles.emptyQueueTitle, { color: theme.text }]}>All clear</Text>
                <Text style={[styles.emptyQueueSub, { color: theme.textSecondary }]}>No urgent items right now.</Text>
              </View>
            ) : (
              workQueue.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.85}
                  onPress={item.onPress}
                  style={[styles.queueRow, { backgroundColor: theme.background, borderColor: theme.border }]}
                >
                  <View style={[styles.queueIconWrap, { backgroundColor: `${priorityColor(item.priority)}18` }]}>
                    <Ionicons name={item.icon} size={18} color={priorityColor(item.priority)} />
                  </View>
                  <View style={styles.queueBody}>
                    <Text style={[styles.queueTitle, { color: theme.text }]}>{item.title}</Text>
                    <Text style={[styles.queueSub, { color: theme.textSecondary }]}>{item.subtitle}</Text>
                  </View>
                  <View style={styles.queueAction}>
                    <Text style={[styles.queueActionText, { color: theme.primary }]}>{item.actionLabel}</Text>
                    <Ionicons name="chevron-forward" size={15} color={theme.primary} />
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>

          {/* Snapshot */}
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <View style={[styles.cardIconWrap, { backgroundColor: `${theme.primary}18` }]}>
                  <Ionicons name="analytics-outline" size={16} color={theme.primary} />
                </View>
                <Text style={[styles.cardTitle, { color: theme.text }]}>Advisor Snapshot</Text>
              </View>
            </View>
            <SnapshotRow label="On track" value={metrics.onTrack} theme={theme} valueColor="#22C55E" />
            <SnapshotRow label="Off track" value={metrics.offTrack} theme={theme} valueColor="#F59E0B" />
            <SnapshotRow label="At risk" value={metrics.atRisk} theme={theme} valueColor="#DC2626" />
            <SnapshotRow label="Graduating this year" value={metrics.graduatingThisYear} theme={theme} />
            <SnapshotRow label="Upcoming meetings" value={metrics.upcomingMeetings.length} theme={theme} last />
          </View>

          {/* Quick Actions */}
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <View style={[styles.cardIconWrap, { backgroundColor: `${theme.primary}18` }]}>
                  <Ionicons name="navigate-outline" size={16} color={theme.primary} />
                </View>
                <Text style={[styles.cardTitle, { color: theme.text }]}>Quick Actions</Text>
              </View>
            </View>
            <View style={styles.actionsGrid}>
              <ActionButton icon="people-outline" label="View Advisees" theme={theme} onPress={() => router.push("/advisees")} />
              <ActionButton icon="document-text-outline" label="Review Plans" theme={theme} onPress={() => router.push("/plans")} />
              <ActionButton icon="calendar-outline" label="Schedule" theme={theme} onPress={() => router.push("/schedule")} />
              <ActionButton icon="search-outline" label="Find Student" theme={theme} onPress={() => router.push("/students")} />
            </View>
          </View>
        </>
      )}
    </ScrollView>
  );
}

function StatTile({ icon, label, value, theme, accent }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string; theme: any; accent?: string }) {
  const color = accent ?? theme.primary;
  return (
    <View style={[styles.tile, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={[styles.tileIconWrap, { backgroundColor: `${color}14` }]}>
        <Ionicons name={icon} size={16} color={color} />
      </View>
      <Text style={[styles.tileValue, { color: theme.text }]}>{value}</Text>
      <Text style={[styles.tileLabel, { color: theme.textSecondary }]}>{label}</Text>
    </View>
  );
}

function SnapshotRow({ label, value, theme, valueColor, last }: { label: string; value: number; theme: any; valueColor?: string; last?: boolean }) {
  return (
    <View style={[styles.snapshotRow, !last && { borderBottomWidth: 1, borderBottomColor: theme.border }]}>
      <Text style={[styles.snapshotLabel, { color: theme.text }]}>{label}</Text>
      <Text style={[styles.snapshotValue, { color: valueColor ?? theme.textSecondary }]}>{value}</Text>
    </View>
  );
}

function ActionButton({ icon, label, theme, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; theme: any; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[styles.actionBtn, { borderColor: theme.border, backgroundColor: theme.background }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.actionIconWrap, { backgroundColor: `${theme.primary}14` }]}>
        <Ionicons name={icon} size={20} color={theme.primary} />
      </View>
      <Text style={[styles.actionLabel, { color: theme.text }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 32, gap: 0 },

  hero: {
    borderRadius: 16,
    padding: 22,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
    minHeight: 160,
  },
  heroOrbLarge: {
    position: "absolute", width: 220, height: 220, borderRadius: 110,
    backgroundColor: "rgba(255,255,255,0.08)", top: -70, right: -50,
  },
  heroOrbSmall: {
    position: "absolute", width: 110, height: 110, borderRadius: 55,
    backgroundColor: "rgba(255,255,255,0.06)", bottom: -30, left: -20,
  },
  heroCopy: { flex: 1, paddingRight: 12 },
  heroEyebrow: { color: "rgba(255,255,255,0.70)", fontSize: 11, fontWeight: "800", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 8 },
  heroGreeting: { color: "#fff", fontSize: 28, fontWeight: "800", lineHeight: 33 },
  heroSub: { color: "rgba(255,255,255,0.80)", fontSize: 13, marginTop: 8, lineHeight: 18 },
  heroBubble: {
    backgroundColor: "rgba(255,255,255,0.14)",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.20)",
    minWidth: 72,
  },
  heroBubbleNumber: { fontSize: 26, fontWeight: "800", color: "#fff" },
  heroBubbleLabel: { fontSize: 11, color: "rgba(255,255,255,0.80)", fontWeight: "600", marginTop: 2 },

  loadingState: { alignItems: "center", paddingVertical: 48 },
  loadingText: { marginTop: 12, fontSize: 14 },

  noticeCard: {
    borderWidth: 1, borderRadius: 14, padding: 12, marginBottom: 12,
    flexDirection: "row", alignItems: "center", gap: 8,
  },
  noticeText: { flex: 1, fontSize: 14 },
  retryText: { fontWeight: "700", fontSize: 14 },

  tilesRow: { flexDirection: "row", gap: 10, marginBottom: 10 },
  tile: {
    flex: 1, borderWidth: 1, borderRadius: 14,
    padding: 14, gap: 6,
  },
  tileIconWrap: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center", marginBottom: 2 },
  tileValue: { fontSize: 22, fontWeight: "800" },
  tileLabel: { fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },

  card: { borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 12 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  cardHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardIconWrap: { width: 30, height: 30, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  cardTitle: { fontSize: 16, fontWeight: "800" },
  cardSubtitle: { fontSize: 12 },

  emptyQueue: { alignItems: "center", paddingVertical: 20 },
  emptyQueueTitle: { fontSize: 16, fontWeight: "700", marginTop: 10, marginBottom: 4 },
  emptyQueueSub: { fontSize: 13, textAlign: "center" },

  queueRow: {
    borderWidth: 1, borderRadius: 14, padding: 12, marginTop: 8,
    flexDirection: "row", alignItems: "center", gap: 10,
  },
  queueIconWrap: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  queueBody: { flex: 1 },
  queueTitle: { fontSize: 14, fontWeight: "700" },
  queueSub: { fontSize: 12, marginTop: 2, lineHeight: 17 },
  queueAction: { flexDirection: "row", alignItems: "center", gap: 2 },
  queueActionText: { fontSize: 12, fontWeight: "700" },

  snapshotRow: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", paddingVertical: 10,
  },
  snapshotLabel: { fontSize: 14 },
  snapshotValue: { fontSize: 15, fontWeight: "700" },

  actionsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  actionBtn: {
    width: "47%", borderWidth: 1, borderRadius: 14,
    padding: 14, alignItems: "center", gap: 8,
  },
  actionIconWrap: { width: 42, height: 42, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  actionLabel: { fontSize: 13, fontWeight: "600", textAlign: "center" },
});
