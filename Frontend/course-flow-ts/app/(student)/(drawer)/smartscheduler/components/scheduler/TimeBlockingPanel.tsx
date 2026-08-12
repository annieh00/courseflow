import React, { useState } from "react"
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
} from "react-native"
import { Ban, X } from "lucide-react-native"
import { useScheduler } from "./SchedulerProvider"
import { DAYS, DAY_LABELS, formatHour } from "../../lib/scheduler-constants"
import type { Day } from "../../lib/scheduler-types"

const HOURS = Array.from({ length: 25 }, (_, i) => 8 + i * 0.5).filter(
  (h) => h <= 20
)

export function TimeBlockingPanel() {
  const { blockedTimes, addBlockedTime, removeBlockedTime } = useScheduler()
  const [isAdding, setIsAdding] = useState(false)
  const [selectedDay, setSelectedDay] = useState<Day>("Mon")
  const [startHour, setStartHour] = useState(12)
  const [endHour, setEndHour] = useState(13)
  const [pickerMode, setPickerMode] = useState<"day" | "start" | "end" | null>(null)

  function handleAdd() {
    if (endHour <= startHour) return
    addBlockedTime({
      id: `block-${Date.now()}`,
      day: selectedDay,
      startHour,
      endHour,
    })
    setIsAdding(false)
    setPickerMode(null)
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <Ban size={14} color="#C8102E" />
          <Text style={styles.sectionTitle}>Blocked Times</Text>
        </View>
        <TouchableOpacity
          style={styles.blockTimeBtn}
          onPress={() => {
            setIsAdding(!isAdding)
            setPickerMode(null)
          }}
        >
          <Text style={styles.blockTimeBtnText}>
            {isAdding ? "Cancel" : "+ Block Time"}
          </Text>
        </TouchableOpacity>
      </View>

      {isAdding && (
        <View style={styles.addForm}>
          {/* Day picker */}
          <Text style={styles.pickerLabel}>Day</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.dayScroll}
            contentContainerStyle={styles.dayScrollContent}
          >
            {DAYS.map((d) => (
              <TouchableOpacity
                key={d}
                style={[
                  styles.dayChip,
                  selectedDay === d && styles.dayChipSelected,
                ]}
                onPress={() => setSelectedDay(d)}
              >
                <Text
                  style={[
                    styles.dayChipText,
                    selectedDay === d && styles.dayChipTextSelected,
                  ]}
                >
                  {d}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Time row */}
          <View style={styles.timeRow}>
            <View style={styles.timePickerCol}>
              <Text style={styles.pickerLabel}>From</Text>
              <TouchableOpacity
                style={[styles.timePicker, pickerMode === "start" && styles.timePickerOpen]}
                onPress={() => setPickerMode(pickerMode === "start" ? null : "start")}
              >
                <Text style={styles.timePickerText}>{formatHour(startHour)}</Text>
                <Text style={styles.timePickerChevron}>▾</Text>
              </TouchableOpacity>
              {pickerMode === "start" && (
                <View style={styles.hourDropdown}>
                  <ScrollView style={{ maxHeight: 160 }} nestedScrollEnabled>
                    {HOURS.map((h) => (
                      <TouchableOpacity
                        key={h}
                        style={[
                          styles.hourOption,
                          startHour === h && styles.hourOptionSelected,
                        ]}
                        onPress={() => {
                          setStartHour(h)
                          if (endHour <= h) setEndHour(h + 1 > 20 ? 20 : h + 1)
                          setPickerMode(null)
                        }}
                      >
                        <Text
                          style={[
                            styles.hourOptionText,
                            startHour === h && styles.hourOptionTextSelected,
                          ]}
                        >
                          {formatHour(h)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            <Text style={styles.toText}>to</Text>

            <View style={styles.timePickerCol}>
              <Text style={styles.pickerLabel}>To</Text>
              <TouchableOpacity
                style={[styles.timePicker, pickerMode === "end" && styles.timePickerOpen]}
                onPress={() => setPickerMode(pickerMode === "end" ? null : "end")}
              >
                <Text style={styles.timePickerText}>{formatHour(endHour)}</Text>
                <Text style={styles.timePickerChevron}>▾</Text>
              </TouchableOpacity>
              {pickerMode === "end" && (
                <View style={styles.hourDropdown}>
                  <ScrollView style={{ maxHeight: 160 }} nestedScrollEnabled>
                    {HOURS.filter((h) => h > startHour).map((h) => (
                      <TouchableOpacity
                        key={h}
                        style={[
                          styles.hourOption,
                          endHour === h && styles.hourOptionSelected,
                        ]}
                        onPress={() => {
                          setEndHour(h)
                          setPickerMode(null)
                        }}
                      >
                        <Text
                          style={[
                            styles.hourOptionText,
                            endHour === h && styles.hourOptionTextSelected,
                          ]}
                        >
                          {formatHour(h)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          </View>

          <TouchableOpacity
            style={[styles.addBlockBtn, endHour <= startHour && styles.addBlockBtnDisabled]}
            onPress={handleAdd}
            disabled={endHour <= startHour}
          >
            <Text style={styles.addBlockBtnText}>Add Block</Text>
          </TouchableOpacity>
        </View>
      )}

      {blockedTimes.length === 0 && !isAdding && (
        <Text style={styles.emptyText}>No blocked times yet</Text>
      )}

      {blockedTimes.length > 0 && (
        <Text style={styles.noteText}>
          Classes won't be added during these times
        </Text>
      )}

      <View style={styles.blockList}>
        {blockedTimes.map((block) => (
          <View key={block.id} style={styles.blockRow}>
            <Text style={styles.blockText}>
              {DAY_LABELS[block.day]}  {formatHour(block.startHour)} – {formatHour(block.endHour)}
            </Text>
            <TouchableOpacity
              onPress={() => removeBlockedTime(block.id)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={14} color="#94A3B8" />
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1E293B",
  },
  blockTimeBtn: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "#F8FAFC",
  },
  blockTimeBtnText: {
    fontSize: 11,
    color: "#475569",
    fontWeight: "500",
  },
  addForm: {
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 12,
    marginBottom: 10,
    gap: 8,
  },
  pickerLabel: {
    fontSize: 10,
    color: "#94A3B8",
    fontWeight: "500",
    marginBottom: 4,
  },
  dayScroll: {
    marginBottom: 4,
  },
  dayScrollContent: {
    gap: 6,
  },
  dayChip: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#FFFFFF",
  },
  dayChipSelected: {
    backgroundColor: "#C8102E",
    borderColor: "#C8102E",
  },
  dayChipText: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "500",
  },
  dayChipTextSelected: {
    color: "#fff",
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    zIndex: 20,
  },
  timePickerCol: {
    flex: 1,
    position: "relative",
    zIndex: 10,
  },
  timePicker: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "#FFFFFF",
  },
  timePickerOpen: {
    borderColor: "#C8102E",
  },
  timePickerText: {
    fontSize: 12,
    color: "#1E293B",
  },
  timePickerChevron: {
    fontSize: 10,
    color: "#94A3B8",
  },
  hourDropdown: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 6,
    zIndex: 100,
    marginTop: 2,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: { elevation: 4 },
    }),
  },
  hourOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  hourOptionSelected: {
    backgroundColor: "rgba(200,16,46,0.07)",
  },
  hourOptionText: {
    fontSize: 12,
    color: "#64748B",
  },
  hourOptionTextSelected: {
    color: "#C8102E",
    fontWeight: "600",
  },
  toText: {
    fontSize: 12,
    color: "#94A3B8",
    marginBottom: 10,
    alignSelf: "center",
  },
  addBlockBtn: {
    backgroundColor: "#C8102E",
    borderRadius: 7,
    paddingVertical: 9,
    alignItems: "center",
    marginTop: 4,
  },
  addBlockBtnDisabled: {
    opacity: 0.4,
  },
  addBlockBtnText: {
    fontSize: 13,
    color: "#fff",
    fontWeight: "600",
  },
  emptyText: {
    fontSize: 12,
    color: "#94A3B8",
    textAlign: "center",
    paddingVertical: 8,
  },
  noteText: {
    fontSize: 10,
    color: "#C8102E",
    marginBottom: 8,
    opacity: 0.8,
  },
  blockList: {
    gap: 6,
  },
  blockRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(200,16,46,0.06)",
    borderWidth: 1,
    borderColor: "rgba(200,16,46,0.18)",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  blockText: {
    fontSize: 12,
    color: "#1E293B",
  },
})
