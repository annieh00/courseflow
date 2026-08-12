import React, { useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useTheme } from "../../../../components/ThemeContext";
import ProgressBar from "../../../../components/ProgressBar";

const API_BASE =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

type Advisee = {
  id: string;
  name: string;
  netid: string;
  major: string;
  minor?: string;
  classStanding: string;
  gpa?: number;
  creditsCompleted: number;
  creditsRequired: number;
  photoUrl?: string | null;
  graduationYear?: number | null;
};

// fallback demo data if backend fails
const MOCK_ADVISEES: Advisee[] = [
  {
    id: "1",
    name: "Sarah Johnson",
    netid: "sjohnson",
    major: "Software Engineering",
    minor: "Data Science",
    classStanding: "Junior",
    gpa: 3.72,
    creditsCompleted: 84,
    creditsRequired: 128,
    graduationYear: 2026,
  },
  {
    id: "2",
    name: "Kevin Lee",
    netid: "klee",
    major: "Computer Science",
    minor: "Cybersecurity",
    classStanding: "Sophomore",
    gpa: 2.35,
    creditsCompleted: 46,
    creditsRequired: 128,
    graduationYear: 2027,
  },
  {
    id: "3",
    name: "Maria Garcia",
    netid: "mgarcia",
    major: "Cybersecurity Engineering",
    classStanding: "Senior",
    gpa: 1.94,
    creditsCompleted: 115,
    creditsRequired: 128,
    graduationYear: 2025,
  },
];

// ---- helpers ----

function getProgress(a: Advisee): number {
  return a.creditsRequired > 0 ? a.creditsCompleted / a.creditsRequired : 0;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("");
}

