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
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useTheme } from "../../../../components/ThemeContext";
import ProgressBar from "../../../../components/ProgressBar";

type Mode = "profile" | "plan" | "message" | "notes";

// mock courses for the plan tab
type PlannedCourse = {
  id: string;
  code: string;
  title: string;
  term: string;
  status: "planned" | "in-progress" | "completed";
  credits: number;
};

type Milestone = {
  id: string;
  label: string;
  completed: boolean;
};

type AdvisorNote = {
  id: string;
  date: string;
  type: "Registration" | "Probation" | "Career" | "General";
  summary: string;
  detail: string;
};

export interface ProfileDto {
  id: number;
  user_id: number;
  email: string;
  netid: string;
  role: "STUDENT" | "ADVISOR" | "ADMIN";
  bio: string | null;
  display_name: string | null;
  graduation_year: number | null;
  photo_url: string | null;
}

// ---- MOCK DATA ----

const MOCK_PLAN: PlannedCourse[] = [
  {
    id: "1",
    code: "SE 339",
    title: "Software Architecture and Design",
    term: "Fall 2025",
    status: "planned",
    credits: 3,
  },
  {
    id: "2",
    code: "COM S 311",
    title: "Algorithms",
    term: "Fall 2025",
    status: "in-progress",
    credits: 3,
  },
  {
    id: "3",
    code: "CPR E 288",
    title: "Embedded Systems I",
    term: "Spring 2026",
    status: "planned",
    credits: 4,
  },
  {
    id: "4",
    code: "CPR E 381",
    title: "Computer Organization",
    term: "Spring 2026",
    status: "completed",
    credits: 4,
  },
];

const MOCK_MILESTONES: Milestone[] = [
  { id: "m1", label: "Admitted", completed: true },
  { id: "m2", label: "Declared major", completed: true },
  { id: "m3", label: "Passed key prereqs", completed: false },
  { id: "m4", label: "Internship completed", completed: false },
  { id: "m5", label: "Expected graduation", completed: false },
];

const MOCK_NOTES: AdvisorNote[] = [
  {
    id: "n1",
    date: "Oct 3, 2025",
    type: "Registration",
    summary: "Registration planning for Spring 2026.",
    detail:
      "Discussed adding SE 339 and COM S 311. Advised against taking more than 16 credits due to work schedule.",
  },
  {
    id: "n2",
    date: "Sep 1, 2025",
    type: "Career",
    summary: "Internship search check-in.",
    detail:
      "Student interested in SWE internships; recommended applying for on-campus career fair and revising resume.",
  },
];

// templates for message tab
const MESSAGE_TEMPLATES: { key: string; label: string; body: string }[] = [
  {
    key: "followup",
    label: "Follow-up",
    body:
      "Hi there,\n\nJust following up on our recent advising meeting. Let me know if you have any questions about your schedule or degree progress.\n\nBest,\nYour Advisor",
  },
  {
    key: "probation",
    label: "Probation check-in",
    body:
      "Hello,\n\nI wanted to check in regarding your academic standing. Let's set up a time to discuss strategies and resources to help you get back on track.\n\nBest,\nYour Advisor",
  },
  {
    key: "gradChecklist",
    label: "Grad checklist",
    body:
      "Hi,\n\nHere’s a quick graduation checklist for you: review degree audit, confirm all requirements are planned, apply for graduation by the deadline, and schedule a final advising appointment.\n\nBest,\nYour Advisor",
  },
  {
    key: "intro",
    label: "New advisee intro",
    body:
      "Hi,\n\nI'm your academic advisor this year. I'd love to meet and discuss your goals, interests, and any questions you have about your major or course plans.\n\nBest,\nYour Advisor",
  },
];

// ---- helpers ----

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("");
}

// ---------- screen ----------

