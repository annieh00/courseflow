import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
  Modal,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import Ionicons from "@expo/vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "../../../components/ThemeContext";
import { useAuth } from "../../../auth/AuthContext";
import ProgressBar from "../../../components/ProgressBar";

const API_BASE = (process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8080/api").replace(/\/api\/?$/, "");

// ─── Types ─────────────────────────────────────────────────────────────────

type Student = {
  id: number;
  netid: string;
  fullName: string;
  firstName: string;
  lastName: string;
  email: string;
  completedCredits: number;
  requiredCredits: number;
  isAdvisee: boolean;
  hasAdvisor: boolean;
  advisorName: string | null;
  advisorNetid: string | null;
};

type TabFilter = "all" | "advisees" | "unassigned";

// ─── Helpers ───────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return (name ?? "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("");
}

function getProgress(s: Student): number {
  if (!s.requiredCredits) return 0;
  return Math.min(1, s.completedCredits / s.requiredCredits);
}

async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem("accessToken");
}

function confirm(title: string, message: string): Promise<boolean> {
  if (Platform.OS === "web") {
    return Promise.resolve(window.confirm(`${title}\n\n${message}`));
  }
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
      { text: "Confirm", style: "destructive", onPress: () => resolve(true) },
    ]);
  });
}

// ─── Component ─────────────────────────────────────────────────────────────

