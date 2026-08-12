import React, { useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from "react-native"

interface Semester {
  id: string
  name: string
  courses: any[]
}

interface Year {
  id: string
  year: number
  fall: Semester
  spring: Semester
}

interface AcademicPlan {
  name: string
  degree: string
  years: Year[]
}

interface PlanViewProps {
  plan: AcademicPlan
  onUpdatePlan: (plan: AcademicPlan) => void
  onBack: () => void
}

export function PlanView({ plan, onUpdatePlan, onBack }: PlanViewProps) {
  const [isEditingName, setIsEditingName] = useState(false)
  const [editedName, setEditedName] = useState(plan.name)

  const handleSaveName = () => {
    if (editedName.trim()) {
      onUpdatePlan({ ...plan, name: editedName.trim() })
      setIsEditingName(false)
    }
  }

  const handleAddYear = () => {
    const newYearNumber = plan.years.length + 1
    const timestamp = Date.now()

    const newYear: Year = {
      id: `year-${timestamp}`,
      year: newYearNumber,
      fall: {
        id: `fall-${timestamp}`,
        name: `Fall Year ${newYearNumber}`,
        courses: [],
      },
      spring: {
        id: `spring-${timestamp}`,
        name: `Spring Year ${newYearNumber}`,
        courses: [],
      },
    }

    onUpdatePlan({ ...plan, years: [...plan.years, newYear] })
  }

  const renderSemester = (semester: Semester) => {
    return (
      <View style={styles.semesterCard}>
        <Text style={styles.semesterTitle}>{semester.name}</Text>
        <Text style={styles.semesterSub}>
          {semester.courses.length} Courses
        </Text>

        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            No courses added yet.
          </Text>
        </View>

        <TouchableOpacity style={styles.addCourseButton}>
          <Text style={styles.addCourseText}>+ Add Course</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          {isEditingName ? (
            <View style={styles.editRow}>
              <TextInput
                value={editedName}
                onChangeText={setEditedName}
                style={styles.input}
                autoFocus
                onSubmitEditing={handleSaveName}
              />
              <TouchableOpacity onPress={handleSaveName}>
                <Text style={styles.saveText}>✓</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.editRow}>
              <Text style={styles.title}>{plan.name}</Text>
              <TouchableOpacity onPress={() => setIsEditingName(true)}>
                <Text style={styles.editText}>✏️</Text>
              </TouchableOpacity>
            </View>
          )}

          <Text style={styles.degree}>{plan.degree}</Text>
        </View>
      </View>

      {/* Years */}
      {plan.years.map((year) => (
        <View key={year.id} style={styles.yearContainer}>
          <Text style={styles.yearTitle}>Year {year.year}</Text>

          {renderSemester(year.fall)}
          {renderSemester(year.spring)}
        </View>
      ))}

      {/* Add Year */}
      <TouchableOpacity style={styles.addYearButton} onPress={handleAddYear}>
        <Text style={styles.addYearText}>+ Add Another Year</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 60,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  backButton: {
    marginRight: 12,
  },
  backText: {
    fontSize: 20,
  },
  editRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
  },
  degree: {
    marginTop: 4,
    color: "#666",
  },
  input: {
    fontSize: 20,
    fontWeight: "bold",
    borderBottomWidth: 1,
    borderColor: "#ccc",
    flex: 1,
  },
  saveText: {
    fontSize: 20,
    color: "green",
    marginLeft: 8,
  },
  editText: {
    fontSize: 16,
    marginLeft: 8,
  },
  yearContainer: {
    marginBottom: 32,
  },
  yearTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  semesterCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  semesterTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  semesterSub: {
    marginTop: 4,
    color: "#666",
  },
  emptyContainer: {
    marginVertical: 12,
  },
  emptyText: {
    color: "#888",
    fontStyle: "italic",
  },
  addCourseButton: {
    paddingVertical: 8,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#aaa",
    borderRadius: 8,
    alignItems: "center",
  },
  addCourseText: {
    fontSize: 14,
    color: "#555",
  },
  addYearButton: {
    marginTop: 20,
    padding: 12,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#aaa",
    alignItems: "center",
    borderRadius: 8,
  },
  addYearText: {
    fontSize: 16,
    color: "#555",
  },
})