import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "../../../components/ThemeContext";

type PlanStatus = "approved" | "needs_changes" | "pending";

type PlanSummary = {
  id: string;
  name: string;
  netid: string;
  status: PlanStatus;
};

const MOCK_PLANS: PlanSummary[] = [
  { id: "1", name: "Sarah Johnson", netid: "sjohnson", status: "pending" },
  { id: "2", name: "Kevin Lee", netid: "klee", status: "needs_changes" },
  { id: "3", name: "Maria Garcia", netid: "mgarcia", status: "approved" },
];

function statusLabel(s: PlanStatus) {
  switch (s) {
    case "approved":
      return "Approved";
    case "needs_changes":
      return "Needs Changes";
    case "pending":
    default:
      return "Pending Review";
  }
}

type Filter = "all" | PlanStatus;

function StatusPill({
  status,
}: {
  status: PlanStatus;
}) {
  let bg = "rgba(148, 163, 184, 0.15)";
  let border = "rgba(148, 163, 184, 0.6)";
  let text = "#64748B";

  if (status === "approved") {
    bg = "rgba(16, 185, 129, 0.15)";
    border = "rgba(16, 185, 129, 0.6)";
    text = "#059669";
  } else if (status === "needs_changes") {
    bg = "rgba(239, 68, 68, 0.15)";
    border = "rgba(239, 68, 68, 0.6)";
    text = "#DC2626";
  } else if (status === "pending") {
    bg = "rgba(234, 179, 8, 0.15)";
    border = "rgba(234, 179, 8, 0.6)";
    text = "#CA8A04";
  }

  return (
    <View style={[styles.statusPill, { backgroundColor: bg, borderColor: border }]}>
      <Text style={[styles.statusText, { color: text }]}>
        {statusLabel(status)}
      </Text>
    </View>
  );
}

export default function PlansScreen() {
  const { theme } = useTheme();
  const router = useRouter();

  const [filter, setFilter] = useState<Filter>("pending");

  // counts for the summary banner
  const { total, approved, needsChanges, pending } = useMemo(() => {
    const total = MOCK_PLANS.length;
    const approved = MOCK_PLANS.filter((p) => p.status === "approved").length;
    const needsChanges = MOCK_PLANS.filter((p) => p.status === "needs_changes").length;
    const pending = MOCK_PLANS.filter((p) => p.status === "pending").length;
    return { total, approved, needsChanges, pending };
  }, []);

  const filteredPlans = useMemo(() => {
    if (filter === "all") return MOCK_PLANS;
    return MOCK_PLANS.filter((p) => p.status === filter);
  }, [filter]);

const handleOpenPlan = (item: PlanSummary) => {
  router.push({
    pathname: "/advisees/advisee-details",
    params: {
      netid: item.netid,
      name: item.name,
      mode: "plan",
      from: "plans",              // 👈 add this
    },
  });
};


  const renderItem = ({ item }: { item: PlanSummary }) => (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: theme.card,
          borderColor: theme.border,
          shadowColor: "#000",
        },
      ]}
      activeOpacity={0.9}
      onPress={() => handleOpenPlan(item)}
    >
      {/* Top row: name + netid + status pill */}
      <View style={styles.cardHeaderRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.name, { color: theme.text }]}>{item.name}</Text>
          <Text style={{ color: theme.muted, marginTop: 2 }}>
            {item.netid}@iastate.edu
          </Text>
        </View>
        <StatusPill status={item.status} />
      </View>

      {/* Meta row */}
      <View style={{ marginTop: 10 }}>
        <Text style={{ color: theme.muted, fontSize: 12 }}>
          Tap to review this plan and leave feedback.
        </Text>
      </View>
    </TouchableOpacity>
  );

  const filters: { key: Filter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "pending", label: "Pending" },
    { key: "needs_changes", label: "Needs Changes" },
    { key: "approved", label: "Approved" },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <Text style={[styles.header, { color: theme.text }]}>Plan Review</Text>
      <Text style={{ color: theme.muted, marginBottom: 12 }}>
        Prioritize pending and “needs changes” plans to keep students on track.
      </Text>

      {/* Summary banner */}
      <View
        style={[
          styles.summaryCard,
          { backgroundColor: theme.card, borderColor: theme.border },
        ]}
      >
        <Text style={[styles.summaryLine, { color: theme.text }]}>
          {total} plans · {approved} approved · {needsChanges} need changes · {pending} pending
        </Text>
        <Text style={{ color: theme.muted, fontSize: 12, marginTop: 4 }}>
          Focus on pending and needs-changes plans first.
        </Text>
      </View>

      {/* Filter chips */}
      <View style={styles.filterRow}>
        {filters.map((f) => {
          const isActive = filter === f.key;
          return (
            <TouchableOpacity
              key={f.key}
              onPress={() => setFilter(f.key)}
              style={[
                styles.filterChip,
                {
                  borderColor: isActive ? theme.primary : theme.border,
                  backgroundColor: isActive ? theme.primary : "transparent",
                },
              ]}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.filterChipText,
                  {
                    color: isActive ? theme.background : theme.text,
                  },
                ]}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* List */}
      {filteredPlans.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>
            No plans match this filter
          </Text>
          <Text style={{ color: theme.muted, textAlign: "center", marginTop: 4 }}>
            Try switching filters, or come back once students submit more plans
            for review.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredPlans}
          keyExtractor={(p) => p.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingVertical: 12 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { fontSize: 22, fontWeight: "700", marginBottom: 4 },

  summaryCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  summaryLine: {
    fontSize: 14,
    fontWeight: "600",
  },

  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
    marginTop: 4,
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: "600",
  },

  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    // subtle shadow (mostly visible on mobile)
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    columnGap: 10,
  },
  name: { fontSize: 16, fontWeight: "600" },

  statusPill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },

  emptyState: {
    marginTop: 32,
    alignItems: "center",
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
});
