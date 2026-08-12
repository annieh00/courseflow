import React from "react"
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
} from "react-native"
import { useScheduler } from "./SchedulerProvider"
import {
  DAYS,
  HOURS,
  START_HOUR,
  END_HOUR,
  formatHour,
  CLASS_COLORS,
} from "../../lib/scheduler-constants"
import type { ScheduleEntry } from "../../lib/scheduler-types"

const TIME_COL_WIDTH = 48
const MIN_HOUR_HEIGHT = 56

interface CalendarGridProps {
  entries: ScheduleEntry[]
  showBlockedTimes?: boolean
  interactive?: boolean
  colorMap?: Map<string, number>
  context?: "builder" | "results"
}

export function CalendarGrid({
  entries,
  showBlockedTimes = true,
  interactive = true,
  colorMap: externalColorMap,
  context = "builder",
}: CalendarGridProps) {
  const { blockedTimes, removeBlockedTime, removeSection } = useScheduler()
  const { height: screenHeight } = useWindowDimensions()

  const CHROME_HEIGHT = context === "results" ? 354 : 120
  const availableHeight = screenHeight - CHROME_HEIGHT
  const HOUR_HEIGHT = Math.max(MIN_HOUR_HEIGHT, availableHeight / (END_HOUR - START_HOUR))

  const colorMap: Map<string, number> = externalColorMap ?? (() => {
    const map = new Map<string, number>()
    let idx = 0
    for (const entry of entries) {
      if (!map.has(entry.course.id)) {
        map.set(entry.course.id, idx % CLASS_COLORS.length)
        idx++
      }
    }
    return map
  })()

  const totalHeight = HOUR_HEIGHT * (END_HOUR - START_HOUR)

  function getSlotStyle(startHour: number, endHour: number) {
    const top = (startHour - START_HOUR) * HOUR_HEIGHT
    const height = (endHour - startHour) * HOUR_HEIGHT
    return { top, height }
  }

  return (
    <View style={styles.container}>
      {/* Day header row */}
      <View style={styles.headerRow}>
        <View style={{ width: TIME_COL_WIDTH }} />
        {DAYS.map((day) => (
          <View key={day} style={styles.dayHeader}>
            <Text style={styles.dayHeaderText}>{day}</Text>
          </View>
        ))}
      </View>

      {/* Scrollable grid body */}
      <ScrollView style={styles.gridScroll} showsVerticalScrollIndicator={false}>
        <View style={[styles.gridBody, { height: totalHeight }]}>
          {/* Time labels */}
          <View style={[styles.timeCol, { height: totalHeight }]}>
            {HOURS.map((hour) => (
              <View
                key={hour}
                style={[styles.timeCell, { height: HOUR_HEIGHT }]}
              >
                <Text style={styles.timeText}>{formatHour(hour)}</Text>
              </View>
            ))}
          </View>

          {/* Day columns */}
          {DAYS.map((day) => (
            <View key={day} style={[styles.dayCol, { height: totalHeight }]}>
              {/* Hour grid lines */}
              {HOURS.map((hour) => (
                <View
                  key={hour}
                  style={[styles.hourCell, { height: HOUR_HEIGHT }]}
                >
                  <View style={styles.halfHourLine} />
                </View>
              ))}

              {/* Blocked times */}
              {showBlockedTimes &&
                blockedTimes
                  .filter((b) => b.day === day)
                  .map((block) => {
                    const pos = getSlotStyle(block.startHour, block.endHour)
                    return (
                      <View
                        key={block.id}
                        style={[styles.blockedSlot, { top: pos.top, height: pos.height }]}
                      >
                        <Text style={styles.blockedText}>Blocked</Text>
                        {interactive && (
                          <TouchableOpacity
                            onPress={() => removeBlockedTime(block.id)}
                            style={styles.removeBtn}
                            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                          >
                            <Text style={styles.removeBtnText}>✕</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    )
                  })}

              {/* Class entries */}
              {entries
                .filter((e) => e.section.slots.some((s) => s.day === day))
                .map((entry) =>
                  entry.section.slots
                    .filter((s) => s.day === day)
                    .map((slot, slotIdx) => {
                      const pos = getSlotStyle(slot.startHour, slot.endHour)
                      const colorIdx = colorMap.get(entry.course.id) ?? 0
                      const color = CLASS_COLORS[colorIdx]
                      return (
                        <View
                          key={`${entry.section.id}-${slotIdx}`}
                          style={[
                            styles.classSlot,
                            {
                              top: pos.top,
                              height: pos.height,
                              backgroundColor: color.bg,
                            },
                          ]}
                        >
                          <Text
                            style={[styles.classCode, { color: color.text }]}
                            numberOfLines={1}
                          >
                            {entry.course.code}
                          </Text>
                          <Text
                            style={[styles.classSection, { color: color.text }]}
                            numberOfLines={1}
                          >
                            Sec {entry.section.sectionCode}
                          </Text>
                          <Text
                            style={[styles.classTime, { color: color.text }]}
                            numberOfLines={1}
                          >
                            {formatHour(slot.startHour)}–{formatHour(slot.endHour)}
                          </Text>
                          {interactive && (
                            <TouchableOpacity
                              onPress={() =>
                                removeSection(entry.course.id, entry.section.id)
                              }
                              style={styles.removeBtn}
                              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                            >
                              <Text style={[styles.removeBtnText, { color: color.text }]}>
                                ✕
                              </Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      )
                    })
                )}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  headerRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
  },
  dayHeader: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderLeftWidth: 1,
    borderLeftColor: "#E2E8F0",
  },
  dayHeaderText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
  },
  gridScroll: {
    flex: 1,
  },
  gridBody: {
    flexDirection: "row",
  },
  timeCol: {
    width: TIME_COL_WIDTH,
  },
  timeCell: {
    justifyContent: "flex-start",
    paddingTop: 2,
    paddingLeft: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  timeText: {
    fontSize: 9,
    color: "#94A3B8",
  },
  dayCol: {
    flex: 1,
    borderLeftWidth: 1,
    borderLeftColor: "#E2E8F0",
    position: "relative",
  },
  hourCell: {
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    justifyContent: "center",
  },
  halfHourLine: {
    position: "absolute",
    top: "50%",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "#F1F5F9",
  },
  blockedSlot: {
    position: "absolute",
    left: 2,
    right: 2,
    backgroundColor: "rgba(200,16,46,0.07)",
    borderWidth: 1,
    borderColor: "rgba(200,16,46,0.2)",
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
    overflow: "hidden",
  },
  blockedText: {
    fontSize: 9,
    color: "#C8102E",
    fontWeight: "600",
  },
  classSlot: {
    position: "absolute",
    left: 2,
    right: 2,
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 3,
    zIndex: 20,
    overflow: "hidden",
  },
  classCode: {
    fontSize: 10,
    fontWeight: "700",
    lineHeight: 13,
  },
  classSection: {
    fontSize: 9,
    opacity: 0.85,
    lineHeight: 12,
  },
  classTime: {
    fontSize: 8,
    opacity: 0.75,
    lineHeight: 11,
  },
  removeBtn: {
    position: "absolute",
    top: 2,
    right: 2,
    padding: 2,
  },
  removeBtnText: {
    fontSize: 9,
    fontWeight: "700",
    opacity: 0.8,
  },
})
