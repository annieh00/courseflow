import React, { useState, useEffect, useMemo } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from "react-native"
import { useFlowchart } from "./FlowchartContext"

// ─── Config ───────────────────────────────────────────────────────────────────
const _isLocal = typeof window === 'undefined' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const BASE_URL = `${_isLocal ? 'http://localhost:8080' : 'https://sdmay26-48.ece.iastate.edu'}/api/degree/SE/electives`
const MAX_VISIBLE = 3.5
const ITEM_HEIGHT = 44

// ─── API shape ────────────────────────────────────────────────────────────────
interface ElectiveEntry {
  requirementId: number
  courseId: string
  courseNumber: string
  courseTitle: string
  credits: string
  minGrade: string
}

// ─── Theme — drives all colors for a given elective type ─────────────────────
interface ElectiveTheme {
  badgeLabel: string
  accentColor: string
  cardBorderColor: string
  cardBgColor: string
  badgeBg: string
  badgeBorder: string
  badgeTextColor: string
  fadeBgColor: string
  legendBorderColor: string
  clearBtnBorderColor: string
  clearBtnTextColor: string
  rowSelectedBorder: string
  rowSelectedBg: string
}

const GEN_ED_THEME: ElectiveTheme = {
  badgeLabel:          "Gen Ed",
  accentColor:         "#1D4ED8",
  cardBorderColor:     "rgba(37,99,235,0.3)",
  cardBgColor:         "rgba(239,246,255,0.6)",
  badgeBg:             "#EFF6FF",
  badgeBorder:         "#BFDBFE",
  badgeTextColor:      "#1D4ED8",
  fadeBgColor:         "rgba(239,246,255,0.85)",
  legendBorderColor:   "rgba(37,99,235,0.1)",
  clearBtnBorderColor: "rgba(200,16,46,0.2)",
  clearBtnTextColor:   "#C8102E",
  rowSelectedBorder:   "rgba(37,99,235,0.3)",
  rowSelectedBg:       "rgba(37,99,235,0.04)",
}

const OPEN_ELECTIVE_THEME: ElectiveTheme = {
  badgeLabel:          "Open",
  accentColor:         "#1D4ED8",
  cardBorderColor:     "rgba(37,99,235,0.3)",
  cardBgColor:         "rgba(239,246,255,0.6)",
  badgeBg:             "#EFF6FF",
  badgeBorder:         "#BFDBFE",
  badgeTextColor:      "#1D4ED8",
  fadeBgColor:         "rgba(239,246,255,0.85)",
  legendBorderColor:   "rgba(37,99,235,0.1)",
  clearBtnBorderColor: "rgba(200,16,46,0.2)",
  clearBtnTextColor:   "#C8102E",
  rowSelectedBorder:   "rgba(37,99,235,0.3)",
  rowSelectedBg:       "rgba(37,99,235,0.04)",
}

// ─── Internal props ───────────────────────────────────────────────────────────
interface ElectiveSearchCardProps {
  groupId: string
  label: string
  electiveType: string    // passed straight to ?type= query param
  theme: ElectiveTheme
}

// Helper: wipe a course code from both status sets so it returns to "default".
// Used so that swapping selections in one slot doesn't leave ghost statuses on
// course codes that other slots might share in their list.
function resetCourseStatus(
  code: string,
  setCompleted: React.Dispatch<React.SetStateAction<Set<string>>>,
  setInProgress: React.Dispatch<React.SetStateAction<Set<string>>>
) {
  setCompleted((prev) => { const s = new Set(prev); s.delete(code); return s })
  setInProgress((prev) => { const s = new Set(prev); s.delete(code); return s })
}

// ─── Status indicator — identical to CourseCard ───────────────────────────────
function StatusIndicator({ status }: { status: "default" | "in-progress" | "completed" }) {
  if (status === "completed")
    return (
      <View style={[styles.checkbox, styles.checkboxCompleted]}>
        <Text style={styles.checkboxIcon}>✓</Text>
      </View>
    )
  if (status === "in-progress")
    return (
      <View style={[styles.checkbox, styles.checkboxInProgress]}>
        <Text style={styles.checkboxIconGold}>◑</Text>
      </View>
    )
  return <View style={styles.checkbox} />
}