export default function StudentsScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();

  const advisorNetid = (user as any)?.userId ?? (user as any)?.netid ?? "";

  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<TabFilter>("all");
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // Note modal state
  const [noteModal, setNoteModal] = useState<{ student: Student } | null>(null);
  const [noteText, setNoteText] = useState("");
  const [noteType, setNoteType] = useState("General");
  const [savingNote, setSavingNote] = useState(false);

  // ── Fetch ─────────────────────────────────────────────────────────────

  const loadStudents = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/api/advisor/students/browse`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(await res.text());
      const data: Student[] = await res.json();
      setStudents(data);
    } catch (err) {
      console.error("[STUDENTS] Load error:", err);
      Alert.alert("Error", "Could not load students.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadStudents(); }, [loadStudents]));

  // ── Actions ───────────────────────────────────────────────────────────

  const handleAdd = async (student: Student) => {
    setActionLoading(student.id);
    try {
      const token = await getToken();
      const res = await fetch(
        `${API_BASE}/api/advisor/${encodeURIComponent(advisorNetid)}/advisees`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ studentNetid: student.netid }),
        }
      );
      if (res.ok) {
        setStudents((prev) =>
          prev.map((s) => s.id === student.id ? { ...s, isAdvisee: true } : s)
        );
      } else {
        Alert.alert("Error", await res.text());
      }
    } catch {
      Alert.alert("Error", "Could not reach the server.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemove = async (student: Student) => {
    const ok = await confirm(
      "Remove Advisee",
      `Remove ${student.fullName} from your advisees?`
    );
    if (!ok) return;

    setActionLoading(student.id);
    try {
      const token = await getToken();
      const res = await fetch(
        `${API_BASE}/api/advisor/${encodeURIComponent(advisorNetid)}/advisees/${encodeURIComponent(student.netid)}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.ok) {
        setStudents((prev) =>
          prev.map((s) => s.id === student.id ? { ...s, isAdvisee: false } : s)
        );
      } else {
        Alert.alert("Error", await res.text());
      }
    } catch {
      Alert.alert("Error", "Could not reach the server.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewProfile = (student: Student) => {
    router.push({
      pathname: "/(advisor)/advisees/advisee-details",
      params: {
        netid: student.netid,
        name: student.fullName,
        mode: "profile",
        from: "students",
        creditsCompleted: String(student.completedCredits),
        creditsRequired: String(student.requiredCredits),
      },
    });
  };

  const openNoteModal = (student: Student) => {
    setNoteModal({ student });
    setNoteText("");
    setNoteType("General");
  };

  const handleSaveNote = async () => {
    if (!noteModal) return;
    if (!noteText.trim()) {
      Alert.alert("Empty note", "Please enter some content.");
      return;
    }
    setSavingNote(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/api/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          advisorNetid,
          studentNetid: noteModal.student.netid,
          content: noteText.trim(),
          noteType,
        }),
      });
      if (res.ok) {
        setNoteModal(null);
      } else {
        Alert.alert("Error", await res.text());
      }
    } catch {
      Alert.alert("Error", "Could not reach the server.");
    } finally {
      setSavingNote(false);
    }
  };

  // ── Derived data ──────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    let list = students;
    if (tab === "advisees") list = list.filter((s) => s.isAdvisee);
    else if (tab === "unassigned") list = list.filter((s) => !s.isAdvisee);

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((s) =>
        [s.fullName, s.netid, s.email].join(" ").toLowerCase().includes(q)
      );
    }

    // Sort: advisees first, then alphabetically
    return [...list].sort((a, b) => {
      if (a.isAdvisee !== b.isAdvisee) return a.isAdvisee ? -1 : 1;
      return (a.fullName ?? "").localeCompare(b.fullName ?? "");
    });
  }, [students, tab, search]);

  const adviseeCount = useMemo(() => students.filter((s) => s.isAdvisee).length, [students]);

  // ── Render item ───────────────────────────────────────────────────────

  const renderItem = ({ item }: { item: Student }) => {
    const progress = getProgress(item);
    const busy = actionLoading === item.id;

    return (
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        {item.isAdvisee && (
          <View style={[styles.adviseeAccent, { backgroundColor: theme.primary }]} />
        )}

        <View style={styles.cardRow}>
          {/* Avatar */}
          <View style={[
            styles.avatar,
            { backgroundColor: item.isAdvisee ? theme.primary : theme.border },
          ]}>
            <Text style={[styles.avatarText, { color: item.isAdvisee ? theme.background : theme.text }]}>
              {getInitials(item.fullName)}
            </Text>
          </View>

          {/* Info */}
          <View style={{ flex: 1, marginLeft: 12 }}>
            <View style={styles.nameRow}>
              <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
                {item.fullName || item.netid}
              </Text>
              {item.isAdvisee && (
                <View style={[styles.adviseeBadge, { backgroundColor: `${theme.primary}22`, borderColor: `${theme.primary}55` }]}>
                  <Text style={[styles.adviseeBadgeText, { color: theme.primary }]}>My Advisee</Text>
                </View>
              )}
            </View>
            <Text style={[styles.meta, { color: theme.textSecondary }]}>{item.netid}</Text>
            <Text style={[styles.meta, { color: theme.textSecondary }]} numberOfLines={1}>{item.email}</Text>
            {item.hasAdvisor && !item.isAdvisee && (
              <View style={[styles.advisorTagRow, { backgroundColor: `${theme.textSecondary}18`, borderColor: `${theme.textSecondary}33` }]}>
                <Ionicons name="person-circle-outline" size={13} color={theme.textSecondary} />
                <Text style={[styles.advisorTagLabel, { color: theme.textSecondary }]}>Advisor:</Text>
                <Text style={[styles.advisorTagValue, { color: theme.text }]} numberOfLines={1}>
                  {item.advisorName ?? item.advisorNetid}
                </Text>
              </View>
            )}
            {item.isAdvisee && (
              <View style={[styles.advisorTagRow, { backgroundColor: `${theme.primary}15`, borderColor: `${theme.primary}40` }]}>
                <Ionicons name="person-circle-outline" size={13} color={theme.primary} />
                <Text style={[styles.advisorTagLabel, { color: theme.primary }]}>Advisor:</Text>
                <Text style={[styles.advisorTagValue, { color: theme.primary }]} numberOfLines={1}>You</Text>
              </View>
            )}
          </View>
        </View>

        {/* Progress */}
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

        {/* Actions */}
        <View style={styles.actionRow}>
          <ActionBtn
            icon="person-outline"
            label="View Profile"
            onPress={() => handleViewProfile(item)}
            theme={theme}
          />
          {item.isAdvisee ? (
            <ActionBtn
              icon="person-remove-outline"
              label="Remove Advisee"
              onPress={() => handleRemove(item)}
              theme={theme}
              danger
              loading={busy}
            />
          ) : (
            <ActionBtn
              icon="person-add-outline"
              label="Add as Advisee"
              onPress={() => handleAdd(item)}
              theme={theme}
              primary
              loading={busy}
              disabled={item.hasAdvisor}
              disabledLabel={item.hasAdvisor ? "Has Advisor" : undefined}
            />
          )}
        </View>
      </View>
    );
  };

  // ── Main render ───────────────────────────────────────────────────────

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>

      {/* Add Note Modal */}
      <Modal
        visible={noteModal !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setNoteModal(null)}
      >
        <View style={styles.overlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Add Note</Text>
            {noteModal && (
              <Text style={[styles.modalSub, { color: theme.textSecondary }]}>
                For {noteModal.student.fullName}
              </Text>
            )}

            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Type</Text>
            <View style={styles.typeRow}>
              {["General", "Academic", "Warning"].map((t) => (
                <TouchableOpacity
                  key={t}
                  onPress={() => setNoteType(t)}
                  style={[
                    styles.typeChip,
                    { borderColor: noteType === t ? theme.primary : theme.border },
                    noteType === t && { backgroundColor: `${theme.primary}18` },
                  ]}
                >
                  <Text style={[styles.typeChipText, { color: noteType === t ? theme.primary : theme.textSecondary }]}>
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Content</Text>
            <TextInput
              style={[styles.noteInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
              value={noteText}
              onChangeText={setNoteText}
              placeholder="Enter note content..."
              placeholderTextColor={theme.textSecondary}
              multiline
              maxLength={255}
            />
            <Text style={[{ color: theme.textSecondary, fontSize: 11, textAlign: "right" }]}>
              {noteText.length}/255
            </Text>

            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={[styles.modalBtn, { borderColor: theme.border, backgroundColor: theme.background }]}
                onPress={() => setNoteModal(null)}
              >
                <Text style={{ color: theme.text, fontWeight: "600" }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: theme.primary, borderColor: theme.primary }]}
                onPress={handleSaveNote}
                disabled={savingNote}
              >
                {savingNote
                  ? <ActivityIndicator size="small" color={theme.background} />
                  : <Text style={{ color: theme.background, fontWeight: "700" }}>Save</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Students</Text>
          <Text style={[styles.headerSub, { color: theme.textSecondary }]}>
            Browse and manage all registered students
          </Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatPill label="Total" value={String(students.length)} theme={theme} />
          <StatPill label="My Advisees" value={String(adviseeCount)} theme={theme} primary />
          <StatPill label="Unassigned" value={String(students.length - adviseeCount)} theme={theme} />
        </View>

        {/* Tabs */}
        <View style={[styles.tabBar, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {([
            { key: "all", label: "All" },
            { key: "advisees", label: "My Advisees" },
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
            placeholder="Search by name, NetID, or email…"
            placeholderTextColor={theme.textSecondary}
            style={[styles.searchInput, { color: theme.text }]}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
              <Ionicons name="close-circle" size={16} color={theme.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Results count */}
        {!loading && (
          <Text style={[styles.resultCount, { color: theme.textSecondary }]}>
            {filtered.length} student{filtered.length !== 1 ? "s" : ""}
            {search ? ` matching "${search}"` : ""}
          </Text>
        )}

        {/* List */}
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
          filtered.map((item) => (
            <View key={item.id}>{renderItem({ item })}</View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function ActionBtn({
  icon, label, onPress, theme, primary, danger, loading, disabled, disabledLabel,
}: {
  icon: string; label: string; onPress: () => void; theme: any;
  primary?: boolean; danger?: boolean; loading?: boolean;
  disabled?: boolean; disabledLabel?: string;
}) {
  const isDisabled = loading || disabled;
  const bg = isDisabled ? theme.background : primary ? theme.primary : danger ? "transparent" : theme.background;
  const border = isDisabled ? theme.border : primary ? theme.primary : danger ? theme.danger ?? "#EF4444" : theme.border;
  const textColor = isDisabled ? theme.textSecondary : primary ? theme.background : danger ? (theme.danger ?? "#EF4444") : theme.text;
  const iconColor = isDisabled ? theme.textSecondary : primary ? theme.background : danger ? (theme.danger ?? "#EF4444") : theme.primary;

  return (
    <TouchableOpacity
      style={[styles.actionBtn, { backgroundColor: bg, borderColor: border, opacity: isDisabled ? 0.55 : 1 }]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.85}
    >
      {loading
        ? <ActivityIndicator size="small" color={iconColor} />
        : <Ionicons name={icon as any} size={14} color={iconColor} />
      }
      <Text style={[styles.actionBtnText, { color: textColor }]}>
        {disabledLabel && disabled ? disabledLabel : label}
      </Text>
    </TouchableOpacity>
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

// ─── Styles ──────────────────────────────────────────────────────────────────

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
  adviseeAccent: { position: "absolute", left: 0, top: 0, bottom: 0, width: 4 },

  cardRow: { flexDirection: "row", alignItems: "flex-start" },
  avatar: {
    width: 50, height: 50, borderRadius: 25,
    alignItems: "center", justifyContent: "center",
  },
  avatarText: { fontWeight: "700", fontSize: 16 },

  nameRow: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  name: { fontSize: 16, fontWeight: "700" },
  meta: { fontSize: 13, marginTop: 2 },

  adviseeBadge: {
    borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2,
  },
  adviseeBadgeText: { fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.4 },

  advisorTagRow: {
    flexDirection: "row", alignItems: "center", gap: 4, marginTop: 5,
    borderWidth: 1, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 4,
    alignSelf: "flex-start",
  },
  advisorTagLabel: { fontSize: 12, fontWeight: "600" },
  advisorTagValue: { fontSize: 12, fontWeight: "500", flexShrink: 1 },

  progressSection: { marginTop: 12 },
  progressLabelRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  progressLabel: { fontSize: 12 },

  actionRow: { flexDirection: "row", gap: 8, marginTop: 12 },
  actionBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 5, borderWidth: 1, borderRadius: 10, paddingVertical: 8,
  },
  actionBtnText: { fontSize: 12, fontWeight: "600" },

  centerState: { paddingTop: 60, alignItems: "center" },
  emptyTitle: { fontSize: 16, fontWeight: "600" },

  // Modal
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center", padding: 20 },
  modalCard: { width: "100%", maxWidth: 420, borderWidth: 1, borderRadius: 16, padding: 20, gap: 12 },
  modalTitle: { fontSize: 18, fontWeight: "700" },
  modalSub: { fontSize: 13, marginTop: -6 },
  fieldLabel: { fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.4 },
  typeRow: { flexDirection: "row", gap: 8 },
  typeChip: { flex: 1, borderWidth: 1, borderRadius: 8, paddingVertical: 7, alignItems: "center" },
  typeChipText: { fontSize: 12, fontWeight: "600" },
  noteInput: {
    borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 14, minHeight: 90, textAlignVertical: "top",
  },
  modalBtns: { flexDirection: "row", gap: 10 },
  modalBtn: {
    flex: 1, borderWidth: 1, borderRadius: 10, paddingVertical: 12,
    alignItems: "center", justifyContent: "center",
  },
});
