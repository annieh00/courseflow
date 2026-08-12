import React from "react"
import { View, Text, StyleSheet } from "react-native"
import type { Semester, Course } from "./degree-programs"
import { CourseCard, ChooseOneCard } from "./CourseCard"
import { GenEdSearchCard, OpenElectiveSearchCard } from "./Genedsearchcard"

export function SemesterColumn({ semester, onMoveCourse }: { semester: Semester; onMoveCourse?: (course: Course) => void }) {
  const yearNum = Math.ceil(semester.number / 2)
  const isFall = semester.number % 2 === 1

  return (
    <View style={styles.semesterContainer}>
      {/* Semester header */}
      <View style={styles.semesterHeader}>
        <Text style={styles.semesterNumber}>Semester {semester.number}</Text>
        <Text style={styles.semesterLabel}>
          Year {yearNum} — {isFall ? "Fall" : "Spring"}
        </Text>
      </View>

      {/* Course cards */}
      <View style={styles.courseGrid}>
        {semester.items.map((item, idx) => {
          if (item.kind === "course" && item.course) {
            return (
              <CourseCard
                key={item.course.code}
                course={item.course}
                onMovePress={onMoveCourse ? () => onMoveCourse(item.course) : undefined}
              />
            )
          }
          if (item.kind === "chooseOne" && item.chooseOne) {
            return <ChooseOneCard key={item.chooseOne.id} group={item.chooseOne} />
          }
          if (item.kind === "genEd" && item.genEd) {
            return (
              <GenEdSearchCard
                key={item.genEd.id}
                groupId={item.genEd.id}
                label={item.genEd.label}
              />
            )
          }
          if (item.kind === "openElective" && item.openElective) {
            return (
              <OpenElectiveSearchCard
                key={item.openElective.id}
                groupId={item.openElective.id}
                label={item.openElective.label}
              />
            )
          }
          return <View key={idx} />
        })}
      </View>
    </View>
  )
}

export function FlowchartGrid({ semesters, onMoveCourse }: { semesters: Semester[]; onMoveCourse?: (course: Course) => void }) {
  return (
    <View style={styles.grid}>
      {semesters.map((sem) => (
        <SemesterColumn key={sem.number} semester={sem} onMoveCourse={onMoveCourse} />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  grid: {
    gap: 24,
    paddingBottom: 40,
  },
  semesterContainer: {
    gap: 12,
  },
  semesterHeader: {
    backgroundColor: "#C8102E",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  semesterNumber: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  semesterLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "rgba(255,255,255,0.75)",
  },
  courseGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
})