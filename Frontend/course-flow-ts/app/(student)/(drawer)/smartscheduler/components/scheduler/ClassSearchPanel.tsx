import React, { useState } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native"
import {
  Search,
  BookOpen,
  AlertCircle,
  Ban,
  Check,
  Plus,
  Globe,
  Clock,
  Users,
  X,
  ChevronDown,
  ChevronRight,
} from "lucide-react-native"
import { useScheduler } from "./SchedulerProvider"
import { formatHour, CLASS_COLORS } from "../../lib/scheduler-constants"
import type { Course, Section } from "../../lib/scheduler-types"

export function ClassSearchPanel() {
  const {
    courses,
    isLoadingCourses,
    courseError,
    searchQuery,
    setSearchQuery,
    expandedCourseId,
    setExpandedCourseId,
    selectedEntries,
    addSection,
    removeSection,
    addAllSectionsForCourse,
    removeAllSectionsForCourse,
    doesSectionConflictWithBlocked,
  } = useScheduler()

  const [tab, setTab] = useState<"search" | "added">("search")

  const filtered = courses

  function isSectionSelected(courseId: string, sectionId: string) {
    return selectedEntries.some(
      (e) => e.course.id === courseId && e.section.id === sectionId
    )
  }

  function handleToggle(course: Course, section: Section) {
    if (isSectionSelected(course.id, section.id)) {
      removeSection(course.id, section.id)
    } else {
      addSection(course, section)
    }
  }

  const addedCourseMap = new Map<string, { course: Course; sections: Section[] }>()
  for (const entry of selectedEntries) {
    if (!addedCourseMap.has(entry.course.id)) {
      addedCourseMap.set(entry.course.id, { course: entry.course, sections: [] })
    }
    addedCourseMap.get(entry.course.id)!.sections.push(entry.section)
  }
  const addedCourses = Array.from(addedCourseMap.values())

  const colorIndices = new Map<string, number>()
  let colorIdx = 0
  for (const entry of selectedEntries) {
    if (!colorIndices.has(entry.course.id)) {
      colorIndices.set(entry.course.id, colorIdx % CLASS_COLORS.length)
      colorIdx++
    }
  }

  return (
    <View style={styles.container}>
      {/* Tab switcher */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, tab === "search" && styles.activeTab]}
          onPress={() => setTab("search")}
        >
          <View style={styles.tabContent}>
            <Search size={13} color={tab === "search" ? "#1E293B" : "#94A3B8"} />
            <Text style={[styles.tabText, tab === "search" && styles.activeTabText]}>
              Search Classes
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === "added" && styles.activeTab]}
          onPress={() => setTab("added")}
        >
          <View style={styles.tabContent}>
            <BookOpen size={13} color={tab === "added" ? "#1E293B" : "#94A3B8"} />
            <Text style={[styles.tabText, tab === "added" && styles.activeTabText]}>
              My Classes{addedCourseMap.size > 0 ? ` (${addedCourseMap.size})` : ""}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {tab === "search" ? (
        <>
          {/* Search input */}
          <View style={styles.searchBox}>
            <View style={styles.searchInputWrapper}>
              <Search size={14} color="#94A3B8" />
              <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Course name or code..."
                placeholderTextColor="#94A3B8"
              />
            </View>
          </View>

          {/* Loading state */}
          {isLoadingCourses && (
            <View style={styles.statusRow}>
              <ActivityIndicator size="small" color="#C8102E" />
              <Text style={styles.statusText}>Loading courses...</Text>
            </View>
          )}

          {/* Error state */}
          {courseError && (
            <View style={styles.errorRow}>
              <AlertCircle size={13} color="#C8102E" />
              <Text style={styles.errorText}>{courseError}</Text>
            </View>
          )}

          {/* Course list */}
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            style={styles.list}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              !isLoadingCourses && !courseError ? (
                <Text style={styles.emptyText}>No courses found</Text>
              ) : null
            }
            renderItem={({ item: course }) => {
              const isExpanded = expandedCourseId === course.id
              const selectedCount = selectedEntries.filter(
                (e) => e.course.id === course.id
              ).length

              return (
                <View style={styles.courseItem}>
                  {/* Course header */}
                  <TouchableOpacity
                    style={[
                      styles.courseHeader,
                      isExpanded && styles.courseHeaderExpanded,
                    ]}
                    onPress={() =>
                      setExpandedCourseId(isExpanded ? null : course.id)
                    }
                  >
                    {isExpanded
                      ? <ChevronDown size={14} color="#64748B" />
                      : <ChevronRight size={14} color="#94A3B8" />
                    }
                    <View style={styles.courseInfo}>
                      <View style={styles.courseCodeRow}>
                        <Text style={styles.courseCode}>{course.code}</Text>
                        {selectedCount > 0 && (
                          <View style={styles.countBadge}>
                            <Text style={styles.countBadgeText}>{selectedCount}</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.courseName} numberOfLines={1}>
                        {course.name}
                      </Text>
                    </View>
                    <View style={styles.creditBadge}>
                      <Text style={styles.creditText}>{course.credits} cr</Text>
                    </View>
                  </TouchableOpacity>

                  {/* Expanded sections */}
                  {isExpanded && (
                    <View style={styles.sectionsContainer}>
                      <TouchableOpacity
                        style={styles.addAllBtn}
                        onPress={() => addAllSectionsForCourse(course)}
                      >
                        <Plus size={11} color="#64748B" />
                        <Text style={styles.addAllBtnText}>Add All Available Sections</Text>
                      </TouchableOpacity>

                      {course.sections.map((section) => {
                        const selected = isSectionSelected(course.id, section.id)
                        const isOnline = section.slots.length === 0
                        const isBlocked = doesSectionConflictWithBlocked(section)
                        const isDisabled = isBlocked && !selected

                        return (
                          <View
                            key={section.id}
                            style={[
                              styles.sectionCard,
                              selected && styles.sectionCardSelected,
                              isBlocked && !selected && styles.sectionCardBlocked,
                            ]}
                          >
                            <View style={styles.sectionRow}>
                              <View style={styles.sectionInfo}>
                                <Text style={styles.sectionCode}>
                                  Section {section.sectionCode}
                                </Text>
                                <Text style={styles.instructor}>
                                  {section.instructor}
                                </Text>
                              </View>

                              {isBlocked && !selected ? (
                                <View style={styles.blockedTag}>
                                  <Ban size={10} color="#C8102E" />
                                  <Text style={styles.blockedTagText}>Blocked</Text>
                                </View>
                              ) : (
                                <TouchableOpacity
                                  style={[
                                    styles.addBtn,
                                    selected && styles.addBtnSelected,
                                    isDisabled && styles.addBtnDisabled,
                                  ]}
                                  onPress={() => handleToggle(course, section)}
                                  disabled={isDisabled}
                                >
                                  <View style={styles.addBtnInner}>
                                    {selected
                                      ? <Check size={11} color="#fff" />
                                      : <Plus size={11} color="#92600A" />
                                    }
                                    <Text
                                      style={[
                                        styles.addBtnText,
                                        selected && styles.addBtnTextSelected,
                                      ]}
                                    >
                                      {selected ? "Added" : "Add"}
                                    </Text>
                                  </View>
                                </TouchableOpacity>
                              )}
                            </View>

                            {isBlocked && !selected && (
                              <Text style={styles.conflictNote}>
                                Conflicts with your blocked time
                              </Text>
                            )}

                            {isOnline ? (
                              <View style={styles.onlineBadge}>
                                <Globe size={10} color="#64748B" />
                                <Text style={styles.onlineBadgeText}>Online / Async</Text>
                              </View>
                            ) : (
                              <View style={styles.slotRow}>
                                <Clock size={10} color="#94A3B8" />
                                <Text style={styles.slotText}>
                                  {section.slots
                                    .map(
                                      (s) =>
                                        `${s.day} ${formatHour(s.startHour)}–${formatHour(s.endHour)}`
                                    )
                                    .join("  •  ")}
                                </Text>
                              </View>
                            )}

                            <View style={styles.capacityRow}>
                              <Users size={10} color="#94A3B8" />
                              <Text style={styles.capacityText}>
                                Capacity: {section.capacity}
                              </Text>
                            </View>
                          </View>
                        )
                      })}
                    </View>
                  )}
                </View>
              )
            }}
          />
        </>
      ) : (
        /* My Classes tab */
        <ScrollView style={styles.list}>
          {addedCourses.length === 0 ? (
            <View style={styles.emptyState}>
              <BookOpen size={32} color="#CBD5E1" />
              <Text style={styles.emptyStateTitle}>No classes added yet</Text>
              <Text style={styles.emptyStateSubtitle}>
                Search for classes and add sections to get started
              </Text>
            </View>
          ) : (
            <View style={styles.addedList}>
              {addedCourses.map(({ course, sections }) => {
                const cIdx = colorIndices.get(course.id) ?? 0
                const color = CLASS_COLORS[cIdx]
                return (
                  <View key={course.id} style={styles.addedCourse}>
                    <View style={styles.addedCourseHeader}>
                      <View
                        style={[styles.colorDot, { backgroundColor: color.bg }]}
                      />
                      <Text style={styles.addedCourseCode}>{course.code}</Text>
                      <Text style={styles.addedCourseName} numberOfLines={1}>
                        {course.name}
                      </Text>
                      <TouchableOpacity
                        onPress={() => removeAllSectionsForCourse(course.id)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <X size={13} color="#94A3B8" />
                      </TouchableOpacity>
                    </View>

                    {sections.map((section) => (
                      <View key={section.id} style={styles.addedSection}>
                        <View style={styles.addedSectionInfo}>
                          <Text style={styles.addedSectionCode}>
                            Sec {section.sectionCode}
                          </Text>
                          <Text style={styles.addedInstructor}>
                            {section.instructor}
                          </Text>
                          {section.slots.length === 0 ? (
                            <View style={styles.addedSlotsRow}>
                              <Globe size={10} color="#64748B" />
                              <Text style={styles.addedSlots}>Online / Async</Text>
                            </View>
                          ) : (
                            <Text style={styles.addedSlots}>
                              {section.slots
                                .map(
                                  (s) =>
                                    `${s.day} ${formatHour(s.startHour)}–${formatHour(s.endHour)}`
                                )
                                .join("  ")}
                            </Text>
                          )}
                        </View>
                        <TouchableOpacity
                          onPress={() => removeSection(course.id, section.id)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <X size={12} color="#94A3B8" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )
              })}

              <Text style={styles.summaryText}>
                {addedCourses.length} course{addedCourses.length !== 1 ? "s" : ""},{" "}
                {selectedEntries.length} section{selectedEntries.length !== 1 ? "s" : ""} selected for combinations
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  tabRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#C8102E",
  },
  tabContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  tabText: {
    fontSize: 12,
    color: "#94A3B8",
    fontWeight: "500",
  },
  activeTabText: {
    color: "#1E293B",
    fontWeight: "600",
  },
  searchBox: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  searchInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    paddingHorizontal: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 9,
    fontSize: 14,
    color: "#1E293B",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  statusText: {
    fontSize: 13,
    color: "#64748B",
  },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(200,16,46,0.06)",
    borderWidth: 1,
    borderColor: "rgba(200,16,46,0.2)",
    borderRadius: 8,
    marginHorizontal: 12,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  errorText: {
    fontSize: 13,
    color: "#C8102E",
    flex: 1,
  },
  list: {
    flex: 1,
  },
  emptyText: {
    color: "#94A3B8",
    fontSize: 14,
    textAlign: "center",
    marginTop: 32,
  },
  courseItem: {
    marginHorizontal: 8,
    marginTop: 4,
  },
  courseHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  courseHeaderExpanded: {
    backgroundColor: "#F8FAFC",
  },
  courseInfo: {
    flex: 1,
  },
  courseCodeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  courseCode: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1E293B",
  },
  countBadge: {
    backgroundColor: "rgba(200,16,46,0.1)",
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  countBadgeText: {
    fontSize: 10,
    color: "#C8102E",
    fontWeight: "600",
  },
  courseName: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 1,
  },
  creditBadge: {
    backgroundColor: "#F1F5F9",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  creditText: {
    fontSize: 10,
    color: "#64748B",
  },
  sectionsContainer: {
    marginLeft: 16,
    marginBottom: 8,
    gap: 6,
  },
  addAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderStyle: "dashed",
    borderRadius: 6,
    paddingVertical: 7,
    paddingHorizontal: 10,
    marginBottom: 2,
  },
  addAllBtnText: {
    fontSize: 11,
    color: "#64748B",
  },
  sectionCard: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    padding: 10,
    backgroundColor: "#FFFFFF",
  },
  sectionCardSelected: {
    borderColor: "rgba(200,16,46,0.3)",
    backgroundColor: "rgba(200,16,46,0.04)",
  },
  sectionCardBlocked: {
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
    opacity: 0.7,
  },
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  sectionInfo: {
    flex: 1,
  },
  sectionCode: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1E293B",
  },
  instructor: {
    fontSize: 10,
    color: "#64748B",
    marginTop: 1,
  },
  addBtn: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "#F8FAFC",
  },
  addBtnSelected: {
    backgroundColor: "#C8102E",
    borderColor: "#C8102E",
  },
  addBtnDisabled: {
    opacity: 0.4,
  },
  addBtnInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  addBtnText: {
    fontSize: 11,
    color: "#92600A",
    fontWeight: "500",
  },
  addBtnTextSelected: {
    color: "#fff",
  },
  blockedTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: "rgba(200,16,46,0.25)",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "rgba(200,16,46,0.06)",
  },
  blockedTagText: {
    fontSize: 10,
    color: "#C8102E",
  },
  conflictNote: {
    fontSize: 10,
    color: "#C8102E",
    marginBottom: 4,
    opacity: 0.8,
  },
  onlineBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: "flex-start",
    marginBottom: 4,
  },
  onlineBadgeText: {
    fontSize: 10,
    color: "#64748B",
  },
  slotRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  slotText: {
    fontSize: 10,
    color: "#64748B",
  },
  capacityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  capacityText: {
    fontSize: 10,
    color: "#64748B",
  },
  // My Classes tab
  emptyState: {
    alignItems: "center",
    paddingTop: 48,
    paddingHorizontal: 24,
    gap: 12,
  },
  emptyStateTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1E293B",
  },
  emptyStateSubtitle: {
    fontSize: 12,
    color: "#64748B",
    textAlign: "center",
  },
  addedList: {
    padding: 12,
    gap: 10,
  },
  addedCourse: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
  },
  addedCourseHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    gap: 8,
    backgroundColor: "#F8FAFC",
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 3,
  },
  addedCourseCode: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1E293B",
  },
  addedCourseName: {
    flex: 1,
    fontSize: 11,
    color: "#64748B",
  },
  addedSection: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    justifyContent: "space-between",
  },
  addedSectionInfo: {
    flex: 1,
    gap: 2,
  },
  addedSectionCode: {
    fontSize: 11,
    fontWeight: "600",
    color: "#1E293B",
  },
  addedInstructor: {
    fontSize: 10,
    color: "#64748B",
  },
  addedSlotsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  addedSlots: {
    fontSize: 10,
    color: "#64748B",
  },
  summaryText: {
    fontSize: 11,
    color: "#94A3B8",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 16,
  },
})
