import React from "react"
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native"
import type { Course, ChooseOneGroup } from "./degree-programs"
import { useFlowchart } from "./FlowchartContext"

// ISU palette
const TYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  required:          { bg: "#FEF2F2", text: "#9B0F24",  border: "#FECACA" },
  "SE Elective":     { bg: "#FEFCE8", text: "#854D0E",  border: "#FEF08A" },  // yellow
  "SPPLM Elective":  { bg: "#F0FDF4", text: "#15803D",  border: "#BBF7D0" },  // green
  "Open Elective":   { bg: "#EFF6FF", text: "#1D4ED8",  border: "#BFDBFE" },  // blue
  "Gen Ed":          { bg: "#EFF6FF", text: "#1D4ED8",  border: "#BFDBFE" },  // blue
  "Senior Design":   { bg: "#FFFDF0", text: "#92650A",  border: "#F1BE48" },  // gold tint
}

// Card-level accent (border, background, accent color) per elective type for ChooseOneCard
const CARD_ACCENT: Record<string, { border: string; bg: string; accent: string }> = {
  "SE Elective":    { border: "rgba(202,138,4,0.35)",  bg: "rgba(254,252,232,0.5)", accent: "#CA8A04" },
  "SPPLM Elective": { border: "rgba(21,128,61,0.3)",   bg: "rgba(240,253,244,0.5)", accent: "#15803D" },
}
const DEFAULT_CARD_ACCENT = { border: "rgba(200,16,46,0.25)", bg: "rgba(200,16,46,0.015)", accent: "#C8102E" }

const TYPE_LABELS: Record<string, string> = {
  required:          "Required",      // Default label for standard required courses
  "SE Elective":     "SE Elec.",
  "SPPLM Elective":  "SPPLM",
  "Open Elective":   "Open",
  "Gen Ed":          "Gen Ed",
  "Senior Design":   "Sr. Design",
}

function StatusIndicator({ status }: { status: "default" | "in-progress" | "completed" }) {
  if (status === "completed") {
    return (
      <View style={[styles.checkbox, styles.checkboxCompleted]}>
        <Text style={styles.checkboxIcon}>✓</Text>
      </View>
    )
  }
  if (status === "in-progress") {
    return (
      <View style={[styles.checkbox, styles.checkboxInProgress]}>
        <Text style={styles.checkboxIconGold}>◑</Text>
      </View>
    )
  }
  return <View style={styles.checkbox} />
}