// ─── Base component (not exported — use the wrappers below) ───────────────────
function ElectiveSearchCard({ groupId, label, electiveType, theme }: ElectiveSearchCardProps) {
  const {
    setCompletedCourses,
    setInProgressCourses,
    selectChooseOne,
    getChooseOneSelection,
  } = useFlowchart()

  const [allCourses, setAllCourses] = useState<ElectiveEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState(false)
  const [query, setQuery] = useState("")
  const [isExpanded, setIsExpanded] = useState(false)
  // Local per-slot status — prevents selection in one card from highlighting
  // the same course in sibling cards that share the same course list.
  const [slotStatus, setSlotStatus] = useState<"default" | "in-progress" | "completed">("default")

  // Fetch the list once on mount
  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch(`${BASE_URL}?type=${electiveType}`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data: ElectiveEntry[] = await res.json()
        setAllCourses(data)
      } catch {
        setFetchError(true)
      } finally {
        setIsLoading(false)
      }
    })()
  }, [electiveType])

  // Deduplicate by courseNumber — same course can appear multiple times in the
  // API response when it satisfies more than one requirement row.
  const uniqueCourses = useMemo(() => {
    const seen = new Set<string>()
    return allCourses.filter((c) => {
      if (seen.has(c.courseNumber)) return false
      seen.add(c.courseNumber)
      return true
    })
  }, [allCourses])

  // Client-side filter on course number OR title
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return uniqueCourses
    return uniqueCourses.filter(
      (c) =>
        c.courseNumber.toLowerCase().includes(q) ||
        c.courseTitle.toLowerCase().includes(q)
    )
  }, [query, uniqueCourses])

  const selectedCode = getChooseOneSelection(groupId)
  const selectedEntry = selectedCode
    ? uniqueCourses.find((c) => c.courseNumber === selectedCode)
    : null

  // Cycle this slot's local status and keep global sets in sync for backend save
  const cycleSlotStatus = () => {
    if (!selectedCode) return
    setSlotStatus((prev) => {
      let next: "default" | "in-progress" | "completed"
      if (prev === "default") next = "in-progress"
      else if (prev === "in-progress") next = "completed"
      else next = "default"

      if (next === "in-progress") {
        setInProgressCourses((p) => new Set([...p, selectedCode]))
        setCompletedCourses((p) => { const s = new Set(p); s.delete(selectedCode); return s })
      } else if (next === "completed") {
        setCompletedCourses((p) => new Set([...p, selectedCode]))
        setInProgressCourses((p) => { const s = new Set(p); s.delete(selectedCode); return s })
      } else {
        setInProgressCourses((p) => { const s = new Set(p); s.delete(selectedCode); return s })
        setCompletedCourses((p) => { const s = new Set(p); s.delete(selectedCode); return s })
      }
      return next
    })
  }

  const handleSelect = (entry: ElectiveEntry) => {
    // Clear the previously selected course for THIS slot only before switching
    if (selectedCode && selectedCode !== entry.courseNumber) {
      resetCourseStatus(selectedCode, setCompletedCourses, setInProgressCourses)
    }
    // Mark the new course as in-progress and store the selection
    setInProgressCourses((prev) => new Set([...prev, entry.courseNumber]))
    selectChooseOne(groupId, entry.courseNumber)
    setSlotStatus("in-progress")
    setIsExpanded(false)
    setQuery("")
  }

  const handleClearSelection = () => {
    if (!selectedCode) return
    resetCourseStatus(selectedCode, setCompletedCourses, setInProgressCourses)
    selectChooseOne(groupId, "")
    setSlotStatus("default")
    setQuery("")
  }

  // ── Shared header ─────────────────────────────────────────────────────────
  const Header = () => (
    <View style={styles.cardHeader}>
      <View style={styles.headerLeft}>
        <View style={[styles.diamond, { backgroundColor: theme.accentColor }]} />
        <Text style={[styles.cardLabel, { color: theme.accentColor }]}>{label}</Text>
      </View>
      <View style={[styles.badge, { backgroundColor: theme.badgeBg, borderColor: theme.badgeBorder }]}>
        <Text style={[styles.badgeText, { color: theme.badgeTextColor }]}>{theme.badgeLabel}</Text>
      </View>
    </View>
  )

  // ── View A: course selected, picker collapsed ─────────────────────────────
  if (selectedEntry && !isExpanded) {
    const isCompleted = slotStatus === "completed"
    const isInProgress = slotStatus === "in-progress"

    return (
      <View style={[styles.card, { borderColor: theme.cardBorderColor, backgroundColor: theme.cardBgColor }]}>
        <Header />

        <TouchableOpacity
          style={[
            styles.selectedRow,
            isCompleted && styles.rowCompleted,
            isInProgress && styles.rowInProgress,
          ]}
          onPress={cycleSlotStatus}
          activeOpacity={0.75}
        >
          <StatusIndicator status={slotStatus} />
          <View style={{ flex: 1 }}>
            <Text
              style={[
                styles.courseCode,
                isCompleted && styles.courseCodeCompleted,
                isInProgress && styles.courseCodeInProgress,
              ]}
              numberOfLines={1}
            >
              {selectedEntry.courseNumber}
            </Text>
            <Text style={styles.courseTitle} numberOfLines={1}>
              {selectedEntry.courseTitle}
            </Text>
          </View>
          <Text style={styles.credits}>{selectedEntry.credits}cr</Text>
        </TouchableOpacity>

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.changeBtn} onPress={() => setIsExpanded(true)}>
            <Text style={styles.changeBtnText}>↩ Change</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.clearBtn, { borderColor: theme.clearBtnBorderColor }]}
            onPress={handleClearSelection}
          >
            <Text style={[styles.clearBtnText, { color: theme.clearBtnTextColor }]}>✕ Clear</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.legendText, { borderTopColor: theme.legendBorderColor }]}>
          Tap course · once: in progress · twice: done · again: clear
        </Text>
      </View>
    )
  }

  // ── View B: picker open ───────────────────────────────────────────────────
  return (
    <View style={[styles.card, { borderColor: theme.cardBorderColor, backgroundColor: theme.cardBgColor }]}>
      <Header />

      <View style={styles.searchRow}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by code or title…"
          placeholderTextColor="#94A3B8"
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
          autoCapitalize="characters"
          returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity
            onPress={() => setQuery("")}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.clearInputIcon}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="small" color={theme.accentColor} />
          <Text style={styles.stateText}>Loading courses…</Text>
        </View>
      ) : fetchError ? (
        <View style={styles.centerBox}>
          <Text style={styles.errorText}>⚠ Could not load courses. Check your connection.</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.centerBox}>
          <Text style={styles.stateText}>No matches for "{query}"</Text>
        </View>
      ) : (
        <View style={styles.scrollContainer}>
          <ScrollView
            style={{ maxHeight: ITEM_HEIGHT * MAX_VISIBLE }}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
          >
            <View style={{ gap: 5, paddingBottom: 4 }}>
              {filtered.map((entry) => {
                const isSelectedByThisSlot = selectedCode === entry.courseNumber
                const status = isSelectedByThisSlot ? slotStatus : "default"
                const isCompleted = status === "completed"
                const isInProgress = status === "in-progress"
                const isSelected = isSelectedByThisSlot

                return (
                  <TouchableOpacity
                    key={entry.courseNumber}
                    style={[
                      styles.resultItem,
                      isCompleted && styles.rowCompleted,
                      isInProgress && styles.rowInProgress,
                      isSelected && !isCompleted && !isInProgress && {
                        borderColor: theme.rowSelectedBorder,
                        backgroundColor: theme.rowSelectedBg,
                      },
                    ]}
                    onPress={() => handleSelect(entry)}
                    activeOpacity={0.75}
                  >
                    <StatusIndicator status={status} />
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.courseCode,
                          isCompleted && styles.courseCodeCompleted,
                          isInProgress && styles.courseCodeInProgress,
                        ]}
                        numberOfLines={1}
                      >
                        {entry.courseNumber}
                      </Text>
                      <Text style={styles.courseTitle} numberOfLines={1}>
                        {entry.courseTitle}
                      </Text>
                    </View>
                    <Text style={styles.credits}>{entry.credits}cr</Text>
                  </TouchableOpacity>
                )
              })}
            </View>
          </ScrollView>

          <View
            style={[styles.fadeBottom, { backgroundColor: theme.fadeBgColor }]}
            pointerEvents="none"
          />
          <View style={styles.scrollHintRow}>
            <Text style={[styles.scrollHintText, { color: theme.accentColor }]}>
              {query
                ? `${filtered.length} result${filtered.length !== 1 ? "s" : ""}`
                : `↕ ${uniqueCourses.length} courses available · type to filter`}
            </Text>
          </View>
        </View>
      )}

      <Text style={[styles.legendText, { borderTopColor: theme.legendBorderColor }]}>
        Tap a course to select it
      </Text>
    </View>
  )
}

