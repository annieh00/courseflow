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

const API_BASE =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

type Student = {
  id: string;
  name: string;
  netid: string;
  major: string;
  classStanding: string;
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
  existingNetids?: string;
};

export default function AddAdviseeScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<Params>();

  const [searchQuery, setSearchQuery] = useState("");
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  // ✅ Track which students are already advisees (by netid)
  const [existingAdviseeNetids, setExistingAdviseeNetids] = useState<
    Set<string>
  >(new Set());

  // Parse existing netids that were passed in from the My Advisees screen
  useEffect(() => {
    if (!params.existingNetids) return;
    try {
      const arr = JSON.parse(params.existingNetids) as string[];
      const s = new Set<string>();
      for (const n of arr) {
        if (typeof n === "string" && n.length > 0) {
          s.add(n);
        }
      }
      setExistingAdviseeNetids(s);
    } catch (err) {
      console.error("Failed to parse existingNetids param:", err);
    }
  }, [params.existingNetids]);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/advisees");
    }
  };

  // Filter search results AND hide already-advisees
  const filteredStudents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    // start from full list, hide already-advisees
    let base = MOCK_STUDENTS.filter(
      (s) => !existingAdviseeNetids.has(s.netid)
    );

    if (!q) return base;

    return base.filter((s) => {
      const haystack = [
        s.name,
        s.netid,
        s.major,
        s.classStanding,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [searchQuery, existingAdviseeNetids]);

  const handleAdd = async (student: Student) => {
    try {
      setSubmittingId(student.id);

      const res = await fetch(`${API_BASE}/api/advisors/me/advisees`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          netid: student.netid,
        }),
      });

      if (!res.ok) {
        console.error("Failed to add advisee:", await res.text());
        return;
      }

      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace("/advisees");
      }
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
          <Text style={{ color: theme.muted, marginTop: 2 }}>
            {item.netid}
          </Text>
          {/* 🔁 Changed from "Junior · Software Engineering" to two lines */}
          <Text style={{ color: theme.muted, marginTop: 2 }}>
            {item.classStanding}
          </Text>
          <Text style={{ color: theme.muted, marginTop: 2 }}>
            {item.major}
          </Text>
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
        No students found
      </Text>
      <Text style={{ color: theme.muted, textAlign: "center", marginTop: 4 }}>
        Try a different name, Net-ID, major, or class standing.
      </Text>
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
