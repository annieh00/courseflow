// app/(admin)/(drawer)/courses.tsx
import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useTheme } from "../../../../components/ThemeContext";

const API_BASE =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

/**
 * Shape of the Course as returned/expected by the Spring backend.
 * (Based on Course.java)
 */
type BackendCourse = {
  id: number;            // field name in JSON is "id"
  courseNum: string;     // maps to column course_number
  coursename: string;    // title
  description?: string | null;
  course_level?: string | null;
  credits: string;       // stored as String in entity
  subject_id?: number | null;
  meetingTimes?: string | null;
  remainingSeats?: number | null;
  location?: string | null;
  professors?: string | null;
  section?: string | null;
  semester?: string | null;
};

/**
 * Shape used in the UI.
 */
type Course = {
  id: number;
  code: string;          // e.g. "SE 339" (courseNum)
  title: string;         // coursename
  credits: number;
  department?: string | null;
  active?: boolean;
};

const MOCK_COURSES: Course[] = [
  {
    id: 1,
    code: "SE 339",
    title: "Software Architecture and Design",
    credits: 3,
    department: "SE",
    active: true,
  },
  {
    id: 2,
    code: "COM S 311",
    title: "Design and Analysis of Algorithms",
    credits: 3,
    department: "COM S",
    active: true,
  },
];

/** Map backend Course -> UI Course */
function mapBackendToCourse(b: BackendCourse): Course {
  // Optional: derive department from the first token of courseNum
  const parts = (b.courseNum ?? "").split(" ");
  const dept = parts[0] || undefined;

  return {
    id: b.id,
    code: b.courseNum,
    title: b.coursename,
    credits: Number(b.credits ?? "0") || 0,
    department: dept,
    active: true, // backend doesn't track "active", so always true for now
  };
}

/** Build a BackendCourse payload for creation from UI fields */
function buildCreatePayload(code: string, title: string, creditsNum: number) {
  return {
    courseNum: code.trim(),
    coursename: title.trim(),
    description: "",
    // backend Course has course_level as String – give a default
    course_level: "0",
    credits: String(creditsNum),
    subject_id: null,
    meetingTimes: "",
    // these are NOT NULL in your DB screenshot, so give safe defaults
    remainingSeats: 0,
    location: "",
    professors: "",
    section: "A",
    semester: "",
  } satisfies Partial<BackendCourse>;
}

