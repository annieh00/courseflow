import React, { useMemo, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { useRouter } from "expo-router";
import { Swipeable } from "react-native-gesture-handler";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useTheme } from "../../../components/ThemeContext";

type Slot = {
  id: string;
  date: string; // "Oct 15, 2025"
  time: string; // "2:00–2:30 PM"
  student?: string;
  netid?: string;
};

const MOCK_SLOTS: Slot[] = [
  {
    id: "1",
    date: "Oct 15, 2025",
    time: "2:00–2:30 PM",
    student: "Sarah Johnson",
    netid: "sjohnson",
  },
  {
    id: "2",
    date: "Oct 15, 2025",
    time: "2:30–3:00 PM",
    student: "Kevin Lee",
    netid: "klee",
  },
  {
    id: "3",
    date: "Oct 16, 2025",
    time: "10:00–10:30 AM",
    student: undefined,
    netid: undefined,
  },
  {
    id: "4",
    date: "Oct 16, 2025",
    time: "10:30–11:00 AM",
    student: "Maria Garcia",
    netid: "mgarcia",
  },
];

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type SectionData = {
  title: string; // date
  data: Slot[];
};

export default function AdvisorSchedule() {
  const { theme } = useTheme();
  const router = useRouter();

  const [selectedDate, setSelectedDate] = useState<string | "all">("all");
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>(
    {}
  );

  const allDates = useMemo(() => {
    const unique = Array.from(new Set(MOCK_SLOTS.map((s) => s.date)));
    return unique;
  }, []);

  // initialize expandedDates: all open by default
  useEffect(() => {
    const init: Record<string, boolean> = {};
    allDates.forEach((d) => {
      init[d] = true;
    });
    setExpandedDates(init);
  }, [allDates]);

  const filteredSections: SectionData[] = useMemo(() => {
    const slots =
      selectedDate === "all"
        ? MOCK_SLOTS
        : MOCK_SLOTS.filter((s) => s.date === selectedDate);

    const byDate: Record<string, Slot[]> = {};
    for (const slot of slots) {
      if (!byDate[slot.date]) byDate[slot.date] = [];
      byDate[slot.date].push(slot);
    }

    return Object.keys(byDate)
      .sort()
      .map((date) => ({
        title: date,
        data: byDate[date],
      }));
  }, [selectedDate]);

  const toggleDate = (date: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedDates((prev) => ({
      ...prev,
      [date]: !prev[date],
    }));
  };

  const handleSlotPress = (slot: Slot) => {
    if (!slot.student || !slot.netid) return;

    router.push({
      pathname: "/advisees/advisee-details",
      params: {
        netid: slot.netid,
        name: slot.student,
        mode: "profile",
        from: "schedule", // 👈 so AdviseeDetails can know we came from here
      },
    });
  };

  const renderRightActions = (slot: Slot) => {
    return (
      <View className="swipeActionsContainer" style={styles.swipeActionsContainer}>
        <TouchableOpacity
          style={[styles.swipeAction, { backgroundColor: "#EF4444" }]}
          onPress={() => {
            console.log("Delete slot", slot.id);
          }}
        >
          <Ionicons name="trash-outline" color="#fff" size={18} />
          <Text style={styles.swipeActionText}>Delete</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.swipeAction, { backgroundColor: "#6B7280" }]}
          onPress={() => {
            console.log("Mark unavailable", slot.id);
          }}
        >
          <Ionicons name="remove-circle-outline" color="#fff" size={18} />
          <Text style={styles.swipeActionText}>Block</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderSlot = ({
    item,
    section,
  }: {
    item: Slot;
    section: SectionData;
  }) => {
    const isExpanded = expandedDates[section.title];
    if (!isExpanded) return null;

    const isBooked = !!item.student;

    return (
      <Swipeable
        renderRightActions={() => renderRightActions(item)}
        overshootRight={false}
      >
        <TouchableOpacity
          style={[
            styles.card,
            { backgroundColor: theme.card, borderColor: theme.border },
          ]}
          activeOpacity={isBooked ? 0.85 : 1}
          onPress={() => isBooked && handleSlotPress(item)}
        >
          <View style={styles.cardTopRow}>
            <Text style={[styles.time, { color: theme.text }]}>
              {item.time}
            </Text>
            <View
              style={[
                styles.slotStatusPill,
                {
                  backgroundColor: isBooked
                    ? "rgba(56, 189, 248, 0.12)"
                    : "rgba(34, 197, 94, 0.10)",
                  borderColor: isBooked
                    ? "rgba(56, 189, 248, 0.6)"
                    : "rgba(34, 197, 94, 0.4)",
                },
              ]}
            >
              <Text
                style={[
                  styles.slotStatusText,
                  { color: isBooked ? "#0EA5E9" : "#16A34A" },
                ]}
              >
                {isBooked ? "Booked" : "Open"}
              </Text>
            </View>
          </View>

          {item.student ? (
            <Text style={{ color: theme.muted, marginTop: 4 }}>
              {item.student} ({item.netid})
            </Text>
          ) : (
            <Text style={{ color: theme.muted, marginTop: 4 }}>
              Open slot — students can book this.
            </Text>
          )}
        </TouchableOpacity>
      </Swipeable>
    );
  };

  const renderSectionHeader = ({ section }: { section: SectionData }) => {
    const isExpanded = expandedDates[section.title];

    return (
      <TouchableOpacity
        onPress={() => toggleDate(section.title)}
        activeOpacity={0.85}
        style={[
          styles.sectionHeader,
          { backgroundColor: theme.background, borderColor: theme.border },
        ]}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Ionicons
            name={isExpanded ? "chevron-down" : "chevron-forward"}
            size={16}
            color={theme.muted}
            style={{ marginRight: 6 }}
          />
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            {section.title}
          </Text>
        </View>
        <Text style={{ color: theme.muted, fontSize: 12 }}>
          {section.data.length} slot{section.data.length === 1 ? "" : "s"}
        </Text>
      </TouchableOpacity>
    );
  };

  const dateFilters = ["all", ...allDates] as const;

  const renderDateFilterChip = (value: string | "all") => {
    const isActive = selectedDate === value;
    const label = value === "all" ? "All dates" : value;

    return (
      <TouchableOpacity
        key={value}
        onPress={() => {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setSelectedDate(value as any);
        }}
        activeOpacity={0.8}
        style={[
          styles.filterChip,
          {
            borderColor: isActive ? theme.primary : theme.border,
            backgroundColor: isActive ? theme.primary : "transparent",
          },
        ]}
      >
        <Text
          style={[
            styles.filterChipText,
            { color: isActive ? theme.background : theme.text },
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.header, { color: theme.text }]}>
        Advising Schedule
      </Text>
      <Text style={{ color: theme.muted, marginBottom: 10 }}>
        Swipe slots to delete or block. Tap a booked slot to open the student's
        details.
      </Text>

      {/* date "calendar" filters */}
      <View style={styles.filterRow}>
        {dateFilters.map((d) => renderDateFilterChip(d))}
      </View>

      <SectionList
        sections={filteredSections}
        keyExtractor={(item) => item.id}
        renderItem={renderSlot}
        renderSectionHeader={renderSectionHeader}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={{ paddingBottom: 16, paddingTop: 4 }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              No slots on this date
            </Text>
            <Text
              style={{
                color: theme.muted,
                textAlign: "center",
                marginTop: 4,
              }}
            >
              Try switching the date filter, or add new advising slots in this
              range.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },

  header: { fontSize: 22, fontWeight: "700", marginBottom: 4 },

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

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
  },

  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  time: {
    fontWeight: "600",
    fontSize: 15,
  },

  slotStatusPill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  slotStatusText: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },

  swipeActionsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    height: "100%",
    gap: 4,
    paddingRight: 8,
  },
  swipeAction: {
    width: 90,
    height: "80%",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  swipeActionText: {
    color: "#fff",
    fontSize: 11,
    marginTop: 2,
    fontWeight: "600",
  },

  emptyState: {
    marginTop: 40,
    alignItems: "center",
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
});