export function CourseCard({ course, onMovePress }: { course: Course; onMovePress?: () => void }) {
  const { getCourseStatus, cycleCourseStatus, arePrerequisitesMet } = useFlowchart()

  const status = getCourseStatus(course.code)
  const prereqsMet = arePrerequisitesMet(course)
  const color = TYPE_COLORS[course.type] ?? TYPE_COLORS["Gen Ed"]

  const isCompleted = status === "completed"
  const isInProgress = status === "in-progress"
  const isLocked = !prereqsMet && status === "default"

  // Logic: Use "Engr Basic" if flag is true, otherwise use the mapping for the type
  const badgeLabel = course.isEngrBasic 
    ? "Engr Basic" 
    : (TYPE_LABELS[course.type] ?? course.type);

  return (
    <TouchableOpacity
      activeOpacity={0.78}
      onPress={() => cycleCourseStatus(course.code)}
      onLongPress={onMovePress}
      delayLongPress={400}
      style={[
        styles.card,
        isCompleted  ? styles.cardCompleted  :
        isInProgress ? styles.cardInProgress :
        isLocked     ? styles.cardLocked     :
                       styles.cardDefault,
      ]}
    >
      <View style={styles.topRow}>
        <StatusIndicator status={status} />
        <Text
          style={[
            styles.courseCode,
            isCompleted  && styles.courseCodeCompleted,
            isInProgress && styles.courseCodeInProgress,
          ]}
          numberOfLines={1}
        >
          {course.code}
        </Text>
        <View style={[styles.badge, { backgroundColor: color.bg, borderColor: color.border }]}>
          <Text style={[styles.badgeText, { color: color.text }]}>
            {badgeLabel}
          </Text>
        </View>
      </View>

      <Text
        style={[
          styles.courseTitle,
          isCompleted  && styles.courseTitleCompleted,
          isInProgress && styles.courseTitleInProgress,
        ]}
        numberOfLines={2}
      >
        {course.title}
      </Text>

      <View style={styles.bottomRow}>
        <Text style={styles.credits}>{course.credits} cr</Text>
        {onMovePress && (
          <Text style={styles.moveHint}>⇄</Text>
        )}
        {isInProgress && (
          <View style={styles.inProgressPill}>
            <View style={styles.inProgressDot} />
            <Text style={styles.inProgressPillText}>In Progress</Text>
          </View>
        )}
        {isLocked && !isCompleted && !isInProgress && (
          <Text style={styles.prereqWarning}>
            🔒 {course.prerequisites?.slice(0, 1).join("")}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  )
}

const SCROLL_THRESHOLD = 4
const ITEM_HEIGHT = 44
const MAX_VISIBLE = 3.5

export function ChooseOneCard({ group }: { group: ChooseOneGroup }) {
  const {
    getCourseStatus,
    cycleCourseStatus,
    selectChooseOne,
    getChooseOneSelection,
  } = useFlowchart()

  const firstCourse = group.courses[0]
  const groupType = firstCourse?.type ?? "required"
  const color = TYPE_COLORS[groupType] ?? TYPE_COLORS["Gen Ed"]
  const cardAccent = CARD_ACCENT[groupType] ?? DEFAULT_CARD_ACCENT

  // Logic: Check if courses in this group are flagged as Engr Basic
  const badgeLabel = firstCourse?.isEngrBasic
    ? "Engr Basic"
    : (TYPE_LABELS[groupType] ?? groupType);

  const selectedCode = getChooseOneSelection(group.id)
  const completedInGroup = group.courses.filter((c) => getCourseStatus(c.code) === "completed")
  const hasMultipleCompleted = completedInGroup.length > 1
  const isScrollable = group.courses.length > SCROLL_THRESHOLD

  const handleToggle = (course: Course) => {
    cycleCourseStatus(course.code)
    const newStatus = getCourseStatus(course.code)
    if (newStatus !== "completed") {
      selectChooseOne(group.id, course.code)
    }
  }

  const courseList = group.courses.map((course) => {
    const status = getCourseStatus(course.code)
    const isCompleted = status === "completed"
    const isInProgress = status === "in-progress"
    const isSelected = selectedCode === course.code

    return (
      <TouchableOpacity
        key={course.code}
        style={[
          styles.chooseOneItem,
          isCompleted  ? styles.chooseOneItemCompleted  :
          isInProgress ? styles.chooseOneItemInProgress :
          isSelected   ? styles.chooseOneItemSelected   :
                         styles.chooseOneItemDefault,
        ]}
        onPress={() => handleToggle(course)}
      >
        <StatusIndicator status={status} />
        <View style={{ flex: 1 }}>
          <Text
            style={[
              styles.chooseOneCourseCode,
              isCompleted  && styles.courseCodeCompleted,
              isInProgress && styles.courseCodeInProgress,
            ]}
          >
            {course.code}
          </Text>
          <Text style={styles.chooseOneCourseTitle} numberOfLines={1}>
            {course.title}
          </Text>
        </View>
        <Text style={styles.credits}>{course.credits}cr</Text>
      </TouchableOpacity>
    )
  })

  return (
    <View style={[styles.chooseOneCard, { borderColor: cardAccent.border, backgroundColor: cardAccent.bg }]}>
      <View style={styles.chooseOneHeader}>
        <View style={styles.chooseOneHeaderLeft}>
          <View style={[styles.chooseOneDiamond, { backgroundColor: cardAccent.accent }]} />
          <Text style={[styles.chooseOneLabel, { color: cardAccent.accent }]}>{group.label}</Text>
        </View>

        <View style={styles.chooseOneHeaderRight}>
          <View style={[styles.badge, { backgroundColor: color.bg, borderColor: color.border }]}>
            <Text style={[styles.badgeText, { color: color.text }]}>
              {badgeLabel}
            </Text>
          </View>

          {hasMultipleCompleted && (
            <Text style={styles.chooseOneWarning}>⚠ Only one counts</Text>
          )}
        </View>
      </View>

      {isScrollable ? (
        <View style={styles.scrollContainer}>
          <ScrollView
            style={{ maxHeight: ITEM_HEIGHT * MAX_VISIBLE }}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
          >
            <View style={styles.scrollInner}>{courseList}</View>
          </ScrollView>
          <View style={styles.scrollFadeBottom} pointerEvents="none" />
          <View style={styles.scrollHintRow}>
            <Text style={[styles.scrollHintText, { color: cardAccent.accent }]}>↕ scroll for more</Text>
          </View>
        </View>
      ) : (
        <View style={{ gap: 6 }}>{courseList}</View>
      )}

      <Text style={[styles.legendText, { borderTopColor: cardAccent.border }]}>
        Tap once: in progress · twice: done · again: clear
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    width: "18%",
    borderWidth: 1,
    borderRadius: 10,
    padding: 8,
    marginBottom: 10,
    gap: 4,
    overflow: "hidden",
    position: "relative",
  },
  cardDefault: { borderColor: "#E2E8F0", backgroundColor: "#FFFFFF" },
  cardCompleted: { borderColor: "rgba(26,127,75,0.35)", backgroundColor: "rgba(26,127,75,0.04)" },
  cardInProgress: { borderColor: "rgba(241,190,72,0.5)", backgroundColor: "#FFFDF4", borderLeftColor: "#C8102E", borderLeftWidth: 3 },
  cardLocked: { borderColor: "rgba(200,16,46,0.15)", backgroundColor: "rgba(200,16,46,0.025)" },
  checkbox: { width: 18, height: 18, borderRadius: 5, borderWidth: 1.5, borderColor: "#CBD5E1", alignItems: "center", justifyContent: "center", flexShrink: 0, backgroundColor: "#FFFFFF" },
  checkboxCompleted: { backgroundColor: "#1A7F4B", borderColor: "#1A7F4B" },
  checkboxInProgress: { backgroundColor: "#F1BE48", borderColor: "#D4A017" },
  checkboxIcon: { color: "#fff", fontSize: 11, fontWeight: "700", lineHeight: 14 },
  checkboxIconGold: { color: "#7A5C00", fontSize: 12, fontWeight: "800", lineHeight: 14 },
  topRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  courseCode: { flex: 1, fontSize: 12, fontWeight: "700", color: "#1E293B", letterSpacing: -0.1 },
  courseCodeCompleted: { color: "#1A7F4B", textDecorationLine: "line-through" },
  courseCodeInProgress: { color: "#92400E" },
  badge: { borderWidth: 1, borderRadius: 5, paddingHorizontal: 5, paddingVertical: 2 },
  badgeText: { fontSize: 8, fontWeight: "600", letterSpacing: 0.1 },
  courseTitle: { fontSize: 10.5, color: "#64748B", lineHeight: 15 },
  courseTitleCompleted: { textDecorationLine: "line-through", color: "#94A3B8" },
  courseTitleInProgress: { color: "#78350F" },
  bottomRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 3, marginTop: 1 },
  credits: { fontSize: 10, fontWeight: "500", color: "#94A3B8" },
  inProgressPill: { flexDirection: "row", alignItems: "center", gap: 3 },
  inProgressDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: "#C8102E" },
  inProgressPillText: { fontSize: 8.5, fontWeight: "600", color: "#92400E", letterSpacing: 0.1 },
  prereqWarning: { fontSize: 9, color: "#C8102E", flexShrink: 1 },
  moveHint: { fontSize: 10, color: "#CBD5E1", fontWeight: "600" },
  chooseOneCard: { borderWidth: 1.5, borderStyle: "dashed", borderColor: "rgba(200,16,46,0.25)", borderRadius: 10, padding: 10, backgroundColor: "rgba(200,16,46,0.015)", marginBottom: 8, gap: 7 },
  chooseOneHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  chooseOneHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 5 },
  chooseOneHeaderRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  chooseOneDiamond: { width: 6, height: 6, backgroundColor: "#C8102E", transform: [{ rotate: "45deg" }] },
  chooseOneLabel: { fontSize: 10.5, fontWeight: "700", color: "#C8102E", letterSpacing: 0.2 },
  chooseOneWarning: { fontSize: 9.5, color: "#B45309" },
  chooseOneItem: { flexDirection: "row", alignItems: "center", gap: 7, borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 7 },
  chooseOneItemDefault: { borderColor: "#E2E8F0", backgroundColor: "#FFFFFF" },
  chooseOneItemCompleted: { borderColor: "rgba(26,127,75,0.3)", backgroundColor: "rgba(26,127,75,0.04)" },
  chooseOneItemInProgress: { borderColor: "rgba(241,190,72,0.5)", backgroundColor: "#FFFDF4", borderLeftColor: "#C8102E", borderLeftWidth: 2 },
  chooseOneItemSelected: { borderColor: "rgba(200,16,46,0.25)", backgroundColor: "rgba(200,16,46,0.03)" },
  chooseOneCourseCode: { fontSize: 11, fontWeight: "700", color: "#1E293B" },
  chooseOneCourseTitle: { fontSize: 10, color: "#64748B", marginTop: 1 },
  scrollContainer: { position: "relative" },
  scrollInner: { gap: 6, paddingBottom: 4 },
  scrollFadeBottom: { position: "absolute", bottom: 0, left: 0, right: 0, height: 28, backgroundColor: "rgba(255,253,244,0.85)", borderBottomLeftRadius: 6, borderBottomRightRadius: 6 },
  scrollHintRow: { alignItems: "center", paddingTop: 4, paddingBottom: 2 },
  scrollHintText: { fontSize: 8.5, color: "#C8102E", fontWeight: "600", letterSpacing: 0.2, opacity: 0.7 },
  legendText: { fontSize: 8.5, color: "#94A3B8", textAlign: "center", letterSpacing: 0.1, borderTopWidth: 1, borderTopColor: "rgba(200,16,46,0.1)", paddingTop: 6 },
})