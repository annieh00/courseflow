import React, { useMemo, useState } from "react"
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native"
import { 
  Book, 
  FlaskConical, 
  Globe, 
  Trophy, 
  X, 
  CheckCircle2, 
  Target,
  Layout
} from "lucide-react-native"
import type { DegreeProgram, Course } from "./degree-programs"
import { useFlowchart } from "./FlowchartContext"
import { useAuth } from "../../../../auth/AuthContext"

const _isLocal = typeof window === 'undefined' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const _API_BASE = `${_isLocal ? 'http://localhost:8080' : 'https://sdmay26-48.ece.iastate.edu'}/api`;

// Replaced emojis with Lucide components
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  required:          <Book size={14} color="#64748B" />,
  "SE Elective":     <FlaskConical size={14} color="#64748B" />,
  "SPPLM Elective":  <FlaskConical size={14} color="#64748B" />,
  "Open Elective":   <Globe size={14} color="#64748B" />,
  "Gen Ed":          <Layout size={14} color="#64748B" />,
  "Senior Design":   <Trophy size={14} color="#64748B" />,
}

const CATEGORY_LABELS: Record<string, string> = {
  required:          "Core Requirements",
  "SE Elective":     "SE Electives",
  "SPPLM Elective":  "Supplementary Electives",
  "Open Elective":   "Open Electives",
  "Gen Ed":          "General Education",
  "Senior Design":   "Senior Design",
}

const CATEGORY_ORDER = [
  "required",
  "SE Elective",
  "SPPLM Elective",
  "Senior Design",
  "Open Elective",
  "Gen Ed",
]

function groupCoursesByType(courses: Course[]) {
  const groups: Record<string, Course[]> = {}
  for (const course of courses) {
    if (!groups[course.type]) groups[course.type] = []
    groups[course.type].push(course)
  }
  return groups
}

interface Props {
  program: DegreeProgram
  onClose?: () => void
}

