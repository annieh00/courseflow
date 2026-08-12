import React from "react"
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native"
import { Zap } from "lucide-react-native"
import { useScheduler } from "./SchedulerProvider"
import { CLASS_COLORS } from "../../lib/scheduler-constants"

export function BuilderToolbar() {
  const {
    selectedEntries,
    blockedTimes,
    generateAllSchedules,
    isGenerating,
    clearAll,
    generatedSchedules,
    view,
    setView,
  } = useScheduler()

  const uniqueCourses = new Map<string, string>()
  for (const entry of selectedEntries) {
    uniqueCourses.set(entry.course.id, entry.course.code)
  }
  const courseEntries = Array.from(uniqueCourses.entries())

  const canGenerate = selectedEntries.length > 0 && !isGenerating
  const canClear = selectedEntries.length > 0 || blockedTimes.length > 0

  return (
    <View style={styles.container}>
      {/* Title + blocked badge row */}
      <View style={styles.topRow}>
        {blockedTimes.length > 0 && (
          <View style={styles.blockedBadge}>
            <Text style={styles.blockedBadgeText}>{blockedTimes.length} blocked</Text>
          </View>
        )}
      </View>

      {courseEntries.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.badgeRow}
          contentContainerStyle={styles.badgeContent}
        >
          {courseEntries.map(([id, code], i) => {
            const color = CLASS_COLORS[i % CLASS_COLORS.length]
            return (
              <View
                key={id}
                style={[styles.courseBadge, { backgroundColor: color.bg }]}
              >
                <Text style={[styles.courseBadgeText, { color: color.text }]}>
                  {code}
                </Text>
              </View>
            )
          })}
        </ScrollView>
      )}

      {/* Action buttons row */}
      <View style={styles.actionsRow}>
        {generatedSchedules.length > 0 && (
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => setView(view === "builder" ? "results" : "builder")}
          >
            <Text style={styles.secondaryBtnText}>
              {view === "builder" ? "View Results" : "← Builder"}
            </Text>
          </TouchableOpacity>
        )}

        {view === "builder" && (
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => setView("saved")}
          >
            <Text style={styles.secondaryBtnText}>Saved Schedules</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.ghostBtn, !canClear && styles.disabledBtn]}
          onPress={clearAll}
          disabled={!canClear}
        >
          <Text style={[styles.ghostBtnText, !canClear && styles.disabledText]}>
            Clear All
          </Text>
        </TouchableOpacity>

        {view === "builder" && (
          <TouchableOpacity
            style={[styles.primaryBtn, !canGenerate && styles.disabledBtn]}
            onPress={generateAllSchedules}
            disabled={!canGenerate}
          >
            {isGenerating ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <View style={styles.generateBtnInner}>
                <Zap size={14} color="#fff" />
                <Text style={styles.primaryBtnText}>Generate Schedules</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
    letterSpacing: -0.3,
  },
  blockedBadge: {
    borderWidth: 1,
    borderColor: "rgba(200,16,46,0.3)",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: "rgba(200,16,46,0.06)",
  },
  blockedBadgeText: {
    fontSize: 10,
    color: "#C8102E",
  },
  badgeRow: {
    marginBottom: 10,
  },
  badgeContent: {
    gap: 6,
  },
  courseBadge: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  courseBadgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: "#C8102E",
    borderRadius: 8,
    paddingVertical: 9,
    alignItems: "center",
  },
  generateBtnInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  primaryBtnText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    paddingVertical: 9,
    paddingHorizontal: 14,
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  secondaryBtnText: {
    color: "#475569",
    fontSize: 12,
    fontWeight: "500",
  },
  ghostBtn: {
    paddingVertical: 9,
    paddingHorizontal: 12,
    alignItems: "center",
  },
  ghostBtnText: {
    color: "#C8102E",
    fontSize: 12,
    fontWeight: "500",
  },
  disabledBtn: {
    opacity: 0.35,
  },
  disabledText: {
    color: "#94A3B8",
  },
})
