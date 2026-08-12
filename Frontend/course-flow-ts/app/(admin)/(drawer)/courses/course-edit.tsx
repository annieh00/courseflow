// app/(admin)/courses/course-edit.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useTheme } from "../../../../components/ThemeContext";

const _isLocal = typeof window === 'undefined' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_BASE = _isLocal ? 'http://localhost:8080/api' : 'https://sdmay26-48.ece.iastate.edu/api';

function buildCourseNum(subject: string, number: string): string {
  return `${subject.trim()} ${number.trim()}`.trim();
}

export default function CourseEditScreen() {
  const params = useLocalSearchParams<{
    id?: string;
    subject?: string;
    number?: string;
    title?: string;
    credits?: string;
    level?: string;
  }>();

  const { theme } = useTheme();
  const router = useRouter();

  const id = params.id;

  const [subject, setSubject] = useState(params.subject ?? "");
  const [number, setNumber] = useState(params.number ?? "");
  const [title, setTitle] = useState(params.title ?? "");
  const [credits, setCredits] = useState(params.credits ?? "");
  const [level, setLevel] = useState(params.level ?? "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // If there is no id at all, immediately go back to the Courses list
  useEffect(() => {
    if (!id) {
      router.replace("/courses");
    }
  }, [id, router]);

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/courses");
  };

  // While redirecting (no id), render nothing
  if (!id) {
    return null;
  }

  const handleSave = async () => {
    const creditsNum = Number(credits);
    if (Number.isNaN(creditsNum)) {
      Alert.alert("Invalid credits", "Credits must be a number.");
      return;
    }

    const courseNum = buildCourseNum(subject, number);

    try {
      setSaving(true);

      // Backend expects @RequestBody String newName
      // so send plain text with the new course number.
      const res = await fetch(`${API_BASE}/courses/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "text/plain" },
        body: courseNum,
      });

      if (!res.ok) {
        console.error("Failed to update course:", await res.text());
        Alert.alert("Error", "Could not save course.");
        return;
      }

      Alert.alert("Saved", `Changes for ${subject} ${number} saved.`);
      router.back();
    } catch (err) {
      console.error("Error updating course:", err);
      Alert.alert("Error", "Unexpected error saving course.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    Alert.alert(
      "Delete course",
      `Are you sure you want to delete ${subject} ${number}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setDeleting(true);
              const res = await fetch(
                `${API_BASE}/courses/${id}/delete`,
                { method: "DELETE" }
              );

              if (!res.ok) {
                console.error("Failed to delete course:", await res.text());
                Alert.alert("Error", "Could not delete course.");
                return;
              }

              router.back();
            } catch (err) {
              console.error("Error deleting course:", err);
              Alert.alert("Error", "Unexpected error deleting course.");
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: "Edit Course",
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
        <Text style={[styles.title, { color: theme.text }]}>Edit course</Text>
        <Text style={{ color: theme.muted, marginBottom: 12 }}>
          {subject} {number}
        </Text>

        <View style={styles.field}>
          <Text style={[styles.label, { color: theme.text }]}>Subject</Text>
          <TextInput
            value={subject}
            onChangeText={setSubject}
            style={[
              styles.input,
              { borderColor: theme.border, color: theme.text },
            ]}
            placeholderTextColor={theme.muted}
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: theme.text }]}>Number</Text>
          <TextInput
            value={number}
            onChangeText={setNumber}
            style={[
              styles.input,
              { borderColor: theme.border, color: theme.text },
            ]}
            placeholderTextColor={theme.muted}
            keyboardType="number-pad"
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: theme.text }]}>
            Course title
          </Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            style={[
              styles.input,
              { borderColor: theme.border, color: theme.text },
            ]}
            placeholderTextColor={theme.muted}
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: theme.text }]}>Credits</Text>
          <TextInput
            value={credits}
            onChangeText={setCredits}
            keyboardType="numeric"
            style={[
              styles.input,
              { borderColor: theme.border, color: theme.text },
            ]}
            placeholderTextColor={theme.muted}
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: theme.text }]}>Level</Text>
          <TextInput
            value={level}
            onChangeText={setLevel}
            style={[
              styles.input,
              { borderColor: theme.border, color: theme.text },
            ]}
            placeholderTextColor={theme.muted}
          />
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[
              styles.primaryButton,
              { backgroundColor: theme.primary, opacity: saving ? 0.8 : 1 },
            ]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text
              style={{
                color: theme.background,
                fontWeight: "700",
                textAlign: "center",
              }}
            >
              {saving ? "Saving..." : "Save"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
            disabled={deleting}
          >
            <Text style={{ color: "#dc2626", fontWeight: "700" }}>
              {deleting ? "Deleting..." : "Delete course"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 4 },
  field: {
    marginBottom: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  buttonRow: {
    marginTop: 16,
    gap: 10,
  },
  primaryButton: {
    borderRadius: 999,
    paddingVertical: 10,
  },
  deleteButton: {
    borderRadius: 999,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#dc2626",
    alignItems: "center",
    justifyContent: "center",
  },
});