export function ProgressSidebar({ program, onClose }: Props) {
  const { accessToken } = useAuth()
  const {
    getCompletedCredits,
    getProgressPercent,
    getUncompletedCourses,
    getInProgressCourses,
    saveProgress,
    resetProgress,
    lastSaved,
  } = useFlowchart()

  const completedCredits = getCompletedCredits(program)
  const progressPercent = getProgressPercent(program)
  const uncompleted = getUncompletedCourses(program)
  const inProgress = getInProgressCourses(program)
  const groupedUncompleted = useMemo(() => groupCoursesByType(uncompleted), [uncompleted])

  const inProgressCredits = useMemo(
    () => inProgress.reduce((sum, c) => sum + c.credits, 0),
    [inProgress]
  )

  const [confirmReset, setConfirmReset] = useState(false)

  const executeReset = async () => {
    setConfirmReset(false)
    if (accessToken) {
      try {
        await fetch(`${_API_BASE}/user/courses`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ courseNumbers: [], inProgressCourseNumbers: [] }),
        })
      } catch (error) {
        console.error("Error resetting progress on server:", error)
      }
    }
    resetProgress()
  }

  const handleSave = async () => {
    await saveProgress()
  }

  const inProgressPercent = Math.round((inProgressCredits / program.totalCredits) * 100)

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerAccent} />
          <View>
            <Text style={styles.headerTitle}>Progress Summary</Text>
            <Text style={styles.headerSub}>{program.program} · {program.institution}</Text>
          </View>
        </View>
        {onClose && (
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <X size={20} color="#94A3B8" />
          </TouchableOpacity>
        )}
      </View>

      {/* Credit stats */}
      <View style={styles.statsBox}>
        <View style={styles.statsRow}>
          <View style={styles.statPill}>
            <Text style={styles.statPillValue}>{completedCredits}</Text>
            <Text style={styles.statPillLabel}>Completed</Text>
            <View style={[styles.statPillAccent, { backgroundColor: "#1A7F4B" }]} />
          </View>
          {inProgressCredits > 0 && (
            <View style={styles.statPill}>
              <Text style={[styles.statPillValue, { color: "#F59E0B" }]}>{inProgressCredits}</Text>
              <Text style={styles.statPillLabel}>In Progress</Text>
              <View style={[styles.statPillAccent, { backgroundColor: "#F59E0B" }]} />
            </View>
          )}
          <View style={styles.statPill}>
            <Text style={[styles.statPillValue, { color: "#1E293B" }]}>{program.totalCredits}</Text>
            <Text style={styles.statPillLabel}>Total</Text>
            <View style={[styles.statPillAccent, { backgroundColor: "#94A3B8" }]} />
          </View>
        </View>

        <View style={styles.progressSection}>
          <View style={styles.progressLabelRow}>
            <Text style={styles.progressPercent}>{completedCredits} credits complete</Text>
            {inProgressCredits > 0 && (
              <Text style={styles.progressInProgressLabel}>
                {inProgressCredits} credits in progress
              </Text>
            )}
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFillCompleted, { width: `${progressPercent}%` }]} />
            {inProgressPercent > 0 && (
              <View
                style={[
                  styles.progressFillInProgress,
                  { width: `${inProgressPercent}%`, left: `${progressPercent}%` },
                ]}
              />
            )}
          </View>
          {inProgressCredits > 0 && (
            <View style={styles.progressLegend}>
              <View style={[styles.legendDot, { backgroundColor: "#C8102E" }]} />
              <Text style={styles.legendLabel}>Completed</Text>
              <View style={[styles.legendDot, { backgroundColor: "#F1BE48" }]} />
              <Text style={styles.legendLabel}>In Progress</Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView style={styles.courseList} showsVerticalScrollIndicator={false}>
        {inProgress.length > 0 && (
          <View style={styles.inProgressSection}>
            <View style={styles.inProgressHeader}>
              <View style={styles.inProgressTitleRow}>
                <View style={styles.inProgressIndicator} />
                <Text style={styles.inProgressSectionTitle}>Currently Taking</Text>
              </View>
              <View style={styles.inProgressCountBadge}>
                <Text style={styles.inProgressCountText}>{inProgress.length}</Text>
              </View>
            </View>
            {inProgress.map((c) => (
              <View key={c.code} style={styles.inProgressItem}>
                <View style={styles.inProgressItemBar} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.inProgressCode}>{c.code}</Text>
                  <Text style={styles.inProgressTitle} numberOfLines={1}>{c.title}</Text>
                </View>
                <Text style={styles.inProgressCredits}>{c.credits} cr</Text>
              </View>
            ))}
          </View>
        )}

        <Text style={styles.sectionTitle}>Remaining Courses</Text>

        {uncompleted.length === 0 && inProgress.length === 0 ? (
          <View style={styles.allDone}>
            <Trophy size={48} color="#1A7F4B" strokeWidth={1.5} />
            <Text style={styles.allDoneTitle}>All courses completed!</Text>
            <Text style={styles.allDoneSubtitle}>Congratulations on finishing your degree requirements.</Text>
          </View>
        ) : uncompleted.length === 0 ? (
          <View style={styles.allDone}>
            <Target size={48} color="#F59E0B" strokeWidth={1.5} />
            <Text style={styles.allDoneTitle}>All remaining courses in progress!</Text>
            <Text style={styles.allDoneSubtitle}>Mark them complete when you finish each one.</Text>
          </View>
        ) : (
          CATEGORY_ORDER.map((cat) => {
            const courses = groupedUncompleted[cat]
            if (!courses || courses.length === 0) return null
            return (
              <View key={cat} style={styles.categoryGroup}>
                <View style={styles.categoryHeader}>
                  <View style={styles.categoryIconWrapper}>
                    {CATEGORY_ICONS[cat] ?? <Book size={14} color="#64748B" />}
                  </View>
                  <Text style={styles.categoryLabel}>{CATEGORY_LABELS[cat] ?? cat}</Text>
                  <View style={styles.categoryCountBadge}>
                    <Text style={styles.categoryCount}>{courses.length}</Text>
                  </View>
                </View>
                {courses.map((c) => (
                  <View key={c.code} style={styles.courseItem}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.courseItemCode}>{c.code}</Text>
                      <Text style={styles.courseItemTitle} numberOfLines={1}>{c.title}</Text>
                    </View>
                    <Text style={styles.courseItemCredits}>{c.credits} cr</Text>
                  </View>
                ))}
              </View>
            )
          })
        )}
        <View style={{ height: 12 }} />
      </ScrollView>

      {/* Action buttons */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>Save Progress</Text>
        </TouchableOpacity>

        {confirmReset ? (
          <View style={styles.confirmRow}>
            <Text style={styles.confirmText}>Clear all progress?</Text>
            <View style={styles.confirmBtns}>
              <TouchableOpacity style={styles.confirmCancelBtn} onPress={() => setConfirmReset(false)}>
                <Text style={styles.confirmCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmResetBtn} onPress={executeReset}>
                <Text style={styles.confirmResetText}>Yes, Reset</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity style={styles.resetBtn} onPress={() => setConfirmReset(true)}>
            <Text style={styles.resetBtnText}>Reset</Text>
          </TouchableOpacity>
        )}

        {lastSaved && (
          <Text style={styles.lastSaved}>
            Saved {new Date(lastSaved).toLocaleDateString("en-US", {
              month: "short", day: "numeric", year: "numeric",
              hour: "numeric", minute: "2-digit",
            })}
          </Text>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerAccent: { width: 3, height: 32, borderRadius: 2, backgroundColor: "#C8102E" },
  headerTitle: { fontSize: 15, fontWeight: "700", color: "#1E293B" },
  headerSub: { fontSize: 11, color: "#94A3B8", marginTop: 1 },
  statsBox: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#F1F5F9", gap: 14 },
  statsRow: { flexDirection: "row", gap: 8 },
  statPill: { flex: 1, backgroundColor: "#F8FAFC", borderRadius: 8, paddingVertical: 10, paddingHorizontal: 8, alignItems: "center", gap: 2, overflow: "hidden" },
  statPillValue: { fontSize: 18, fontWeight: "800", color: "#C8102E" },
  statPillLabel: { fontSize: 9, color: "#94A3B8", fontWeight: "500" },
  statPillAccent: { position: "absolute", bottom: 0, left: 0, right: 0, height: 2 },
  progressSection: { gap: 6 },
  progressLabelRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  progressPercent: { fontSize: 11, fontWeight: "600", color: "#1E293B" },
  progressInProgressLabel: { fontSize: 10, color: "#F59E0B", fontWeight: "500" },
  progressTrack: { height: 8, backgroundColor: "#F1F5F9", borderRadius: 4, overflow: "hidden", position: "relative" },
  progressFillCompleted: { position: "absolute", left: 0, top: 0, height: "100%", backgroundColor: "#C8102E", borderRadius: 4 },
  progressFillInProgress: { position: "absolute", top: 0, height: "100%", backgroundColor: "#F1BE48", borderRadius: 4 },
  progressLegend: { flexDirection: "row", alignItems: "center", gap: 5 },
  legendDot: { width: 7, height: 7, borderRadius: 4 },
  legendLabel: { fontSize: 9.5, color: "#64748B", marginRight: 8 },
  courseList: { flex: 1, paddingHorizontal: 16, paddingTop: 14 },
  inProgressSection: { marginBottom: 18, borderRadius: 10, borderWidth: 1, borderColor: "rgba(241,190,72,0.4)", backgroundColor: "#FFFDF4", overflow: "hidden" },
  inProgressHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: "rgba(241,190,72,0.3)" },
  inProgressTitleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  inProgressIndicator: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#C8102E" },
  inProgressSectionTitle: { fontSize: 11, fontWeight: "700", color: "#78350F", textTransform: "uppercase" },
  inProgressCountBadge: { backgroundColor: "#C8102E", borderRadius: 9, minWidth: 18, height: 18, alignItems: "center", justifyContent: "center" },
  inProgressCountText: { fontSize: 10, color: "#FFFFFF", fontWeight: "700" },
  inProgressItem: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "rgba(241,190,72,0.2)" },
  inProgressItemBar: { width: 2.5, height: 28, borderRadius: 2, backgroundColor: "#F1BE48" },
  inProgressCode: { fontSize: 11, fontWeight: "700", color: "#78350F" },
  inProgressTitle: { fontSize: 10, color: "#92400E", marginTop: 1 },
  inProgressCredits: { fontSize: 10, color: "#B45309", fontWeight: "500" },
  sectionTitle: { fontSize: 10, fontWeight: "700", color: "#94A3B8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 },
  allDone: { alignItems: "center", paddingVertical: 32, gap: 12 },
  allDoneTitle: { fontSize: 15, fontWeight: "600", color: "#1A7F4B" },
  allDoneSubtitle: { fontSize: 12, color: "#64748B", textAlign: "center" },
  categoryGroup: { marginBottom: 14 },
  categoryHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 5 },
  categoryIconWrapper: { width: 14, alignItems: "center" },
  categoryLabel: { flex: 1, fontSize: 10, fontWeight: "700", color: "#64748B", textTransform: "uppercase" },
  categoryCountBadge: { backgroundColor: "#F1F5F9", borderRadius: 8, paddingHorizontal: 6, paddingVertical: 1 },
  categoryCount: { fontSize: 9.5, color: "#94A3B8", fontWeight: "600" },
  courseItem: { flexDirection: "row", alignItems: "center", backgroundColor: "#F8FAFC", borderRadius: 7, paddingHorizontal: 10, paddingVertical: 7, marginBottom: 3 },
  courseItemCode: { fontSize: 11, fontWeight: "600", color: "#1E293B" },
  courseItemTitle: { fontSize: 9.5, color: "#64748B", marginTop: 1 },
  courseItemCredits: { fontSize: 9.5, color: "#94A3B8", marginLeft: 8 },
  actions: { padding: 14, gap: 8, borderTopWidth: 1, borderTopColor: "#F1F5F9" },
  saveBtn: { backgroundColor: "#F59E0B", borderRadius: 10, paddingVertical: 13, alignItems: "center" },
  saveBtnText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  resetBtn: { borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 10, paddingVertical: 11, alignItems: "center" },
  resetBtnText: { color: "#64748B", fontSize: 13, fontWeight: "500" },
  lastSaved: { fontSize: 9.5, color: "#94A3B8", textAlign: "center" },
  confirmRow: { borderWidth: 1, borderColor: "rgba(200,16,46,0.2)", borderRadius: 10, padding: 12, backgroundColor: "rgba(200,16,46,0.03)", gap: 8 },
  confirmText: { fontSize: 12, color: "#C8102E", fontWeight: "600", textAlign: "center" },
  confirmBtns: { flexDirection: "row", gap: 8 },
  confirmCancelBtn: { flex: 1, borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 8, paddingVertical: 8, alignItems: "center" },
  confirmCancelText: { fontSize: 13, color: "#64748B", fontWeight: "500" },
  confirmResetBtn: { flex: 1, backgroundColor: "#C8102E", borderRadius: 8, paddingVertical: 8, alignItems: "center" },
  confirmResetText: { fontSize: 13, color: "#FFFFFF", fontWeight: "700" },
})

