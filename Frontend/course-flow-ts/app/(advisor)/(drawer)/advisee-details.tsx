import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
} from "react-native";
import { Stack, useRouter } from "expo-router"; // 👈 NEW
import Ionicons from "@expo/vector-icons/Ionicons"; // 👈 NEW
import { useLocalSearchParams } from "expo-router";
import { useTheme } from "../../../components/ThemeContext";
import ProgressBar from "../../../components/ProgressBar";

type Mode = "profile" | "plan" | "message";

// mock courses for the plan tab
type PlannedCourse = {
  id: string;
  code: string;
  title: string;
  term: string;
  status: "planned" | "in-progress" | "completed";
};

export interface ProfileDto {
  id: number; // profile_id
  user_id: number;
  email: string;
  netid: string;
  role: "STUDENT" | "ADVISOR" | "ADMIN";
  bio: string | null;
  display_name: string | null;
  graduation_year: number | null;
  photo_url: string | null; // can be URL or data:image;base64,...
}

const MOCK_PLAN: PlannedCourse[] = [
  {
    id: "1",
    code: "SE 339",
    title: "Software Architecture and Design",
    term: "Fall 2025",
    status: "planned",
  },
  {
    id: "2",
    code: "COM S 311",
    title: "Algorithms",
    term: "Fall 2025",
    status: "in-progress",
  },
  {
    id: "3",
    code: "CPR E 288",
    title: "Embedded Systems I",
    term: "Spring 2026",
    status: "planned",
  },
  {
    id: "4",
    code: "CPR E 381",
    title: "Computer Organization",
    term: "Spring 2026",
    status: "completed",
  },
];

export default function AdviseeDetails() {
  const { theme } = useTheme();
  const router = useRouter(); // 👈 NEW

  const goBackToAdvisees = () => {
    if (router.canGoBack()) router.back();
    else router.replace(`/(advisor)/(drawer)/advisees`); // fallback to list route
  };

  const params = useLocalSearchParams<{
    netid?: string;
    name?: string;
    mode?: string;
    photoUrl?: string;
    graduationYear?: string;
  }>();

  const name = params.name || "Advisee";
  const netid = params.netid || "unknown";

  const photoUrl =
    (typeof params.photoUrl === "string" && params.photoUrl.length > 0
      ? params.photoUrl
      : undefined) || "https://via.placeholder.com/240";

  const graduationYear = params.graduationYear || "—";

  const initialMode: Mode =
    params.mode === "plan" || params.mode === "message"
      ? (params.mode as Mode)
      : "profile";

  const [mode, setMode] = useState<Mode>(initialMode);

  // pretend this is computed from backend later
  const degreeProgress = 0.62;

  const completedCount = useMemo(
    () => MOCK_PLAN.filter((c) => c.status === "completed").length,
    []
  );

  const planCompletion = completedCount / (MOCK_PLAN.length || 1);

  // ---------- custom header like professor-details ----------
  const headerLeft = () => (
    <TouchableOpacity
      onPress={goBackToAdvisees}
      style={{
        paddingHorizontal: 8,
        flexDirection: "row",
        alignItems: "center",
      }}
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
    >
      <Ionicons name="chevron-back" size={22} color={theme.background} />
      <Text
        style={{ marginLeft: 2, fontWeight: "700", color: theme.background }}
      >
        Back
      </Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={{ padding: 20 }}
    >
      {/* 👇 This injects the custom header for this screen */}
      <Stack.Screen
        options={{
          title: "Advisee Details",
          headerLeft,
        }}
      />

      {/* Header */}
      <Text style={[styles.title, { color: theme.text }]}>{name}</Text>
      <Text style={{ color: theme.muted, marginBottom: 16 }}>{netid}</Text>

      {/* Tabs */}
      <View
        style={[
          styles.tabRow,
          { backgroundColor: theme.card, borderColor: theme.border },
        ]}
      >
        <TabButton
          label="Profile"
          active={mode === "profile"}
          onPress={() => setMode("profile")}
          theme={theme}
        />
        <TabButton
          label="Plan"
          active={mode === "plan"}
          onPress={() => setMode("plan")}
          theme={theme}
        />
        <TabButton
          label="Message"
          active={mode === "message"}
          onPress={() => setMode("message")}
          theme={theme}
        />
      </View>

      {/* Content */}
      {mode === "profile" && (
        <ProfileSection
          theme={theme}
          degreeProgress={degreeProgress}
          photoUrl={photoUrl}
          name={name}
          netid={netid}
          graduationYear={graduationYear}
        />
      )}

      {mode === "plan" && (
        <PlanSection theme={theme} planCompletion={planCompletion} />
      )}

      {mode === "message" && <MessageSection theme={theme} name={name} />}
    </ScrollView>
  );
}

// ---------- Subcomponents ----------