export default function AdminCoursesScreen() {
  const { theme } = useTheme();

  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const [newCode, setNewCode] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newCredits, setNewCredits] = useState("3");
  const [saving, setSaving] = useState(false);

  /** GET /courses/search */
  const loadCourses = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/courses/search`);

      if (!res.ok) {
        console.warn("Failed to load courses, using mock data");
        setCourses(MOCK_COURSES);
        return;
      }

      const data: BackendCourse[] = await res.json();
      setCourses(data.map(mapBackendToCourse));
    } catch (err) {
      console.error("Error loading courses:", err);
      setCourses(MOCK_COURSES);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadCourses();
    }, [loadCourses])
  );

  const filteredCourses = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return courses;
    return courses.filter((c) => {
      const haystack = [
        c.code,
        c.title,
        c.department ?? "",
        String(c.credits),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [courses, search]);

  /** POST /courses/addCourse */
  const handleCreate = async () => {
    if (!newCode || !newTitle) return;

    const creditsNum = Number(newCredits) || 0;

    try {
      setSaving(true);

      const payload = buildCreatePayload(newCode, newTitle, creditsNum);

      const res = await fetch(`${API_BASE}/courses/addCourse`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        console.error("Failed to create course:", await res.text());
        return;
      }

      await loadCourses();
      setNewCode("");
      setNewTitle("");
      setNewCredits("3");
    } catch (err) {
      console.error("Error creating course:", err);
    } finally {
      setSaving(false);
    }
  };

  /** DELETE /courses/{id}/delete */
  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`${API_BASE}/courses/${id}/delete`, {
        method: "DELETE",
      });

      if (!res.ok) {
        console.error("Failed to delete course:", await res.text());
        return;
      }

      setCourses((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error("Error deleting course:", err);
    }
  };

  const renderItem = ({ item }: { item: Course }) => (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.card, borderColor: theme.border },
      ]}
    >
      <View style={{ flex: 1 }}>
        <Text style={[styles.courseCode, { color: theme.text }]}>
          {item.code}
        </Text>
        <Text style={{ color: theme.muted, marginTop: 2 }}>
          {item.title}
        </Text>
        <Text style={{ color: theme.muted, marginTop: 2 }}>
          {item.credits} credits
          {item.department ? ` • ${item.department}` : ""}
        </Text>
        {item.active === false && (
          <Text style={{ color: "#dc2626", marginTop: 2 }}>Inactive</Text>
        )}
      </View>
      <TouchableOpacity
        style={styles.iconBtn}
        onPress={() => handleDelete(item.id)}
        activeOpacity={0.8}
      >
        <Ionicons name="trash-outline" size={18} color="#dc2626" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>Courses</Text>
      <Text style={{ color: theme.muted, marginBottom: 10 }}>
        Manage the course catalog available to advisors and students.
      </Text>

      {/* Search */}
      <View
        style={[
          styles.searchContainer,
          { backgroundColor: theme.card, borderColor: theme.border },
        ]}
      >
        <Ionicons
          name="search-outline"
          size={18}
          color={theme.muted}
          style={{ marginRight: 6 }}
        />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search by code, title, department..."
          placeholderTextColor={theme.muted}
          style={[styles.searchInput, { color: theme.text }]}
          autoCorrect={false}
        />
      </View>

      {/* Add course */}
      <View
        style={[
          styles.createCard,
          { backgroundColor: theme.card, borderColor: theme.border },
        ]}
      >
        <Text style={[styles.sectionLabel, { color: theme.text }]}>
          Add new course
        </Text>

        <View style={styles.row}>
          <View style={{ flex: 1, marginRight: 6 }}>
            <TextInput
              value={newCode}
              onChangeText={setNewCode}
              placeholder="Code (e.g., SE 339)"
              placeholderTextColor={theme.muted}
              style={[
                styles.input,
                { borderColor: theme.border, color: theme.text },
              ]}
              autoCapitalize="characters"
            />
          </View>
          <View style={{ width: 70, marginLeft: 6 }}>
            <TextInput
              value={newCredits}
              onChangeText={setNewCredits}
              placeholder="Cr"
              placeholderTextColor={theme.muted}
              style={[
                styles.input,
                { borderColor: theme.border, color: theme.text },
              ]}
              keyboardType="numeric"
            />
          </View>
        </View>

        <TextInput
          value={newTitle}
          onChangeText={setNewTitle}
          placeholder="Course title"
          placeholderTextColor={theme.muted}
          style={[
            styles.input,
            {
              borderColor: theme.border,
              color: theme.text,
              marginTop: 6,
            },
          ]}
        />

        <TouchableOpacity
          style={[
            styles.primaryButton,
            { backgroundColor: theme.primary, opacity: saving ? 0.8 : 1 },
          ]}
          onPress={handleCreate}
          disabled={saving}
          activeOpacity={0.9}
        >
          <Text
            style={{
              color: theme.background,
              fontWeight: "700",
              textAlign: "center",
            }}
          >
            {saving ? "Saving..." : "Create course"}
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredCourses}
        keyExtractor={(c) => String(c.id)}
        renderItem={renderItem}
        contentContainerStyle={{ paddingVertical: 8 }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              {loading ? "Loading courses..." : "No courses found"}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 4 },

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 10,
  },
  searchInput: { flex: 1, fontSize: 14 },

  createCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  sectionLabel: { fontSize: 14, fontWeight: "600", marginBottom: 6 },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 13,
  },
  primaryButton: {
    borderRadius: 999,
    paddingVertical: 8,
    marginTop: 8,
  },

  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  courseCode: { fontSize: 15, fontWeight: "700" },
  iconBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 8,
  },

  emptyState: {
    marginTop: 24,
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
});
