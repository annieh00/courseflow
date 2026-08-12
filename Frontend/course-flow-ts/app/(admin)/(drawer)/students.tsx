import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import Ionicons from "@expo/vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "../../../components/ThemeContext";
import ProgressBar from "../../../components/ProgressBar";

const API_BASE = (process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8080/api").replace(/\/api\/?$/, "");

type Student = {
  id: number;
  netid: string;
  fullName: string;
  firstName: string;
  lastName: string;
  email: string;
  completedCredits: number;
  requiredCredits: number;
  hasAdvisor: boolean;
  advisorName: string | null;
  advisorNetid: string | null;
};

type TabFilter = "all" | "assigned" | "unassigned";

function getInitials(name: string): string {
  return (name ?? "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("");
}

export default function AdminStudentsScreen() {
  const { theme } = useTheme();

  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<TabFilter>("all");

  const loadStudents = useCallback(async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("accessToken");
      const res = await fetch(`${API_BASE}/api/advisor/admin/students`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(await res.text());
      setStudents(await res.json());
    } catch (err) {
      console.error("[ADMIN STUDENTS]", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadStudents(); }, [loadStudents]));

  const assignedCount = useMemo(() => students.filter((s) => s.hasAdvisor).length, [students]);

  const filtered = useMemo(() => {
    let list = students;
    if (tab === "assigned") list = list.filter((s) => s.hasAdvisor);
    else if (tab === "unassigned") list = list.filter((s) => !s.hasAdvisor);

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((s) =>
        [s.fullName, s.netid, s.email, s.advisorName ?? "", s.advisorNetid ?? ""]
          .join(" ").toLowerCase().includes(q)
      );
    }

    return [...list].sort((a, b) => {
      if (a.hasAdvisor !== b.hasAdvisor) return a.hasAdvisor ? -1 : 1;
      return (a.fullName ?? "").localeCompare(b.fullName ?? "");
    });
  }, [students, tab, search]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Students</Text>
          <Text style={[styles.headerSub, { color: theme.textSecondary }]}>
            Overview of all registered students and their advisor assignments
          </Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatPill label="Total" value={String(students.length)} theme={theme} />
          <StatPill label="Assigned" value={String(assignedCount)} theme={theme} primary />
          <StatPill label="Unassigned" value={String(students.length - assignedCount)} theme={theme} />
        </View>

        {/* Tabs */}
        <View style={[styles.tabBar, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {([
            { key: "all", label: "All" },
            { key: "assigned", label: "Assigned" },
            { key: "unassigned", label: "Unassigned" },
          ] as { key: TabFilter; label: string }[]).map(({ key, label }) => (
            <TouchableOpacity
              key={key}
              style={[styles.tab, tab === key && { backgroundColor: theme.primary }]}
              onPress={() => setTab(key)}
              activeOpacity={0.85}
            >
              <Text style={[styles.tabText, { color: tab === key ? theme.background : theme.textSecondary }]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Search */}
        <View style={[styles.searchBar, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Ionicons name="search" size={16} color={theme.textSecondary} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search by name, NetID, email, or advisor…"
            placeholderTextColor={theme.textSecondary}
            style={[styles.searchInput, { color: theme.text }]}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
              <Ionicons name="close-circle" size={16} color={theme.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {!loading && (
          <Text style={[styles.resultCount, { color: theme.textSecondary }]}>
            {filtered.length} student{filtered.length !== 1 ? "s" : ""}
            {search ? ` matching "${search}"` : ""}
          </Text>
        )}

        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[{ color: theme.textSecondary, marginTop: 10 }]}>Loading students…</Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.centerState}>
            <Ionicons name="people-outline" size={40} color={theme.textSecondary} style={{ marginBottom: 8 }} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No students found</Text>
            <Text style={[{ color: theme.textSecondary, marginTop: 4, textAlign: "center" }]}>
              {search ? "Try a different search term." : "No students in this category yet."}
            </Text>
          </View>
        ) : (
          filtered.map((item) => {
            const progress = item.requiredCredits ? Math.min(1, item.completedCredits / item.requiredCredits) : 0;
            return (
              <View key={item.id} style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                {item.hasAdvisor && (
                  <View style={[styles.assignedAccent, { backgroundColor: theme.primary }]} />
                )}

                <View style={styles.cardRow}>
                  <View style={[styles.avatar, { backgroundColor: item.hasAdvisor ? theme.primary : theme.border }]}>
                    <Text style={[styles.avatarText, { color: item.hasAdvisor ? theme.background : theme.text }]}>
                      {getInitials(item.fullName)}
                    </Text>
                  </View>

                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
                      {item.fullName || item.netid}
                    </Text>
                    <Text style={[styles.meta, { color: theme.textSecondary }]}>{item.netid}</Text>
                    <Text style={[styles.meta, { color: theme.textSecondary }]} numberOfLines={1}>{item.email}</Text>

                    {item.hasAdvisor ? (
                      <View style={styles.advisorRow}>
                        <Ionicons name="person-circle-outline" size={13} color={theme.primary} />
                        <Text style={[styles.advisorText, { color: theme.primary }]} numberOfLines={1}>
                          {item.advisorName ?? item.advisorNetid}
                          {item.advisorNetid ? ` (${item.advisorNetid})` : ""}
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.advisorRow}>
                        <Ionicons name="person-circle-outline" size={13} color={theme.textSecondary} />
                        <Text style={[styles.advisorText, { color: theme.textSecondary }]}>No advisor assigned</Text>
                      </View>
                    )}
                  </View>
                </View>

                <View style={styles.progressSection}>
                  <View style={styles.progressLabelRow}>
                    <Text style={[styles.progressLabel, { color: theme.textSecondary }]}>Degree Progress</Text>
                    <Text style={[styles.progressLabel, { color: theme.textSecondary }]}>
                      {item.completedCredits} / {item.requiredCredits} cr
                    </Text>
                  </View>
                  <ProgressBar
                    progress={progress}
                    width={undefined}
                    height={8}
                    completedColor={theme.primary}
                    remainingColor={theme.border}
                  />
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

function StatPill({ label, value, theme, primary }: { label: string; value: string; theme: any; primary?: boolean }) {
  return (
    <View style={[
      styles.statPill,
      { backgroundColor: primary ? `${theme.primary}18` : theme.card, borderColor: primary ? `${theme.primary}55` : theme.border },
    ]}>
      <Text style={[styles.statValue, { color: primary ? theme.primary : theme.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },

  header: { marginBottom: 14 },
  headerTitle: { fontSize: 26, fontWeight: "700" },
  headerSub: { fontSize: 14, marginTop: 2 },

  statsRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  statPill: {
    flex: 1, borderWidth: 1, borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 10, alignItems: "center",
  },
  statValue: { fontSize: 18, fontWeight: "700" },
  statLabel: { fontSize: 11, marginTop: 2 },

  tabBar: {
    flexDirection: "row", borderWidth: 1, borderRadius: 12,
    overflow: "hidden", marginBottom: 10,
  },
  tab: { flex: 1, paddingVertical: 9, alignItems: "center" },
  tabText: { fontSize: 13, fontWeight: "600" },

  searchBar: {
    flexDirection: "row", alignItems: "center", gap: 8,
    borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10,
    marginBottom: 8,
  },
  searchInput: { flex: 1, fontSize: 14 },
  resultCount: { fontSize: 12, marginBottom: 8 },

  card: {
    borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 12, overflow: "hidden",
  },
  assignedAccent: { position: "absolute", left: 0, top: 0, bottom: 0, width: 4 },

  cardRow: { flexDirection: "row", alignItems: "flex-start" },
  avatar: {
    width: 50, height: 50, borderRadius: 25,
    alignItems: "center", justifyContent: "center",
  },
  avatarText: { fontWeight: "700", fontSize: 16 },
  name: { fontSize: 16, fontWeight: "700" },
  meta: { fontSize: 13, marginTop: 2 },

  advisorRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  advisorText: { fontSize: 12, fontWeight: "600", flexShrink: 1 },

  progressSection: { marginTop: 12 },
  progressLabelRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  progressLabel: { fontSize: 12 },

  centerState: { paddingTop: 60, alignItems: "center" },
  emptyTitle: { fontSize: 16, fontWeight: "600" },
});