function TabButton({
  label,
  active,
  onPress,
  theme,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  theme: any;
}) {
  return (
    <TouchableOpacity
      style={[styles.tabButton, active && { backgroundColor: theme.primary }]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.tabText,
          { color: active ? theme.background : theme.text },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function ProfileSection({
  theme,
  degreeProgress,
  photoUrl,
  name,
  netid,
  graduationYear,
}: {
  theme: any;
  degreeProgress: number;
  photoUrl: string;
  name: string;
  netid: string;
  graduationYear: string;
}) {
  return (
    <View style={{ marginTop: 16 }}>
      <View style={styles.profileHeaderRow}>
        <View style={styles.profileInfoContainer}>
          <Text style={[styles.profileName, { color: theme.text }]}>
            {name}
          </Text>
          <Text style={[styles.profileEmail, { color: theme.muted }]}>
            {netid}@iastate.edu
          </Text>

          <Text style={[styles.profileLabel, { color: theme.muted }]}>
            Graduation Year
          </Text>
          <Text style={[styles.profileValue, { color: theme.text }]}>
            {graduationYear}
          </Text>

          <Text
            style={[styles.profileLabel, { color: theme.muted, marginTop: 6 }]}
          >
            Major
          </Text>
          <Text style={[styles.profileValue, { color: theme.text }]}>
            Software Engineering
          </Text>

          <Text
            style={[styles.profileLabel, { color: theme.muted, marginTop: 6 }]}
          >
            Minor
          </Text>
          <Text style={[styles.profileValue, { color: theme.text }]}>
            Data Science
          </Text>
        </View>

        <View style={styles.profileImageContainerAdvisor}>
          <Image
            source={{ uri: photoUrl }}
            style={styles.profileImageAdvisor}
          />
        </View>
      </View>

      <Text
        style={[
          styles.sectionTitle,
          { color: theme.text, marginTop: 18, marginBottom: 4 },
        ]}
      >
        Degree Progress
      </Text>
      <ProgressBar
        progress={degreeProgress}
        width={undefined}
        height={20}
        completedColor={theme.primary}
        remainingColor="#FFC72C"
      />
      <Text style={{ color: theme.muted, marginTop: 4 }}>
        {Math.round(degreeProgress * 100)}% of degree requirements planned or
        completed.
      </Text>
    </View>
  );
}

function PlanSection({
  theme,
  planCompletion,
}: {
  theme: any;
  planCompletion: number;
}) {
  return (
    <View style={{ marginTop: 16 }}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>
        Planned Courses
      </Text>
      <Text style={{ color: theme.muted, marginBottom: 8 }}>
        This is a mock plan; later you’ll pull this from the student’s Smart
        Scheduler / degree audit.
      </Text>

      <Text style={{ color: theme.muted, marginBottom: 8 }}>
        Plan completion: {Math.round(planCompletion * 100)}%
      </Text>

      {MOCK_PLAN.map((c) => (
        <View
          key={c.id}
          style={[
            styles.courseRow,
            { borderColor: theme.border, backgroundColor: theme.card },
          ]}
        >
          <Text style={[styles.courseCode, { color: theme.text }]}>
            {c.code}
          </Text>
          <Text style={{ color: theme.text }}>{c.title}</Text>
          <Text style={{ color: theme.muted, marginTop: 4 }}>
            {c.term} • {c.status}
          </Text>
        </View>
      ))}
    </View>
  );
}

function MessageSection({ theme, name }: { theme: any; name: string }) {
  const [text, setText] = useState("");

  return (
    <View style={{ marginTop: 16 }}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>
        Send Message
      </Text>
      <Text style={{ color: theme.muted, marginBottom: 8 }}>
        This doesn’t send anywhere yet — later you can hook it up to email or an
        in-app messaging system.
      </Text>

      <Text style={{ color: theme.text, marginBottom: 4 }}>
        To: <Text style={styles.infoValue}>{name}</Text>
      </Text>

      <TextInput
        multiline
        value={text}
        onChangeText={setText}
        placeholder="Write a quick advising note, reminder, or follow-up..."
        placeholderTextColor={theme.muted}
        style={[
          styles.messageBox,
          {
            borderColor: theme.border,
            color: theme.text,
            backgroundColor: theme.card,
          },
        ]}
      />

      <TouchableOpacity
        style={[styles.sendBtn, { backgroundColor: theme.primary }]}
        onPress={() => {
          console.log("Sending message:", text);
        }}
      >
        <Text
          style={{
            color: theme.background,
            fontWeight: "700",
            textAlign: "center",
          }}
        >
          Send Message
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ---------- styles ----------

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 24, fontWeight: "700" },
  tabRow: {
    flexDirection: "row",
    borderWidth: 1,
    borderRadius: 999,
    padding: 4,
    marginTop: 8,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 999,
    alignItems: "center",
  },
  tabText: { fontSize: 13, fontWeight: "600" },

  sectionTitle: { fontSize: 18, fontWeight: "600", marginTop: 16 },
  infoValue: { fontWeight: "600" },

  courseRow: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  courseCode: { fontWeight: "700", marginBottom: 2 },

  messageBox: {
    minHeight: 120,
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginTop: 8,
    textAlignVertical: "top",
  },
  sendBtn: {
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 999,
  },

  // profile header bits
  profileHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  profileInfoContainer: {
    flex: 1,
    paddingRight: 10,
  },
  profileName: {
    fontSize: 20,
    fontWeight: "700",
  },
  profileEmail: {
    fontSize: 14,
    marginTop: 4,
  },
  profileLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: 10,
  },
  profileValue: {
    fontSize: 14,
  },
  profileImageContainerAdvisor: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: "hidden",
    marginLeft: 10,
  },
  profileImageAdvisor: {
    width: "100%",
    height: "100%",
  },
});
