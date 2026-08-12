// app/(advisor)/(drawer)/advisees/add-advisee.tsx
import React, { useMemo, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useTheme } from "../../../../components/ThemeContext";
import { useAuth } from "../../../../auth/AuthContext";

const API_BASE = (process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8080/api").replace(/\/api\/?$/, "");

type Student = {
  id: string;
  name: string;
  netid: string;
  major?: string;
  classStanding?: string;
};

const MOCK_STUDENTS: Student[] = [
  {
    id: "1",
    name: "Sarah Johnson",
    netid: "sjohnson",
    major: "Software Engineering",
    classStanding: "Junior",
  },
  {
    id: "2",
    name: "Kevin Lee",
    netid: "klee",
    major: "Computer Science",
    classStanding: "Sophomore",
  },
  {
    id: "3",
    name: "Maria Garcia",
    netid: "mgarcia",
    major: "Cybersecurity Engineering",
    classStanding: "Senior",
  },
  {
    id: "4",
    name: "Jacob Chen",
    netid: "jchen",
    major: "Data Science",
    classStanding: "Freshman",
  },
  {
    id: "5",
    name: "Alicia Perez",
    netid: "aperez",
    major: "Software Engineering",
    classStanding: "Sophomore",
  },
];

type Params = {
  existingNetids?: string; // JSON string array of netids
};

export default function AddAdviseeScreen() {
  console.log("API_BASE:", API_BASE);

  const { theme } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<Params>();

  const { user } = useAuth();
  const advisorNetid = user?.userId;

  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");


  // track already-advisee netids (passed in from previous screen)
  const [existingAdviseeNetids, setExistingAdviseeNetids] = useState<
    Set<string>
  >(() => {
    try {
      const raw = params.existingNetids;
      if (typeof raw !== "string" || raw.length === 0) return new Set();
      const arr = JSON.parse(raw);
      if (!Array.isArray(arr)) return new Set();
      return new Set(arr.filter((x) => typeof x === "string"));
    } catch {
      return new Set();
    }
  });

  
  // if route param changes (rare, but safe), re-derive set
  useEffect(() => {
    try {
      const raw = params.existingNetids;
      if (typeof raw !== "string" || raw.length === 0) return;
      const arr = JSON.parse(raw);
      if (!Array.isArray(arr)) return;
      setExistingAdviseeNetids(
        new Set(arr.filter((x) => typeof x === "string")),
      );
    } catch {
      // ignore
    }
  }, [params.existingNetids]);

  const [submittingId, setSubmittingId] = useState<string | null>(null);

useEffect(() => {
  const loadStudents = async () => {
    try {
      setLoading(true);

      const res = await fetch(`${API_BASE}/api/advisor/students`);
      const text = await res.text();

      console.log("GET /students status:", res.status);
      console.log("GET /students text:", text);

      if (!res.ok) throw new Error(text);

      const raw = text ? JSON.parse(text) : [];

      const mapped: Student[] = (raw ?? []).map((u: any) => ({
        id: String(u.id),
        netid: u.netid,
        name: u.fullName ?? u.netid,
        major: "",
        classStanding: "",
      }));

      setStudents(mapped.length ? mapped : MOCK_STUDENTS);
    } catch (e) {
      console.warn("Failed to load students, using mock:", e);
      setStudents(MOCK_STUDENTS);
    } finally {
      setLoading(false);
    }
  };

  loadStudents();
}, [API_BASE]);


  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/advisees");
  };

  // Filter search results AND hide already-advisees
  const filteredStudents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    // start from full list, hide already-advisees
    let base = students.filter((s) => !existingAdviseeNetids.has(s.netid));

    if (!q) return base;

    return base.filter((s) => {
      const haystack = [s.name, s.netid, s.major, s.classStanding]
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [searchQuery, students, existingAdviseeNetids]);

  const handleAdd = async (student: Student) => {
    try {
      if (!advisorNetid) {
        console.error("No advisor netid available");
        return;
      }

      setSubmittingId(student.id);

      const url =
        `${API_BASE}/api/advisor/${encodeURIComponent(advisorNetid)}/advisees` +
        `?studentNetid=${encodeURIComponent(student.netid)}`;

      const res = await fetch(url, { method: "POST" });

      if (!res.ok) {
        console.error("Failed to add advisee:", await res.text());
        return;
      }

      // hide immediately in this list
      setExistingAdviseeNetids((prev) => {
        const next = new Set(prev);
        next.add(student.netid);
        return next;
      });

      if (router.canGoBack()) router.back();
      else router.replace("/advisees");
    } catch (err) {
      console.error("Error adding advisee:", err);
    } finally {
      setSubmittingId(null);
    }
  };

  const renderItem = ({ item }: { item: Student }) => {
    const isSubmitting = submittingId === item.id;

    return (
      <View
        style={[
          styles.card,
          { backgroundColor: theme.card, borderColor: theme.border },
        ]}
      >
        <View style={{ flex: 1 }}>
          <Text style={[styles.name, { color: theme.text }]}>{item.name}</Text>
          <Text style={{ color: theme.muted, marginTop: 2 }}>{item.netid}</Text>
          <Text style={{ color: theme.muted, marginTop: 2 }}>
            {item.classStanding}
          </Text>
          <Text style={{ color: theme.muted, marginTop: 2 }}>{item.major}</Text>
        </View>

        <TouchableOpacity
          style={[
            styles.addChip,
            { borderColor: theme.primary, backgroundColor: theme.card },
          ]}
          onPress={() => handleAdd(item)}
          activeOpacity={0.85}
          disabled={isSubmitting}
        >
          <Ionicons
            name={isSubmitting ? "hourglass-outline" : "person-add-outline"}
            size={16}
            color={theme.primary}
          />
          <Text
            style={{
              marginLeft: 4,
              color: theme.primary,
              fontWeight: "600",
              fontSize: 13,
            }}
          >
            {isSubmitting ? "Adding..." : "Add"}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const listEmptyComponent = (
    <View style={styles.emptyState}>
      <Text style={[styles.emptyTitle, { color: theme.text }]}>
        {loading ? "Loading students..." : "No students found"}
      </Text>
      {!loading && (
        <Text style={{ color: theme.muted, textAlign: "center", marginTop: 4 }}>
          Try a different name, Net-ID, major, or class standing.
        </Text>
      )}
    </View>
  );

  return (
    
    <>
      <Stack.Screen
        options={{
          title: "Add Advisee",
          headerStyle: { backgroundColor: theme.primary },
          headerTintColor: theme.background,
          headerTitleStyle: { color: theme.background },
          headerShadowVisible: false,
          headerLeft: () => (
            <TouchableOpacity
              onPress={handleBack}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 8,
              }}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Ionicons
                name="chevron-back"
                size={22}
                color={theme.background}
              />
              <Text
                style={{
                  marginLeft: 4,
                  fontWeight: "600",
                  color: theme.background,
                }}
              >
                Back
              </Text>
            </TouchableOpacity>
          ),
        }}
      />

      <View style={[styles.container, { backgroundColor: theme.background }]}>
        {/* Search bar */}
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
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search all students..."
            placeholderTextColor={theme.muted}
            style={[styles.searchInput, { color: theme.text }]}
            autoCorrect={false}
          />
        </View>

        <Text style={{ color: theme.muted, marginBottom: 8 }}>
          Select a student to add them to your advisee list.
        </Text>

        <FlatList
          data={filteredStudents}
          keyExtractor={(s) => s.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingVertical: 8 }}
          ListEmptyComponent={listEmptyComponent}
          keyboardShouldPersistTaps="handled"
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },

  card: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
  },

  addChip: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginLeft: 10,
  },

  emptyState: {
    marginTop: 28,
    alignItems: "center",
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
});