export default function AdviseeDetails() {
  const { theme } = useTheme();
  const router = useRouter();

  const params = useLocalSearchParams<{
    from?: string;
    netid?: string;
    name?: string;
    mode?: string;
    photoUrl?: string;
    graduationYear?: string;
    major?: string;
    minor?: string;
    classStanding?: string;
    gpa?: string;
    creditsCompleted?: string;
    creditsRequired?: string;
  }>();

  const from = typeof params.from === "string" ? params.from : undefined;
  const name = params.name || "Advisee";
  const netid = params.netid || "unknown";

  const major =
    typeof params.major === "string" && params.major.length > 0
      ? params.major
      : "";
  const minor =
    typeof params.minor === "string" && params.minor.length > 0
      ? params.minor
      : "";
  const classStanding =
    typeof params.classStanding === "string" &&
    params.classStanding.length > 0
      ? params.classStanding
      : "";

  const gpaRaw =
    typeof params.gpa === "string" && params.gpa.length > 0
      ? Number(params.gpa)
      : NaN;
  const gpa = Number.isNaN(gpaRaw) ? undefined : gpaRaw;

  const creditsCompletedRaw =
    typeof params.creditsCompleted === "string" &&
    params.creditsCompleted.length > 0
      ? Number(params.creditsCompleted)
      : NaN;
  const creditsRequiredRaw =
    typeof params.creditsRequired === "string" &&
    params.creditsRequired.length > 0
      ? Number(params.creditsRequired)
      : NaN;

  const creditsCompleted = Number.isNaN(creditsCompletedRaw)
    ? undefined
    : creditsCompletedRaw;
  const creditsRequired = Number.isNaN(creditsRequiredRaw)
    ? undefined
    : creditsRequiredRaw;

  const degreeProgress =
    typeof creditsCompleted === "number" &&
    typeof creditsRequired === "number" &&
    creditsRequired > 0
      ? creditsCompleted / creditsRequired
      : 0;

  const photoUrl =
    (typeof params.photoUrl === "string" && params.photoUrl.length > 0
      ? params.photoUrl
      : undefined) || "";

  const graduationYear = params.graduationYear || "—";

  const initialMode: Mode =
    params.mode === "plan" ||
    params.mode === "message" ||
    params.mode === "notes"
      ? (params.mode as Mode)
      : "profile";

  const [mode, setMode] = useState<Mode>(initialMode);

  const completedCount = useMemo(
    () => MOCK_PLAN.filter((c) => c.status === "completed").length,
    []
  );
  const planCompletion = completedCount / (MOCK_PLAN.length || 1);

  const latestNote = MOCK_NOTES[0];

  const handleBack = () => {
    if (from === "plans") {
      router.replace("/(advisor)/(drawer)/plans");
      return;
    }

    if (from === "advisees") {
      router.replace("/(advisor)/(drawer)/advisees");
      return;
    }

    if (from === "schedule") {
      router.replace("/(advisor)/(drawer)/schedule");
      return;
    }

    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/advisees");
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: "Advisee Details",
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

      <ScrollView
        style={[styles.container, { backgroundColor: theme.background }]}
        contentContainerStyle={{ paddingBottom: 24 }}
        stickyHeaderIndices={[0]} // sticky header w/ name + tabs
      >
        {/* Sticky header: name + netid + tabs */}
        <View
          style={[
            styles.stickyHeader,
            { backgroundColor: theme.background, borderColor: theme.border },
          ]}
        >
          <Text style={[styles.title, { color: theme.text }]}>{name}</Text>
          <Text style={{ color: theme.muted, marginBottom: 8 }}>{netid}</Text>

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
            <TabButton
              label="Notes"
              active={mode === "notes"}
              onPress={() => setMode("notes")}
              theme={theme}
            />
          </View>
        </View>

        {/* Content for each mode */}
        {mode === "profile" && (
          <ProfileSection
            theme={theme}
            degreeProgress={degreeProgress}
            photoUrl={photoUrl}
            name={name}
            netid={netid}
            graduationYear={graduationYear}
            latestNote={latestNote}
            onShowNotes={() => setMode("notes")}
            major={major}
            minor={minor}
            classStanding={classStanding}
            gpa={gpa}
            creditsCompleted={creditsCompleted}
            creditsRequired={creditsRequired}
          />
        )}

        {mode === "plan" && (
          <PlanSection theme={theme} planCompletion={planCompletion} />
        )}

        {mode === "message" && <MessageSection theme={theme} name={name} />}

        {mode === "notes" && <NotesSection theme={theme} />}
      </ScrollView>
    </>
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
      activeOpacity={0.85}
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
  latestNote,
  onShowNotes,
  major,
  minor,
  classStanding,
  gpa,
  creditsCompleted,
  creditsRequired,
}: {
  theme: any;
  degreeProgress: number;
  photoUrl: string;
  name: string;
  netid: string;
  graduationYear: string;
  latestNote: AdvisorNote | undefined;
  onShowNotes: () => void;
  major: string;
  minor: string;
  classStanding: string;
  gpa?: number;
  creditsCompleted?: number;
  creditsRequired?: number;
}) {
  const hasPhoto = !!photoUrl;

  const degreePercent = Math.round(degreeProgress * 100);

  return (
    <View style={{ marginTop: 16, paddingHorizontal: 20 }}>
      <View style={styles.profileHeaderRow}>
        <View style={styles.profileInfoContainer}>
          <Text style={[styles.profileName, { color: theme.text }]}>
            {name}
          </Text>
          <Text style={[styles.profileEmail, { color: theme.muted }]}>
            {netid}@iastate.edu
          </Text>

          {/* Class standing / GPA / graduation / major / minor with icons */}
          <View style={{ marginTop: 10 }}>
            {!!classStanding && (
              <>
                <View style={styles.iconRow}>
                  <Ionicons
                    name="person-outline"
                    size={16}
                    color={theme.muted}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={[styles.profileLabel, { color: theme.muted }]}>
                    Class Standing
                  </Text>
                </View>
                <Text style={[styles.profileValue, { color: theme.text }]}>
                  {classStanding}
                </Text>
              </>
            )}

            {typeof gpa === "number" && (
              <>
                <View style={[styles.iconRow, { marginTop: 8 }]}>
                  <Ionicons
                    name="stats-chart-outline"
                    size={16}
                    color={theme.muted}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={[styles.profileLabel, { color: theme.muted }]}>
                    GPA
                  </Text>
                </View>
                <Text style={[styles.profileValue, { color: theme.text }]}>
                  {gpa.toFixed(2)}
                </Text>
              </>
            )}

            <View style={[styles.iconRow, { marginTop: 8 }]}>
              <Ionicons
                name="school-outline"
                size={16}
                color={theme.muted}
                style={{ marginRight: 6 }}
              />
              <Text style={[styles.profileLabel, { color: theme.muted }]}>
                Graduation Year
              </Text>
            </View>
            <Text style={[styles.profileValue, { color: theme.text }]}>
              {graduationYear}
            </Text>

            {!!major && (
              <>
                <View style={[styles.iconRow, { marginTop: 8 }]}>
                  <Ionicons
                    name="book-outline"
                    size={16}
                    color={theme.muted}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={[styles.profileLabel, { color: theme.muted }]}>
                    Major
                  </Text>
                </View>
                <Text style={[styles.profileValue, { color: theme.text }]}>
                  {major}
                </Text>
              </>
            )}

            {!!minor && (
              <>
                <View style={[styles.iconRow, { marginTop: 8 }]}>
                  <Ionicons
                    name="layers-outline"
                    size={16}
                    color={theme.muted}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={[styles.profileLabel, { color: theme.muted }]}>
                    Minor
                  </Text>
                </View>
                <Text style={[styles.profileValue, { color: theme.text }]}>
                  {minor}
                </Text>
              </>
            )}
          </View>
        </View>

        <View style={styles.profileImageContainerAdvisor}>
          {hasPhoto ? (
            <Image
              source={{ uri: photoUrl }}
              style={styles.profileImageAdvisor}
            />
          ) : (
            <View
              style={[
                styles.profileImageAdvisor,
                {
                  backgroundColor: theme.primary ?? "#C8102E",
                  alignItems: "center",
                  justifyContent: "center",
                },
              ]}
            >
              <Text style={{ color: "white", fontWeight: "700", fontSize: 24 }}>
                {getInitials(name || netid)}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Degree progress */}
      <Text
        style={[
          styles.sectionTitle,
          { color: theme.text, marginTop: 18, marginBottom: 4 },
        ]}
      >
        Degree Progress
      </Text>
      {typeof creditsCompleted === "number" &&
        typeof creditsRequired === "number" && (
          <Text style={{ color: theme.muted, marginBottom: 4 }}>
            {creditsCompleted}/{creditsRequired} credits
          </Text>
        )}
      <ProgressBar
        progress={degreeProgress}
        width={undefined}
        height={20}
        completedColor={theme.primary}
        remainingColor="#FFC72C"
      />
      <Text style={{ color: theme.muted, marginTop: 4 }}>
        {degreePercent}% of degree requirements planned or completed.
      </Text>

      {/* Milestone timeline */}
      <View style={{ marginTop: 16 }}>
        <Text
          style={[
            styles.subSectionTitle,
            { color: theme.text, marginBottom: 6 },
          ]}
        >
          Milestones
        </Text>
        <View style={styles.milestoneRow}>
          {MOCK_MILESTONES.map((m, idx) => (
            <View key={m.id} style={styles.milestoneItem}>
              <View
                style={[
                  styles.milestoneCircle,
                  m.completed && { backgroundColor: theme.primary },
                ]}
              >
                {m.completed && (
                  <Ionicons name="checkmark" size={10} color="#fff" />
                )}
              </View>
              <Text
                style={[
                  styles.milestoneLabel,
                  {
                    color: m.completed ? theme.text : theme.muted,
                  },
                ]}
              >
                {m.label}
              </Text>
              {idx < MOCK_MILESTONES.length - 1 && (
                <View
                  style={[
                    styles.milestoneConnector,
                    { borderColor: theme.border },
                  ]}
                />
              )}
            </View>
          ))}
        </View>
      </View>

      {/* Latest advisor note summary */}
      {latestNote && (
        <View
          style={[
            styles.latestNoteCard,
            { borderColor: theme.border, backgroundColor: theme.card },
          ]}
        >
          <View style={styles.latestNoteHeaderRow}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons
                name="document-text-outline"
                size={16}
                color={theme.muted}
                style={{ marginRight: 6 }}
              />
              <Text style={[styles.latestNoteTitle, { color: theme.text }]}>
                Latest advising note
              </Text>
            </View>
            <Text style={{ color: theme.muted, fontSize: 12 }}>
              {latestNote.date}
            </Text>
          </View>
          <Text style={{ color: theme.muted, fontSize: 13, marginBottom: 6 }}>
            {latestNote.type}
          </Text>
          <Text style={{ color: theme.text, fontSize: 14 }} numberOfLines={2}>
            {latestNote.detail}
          </Text>
          <TouchableOpacity
            style={{ marginTop: 8 }}
            onPress={onShowNotes}
            activeOpacity={0.8}
          >
            <Text
              style={{
                color: theme.primary,
                fontWeight: "600",
                fontSize: 13,
              }}
            >
              View all notes →
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function getStatusMeta(
  status: PlannedCourse["status"],
  theme: any
): { label: string; bg: string; text: string; border: string } {
  switch (status) {
    case "in-progress":
      return {
        label: "In Progress",
        bg: theme.background,
        text: theme.primary,
        border: theme.primary,
      };
    case "completed":
      return {
        label: "Completed",
        bg: "rgba(22, 163, 74, 0.08)",
        text: "#16A34A",
        border: "rgba(22, 163, 74, 0.5)",
      };
    case "planned":
    default:
      return {
        label: "Planned",
        bg: "rgba(234, 179, 8, 0.08)",
        text: "#CA8A04",
        border: "rgba(234, 179, 8, 0.5)",
      };
  }
}

function StatusPill({
  status,
  theme,
}: {
  status: PlannedCourse["status"];
  theme: any;
}) {
  const meta = getStatusMeta(status, theme);

  return (
    <View
      style={[
        styles.statusPill,
        {
          backgroundColor: meta.bg,
          borderColor: meta.border,
        },
      ]}
    >
      <Text style={[styles.statusPillText, { color: meta.text }]}>
        {meta.label}
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
    <View style={{ marginTop: 24 }}>
      {/* Section header + summary */}
      <Text style={[styles.sectionTitle, { color: theme.text }]}>
        Planned Courses
      </Text>
      <Text style={{ color: theme.muted, marginTop: 4, marginBottom: 10 }}>
        This is a mock plan; later you’ll pull this from the student’s Smart
        Scheduler / degree audit.
      </Text>
{/* 
      <View
        style={[
          styles.planSummaryCard,
          { borderColor: theme.border, backgroundColor: theme.card },
        ]}
      >
        <Text style={[styles.planSummaryLabel, { color: theme.muted }]}>
          Overall plan completion
        </Text>
        <ProgressBar
          progress={planCompletion}
          width={undefined}
          height={18}
          completedColor={theme.primary}
          remainingColor="#FFC72C"
        />
      </View> */}

      {/* Course cards */}
      <View style={{ marginTop: 16 }}>
        {MOCK_PLAN.map((c) => (
          <View
            key={c.id}
            style={[
              styles.courseRow,
              { borderColor: theme.border, backgroundColor: theme.card },
            ]}
          >
            {/* Top row: code/title + status pill */}
            <View style={styles.courseHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.courseCode, { color: theme.text }]}>
                  {c.code}
                </Text>
                <Text style={[styles.courseTitle, { color: theme.muted }]}>
                  {c.title}
                </Text>
              </View>

              <StatusPill status={c.status} theme={theme} />
            </View>

            {/* Bottom row: term + subtle meta */}
            <View style={styles.courseMetaRow}>
              <Text style={{ color: theme.muted, fontSize: 12 }}>
                {c.term}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

function MessageSection({ theme, name }: { theme: any; name: string }) {
  const [text, setText] = useState("");

  const applyTemplate = (body: string) => {
    setText(body);
  };

  const handleSaveNote = () => {
    console.log("Saving advisor note:", text);
  };

  const handleSendEmail = () => {
    console.log("Sending email to", name, "with body:", text);
  };

  return (
    <View style={{ marginTop: 16, paddingHorizontal: 20 }}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>
        Send Message
      </Text>

      <Text style={{ color: theme.text, marginBottom: 4 }}>
        To: <Text style={styles.infoValue}>{name}</Text>
      </Text>

      {/* template chips */}
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          marginVertical: 6,
          gap: 6,
        }}
      >
        {MESSAGE_TEMPLATES.map((tpl) => (
          <TouchableOpacity
            key={tpl.key}
            style={[
              styles.templateChip,
              { borderColor: theme.border, backgroundColor: theme.card },
            ]}
            onPress={() => applyTemplate(tpl.body)}
            activeOpacity={0.85}
          >
            <Text
              style={{ fontSize: 12, color: theme.text, fontWeight: "600" }}
            >
              {tpl.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

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

      {/* dual actions */}
      <View style={styles.messageActionsRow}>
        <TouchableOpacity
          style={[styles.secondaryActionBtn, { borderColor: theme.primary }]}
          onPress={handleSaveNote}
          activeOpacity={0.85}
        >
          <Text
            style={{
              color: theme.primary,
              fontWeight: "600",
              textAlign: "center",
            }}
          >
            Save as Advisor Note
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.primaryActionBtn, { backgroundColor: theme.primary }]}
          onPress={handleSendEmail}
          activeOpacity={0.9}
        >
          <Text
            style={{
              color: theme.background,
              fontWeight: "700",
              textAlign: "center",
            }}
          >
            Send Email
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function NotesSection({ theme }: { theme: any }) {
  const [showAdd, setShowAdd] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [noteType, setNoteType] = useState<AdvisorNote["type"]>("General");

  const handleSave = () => {
    console.log("New note:", { noteType, noteText });
    setNoteText("");
    setShowAdd(false);
  };

  return (
    <View style={{ marginTop: 16, paddingHorizontal: 20 }}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>
        Advising Notes
      </Text>
      <Text style={{ color: theme.muted, marginBottom: 8 }}>
        Timeline of advising meetings and notes. Later you can sync this with
        the backend.
      </Text>

      {/* existing notes */}
      {MOCK_NOTES.map((n) => (
        <View
          key={n.id}
          style={[
            styles.noteRow,
            { borderColor: theme.border, backgroundColor: theme.card },
          ]}
        >
          <View
            style={{ flexDirection: "row", justifyContent: "space-between" }}
          >
            <Text style={{ color: theme.text, fontWeight: "600" }}>
              {n.date}
            </Text>
            <Text style={{ color: theme.muted, fontSize: 12 }}>{n.type}</Text>
          </View>
          <Text style={{ color: theme.muted, marginTop: 2 }}>
            {n.summary}
          </Text>
          <Text style={{ color: theme.text, marginTop: 4 }}>{n.detail}</Text>
        </View>
      ))}

      {/* add note toggle */}
      {!showAdd ? (
        <TouchableOpacity
          style={[styles.addNoteBtn, { borderColor: theme.primary }]}
          onPress={() => setShowAdd(true)}
          activeOpacity={0.85}
        >
          <Ionicons
            name="add"
            size={16}
            color={theme.primary}
            style={{ marginRight: 6 }}
          />
          <Text
            style={{
              color: theme.primary,
              fontWeight: "600",
              fontSize: 14,
            }}
          >
            Add note
          </Text>
        </TouchableOpacity>
      ) : (
        <View
          style={[
            styles.addNoteCard,
            { borderColor: theme.border, backgroundColor: theme.card },
          ]}
        >
          <Text style={{ color: theme.text, fontWeight: "600" }}>New note</Text>

          {/* Very simple type picker = text buttons */}
          <View style={{ flexDirection: "row", marginVertical: 8, gap: 6 }}>
            {["General", "Registration", "Probation", "Career"].map((t) => (
              <TouchableOpacity
                key={t}
                style={[
                  styles.noteTypeChip,
                  noteType === t && {
                    backgroundColor: theme.primary,
                  },
                ]}
                onPress={() => setNoteType(t as AdvisorNote["type"])}
              >
                <Text
                  style={{
                    fontSize: 12,
                    color: noteType === t ? theme.background : theme.text,
                  }}
                >
                  {t}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            multiline
            value={noteText}
            onChangeText={setNoteText}
            placeholder="Meeting notes, decisions, and next steps..."
            placeholderTextColor={theme.muted}
            style={[
              styles.messageBox,
              {
                borderColor: theme.border,
                color: theme.text,
                backgroundColor: theme.card,
                minHeight: 90,
              },
            ]}
          />

          <View style={styles.messageActionsRow}>
            <TouchableOpacity
              style={styles.secondaryActionBtn}
              onPress={() => {
                setShowAdd(false);
                setNoteText("");
              }}
            >
              <Text
                style={{
                  textAlign: "center",
                  color: theme.muted,
                  fontWeight: "500",
                }}
              >
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.primaryActionBtn,
                { backgroundColor: theme.primary },
              ]}
              onPress={handleSave}
            >
              <Text
                style={{
                  textAlign: "center",
                  color: theme.background,
                  fontWeight: "700",
                }}
              >
                Save note
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

// ---------- styles ----------

const styles = StyleSheet.create({
  container: { flex: 1 },

  stickyHeader: {
    paddingTop: 8,
    paddingBottom: 10,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },

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
  subSectionTitle: { fontSize: 16, fontWeight: "600" },
  infoValue: { fontWeight: "600" },

  courseRow: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  courseCode: {
    fontWeight: "700",
    marginBottom: 2,
    fontSize: 16,
  },
  courseTitle: {
    fontSize: 14,
    marginTop: 2,
  },
  messageBox: {
    minHeight: 120,
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginTop: 8,
    textAlignVertical: "top",
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
  },
  profileValue: {
    fontSize: 14,
  },
  profileImageContainerAdvisor: {
    width: 90,
    height: 90,
    borderRadius: 45,
    overflow: "hidden",
    marginLeft: 10,
  },
  profileImageAdvisor: {
    width: "100%",
    height: "100%",
  },
  iconRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  // milestones
  milestoneRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 4,
  },
  milestoneItem: {
    flex: 1,
    alignItems: "center",
  },
  milestoneCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
    justifyContent: "center",
  },
  milestoneLabel: {
    fontSize: 11,
    textAlign: "center",
    marginTop: 4,
  },
  milestoneConnector: {
    position: "absolute",
    top: 9,
    right: -10,
    left: "60%",
    borderTopWidth: 1,
  },

  latestNoteCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginTop: 18,
  },
  latestNoteHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  latestNoteTitle: {
    fontSize: 14,
    fontWeight: "700",
  },

  termHeader: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
  },

  // message tab
  templateChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  messageActionsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
  secondaryActionBtn: {
    flex: 1,
    borderRadius: 999,
    borderWidth: 1,
    paddingVertical: 8,
  },
  primaryActionBtn: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 8,
  },

  // notes tab
  noteRow: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  addNoteBtn: {
    marginTop: 8,
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
  },
  addNoteCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
  },
  noteTypeChip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 0,
  },

  courseHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  courseMetaRow: {
    marginTop: 10,
  },
  planSummaryCard: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  planSummaryLabel: {
    fontSize: 13,
    marginBottom: 4,
  },
  planSummaryValue: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
});
