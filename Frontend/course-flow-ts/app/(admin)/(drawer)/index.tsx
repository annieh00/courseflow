// app/(admin)/(drawer)/index.tsx
import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useTheme } from "../../../components/ThemeContext";
import { useAuth } from "../../../auth/AuthContext";
import api from "../../../services/api";

interface AdminStatsDTO {
  totalUsers: number;
  totalStudents: number;
  totalAdvisors: number;
  totalAdmins: number;
  totalCourses: number;
  pendingAdminApprovals: number;
  pendingAdvisorApprovals: number;
}

export default function AdminDashboard() {
  const { theme } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const firstName = user?.name ? user.name.split(" ")[0] : "Admin";

  const [stats, setStats] = useState<AdminStatsDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<AdminStatsDTO>("/admin/stats")
      .then(res => setStats(res.data))
      .catch(err => console.error("Failed to fetch dashboard stats:", err))
      .finally(() => setLoading(false));
  }, []);

  const totalPending = (stats?.pendingAdminApprovals ?? 0) + (stats?.pendingAdvisorApprovals ?? 0);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
    >
      {/* Hero */}
      <View style={[styles.hero, { backgroundColor: theme.primary }]}>
        <View style={styles.heroOrbLarge} />
        <View style={styles.heroOrbSmall} />
        <View style={styles.heroCopy}>
          <Text style={styles.heroEyebrow}>ADMIN CONTROL PANEL</Text>
          <Text style={styles.heroGreeting}>Welcome,{"\n"}{firstName}.</Text>
          <Text style={styles.heroSub}>Manage users, courses, and role approvals across CourseFlow.</Text>
        </View>
        <View style={styles.heroBubble}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.heroBubbleNumber}>{stats?.totalUsers ?? 0}</Text>
              <Text style={styles.heroBubbleLabel}>Total Users</Text>
            </>
          )}
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading stats…</Text>
        </View>
      ) : (
        <>
          {/* Stats grid */}
          <View style={styles.tilesRow}>
            <StatTile icon="people-outline" label="Students" value={stats?.totalStudents ?? 0} theme={theme} />
            <StatTile icon="person-circle-outline" label="Advisors" value={stats?.totalAdvisors ?? 0} theme={theme} />
          </View>
          <View style={styles.tilesRow}>
            <StatTile icon="shield-checkmark-outline" label="Admins" value={stats?.totalAdmins ?? 0} theme={theme} />
            <StatTile icon="book-outline" label="Courses" value={stats?.totalCourses ?? 0} theme={theme} />
          </View>

          {/* Pending approvals */}
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <View style={[styles.cardIconWrap, { backgroundColor: `${theme.primary}18` }]}>
                  <Ionicons name="time-outline" size={16} color={theme.primary} />
                </View>
                <Text style={[styles.cardTitle, { color: theme.text }]}>Pending Approvals</Text>
              </View>
              {totalPending > 0 && (
                <View style={[styles.pendingBadge, { backgroundColor: '#F59E0B' }]}>
                  <Text style={styles.pendingBadgeText}>{totalPending}</Text>
                </View>
              )}
            </View>

            <ApprovalRow
              label="Admin role requests"
              count={stats?.pendingAdminApprovals ?? 0}
              icon="shield-checkmark-outline"
              theme={theme}
              onPress={() => router.push("/(admin)/(drawer)/admin-approval")}
            />
            <ApprovalRow
              label="Advisor role requests"
              count={stats?.pendingAdvisorApprovals ?? 0}
              icon="school-outline"
              theme={theme}
              onPress={() => router.push("/(admin)/(drawer)/advisor-approval")}
              last
            />
          </View>

          {/* Quick actions */}
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <View style={[styles.cardIconWrap, { backgroundColor: `${theme.primary}18` }]}>
                  <Ionicons name="flash-outline" size={16} color={theme.primary} />
                </View>
                <Text style={[styles.cardTitle, { color: theme.text }]}>Quick Actions</Text>
              </View>
            </View>
            <View style={styles.actionsGrid}>
              <ActionButton icon="people-outline" label="Manage Users" theme={theme} onPress={() => router.push("/(admin)/(drawer)/users")} />
              <ActionButton icon="book-outline" label="Manage Courses" theme={theme} onPress={() => router.push("/(admin)/(drawer)/courses")} />
              <ActionButton icon="person-circle-outline" label="Students" theme={theme} onPress={() => router.push("/(admin)/(drawer)/students")} />
              <ActionButton icon="checkmark-circle-outline" label="Approvals" theme={theme} onPress={() => router.push("/(admin)/(drawer)/admin-approval")} />
            </View>
          </View>

          {/* Tips */}
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <View style={[styles.cardIconWrap, { backgroundColor: `${theme.primary}18` }]}>
                  <Ionicons name="information-circle-outline" size={16} color={theme.primary} />
                </View>
                <Text style={[styles.cardTitle, { color: theme.text }]}>Admin Tips</Text>
              </View>
            </View>
            {[
              "Review pending admin and advisor approvals weekly.",
              "Deactivate outdated courses so students only see active options.",
              "Use consistent Net-ID and email formats to keep accounts clean.",
            ].map((tip, i) => (
              <View key={i} style={[styles.tipRow, i < 2 && { borderBottomWidth: 1, borderBottomColor: theme.border }]}>
                <View style={[styles.tipDot, { backgroundColor: theme.primary }]} />
                <Text style={[styles.tipText, { color: theme.text }]}>{tip}</Text>
              </View>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}

function StatTile({ icon, label, value, theme }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: number; theme: any }) {
  return (
    <View style={[styles.tile, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={[styles.tileIconWrap, { backgroundColor: `${theme.primary}14` }]}>
        <Ionicons name={icon} size={18} color={theme.primary} />
      </View>
      <Text style={[styles.tileValue, { color: theme.text }]}>{value}</Text>
      <Text style={[styles.tileLabel, { color: theme.textSecondary }]}>{label}</Text>
    </View>
  );
}

function ApprovalRow({ label, count, icon, theme, onPress, last }: { label: string; count: number; icon: keyof typeof Ionicons.glyphMap; theme: any; onPress: () => void; last?: boolean }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.approvalRow, !last && { borderBottomWidth: 1, borderBottomColor: theme.border }]}
    >
      <Ionicons name={icon} size={18} color={theme.textSecondary} />
      <Text style={[styles.approvalLabel, { color: theme.text }]}>{label}</Text>
      <View style={[styles.countBadge, { backgroundColor: count > 0 ? '#FEF3C7' : theme.background, borderColor: count > 0 ? '#F59E0B' : theme.border }]}>
        <Text style={[styles.countBadgeText, { color: count > 0 ? '#92400E' : theme.textSecondary }]}>{count}</Text>
      </View>
      <Ionicons name="chevron-forward" size={15} color={theme.textSecondary} />
    </TouchableOpacity>
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
  content: { padding: 16, paddingBottom: 32 },

  hero: {
    borderRadius: 16, padding: 22, marginBottom: 16,
    flexDirection: "row", alignItems: "center",
    overflow: "hidden", minHeight: 160,
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
    backgroundColor: "rgba(255,255,255,0.14)", borderRadius: 16,
    paddingHorizontal: 14, paddingVertical: 12, alignItems: "center",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.20)", minWidth: 72,
  },
  heroBubbleNumber: { fontSize: 26, fontWeight: "800", color: "#fff" },
  heroBubbleLabel: { fontSize: 11, color: "rgba(255,255,255,0.80)", fontWeight: "600", marginTop: 2 },

  loadingState: { alignItems: "center", paddingVertical: 48 },
  loadingText: { marginTop: 12, fontSize: 14 },

  tilesRow: { flexDirection: "row", gap: 10, marginBottom: 10 },
  tile: { flex: 1, borderWidth: 1, borderRadius: 14, padding: 14, gap: 6 },
  tileIconWrap: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  tileValue: { fontSize: 24, fontWeight: "800" },
  tileLabel: { fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },

  card: { borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 12 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  cardHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardIconWrap: { width: 30, height: 30, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  cardTitle: { fontSize: 16, fontWeight: "800" },

  pendingBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  pendingBadgeText: { color: "#fff", fontSize: 12, fontWeight: "800" },

  approvalRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, gap: 10 },
  approvalLabel: { flex: 1, fontSize: 14 },
  countBadge: { borderRadius: 999, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 3 },
  countBadgeText: { fontSize: 13, fontWeight: "700" },

  actionsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  actionBtn: { width: "47%", borderWidth: 1, borderRadius: 14, padding: 14, alignItems: "center", gap: 8 },
  actionIconWrap: { width: 42, height: 42, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  actionLabel: { fontSize: 13, fontWeight: "600", textAlign: "center" },

  tipRow: { flexDirection: "row", alignItems: "flex-start", paddingVertical: 10, gap: 10 },
  tipDot: { width: 6, height: 6, borderRadius: 3, marginTop: 5 },
  tipText: { flex: 1, fontSize: 13, lineHeight: 19 },
});
