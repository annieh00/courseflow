// (advisor)/(drawer)/advisees/advisee-details.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Modal,
  Pressable,
  Linking,
  ActivityIndicator,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useTheme } from "../../../../components/ThemeContext";
import ProgressBar from "../../../../components/ProgressBar";
import { useAuth } from "../../../../auth/AuthContext";

type Mode = "profile" | "plan" | "message" | "notes";

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

type Course = {
  id?: string;
  year: number | null;
  semester: string;
  code: string;
  name: string;
  credits: number;
  taken: boolean;
};

type BackendPlan = {
  plan_id: number;
  plan_name: string;
  total_credits: number;
  list_of_courses?: Course[];
};

type PlanWarningSeverity = "high" | "medium" | "low";

type PlanWarning = {
  id: string;
  label: string;
  severity: PlanWarningSeverity;
};

type SemesterData = {
  id: string;
  name: string;
  courses: Course[];
};

type YearData = {
  yearNumber: number;
  fall: SemesterData;
  spring: SemesterData;
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

const MOCK_MILESTONES: Milestone[] = [
  { id: "m1", label: "Admitted", completed: true },
  { id: "m2", label: "Declared major", completed: true },
  { id: "m3", label: "Passed key prereqs", completed: false },
  { id: "m4", label: "Internship completed", completed: false },
  { id: "m5", label: "Expected graduation", completed: false },
];

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("");
}

