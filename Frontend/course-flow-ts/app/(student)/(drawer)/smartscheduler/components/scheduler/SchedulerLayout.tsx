import React, { useState } from "react"
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native"
import { MessageCircle, X, BookmarkCheck } from "lucide-react-native"
import { useScheduler } from "./SchedulerProvider"
import { BuilderToolbar } from "./BuilderToolbar"
import { ClassSearchPanel } from "./ClassSearchPanel"
import { TimeBlockingPanel } from "./TimeBlockingPanel"
import { CalendarGrid } from "./CalendarGrid"
import { ScheduleResults } from "./ScheduleResults"
import { ChatbotPanel } from "./ChatbotPanel"
import { CLASS_COLORS, formatHour } from "../../lib/scheduler-constants"

export function SchedulerLayout() {
  const { view, selectedEntries, savedSchedules, setView } = useScheduler()
  const [chatOpen, setChatOpen] = useState(false)

  return (
    <View style={styles.root}>
      <BuilderToolbar />

      {view === "builder" ? (
        <View style={styles.builderBody}>
          {/* Left panel: search + time blocking */}
          <View style={styles.leftPanel}>
            <View style={styles.searchFlex}>
              <ClassSearchPanel />
            </View>
            <TimeBlockingPanel />
          </View>

          {/* Right panel: calendar */}
          <View style={styles.calendarPanel}>
            <CalendarGrid
              entries={selectedEntries}
              showBlockedTimes={true}
              interactive={true}
              context="builder"
            />
          </View>
        </View>
      ) : view === "results" ? (
        <ScheduleResults />
      ) : (
        /* Saved schedules view */
        <View style={styles.savedView}>
          <View style={styles.savedHeader}>
            <TouchableOpacity onPress={() => setView("builder")} style={styles.savedBack}>
              <Text style={styles.savedBackText}>← Builder</Text>
            </TouchableOpacity>
            <Text style={styles.savedTitle}>Saved Schedules</Text>
          </View>
          {savedSchedules.length === 0 ? (
            <View style={styles.savedEmpty}>
              <BookmarkCheck size={40} color="#CBD5E1" />
              <Text style={styles.savedEmptyText}>No saved schedules yet</Text>
              <Text style={styles.savedEmptySubText}>Generate schedules and tap Save to store them here</Text>
            </View>
          ) : (
            <ScrollView style={styles.savedList} showsVerticalScrollIndicator={false}>
              {savedSchedules.map((saved) => {
                const colorIdx = new Map<string, number>()
                let ci = 0
                saved.entries.forEach(e => { if (!colorIdx.has(e.course.id)) colorIdx.set(e.course.id, ci++) })
                return (
                  <View key={saved.id} style={styles.savedCard}>
                    <Text style={styles.savedCardName}>{saved.name}</Text>
                    <Text style={styles.savedCardMeta}>
                      {saved.entries.length} section{saved.entries.length !== 1 ? "s" : ""} · Saved {new Date(saved.savedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </Text>
                    {saved.entries.map((entry) => {
                      const color = CLASS_COLORS[(colorIdx.get(entry.course.id) ?? 0) % CLASS_COLORS.length]
                      const timeStr = entry.section.slots.map(s =>
                        `${s.day} ${formatHour(s.startHour)}–${formatHour(s.endHour)}`
                      ).join("  ·  ")
                      return (
                        <View key={entry.section.id} style={[styles.savedEntryRow, { borderLeftColor: color.text }]}>
                          <View style={styles.savedEntryLeft}>
                            <Text style={[styles.savedEntryCode, { color: color.text }]}>
                              {entry.course.code} <Text style={styles.savedEntrySection}>Sec {entry.section.sectionCode}</Text>
                            </Text>
                            <Text style={styles.savedEntryTime}>{timeStr}</Text>
                          </View>
                        </View>
                      )
                    })}
                  </View>
                )
              })}
            </ScrollView>
          )}
        </View>
      )}

      {/* Floating AI chat button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setChatOpen(true)}
        activeOpacity={0.85}
      >
        <MessageCircle size={22} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Chat overlay modal */}
      <Modal
        visible={chatOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setChatOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <KeyboardAvoidingView
            style={styles.chatSheet}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
          >
            {/* Header */}
            <View style={styles.chatHeader}>
              <View style={styles.chatHeaderLeft}>
                <MessageCircle size={18} color="#C8102E" />
                <Text style={styles.chatHeaderTitle}>AI Schedule Assistant</Text>
              </View>
              <TouchableOpacity
                onPress={() => setChatOpen(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ChatbotPanel onClose={() => setChatOpen(false)} />
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  builderBody: {
    flex: 1,
    flexDirection: "row",
  },
  leftPanel: {
    width: 280,
    borderRightWidth: 1,
    borderRightColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    flexDirection: "column",
  },
  searchFlex: {
    flex: 1,
    overflow: "hidden",
  },
  calendarPanel: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#C8102E",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(15,23,42,0.45)",
  },
  chatSheet: {
    height: "72%",
    backgroundColor: "#F8FAFC",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
  },
  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  chatHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  chatHeaderTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1E293B",
  },
  savedView: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  savedHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    gap: 14,
  },
  savedBack: { paddingRight: 8 },
  savedBackText: { fontSize: 13, color: "#475569" },
  savedTitle: { fontSize: 15, fontWeight: "700", color: "#1E293B" },
  savedEmpty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 24,
  },
  savedEmptyText: { fontSize: 16, fontWeight: "600", color: "#1E293B" },
  savedEmptySubText: { fontSize: 13, color: "#64748B", textAlign: "center" },
  savedList: { flex: 1, padding: 16 },
  savedCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 6,
  },
  savedCardName: { fontSize: 15, fontWeight: "700", color: "#1E293B" },
  savedCardMeta: { fontSize: 11, color: "#94A3B8" },
  savedCardCourses: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 2 },
  savedCourseBadge: {
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  savedCourseBadgeText: { fontSize: 11, fontWeight: "600" },
  savedEntryRow: {
    borderLeftWidth: 3,
    borderRadius: 4,
    paddingLeft: 10,
    paddingVertical: 5,
    marginTop: 6,
    backgroundColor: "#F8FAFC",
  },
  savedEntryLeft: { gap: 2 },
  savedEntryCode: { fontSize: 12, fontWeight: "700" },
  savedEntrySection: { fontSize: 11, fontWeight: "400", color: "#64748B" },
  savedEntryTime: { fontSize: 11, color: "#64748B" },
})