export default function AdviseesScreen() {
  const { theme } = useTheme();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [advisees, setAdvisees] = useState<Advisee[]>([]);
  const [loading, setLoading] = useState(false);

  // 🔄 Load advisees from backend
  const loadAdvisees = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/advisors/me/advisees`, {
        credentials: "include",
      });

      if (!res.ok) {
        console.warn("Failed to fetch advisees, using mock data.");
        setAdvisees(MOCK_ADVISEES);
        return;
      }

      const data: Advisee[] = await res.json();
      setAdvisees(data);
    } catch (err) {
      console.error("Error loading advisees:", err);
      setAdvisees(MOCK_ADVISEES);
    } finally {
      setLoading(false);
    }
  }, []);

  // initial load + refetch whenever this screen regains focus
  useFocusEffect(
    useCallback(() => {
      loadAdvisees();
    }, [loadAdvisees])
  );

  // ---- derived stats for banner ----
  const stats = useMemo(() => {
    const total = advisees.length;
    let gpaSum = 0;
    let gpaCount = 0;
    let progressSum = 0;
    let progressCount = 0;
    let highGpaCount = 0; // GPA ≥ 3.0
    let lowGpaCount = 0; // GPA < 2.0
    let nearGradCount = 0; // progress ≥ 80%

    for (const a of advisees) {
      if (typeof a.gpa === "number") {
        gpaSum += a.gpa;
        gpaCount++;
        if (a.gpa >= 3.0) highGpaCount++;
        if (a.gpa < 2.0) lowGpaCount++;
      }

      const p = getProgress(a);
      if (!Number.isNaN(p)) {
        progressSum += p;
        progressCount++;
        if (p >= 0.8) nearGradCount++;
      }
    }

    const avgGpa = gpaCount ? gpaSum / gpaCount : null;
    const avgProgress = progressCount ? progressSum / progressCount : 0;

    return {
      total,
      avgGpa,
      avgProgress,
      highGpaCount,
      lowGpaCount,
      nearGradCount,
    };
  }, [advisees]);

  // ---- filtered advisees for search ----
  const filteredAdvisees = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return advisees;

    return advisees.filter((a) => {
      const haystack = [
        a.name,
        a.netid,
        a.major,
        a.minor ?? "",
        a.classStanding,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [searchQuery, advisees]);

const handleAction = (
  advisee: Advisee,
  mode: "profile" | "plan" | "message"
) => {
  router.push({
    pathname: "/advisees/advisee-details",
    params: {
      netid: advisee.netid,
      name: advisee.name,
      mode,
      from: "advisees",
      photoUrl: advisee.photoUrl ?? "",
      graduationYear: advisee.graduationYear
        ? String(advisee.graduationYear)
        : "",

      // ✅ NEW: pass everything else
      major: advisee.major,
      minor: advisee.minor ?? "",
      classStanding: advisee.classStanding,
      gpa:
        typeof advisee.gpa === "number" ? advisee.gpa.toString() : "",
      creditsCompleted: advisee.creditsCompleted.toString(),
      creditsRequired: advisee.creditsRequired.toString(),
    },
  });
};



  const handleAddPress = () => {
    const existingNetids = advisees
      .map((a) => a.netid)
      .filter((n) => typeof n === "string" && n.length > 0);

    router.push({
      pathname: "/advisees/add-advisee",
      params: {
        // pass current advisee net-ids into Add screen so it can hide them
        existingNetids: JSON.stringify(existingNetids),
      },
    });
  };

  const renderItem = ({ item }: { item: Advisee }) => {
    const progress = getProgress(item);

    return (
      <View
        style={[
          styles.card,
          { backgroundColor: theme.card, borderColor: theme.border },
        ]}
      >
        {/* thin accent bar at top */}
        <View
          style={[
            styles.riskBar,
            { backgroundColor: theme.primary, opacity: 0.9 },
          ]}
        />

        {/* Top: avatar + basic info */}
        <View style={styles.row}>
          {/* Avatar */}
          {item.photoUrl ? (
            <Image
              source={{ uri: item.photoUrl }}
              style={styles.avatar}
              resizeMode="cover"
            />
          ) : (
            <View
              style={[
                styles.avatar,
                { backgroundColor: theme.primary ?? "#C8102E" },
              ]}
            >
              <Text style={styles.avatarText}>
                {getInitials(item.name || item.netid)}
              </Text>
            </View>
          )}

          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={[styles.name, { color: theme.text }]}>
              {item.name}
            </Text>
            <Text style={{ color: theme.muted, marginTop: 2 }}>
              {item.netid}
            </Text>
            <Text style={{ color: theme.muted, marginTop: 2 }}>
              {item.classStanding}
            </Text>
            <Text style={{ color: theme.muted, marginTop: 2 }}>
              {item.major}
            </Text>
            {item.minor && (
              <Text style={{ color: theme.muted, marginTop: 2 }}>
                Minor: {item.minor}
              </Text>
            )}
          </View>

          {/* GPA pill (if present) */}
          <View style={{ alignItems: "flex-end" }}>
            {typeof item.gpa === "number" && (
              <View style={styles.gpaPill}>
                <Text style={[styles.gpaLabel, { color: theme.muted }]}>
                  GPA
                </Text>
                <Text style={[styles.gpaValueSmall, { color: theme.text }]}>
                  {item.gpa.toFixed(2)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Progress toward degree */}
        <View style={{ marginTop: 10 }}>
          <Text style={{ color: theme.muted, fontSize: 12, marginBottom: 4 }}>
            Degree progress{"\n"}
            {item.creditsCompleted}/{item.creditsRequired} credits
          </Text>

          <ProgressBar
            progress={progress}
            width={undefined}
            height={18}
            completedColor={theme.primary}
            remainingColor="#FFC72C"
          />
          <Text
            style={{
              color: theme.muted,
              fontSize: 12,
              marginTop: 4,
            }}
          >
            {Math.round(progress * 100)}% complete
          </Text>
        </View>

        {/* Actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionButton, { borderColor: theme.primary }]}
            activeOpacity={0.85}
            onPress={() => handleAction(item, "profile")}
          >
            <Text style={[styles.actionText, { color: theme.primary }]}>
              View Profile
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { borderColor: theme.primary }]}
            activeOpacity={0.85}
            onPress={() => handleAction(item, "plan")}
          >
            <Text style={[styles.actionText, { color: theme.primary }]}>
              View Plan
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton,
              { borderColor: theme.primary, backgroundColor: theme.primary },
            ]}
            activeOpacity={0.9}
            onPress={() => handleAction(item, "message")}
          >
            <Text
              style={[
                styles.actionText,
                { color: theme.background, fontWeight: "700" },
              ]}
            >
              Send Message
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const listEmptyComponent = (
    <View style={styles.emptyState}>
      <Text style={[styles.emptyTitle, { color: theme.text }]}>
        {loading ? "Loading advisees..." : "No advisees found"}
      </Text>
      {!loading && (
        <Text
          style={{ color: theme.muted, textAlign: "center", marginTop: 4 }}
        >
          Try adjusting your search — you can search by name, Net-ID, major, or
          class standing.
        </Text>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* 🔍 Search at the very top */}
      <View
        style={[
          styles.searchContainer,
          { backgroundColor: theme.card, borderColor: theme.border },
        ]}
      >
        <Ionicons
          name="search-outline"
          size={18}
          color={theme.muted}
          style={{ marginRight: 6 }}
        />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search by name, Net-ID, major..."
          placeholderTextColor={theme.muted}
          style={[styles.searchInput, { color: theme.text }]}
          autoCorrect={false}
        />
      </View>

      {/* Quick stats / mini “dashboard” */}
      <View
        style={[
          styles.statsCard,
          { backgroundColor: theme.card, borderColor: theme.border },
        ]}
      >
        <Text style={[styles.statsTitle, { color: theme.text }]}>
          My Advisee Overview
        </Text>

        <Text style={{ color: theme.muted, marginBottom: 4 }}>
          {stats.total} advisees{"\n"}
          Avg GPA:{" "}
          {typeof stats.avgGpa === "number" ? stats.avgGpa.toFixed(2) : "—"}
          {"\n"}
          Avg degree progress: {Math.round(stats.avgProgress * 100)}%
        </Text>

        <View style={styles.overviewRow}>
          <View style={styles.overviewItem}>
            <Text style={[styles.overviewLabel, { color: theme.muted }]}>
              GPA ≥ 3.0
            </Text>
            <Text style={[styles.overviewValue, { color: theme.text }]}>
              {stats.highGpaCount}
            </Text>
          </View>
          <View style={styles.overviewItem}>
            <Text style={[styles.overviewLabel, { color: theme.muted }]}>
              GPA &lt; 2.0
            </Text>
            <Text style={[styles.overviewValue, { color: theme.text }]}>
              {stats.lowGpaCount}
            </Text>
          </View>
          <View style={styles.overviewItem}>
            <Text style={[styles.overviewLabel, { color: theme.muted }]}>
              Near graduation
            </Text>
            <Text style={[styles.overviewValue, { color: theme.text }]}>
              {stats.nearGradCount}
            </Text>
          </View>
        </View>
      </View>

      {/* Header row with Add button */}
      <View style={styles.headerRow}>
        <Text style={[styles.header, { color: theme.text }]}>My Advisees</Text>
        <TouchableOpacity
          style={[
            styles.addButton,
            { borderColor: theme.primary, backgroundColor: theme.card },
          ]}
          onPress={handleAddPress}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={18} color={theme.primary} />
          <Text
            style={{
              marginLeft: 4,
              color: theme.primary,
              fontWeight: "600",
              fontSize: 13,
            }}
          >
            Add
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={{ color: theme.muted, marginBottom: 12 }}>
        Tap an action to review a student’s plan, profile, or send a quick
        message.
      </Text>
      <FlatList
        data={filteredAdvisees}
        keyExtractor={(a) => a.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingVertical: 8 }}
        ListEmptyComponent={listEmptyComponent}
        keyboardShouldPersistTaps="handled"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  header: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 4,
  },

  addButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  // quick stats card
  statsCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },

  overviewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  overviewItem: {
    flex: 1,
    alignItems: "flex-start",
  },
  overviewLabel: {
    fontSize: 12,
  },
  overviewValue: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 2,
  },

  // search
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },

  // cards
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    overflow: "hidden",
  },
  riskBar: {
    height: 4,
    borderRadius: 999,
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  name: { fontSize: 16, fontWeight: "600" },

  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "white",
    fontWeight: "700",
    fontSize: 16,
  },

  gpaPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 6,
  },
  gpaLabel: { fontSize: 10, textTransform: "uppercase" },
  gpaValueSmall: {
    fontSize: 13,
    fontWeight: "700",
  },

  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    gap: 8,
  },
  actionButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  actionText: {
    fontSize: 13,
    fontWeight: "600",
  },

  emptyState: {
    marginTop: 28,
    alignItems: "center",
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
});