const API_BASE = (process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8080/api").replace(/\/api\/?$/, "");

const groupCoursesByYear = (courses: Course[]): YearData[] => {
  const years: Record<number, YearData> = {};

  for (let i = 1; i <= 4; i++) {
    years[i] = {
      yearNumber: i,
      fall: { id: `f-${i}`, name: `Fall Year ${i}`, courses: [] },
      spring: { id: `s-${i}`, name: `Spring Year ${i}`, courses: [] },
    };
  }

  if (courses && courses.length > 0) {
    courses.forEach((course) => {
      const y = course.year ?? 1;

      if (!years[y]) {
        years[y] = {
          yearNumber: y,
          fall: { id: `f-${y}`, name: `Fall Year ${y}`, courses: [] },
          spring: { id: `s-${y}`, name: `Spring Year ${y}`, courses: [] },
        };
      }

      const term = course.semester?.toLowerCase() || "";
      if (term.includes("fall")) years[y].fall.courses.push(course);
      else if (term.includes("spring")) years[y].spring.courses.push(course);
    });
  }

  return Object.values(years).sort((a, b) => a.yearNumber - b.yearNumber);
};

function analyzePlanWarnings(courses: Course[], totalCredits: number): PlanWarning[] {
  const warnings: PlanWarning[] = [];
  const normalizedCodes = courses
    .map((course) => course.code?.trim().toUpperCase())
    .filter((code): code is string => Boolean(code));
  const duplicateCodes = Array.from(
    new Set(
      normalizedCodes.filter(
        (code, index) => normalizedCodes.indexOf(code) !== index
      )
    )
  );
  const termCredits = new Map<string, number>();

  courses.forEach((course) => {
    const year = course.year ?? "unknown";
    const semester = (course.semester ?? "unknown").trim().toLowerCase();
    const key = `${year}-${semester}`;
    termCredits.set(key, (termCredits.get(key) ?? 0) + (Number(course.credits) || 0));
  });

  const overloadedTermCount = Array.from(termCredits.values()).filter(
    (credits) => credits > 18
  ).length;
  const hasYearOneFall = courses.some(
    (course) =>
      course.year === 1 && (course.semester ?? "").toLowerCase().includes("fall")
  );
  const hasYearOneSpring = courses.some(
    (course) =>
      course.year === 1 &&
      (course.semester ?? "").toLowerCase().includes("spring")
  );

  if (courses.length === 0) {
    warnings.push({
      id: "empty-plan",
      label: "No courses added",
      severity: "high",
    });
  }

  if (totalCredits < 128) {
    warnings.push({
      id: "low-credits",
      label: `${128 - totalCredits} credits short`,
      severity: "high",
    });
  }

  if (overloadedTermCount > 0) {
    warnings.push({
      id: "overloaded-terms",
      label: `${overloadedTermCount} overloaded term${
        overloadedTermCount === 1 ? "" : "s"
      }`,
      severity: "medium",
    });
  }

  if (duplicateCodes.length > 0) {
    warnings.push({
      id: "duplicate-courses",
      label: `${duplicateCodes.length} duplicate course${
        duplicateCodes.length === 1 ? "" : "s"
      }`,
      severity: "medium",
    });
  }

  if (courses.length > 0 && !courses.some((course) => course.taken)) {
    warnings.push({
      id: "no-completed-courses",
      label: "No completed courses marked",
      severity: "low",
    });
  }

  if (courses.length > 0 && (!hasYearOneFall || !hasYearOneSpring)) {
    warnings.push({
      id: "missing-first-year-term",
      label: "First year has an empty term",
      severity: "low",
    });
  }

  return warnings;
}

function getPlanWarningColors(severity: PlanWarningSeverity) {
  if (severity === "high") {
    return {
      bg: "rgba(220,38,38,0.10)",
      border: "rgba(220,38,38,0.35)",
      text: "#DC2626",
    };
  }

  if (severity === "medium") {
    return {
      bg: "rgba(245,158,11,0.12)",
      border: "rgba(245,158,11,0.35)",
      text: "#D97706",
    };
  }

  return {
    bg: "rgba(14,165,233,0.10)",
    border: "rgba(14,165,233,0.30)",
    text: "#0EA5E9",
  };
}

type StudentProfile = {
  bio?: string | null;
  photoUrl?: string | null;
  displayName?: string | null;
  name?: string | null;
  email?: string | null;
  majors?: string[] | null;
  minors?: string[] | null;
  graduationYear?: string | null;
};

export default function AdviseeDetails() {
  const { theme } = useTheme();
  const router = useRouter();
  const { user } = useAuth();

  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
const [profileLoading, setProfileLoading] = useState(false);


const loadStudentProfile = async () => {
  try {
    if (!netid) return;

    setProfileLoading(true);

    const token =
      (user as any)?.accessToken ??
      (user as any)?.token ??
      (user as any)?.jwt ??
      "";

    const res = await fetch(
      `${API_BASE}/api/profile/${encodeURIComponent(netid)}`,
      {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      }
    );

    const text = await res.text();

    if (!res.ok) {
      console.warn("Failed to load student profile:", text);
      setStudentProfile(null);
      return;
    }

    const raw = text ? JSON.parse(text) : null;
    console.log("Loaded student profile:", raw);
    setStudentProfile(raw);
  } catch (e) {
    console.error("Profile load error:", e);
    setStudentProfile(null);
  } finally {
    setProfileLoading(false);
  }
};
  

  const advisorNetid =
    (user as any)?.netid ?? (user as any)?.userId ?? (user as any)?.id ?? "";

  const params = useLocalSearchParams<{
    from?: string;
    netid?: string;
    name?: string;
    mode?: string;
    planId?: string;
    photoUrl?: string;
    graduationYear?: string;
    major?: string;
    minor?: string;
    classStanding?: string;
    // gpa?: string;
    creditsCompleted?: string;
    creditsRequired?: string;
  }>();
  




  
const from = typeof params.from === "string" ? params.from : undefined;
const hasValidParams =
  typeof params.netid === "string" &&
  params.netid.trim().length > 0 &&
  typeof params.name === "string" &&
  params.name.trim().length > 0;

  useEffect(() => {
  if (!hasValidParams) {
    console.warn("advisee-details opened without required params:", params);
  }
}, [hasValidParams, params]);

const name =
  typeof params.name === "string" && params.name.trim().length > 0
    ? params.name
    : "";
const netid =
  typeof params.netid === "string" && params.netid.trim().length > 0
    ? params.netid
    : "";
  
  const requestedPlanId =
    typeof params.planId === "string" && params.planId.length > 0
      ? Number(params.planId)
      : undefined;

  // const major =
  //   typeof params.major === "string" && params.major.length > 0
  //     ? params.major
  //     : "";
  // const minor =
  //   typeof params.minor === "string" && params.minor.length > 0
  //     ? params.minor
  //     : "";
  // const classStanding =
  //   typeof params.classStanding === "string" && params.classStanding.length > 0
  //     ? params.classStanding
  //     : "";
  const major =
  typeof params.major === "string" && params.major.trim().length > 0
    ? params.major.trim()
    : "N/A";

const minor =
  typeof params.minor === "string" && params.minor.trim().length > 0
    ? params.minor.trim()
    : "N/A";

const classStanding =
  typeof params.classStanding === "string" && params.classStanding.trim().length > 0
    ? params.classStanding.trim()
    : "N/A";

  // const gpaRaw =
  //   typeof params.gpa === "string" && params.gpa.length > 0
  //     ? Number(params.gpa)
  //     : NaN;
  // const gpa = Number.isNaN(gpaRaw) ? undefined : gpaRaw;

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

  // const graduationYear = params.graduationYear || "—";


  const graduationYear =
  typeof params.graduationYear === "string" && params.graduationYear.trim().length > 0
    ? params.graduationYear.trim()
    : "N/A";

  const [notes, setNotes] = useState<AdvisorNote[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);

  const [noteToDelete, setNoteToDelete] = useState<AdvisorNote | null>(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deletingNote, setDeletingNote] = useState(false);

  const [saveMessageModalVisible, setSaveMessageModalVisible] = useState(false);
  const [pendingMessageNote, setPendingMessageNote] = useState<{
    content: string;
    type: AdvisorNote["type"];
    onSuccess?: () => void;
  } | null>(null);
  const [savingMessageNote, setSavingMessageNote] = useState(false);

    useEffect(() => {
  loadStudentProfile();
}, [netid]);
  const initialMode: Mode =
    params.mode === "plan" ||
    params.mode === "message" ||
    params.mode === "notes"
      ? (params.mode as Mode)
      : "profile";

  const [mode, setMode] = useState<Mode>(initialMode);

  const resolvedMajor =
  studentProfile?.majors?.join(", ") ||
  major ||
  "N/A";

const resolvedMinor =
  studentProfile?.minors?.join(", ") ||
  minor ||
  "N/A";

const resolvedGraduationYear =
  studentProfile?.graduationYear?.trim() ||
  graduationYear ||
  "N/A";

const resolvedPhotoUrl =
  studentProfile?.photoUrl ||
  photoUrl ||
  "";

const resolvedName =
  studentProfile?.displayName?.trim() ||
  studentProfile?.name?.trim() ||
  name ||
  "";

  const loadNotes = async () => {
    try {
      if (!advisorNetid || !netid || netid === "unknown") {
        setNotes([]);
        return;
      }

      setNotesLoading(true);

      const url = `${API_BASE}/api/notes/${encodeURIComponent(
        netid
      )}?requesterNetid=${encodeURIComponent(advisorNetid)}`;

      const res = await fetch(url);
      const text = await res.text();

      if (!res.ok) {
        setNotes([]);
        return;
      }

      const raw = text ? JSON.parse(text) : [];

      const mapped: AdvisorNote[] = (raw ?? []).map((n: any) => ({
        id: String(n.id ?? Math.random()),
        date: n.createdAt
          ? new Date(n.createdAt).toLocaleDateString()
          : (n.date ?? "—"),
        type: (n.noteType ?? "General") as AdvisorNote["type"],
        summary: n.content ?? "",
        detail: n.content ?? "",
      }));

      setNotes(mapped);
    } catch (e) {
      console.error("Notes load error:", e);
      setNotes([]);
    } finally {
      setNotesLoading(false);
    }
  };

  const handleNoteCreated = async (_created?: AdvisorNote) => {
    await loadNotes();
  };

  const openDeleteModal = (note: AdvisorNote) => {
    setNoteToDelete(note);
    setDeleteModalVisible(true);
  };

  const closeDeleteModal = () => {
    if (deletingNote) return;
    setDeleteModalVisible(false);
    setNoteToDelete(null);
  };

function getClassStandingFromGradYear(
  graduationYear?: string | null
): string {
  if (!graduationYear) return "N/A";

  const grad = Number(graduationYear);
  if (Number.isNaN(grad)) return "N/A";

  const currentYear = new Date().getFullYear();
  const yearsLeft = grad - currentYear;

  if (yearsLeft <= 1) return "Senior";
  if (yearsLeft === 2) return "Junior";
  if (yearsLeft === 3) return "Sophomore";
  if (yearsLeft >= 4) return "Freshman";

  return "N/A";
}
  const handleNoteDeleted = async (noteId: string) => {
    try {
      if (!advisorNetid || !noteId) return;

      setDeletingNote(true);

      const url = `${API_BASE}/api/notes/${encodeURIComponent(
        noteId
      )}?requesterNetid=${encodeURIComponent(advisorNetid)}`;

      const res = await fetch(url, { method: "DELETE" });

      if (!res.ok) return;

      closeDeleteModal();
      await loadNotes();
    } catch (e) {
      console.error("Delete note error:", e);
    } finally {
      setDeletingNote(false);
    }
  };

  const handleSaveMessageAsNote = async () => {
    try {
      if (!advisorNetid || !netid || !pendingMessageNote?.content.trim()) {
        return;
      }

      setSavingMessageNote(true);

      const payload = {
        advisorNetid,
        studentNetid: netid,
        content: pendingMessageNote.content.trim(),
        noteType: pendingMessageNote.type,
      };

      const res = await fetch(`${API_BASE}/api/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) return;

      pendingMessageNote?.onSuccess?.();
      closeSaveMessageModal();
      await loadNotes();
    } catch (e) {
      console.error("Save message as note error:", e);
    } finally {
      setSavingMessageNote(false);
    }
  };

  const openSaveMessageModal = (
    content: string,
    type: AdvisorNote["type"] = "General",
    onSuccess?: () => void
  ) => {
    setPendingMessageNote({ content, type, onSuccess });
    setSaveMessageModalVisible(true);
  };

  const closeSaveMessageModal = () => {
    if (savingMessageNote) return;
    setSaveMessageModalVisible(false);
    setPendingMessageNote(null);
  };

  useEffect(() => {
    loadNotes();
  }, [advisorNetid, netid]);

  const latestNote = notes[0];

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

  useEffect(() => {
  if (!hasValidParams) {
    console.warn("advisee-details opened without required params:", params);
  }
}, [hasValidParams, params]);

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
      {profileLoading && (
  <Text style={{ color: theme.muted, paddingHorizontal: 20, marginTop: 12 }}>
    Loading profile...
  </Text>
)}

      <ScrollView
        style={[styles.container, { backgroundColor: theme.background }]}
        contentContainerStyle={{ paddingBottom: 24 }}
        stickyHeaderIndices={[0]}
      >
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

        {mode === "profile" && (
<ProfileSection
  theme={theme}
  degreeProgress={degreeProgress}
  photoUrl={resolvedPhotoUrl}
  name={resolvedName}
  netid={netid}
  graduationYear={resolvedGraduationYear}
  latestNote={latestNote}
  onShowNotes={() => setMode("notes")}
  major={resolvedMajor}
  minor={resolvedMinor}
  classStanding={getClassStandingFromGradYear(resolvedGraduationYear)}
  // gpa={gpa}
  creditsCompleted={creditsCompleted}
  creditsRequired={creditsRequired}
/>
        )}

        {mode === "plan" && (
          <AdvisorPlanSection
            theme={theme}
            studentNetid={netid}
            requestedPlanId={requestedPlanId}
          />
        )}

        {mode === "message" && (
          <MessageSection
            theme={theme}
            name={name}
            studentNetid={netid}
            onOpenSaveNoteModal={openSaveMessageModal}
          />
        )}

        {mode === "notes" && (
          <NotesSection
            theme={theme}
            notes={notes}
            notesLoading={notesLoading}
            studentNetid={netid}
            advisorNetid={advisorNetid}
            onNoteCreated={handleNoteCreated}
            onDeletePress={openDeleteModal}
          />
        )}
      </ScrollView>

      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeDeleteModal}
      >
        <Pressable style={styles.modalBackdrop} onPress={closeDeleteModal} />

        <View style={styles.modalCenter}>
          <View
            style={[
              styles.modalCard,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
          >
            <View style={styles.modalIconWrap}>
              <Ionicons name="trash-outline" size={22} color="#DC2626" />
            </View>

            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Delete note?
            </Text>

            <Text style={[styles.modalBody, { color: theme.muted }]}>
              {noteToDelete
                ? `Are you sure you want to delete this ${noteToDelete.type.toLowerCase()} note? This action cannot be undone.`
                : "Are you sure you want to delete this note?"}
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[
                  styles.modalSecondaryBtn,
                  { borderColor: theme.border, backgroundColor: theme.background },
                ]}
                onPress={closeDeleteModal}
                activeOpacity={0.85}
                disabled={deletingNote}
              >
                <Text style={{ color: theme.text, fontWeight: "600" }}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalDangerBtn}
                onPress={() => noteToDelete && handleNoteDeleted(noteToDelete.id)}
                activeOpacity={0.9}
                disabled={deletingNote || !noteToDelete}
              >
                <Text style={{ color: "white", fontWeight: "700" }}>
                  {deletingNote ? "Deleting..." : "Delete"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={saveMessageModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeSaveMessageModal}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={closeSaveMessageModal}
        />

        <View style={styles.modalCenter}>
          <View
            style={[
              styles.modalCard,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
          >
            <View style={styles.modalIconWrap}>
              <Ionicons
                name="document-text-outline"
                size={22}
                color={theme.primary}
              />
            </View>

            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Save message as note?
            </Text>

            <Text style={[styles.modalBody, { color: theme.muted }]}>
              This will save the current {pendingMessageNote?.type.toLowerCase()}{" "}
              note for {name}.
            </Text>

            {!!pendingMessageNote?.content && (
              <View
                style={[
                  styles.modalPreviewCard,
                  { backgroundColor: theme.background, borderColor: theme.border },
                ]}
              >
                <Text style={[styles.modalPreviewLabel, { color: theme.muted }]}>
                  Preview
                </Text>
                <Text style={{ color: theme.text }} numberOfLines={5}>
                  {pendingMessageNote.content}
                </Text>
              </View>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[
                  styles.modalSecondaryBtn,
                  { borderColor: theme.border, backgroundColor: theme.background },
                ]}
                onPress={closeSaveMessageModal}
                activeOpacity={0.85}
                disabled={savingMessageNote}
              >
                <Text style={{ color: theme.text, fontWeight: "600" }}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalPrimaryBtn, { backgroundColor: theme.primary }]}
                onPress={handleSaveMessageAsNote}
                activeOpacity={0.9}
                disabled={savingMessageNote || !pendingMessageNote?.content}
              >
                <Text style={{ color: theme.background, fontWeight: "700" }}>
                  {savingMessageNote ? "Saving..." : "Save Note"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

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
  // gpa,
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
  // gpa?: number;
  creditsCompleted?: number;
  creditsRequired?: number;
}) {
  const hasPhoto = !!photoUrl;
  const degreePercent = Math.round(degreeProgress * 100);

  return (
    <View style={{ marginTop: 16, paddingHorizontal: 20 }}>
      <View style={styles.profileHeaderRow}>
        <View style={styles.profileInfoContainer}>
          <Text style={[styles.profileName, { color: theme.text }]}>{name}</Text>
          <Text style={[styles.profileEmail, { color: theme.muted }]}>
            {netid}@iastate.edu
          </Text>

          <View style={{ marginTop: 10 }}>
            {/* {!!classStanding && (
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
            )} */}
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

  {/* <Ionicons
    name="stats-chart-outline"
    size={16}
    color={theme.muted}
    style={{ marginRight: 6 }}
  /> */}
  {/* <Text style={[styles.profileLabel, { color: theme.muted }]}>
    GPA
  </Text> */}

{/* <Text style={[styles.profileValue, { color: theme.text }]}>
  {typeof gpa === "number" ? gpa.toFixed(2) : "N/A"}
</Text> */}

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
          </View>
        </View>

        <View style={styles.profileImageContainerAdvisor}>
          {hasPhoto ? (
            <Image source={{ uri: photoUrl }} style={styles.profileImageAdvisor} />
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
            {creditsCompleted} completed / {creditsRequired} required credits
          </Text>
        )}

      <ProgressBar
        progress={degreeProgress}
        height={20}
        completedColor={theme.primary}
        remainingColor="#FFC72C"
      />

      <Text style={{ color: theme.muted, marginTop: 4 }}>
        {degreePercent}% of degree requirements planned or completed.
      </Text>

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

          <Text
            style={{
              color: theme.text,
              fontSize: 14,
              lineHeight: 20,
              marginBottom: 6,
            }}
          >
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

function AdvisorPlanSection({
  theme,
  studentNetid,
  requestedPlanId,
}: {
  theme: any;
  studentNetid: string;
  requestedPlanId?: number;
}) {
  const [allPlans, setAllPlans] = useState<BackendPlan[]>([]);
  const [activePlanId, setActivePlanId] = useState<number | null>(null);
  const [planData, setPlanData] = useState<YearData[]>([]);
  const [planName, setPlanName] = useState("");
  const [loading, setLoading] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const totalCredits = useMemo(() => {
    return planData.reduce((acc, year) => {
      const fallCreds = year.fall.courses.reduce(
        (sum, c) => sum + (Number(c.credits) || 0),
        0
      );
      const springCreds = year.spring.courses.reduce(
        (sum, c) => sum + (Number(c.credits) || 0),
        0
      );
      return acc + fallCreds + springCreds;
    }, 0);
  }, [planData]);

  const planWarnings = useMemo(() => {
    const courses = planData.flatMap((year) => [
      ...year.fall.courses,
      ...year.spring.courses,
    ]);
    return analyzePlanWarnings(courses, totalCredits);
  }, [planData, totalCredits]);

  const loadPlanIntoView = (plan: BackendPlan) => {
    setActivePlanId(plan.plan_id);
    setPlanName(plan.plan_name);
    setPlanData(groupCoursesByYear(plan.list_of_courses || []));
    setIsDropdownOpen(false);
  };

  const fetchAllPlans = async () => {
    if (!studentNetid || studentNetid === "unknown") {
      setAllPlans([]);
      setPlanData([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE}/coursePlan/${studentNetid}/plans`
      );

      if (!response.ok) {
        setAllPlans([]);
        setPlanData([]);
        return;
      }

      const plans: BackendPlan[] = await response.json();
      setAllPlans(plans);

      if (Array.isArray(plans) && plans.length > 0) {
        let planToLoad: BackendPlan;

        if (requestedPlanId) {
          planToLoad =
            plans.find((p) => p.plan_id === requestedPlanId) || plans[0];
        } else if (activePlanId) {
          planToLoad =
            plans.find((p) => p.plan_id === activePlanId) || plans[0];
        } else {
          const sorted = [...plans].sort((a, b) => b.plan_id - a.plan_id);
          planToLoad = sorted[0];
        }

        loadPlanIntoView(planToLoad);
      } else {
        setActivePlanId(null);
        setPlanName("");
        setPlanData([]);
      }
    } catch (error) {
      console.error("Failed to fetch plan data:", error);
      setAllPlans([]);
      setPlanData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllPlans();
  }, [studentNetid, requestedPlanId]);

  if (loading) {
    return (
      <View style={{ marginTop: 24, paddingHorizontal: 20 }}>
        <View
          style={[
            styles.planContainerCard,
            {
              borderColor: theme.border,
              backgroundColor: theme.card,
              alignItems: "center",
              justifyContent: "center",
              minHeight: 180,
            },
          ]}
        >
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={{ color: theme.muted, marginTop: 10 }}>
            Loading saved schedules...
          </Text>
        </View>
      </View>
    );
  }

if (!allPlans.length) {
  return (
    <View style={{ marginTop: 24, paddingHorizontal: 20, flex: 1 }}>
      <View
        style={[
          styles.planContainerCard,
          styles.emptyPlanCardCentered,
          { borderColor: theme.border, backgroundColor: theme.card },
        ]}
      >
        <View
          style={[
            styles.emptyPlanIcon,
            { backgroundColor: `${theme.primary}14` },
          ]}
        >
          <Ionicons name="school-outline" size={26} color={theme.primary} />
        </View>

        <Text
          style={[
            styles.sectionTitle,
            {
              color: theme.text,
              marginTop: 0,
              textAlign: "center",
            },
          ]}
        >
          No saved schedules yet
        </Text>

        <Text
          style={{
            color: theme.muted,
            textAlign: "center",
            marginTop: 6,
            lineHeight: 20,
            maxWidth: 260,
          }}
        >
          This advisee does not have any course plans saved yet.
        </Text>
      </View>
    </View>
  );
}

  return (
    <View style={styles.advisorPlanView}>
        <View style={styles.planHeader}>
          <View style={{ flex: 1 }}>
            <TouchableOpacity
              style={styles.dropdownTrigger}
              onPress={() => setIsDropdownOpen(true)}
              activeOpacity={0.85}
            >
              <Text
                style={[styles.planHeaderTitle, { color: theme.text }]}
                numberOfLines={1}
              >
                {planName}
              </Text>
              <Ionicons
                name="chevron-down"
                size={20}
                color={theme.muted}
                style={{ marginLeft: 6 }}
              />
            </TouchableOpacity>

            <Text style={[styles.creditBadge, { color: theme.primary }]}>
              {totalCredits} CREDITS
            </Text>
          </View>
        </View>

        {planWarnings.length > 0 && (
          <View
            style={[
              styles.planWarningPanel,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
              },
            ]}
          >
            <View style={styles.planWarningHeaderRow}>
              <Ionicons name="flag-outline" size={16} color={theme.primary} />
              <Text style={[styles.planWarningHeader, { color: theme.text }]}>
                Review flags
              </Text>
            </View>

            <View style={styles.planWarningList}>
              {planWarnings.map((warning) => {
                const colors = getPlanWarningColors(warning.severity);
                return (
                  <View
                    key={warning.id}
                    style={[
                      styles.planWarningChip,
                      {
                        backgroundColor: colors.bg,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.planWarningChipText,
                        { color: colors.text },
                      ]}
                    >
                      {warning.label}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {planData.map((year) => (
          <View key={year.yearNumber} style={styles.yearBlock}>
            <Text
              style={[
                styles.yearTitle,
                { color: theme.text, borderBottomColor: theme.border },
              ]}
            >
              Year {year.yearNumber}
            </Text>

            <View style={styles.semesterGrid}>
              {[year.fall, year.spring].map((sem, idx) => {
                return (
                  <View
                    key={sem.id}
                    style={[
                      styles.semesterCard,
                      {
                        backgroundColor: theme.card,
                        borderColor: theme.border,
                      },
                    ]}
                  >
                    <View style={styles.semesterHeader}>
                      <View>
                        <Text
                          style={[styles.semesterTitle, { color: theme.text }]}
                        >
                          {idx === 0 ? "Fall" : "Spring"}
                        </Text>
                      </View>
                    </View>

                    {sem.courses.length === 0 ? (
                      <View style={styles.emptySemesterBox}>
                        <Text style={{ color: theme.muted, fontSize: 13 }}>
                          No courses added yet.
                        </Text>
                      </View>
                    ) : (
                      sem.courses.map((course) => (
                        <View
                          key={`${sem.id}-${course.code}-${course.name}`}
                          style={[
                            styles.courseChip,
                            {
                              backgroundColor: theme.card,
                              borderColor: theme.border,
                            },
                          ]}
                        >
                          <View style={{ flex: 1 }}>
                            <View style={styles.courseChipTopRow}>
                              <Text
                                style={[
                                  styles.courseChipCode,
                                  { color: theme.text },
                                ]}
                              >
                                {course.code}
                              </Text>
                            </View>

                            <Text
                              style={[
                                styles.courseChipName,
                                { color: theme.muted },
                              ]}
                            >
                              {course.name}
                            </Text>
                          </View>
                        </View>
                      ))
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        ))}

      <Modal visible={isDropdownOpen} transparent animationType="fade">
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setIsDropdownOpen(false)}
        >
          <View
            style={[styles.dropdownMenu, { backgroundColor: theme.card }]}
          >
            <Text style={[styles.dropdownHeader, { color: theme.muted }]}>
              Switch Plan
            </Text>

            {allPlans.map((plan) => {
              const isSelected = plan.plan_id === activePlanId;
              return (
                <TouchableOpacity
                  key={plan.plan_id}
                  style={[
                    styles.dropdownItem,
                    isSelected && { backgroundColor: `${theme.primary}14` },
                  ]}
                  onPress={() => loadPlanIntoView(plan)}
                  activeOpacity={0.85}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.dropdownItemTitle,
                        { color: isSelected ? theme.primary : theme.text },
                      ]}
                    >
                      {plan.plan_name}
                    </Text>
                    <Text style={{ color: theme.muted, fontSize: 12 }}>
                      Plan ID: {plan.plan_id}
                    </Text>
                  </View>

                  {isSelected && (
                    <Ionicons
                      name="checkmark"
                      size={18}
                      color={theme.primary}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

function MessageSection({
  theme,
  name,
  studentNetid,
  onOpenSaveNoteModal,
}: {
  theme: any;
  name: string;
  studentNetid: string;
  onOpenSaveNoteModal: (
    content: string,
    type?: AdvisorNote["type"],
    onSuccess?: () => void
  ) => void;
}) {
  const [text, setText] = useState("");
  const [messageType, setMessageType] =
    useState<AdvisorNote["type"]>("General");

  const handleSaveNote = () => {
    if (!text.trim()) return;

    onOpenSaveNoteModal(text.trim(), messageType, () => {
      setText("");
    });
  };

  const handleSendEmail = async () => {
    try {
      const to = `${studentNetid}@iastate.edu`;
      const subject = encodeURIComponent(`Message from your advisor`);
      const body = encodeURIComponent(text);

      const url = `mailto:${to}?subject=${subject}&body=${body}`;

      const supported = await Linking.canOpenURL(url);
      if (!supported) return;

      await Linking.openURL(url);
    } catch (e) {
      console.error("Failed to open email app:", e);
    }
  };

  return (
    <View style={{ marginTop: 16, paddingHorizontal: 20 }}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>
        Send Message
      </Text>

      <Text style={{ color: theme.text, marginBottom: 4 }}>
        To: <Text style={styles.infoValue}>{name}</Text>
      </Text>

      <Text style={{ color: theme.muted, marginTop: 8, marginBottom: 6 }}>
        Message category
      </Text>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
        {(
          ["General", "Registration", "Probation", "Career"] as AdvisorNote["type"][]
        ).map((t) => (
          <TouchableOpacity
            key={t}
            style={[
              styles.noteTypeChip,
              {
                backgroundColor: messageType === t ? theme.primary : theme.card,
                borderWidth: 1,
                borderColor: messageType === t ? theme.primary : theme.border,
              },
            ]}
            onPress={() => setMessageType(t)}
            activeOpacity={0.85}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: "600",
                color: messageType === t ? theme.background : theme.text,
              }}
            >
              {t}
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

function NotesSection({
  theme,
  notes,
  notesLoading,
  studentNetid,
  advisorNetid,
  onNoteCreated,
  onDeletePress,
}: {
  theme: any;
  notes: AdvisorNote[];
  notesLoading: boolean;
  studentNetid: string;
  advisorNetid?: string;
  onNoteCreated: (n: AdvisorNote) => void;
  onDeletePress: (note: AdvisorNote) => void;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [noteType, setNoteType] = useState<AdvisorNote["type"]>("General");

  const handleSave = async () => {
    try {
      if (!advisorNetid || !studentNetid || !noteText.trim()) return;

      const payload = {
        advisorNetid,
        studentNetid,
        content: noteText.trim(),
        noteType,
      };

      const res = await fetch(`${API_BASE}/api/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const bodyText = await res.text();

      if (!res.ok) return;

      const created = bodyText ? JSON.parse(bodyText) : null;

      setNoteText("");
      setShowAdd(false);

      onNoteCreated({
        id: String(created?.id ?? Math.random()),
        date: created?.createdAt
          ? new Date(created.createdAt).toLocaleDateString()
          : new Date().toLocaleDateString(),
        type: (created?.noteType ?? noteType) as AdvisorNote["type"],
        summary: created?.content ?? noteText.trim(),
        detail: created?.content ?? noteText.trim(),
      });
    } catch (e) {
      console.error("POST note error:", e);
    }
  };

  return (
    <View style={{ marginTop: 16, paddingHorizontal: 20 }}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>
        Advising Notes
      </Text>
      <Text style={{ color: theme.muted, marginBottom: 8 }}>
        Timeline of advising meetings and notes.
      </Text>

      {notesLoading ? (
        <Text style={{ color: theme.muted }}>Loading notes...</Text>
      ) : notes.length === 0 ? (
        <Text style={{ color: theme.muted }}>No notes yet.</Text>
      ) : (
        notes.map((n) => (
          <View
            key={n.id}
            style={[
              styles.noteRow,
              { borderColor: theme.border, backgroundColor: theme.card },
            ]}
          >
            <View style={styles.noteHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.text, fontWeight: "600" }}>
                  {n.date}
                </Text>
                <Text style={{ color: theme.muted, fontSize: 12, marginTop: 2 }}>
                  {n.type}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => onDeletePress(n)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={styles.noteDeleteBtn}
              >
                <Ionicons name="trash-outline" size={18} color="#DC2626" />
              </TouchableOpacity>
            </View>

            <Text style={{ color: theme.text, marginTop: 8 }}>{n.detail}</Text>
          </View>
        ))
      )}

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

  planContainerCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
  },
  emptyPlanIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 8,
  },
  advisorPlanView: {
    marginTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  planHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dropdownTrigger: {
    flexDirection: "row",
    alignItems: "center",
  },
  planHeaderTitle: {
    fontSize: 22,
    fontWeight: "700",
    maxWidth: "90%",
  },
  creditBadge: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  planSummaryRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
    marginBottom: 8,
  },
  planSummaryPill: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minWidth: 90,
  },
  planSummaryValue: {
    fontSize: 16,
    fontWeight: "700",
  },
  planSummaryLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  yearBlock: {
    marginTop: 30,
  },
  yearTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 15,
    borderBottomWidth: 1,
    paddingBottom: 8,
  },
  semesterGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  semesterCard: {
    width: "48%",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  semesterHeader: {
    marginBottom: 10,
  },
  semesterTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  semesterSub: {
    fontSize: 12,
    marginTop: 3,
  },
  emptySemesterBox: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  courseChip: {
    borderWidth: 0,
    borderRadius: 0,
    paddingVertical: 4,
    paddingHorizontal: 0,
    marginTop: 4,
  },
  courseChipTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  courseChipCode: {
    fontSize: 14,
    fontWeight: "700",
  },
  courseChipName: {
    fontSize: 13,
    marginTop: 3,
  },
  readOnlyStatusPill: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  readOnlyDone: {
    backgroundColor: "rgba(22, 163, 74, 0.12)",
  },
  readOnlyPlanned: {
    backgroundColor: "rgba(234, 179, 8, 0.14)",
  },
  readOnlyStatusText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },

  planWarningPanel: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginTop: 14,
  },
  planWarningHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  planWarningHeader: {
    fontSize: 14,
    fontWeight: "700",
  },
  planWarningList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  planWarningChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  planWarningChipText: {
    fontSize: 12,
    fontWeight: "700",
  },

  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  modalCenter: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  modalCard: {
    width: "100%",
    maxWidth: 380,
    borderRadius: 18,
    borderWidth: 1,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  modalIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.06)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    alignSelf: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  modalBody: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    marginTop: 8,
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 20,
  },
  modalSecondaryBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  modalDangerBtn: {
    flex: 1,
    backgroundColor: "#DC2626",
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  modalPrimaryBtn: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  modalPreviewCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginTop: 14,
  },
  modalPreviewLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 6,
    textTransform: "uppercase",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  dropdownMenu: {
    borderRadius: 16,
    paddingVertical: 8,
    overflow: "hidden",
  },
  dropdownHeader: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 6,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dropdownItemTitle: {
    fontSize: 15,
    fontWeight: "600",
  },

  messageBox: {
    minHeight: 120,
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginTop: 8,
    textAlignVertical: "top",
  },
  noteHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  noteDeleteBtn: {
    padding: 4,
    marginLeft: 10,
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
  emptyPlanCardCentered: {
  minHeight: 220,
  alignItems: "center",
  justifyContent: "center",
},
});
