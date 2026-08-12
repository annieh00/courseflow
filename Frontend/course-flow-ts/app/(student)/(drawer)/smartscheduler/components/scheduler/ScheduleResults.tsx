import React, { useState } from "react"
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  TextInput,
} from "react-native"
import { Calendar, Bookmark, BookmarkCheck, Save } from "lucide-react-native"
import { useScheduler } from "./SchedulerProvider"
import { CalendarGrid } from "./CalendarGrid"
import { CLASS_COLORS } from "../../lib/scheduler-constants"

export function ScheduleResults() {
  const {
    generatedSchedules,
    activeScheduleIndex,
    setActiveScheduleIndex,
    toggleBookmark,
    setView,
    saveNamedSchedule,
  } = useScheduler()

  const [nameModalVisible, setNameModalVisible] = useState(false)
  const [scheduleName, setScheduleName] = useState("")

  if (generatedSchedules.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Calendar size={40} color="#CBD5E1" />
        <Text style={styles.emptyTitle}>No schedules generated yet</Text>
        <Text style={styles.emptySubtitle}>
          Add classes and tap "Generate Schedules"
        </Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => setView("builder")}>
          <Text style={styles.backBtnText}>← Back to Builder</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const active = generatedSchedules[activeScheduleIndex]
  const bookmarkedCount = generatedSchedules.filter((s) => s.bookmarked).length

  const colorMap = new Map<string, number>()
  let colorIdx = 0
  for (const entry of active.entries) {
    if (!colorMap.has(entry.course.id)) {
      colorMap.set(entry.course.id, colorIdx % CLASS_COLORS.length)
      colorIdx++
    }
  }

  function confirmSave() {
    const name = scheduleName.trim() || `Schedule ${activeScheduleIndex + 1}`
    saveNamedSchedule(name)
    setScheduleName("")
    setNameModalVisible(false)
  }

  return (
    <View style={styles.container}>
      {/* Results header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.builderLink}
          onPress={() => setView("builder")}
        >
          <Text style={styles.builderLinkText}>← Builder</Text>
        </TouchableOpacity>

        <Text style={styles.countText}>
          {generatedSchedules.length} possible{" "}
          {generatedSchedules.length === 1 ? "schedule" : "schedules"}
        </Text>

        {bookmarkedCount > 0 && (
          <View style={styles.bookmarkBadge}>
            <Bookmark size={11} color="#92600A" />
            <Text style={styles.bookmarkBadgeText}>{bookmarkedCount}</Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.saveBtn}
          onPress={() => setNameModalVisible(true)}
        >
          <View style={styles.saveBtnInner}>
            <Save size={12} color="#C8102E" />
            <Text style={styles.saveBtnText}>Save</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Navigation row */}
      <View style={styles.navRow}>
        <TouchableOpacity
          style={[styles.navBtn, activeScheduleIndex === 0 && styles.navBtnDisabled]}
          onPress={() => setActiveScheduleIndex(Math.max(0, activeScheduleIndex - 1))}
          disabled={activeScheduleIndex === 0}
        >
          <Text style={styles.navBtnText}>‹</Text>
        </TouchableOpacity>

        <Text style={styles.navLabel}>
          Schedule {activeScheduleIndex + 1} / {generatedSchedules.length}
        </Text>

        <TouchableOpacity
          style={[
            styles.navBtn,
            activeScheduleIndex === generatedSchedules.length - 1 &&
              styles.navBtnDisabled,
          ]}
          onPress={() =>
            setActiveScheduleIndex(
              Math.min(generatedSchedules.length - 1, activeScheduleIndex + 1)
            )
          }
          disabled={activeScheduleIndex === generatedSchedules.length - 1}
        >
          <Text style={styles.navBtnText}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.bookmarkBtn}
          onPress={() => toggleBookmark(active.id)}
        >
          {active.bookmarked
            ? <BookmarkCheck size={18} color="#C8102E" />
            : <Bookmark size={18} color="#94A3B8" />
          }
        </TouchableOpacity>
      </View>

      {/* Calendar */}
      <View style={styles.calendarContainer}>
        <CalendarGrid
          entries={active.entries}
          showBlockedTimes={true}
          interactive={false}
          colorMap={colorMap}
          context="results"
        />
      </View>

      {/* Course legend */}
      <View style={styles.legend}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {active.entries.map((entry) => {
            const cIdx = colorMap.get(entry.course.id) ?? 0
            const color = CLASS_COLORS[cIdx]
            return (
              <View
                key={entry.section.id}
                style={[styles.legendItem, { backgroundColor: color.bg }]}
              >
                <Text style={[styles.legendText, { color: color.text }]}>
                  {entry.course.code} Sec {entry.section.sectionCode}
                </Text>
              </View>
            )
          })}
        </ScrollView>
      </View>

      {/* All schedules list */}
      <View style={styles.scheduleList}>
        <Text style={styles.scheduleListTitle}>All Schedules</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {generatedSchedules.map((schedule, idx) => (
            <TouchableOpacity
              key={schedule.id}
              style={[
                styles.scheduleChip,
                idx === activeScheduleIndex && styles.scheduleChipActive,
              ]}
              onPress={() => setActiveScheduleIndex(idx)}
            >
              <Text
                style={[
                  styles.scheduleChipText,
                  idx === activeScheduleIndex && styles.scheduleChipTextActive,
                ]}
              >
                {idx + 1}{schedule.bookmarked ? " ▶" : ""}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Name schedule modal */}
      <Modal visible={nameModalVisible} transparent animationType="fade" onRequestClose={() => setNameModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.nameModal}>
            <Text style={styles.nameModalTitle}>Name this Schedule</Text>
            <TextInput
              style={styles.nameInput}
              placeholder={`Schedule ${activeScheduleIndex + 1}`}
              placeholderTextColor="#94A3B8"
              value={scheduleName}
              onChangeText={setScheduleName}
              autoFocus
            />
            <View style={styles.nameModalBtns}>
              <TouchableOpacity style={styles.nameModalCancel} onPress={() => { setScheduleName(""); setNameModalVisible(false) }}>
                <Text style={styles.nameModalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.nameModalConfirm} onPress={confirmSave}>
                <Text style={styles.nameModalConfirmText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#1E293B",
  },
  emptySubtitle: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
  },
  backBtn: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    marginTop: 8,
  },
  backBtnText: {
    color: "#475569",
    fontSize: 14,
    fontWeight: "500",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    gap: 10,
  },
  builderLink: {
    paddingVertical: 4,
    paddingRight: 8,
  },
  builderLinkText: {
    fontSize: 13,
    color: "#475569",
  },
  countText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
  },
  bookmarkBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: "rgba(241,190,72,0.4)",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: "rgba(241,190,72,0.1)",
  },
  bookmarkBadgeText: {
    fontSize: 11,
    color: "#92600A",
  },
  saveBtn: {
    borderWidth: 1,
    borderColor: "rgba(200,16,46,0.3)",
    borderRadius: 7,
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: "rgba(200,16,46,0.06)",
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },
  saveBtnInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  saveBtnText: {
    fontSize: 12,
    color: "#C8102E",
    fontWeight: "600",
  },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    gap: 10,
  },
  navBtn: {
    width: 34,
    height: 34,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
  },
  navBtnDisabled: {
    opacity: 0.3,
  },
  navBtnText: {
    fontSize: 20,
    color: "#1E293B",
    lineHeight: 22,
  },
  navLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
    textAlign: "center",
  },
  bookmarkBtn: {
    width: 34,
    height: 34,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
  },
  calendarContainer: {
    flex: 1,
    minHeight: 0,
  },
  legend: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
  },
  legendItem: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 6,
  },
  legendText: {
    fontSize: 11,
    fontWeight: "600",
  },
  scheduleList: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
  },
  scheduleListTitle: {
    fontSize: 10,
    fontWeight: "600",
    color: "#94A3B8",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  scheduleChip: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 6,
    backgroundColor: "#F8FAFC",
  },
  scheduleChipActive: {
    backgroundColor: "rgba(200,16,46,0.08)",
    borderColor: "rgba(200,16,46,0.3)",
  },
  scheduleChipText: {
    fontSize: 12,
    color: "#64748B",
  },
  scheduleChipTextActive: {
    color: "#C8102E",
    fontWeight: "600",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  nameModal: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 20,
    width: "100%",
    maxWidth: 360,
    gap: 14,
  },
  nameModalTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E293B",
    textAlign: "center",
  },
  nameInput: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#1E293B",
    backgroundColor: "#F8FAFC",
  },
  nameModalBtns: {
    flexDirection: "row",
    gap: 10,
  },
  nameModalCancel: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  nameModalCancelText: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "500",
  },
  nameModalConfirm: {
    flex: 1,
    backgroundColor: "#C8102E",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  nameModalConfirmText: {
    fontSize: 13,
    color: "#FFFFFF",
    fontWeight: "700",
  },
})