// ─── Public exports ───────────────────────────────────────────────────────────

interface SearchCardProps {
  groupId: string
  label?: string
}

export function GenEdSearchCard({ groupId, label = "Gen Ed Elective" }: SearchCardProps) {
  return (
    <ElectiveSearchCard
      groupId={groupId}
      label={label}
      electiveType="GENERAL_EDUCATION"
      theme={GEN_ED_THEME}
    />
  )
}

export function OpenElectiveSearchCard({ groupId, label = "Open Elective" }: SearchCardProps) {
  return (
    <ElectiveSearchCard
      groupId={groupId}
      label={label}
      electiveType="GENERAL_EDUCATION"
      theme={OPEN_ELECTIVE_THEME}
    />
  )
}

// ─── Styles — all theme-independent rules live here ───────────────────────────
const styles = StyleSheet.create({
  card: {
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    gap: 7,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 5 },
  diamond: { width: 6, height: 6, transform: [{ rotate: "45deg" }] },
  cardLabel: { fontSize: 10.5, fontWeight: "700", letterSpacing: 0.2 },
  badge: { borderWidth: 1, borderRadius: 5, paddingHorizontal: 5, paddingVertical: 2 },
  badgeText: { fontSize: 8, fontWeight: "600", letterSpacing: 0.1 },

  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 6,
  },
  searchIcon: { fontSize: 12 },
  searchInput: { flex: 1, fontSize: 12, color: "#1E293B", padding: 0 },
  clearInputIcon: { fontSize: 11, color: "#94A3B8", fontWeight: "700", paddingHorizontal: 2 },

  scrollContainer: { position: "relative" },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 7,
    backgroundColor: "#FFFFFF",
    borderColor: "#E2E8F0",
  },
  rowCompleted: {
    borderColor: "rgba(26,127,75,0.3)",
    backgroundColor: "rgba(26,127,75,0.04)",
  },
  rowInProgress: {
    borderColor: "rgba(241,190,72,0.5)",
    backgroundColor: "#FFFDF4",
    borderLeftColor: "#C8102E",
    borderLeftWidth: 2,
  },
  fadeBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 28,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
  },
  scrollHintRow: { alignItems: "center", paddingTop: 4, paddingBottom: 2 },
  scrollHintText: { fontSize: 8.5, fontWeight: "600", letterSpacing: 0.2, opacity: 0.7 },

  selectedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 7,
    backgroundColor: "#FFFFFF",
    borderColor: "#E2E8F0",
  },
  actionRow: { flexDirection: "row", gap: 6 },
  changeBtn: {
    flex: 1,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
  },
  changeBtnText: { fontSize: 10, fontWeight: "600", color: "#475569" },
  clearBtn: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: "center",
  },
  clearBtnText: { fontSize: 10, fontWeight: "600" },

  checkbox: {
    width: 18, height: 18, borderRadius: 5, borderWidth: 1.5,
    borderColor: "#CBD5E1", alignItems: "center", justifyContent: "center",
    flexShrink: 0, backgroundColor: "#FFFFFF",
  },
  checkboxCompleted: { backgroundColor: "#1A7F4B", borderColor: "#1A7F4B" },
  checkboxInProgress: { backgroundColor: "#F1BE48", borderColor: "#D4A017" },
  checkboxIcon: { color: "#fff", fontSize: 11, fontWeight: "700", lineHeight: 14 },
  checkboxIconGold: { color: "#7A5C00", fontSize: 12, fontWeight: "800", lineHeight: 14 },

  courseCode: { fontSize: 11, fontWeight: "700", color: "#1E293B" },
  courseCodeCompleted: { color: "#1A7F4B", textDecorationLine: "line-through" },
  courseCodeInProgress: { color: "#92400E" },
  courseTitle: { fontSize: 10, color: "#64748B", marginTop: 1 },
  credits: { fontSize: 10, fontWeight: "500", color: "#94A3B8" },

  legendText: {
    fontSize: 8.5, color: "#94A3B8", textAlign: "center",
    letterSpacing: 0.1, borderTopWidth: 1, paddingTop: 6,
  },
  centerBox: { alignItems: "center", paddingVertical: 14, gap: 6 },
  stateText: { fontSize: 11, color: "#94A3B8" },
  errorText: { fontSize: 11, color: "#C8102E", textAlign: "center" },
})